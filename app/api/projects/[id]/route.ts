// app/api/projects/[id]/route.ts

import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";

type Ctx = {
  params: Promise<{ id: string }>;
};

/* =========================================================
   SAME OPTIONS AS CREATE PROJECT PAGE
========================================================= */

const GENDER_OPTIONS = [
  "Male",
  "Female",
];

const HISPANIC_OPTIONS = [
  "Hispanic",
  "Non-Hispanic",
];

const RELATIONSHIP_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Living with partner",
];

const CHILDREN_OPTIONS = [
  "Yes",
  "No",
];

const EMPLOYMENT_OPTIONS = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Unemployed",
  "Student",
  "Retired",
];

const EDUCATION_OPTIONS = [
  "Less than high school",
  "High school",
  "Some college",
  "Associate degree",
  "Bachelor's degree",
  "Graduate degree",
];

const DEVICE_OPTIONS = [
  "Desktop",
  "Mobile",
  "Tablet",
];

/* =========================================================
   HELPERS
========================================================= */

function hasOwn(
  obj: Record<string, any>,
  key: string,
) {
  return Object.prototype.hasOwnProperty.call(
    obj,
    key,
  );
}

/* =========================================================
   NORMALIZE MULTI SELECT

   Edit UI can send:

   []
   ["Male"]
   ["Male", "Female"]
   "Male"
   "Male, Female"
   "All"

   Database stores:

   ""
   "Male"
   "All"
   "Male, Female"
========================================================= */

function normalizeMultiValue(
  value: unknown,
  options: string[],
): string {
  if (Array.isArray(value)) {
    const selected = Array.from(
      new Set(
        value
          .map((item) =>
            String(item).trim(),
          )
          .filter(Boolean),
      ),
    );

    if (selected.length === 0) {
      return "";
    }

    const validSelected =
      selected.filter((item) =>
        options.includes(item),
      );

    if (validSelected.length === 0) {
      return "";
    }

    if (
      validSelected.length ===
      options.length
    ) {
      return "All";
    }

    return validSelected.join(", ");
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    if (!normalized) {
      return "";
    }

    if (normalized === "All") {
      return "All";
    }

    const selected = normalized
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const validSelected =
      selected.filter((item) =>
        options.includes(item),
      );

    if (validSelected.length === 0) {
      return "";
    }

    if (
      validSelected.length ===
      options.length
    ) {
      return "All";
    }

    return Array.from(
      new Set(validSelected),
    ).join(", ");
  }

  return "";
}

/* =========================================================
   NORMALIZE LOCATION

   Edit UI may send arrays.

   Database stores arrays.
========================================================= */

function normalizeLocation(
  value: unknown,
): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) =>
            String(item).trim(),
          )
          .filter(Boolean),
      ),
    );
  }

  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) =>
            item.trim(),
          )
          .filter(Boolean),
      ),
    );
  }

  return [];
}

/* =========================================================
   TARGETING NORMALIZER
========================================================= */

function normalizeTargeting(
  data: Record<string, any>,
  current: Record<string, any>,
) {
  const targeting: Record<string, any> = {
    ...current,
    ...data,
  };

  /* -------------------------------------------------------
     GENDER
  ------------------------------------------------------- */

  if (hasOwn(data, "gender")) {
    targeting.gender =
      normalizeMultiValue(
        data.gender,
        GENDER_OPTIONS,
      );
  }

  /* -------------------------------------------------------
     HISPANIC ORIGIN
  ------------------------------------------------------- */

  if (
    hasOwn(
      data,
      "hispanicOrigin",
    )
  ) {
    targeting.hispanicOrigin =
      normalizeMultiValue(
        data.hispanicOrigin,
        HISPANIC_OPTIONS,
      );
  }

  /* -------------------------------------------------------
     RELATIONSHIP
  ------------------------------------------------------- */

  if (
    hasOwn(
      data,
      "relationship",
    )
  ) {
    targeting.relationship =
      normalizeMultiValue(
        data.relationship,
        RELATIONSHIP_OPTIONS,
      );
  }

  /* -------------------------------------------------------
     CHILDREN
  ------------------------------------------------------- */

  if (
    hasOwn(
      data,
      "children",
    )
  ) {
    targeting.children =
      normalizeMultiValue(
        data.children,
        CHILDREN_OPTIONS,
      );
  }

  /* -------------------------------------------------------
     EMPLOYMENT
  ------------------------------------------------------- */

  if (
    hasOwn(
      data,
      "employment",
    )
  ) {
    targeting.employment =
      normalizeMultiValue(
        data.employment,
        EMPLOYMENT_OPTIONS,
      );
  }

  /* -------------------------------------------------------
     EDUCATION
  ------------------------------------------------------- */

  if (
    hasOwn(
      data,
      "education",
    )
  ) {
    targeting.education =
      normalizeMultiValue(
        data.education,
        EDUCATION_OPTIONS,
      );
  }

  /* -------------------------------------------------------
     DEVICE
  ------------------------------------------------------- */

  if (
    hasOwn(
      data,
      "device",
    )
  ) {
    targeting.device =
      normalizeMultiValue(
        data.device,
        DEVICE_OPTIONS,
      );
  }

  /* -------------------------------------------------------
     LOCATION
  ------------------------------------------------------- */

  const locationFields = [
    "region",
    "division",
    "state",
    "csa",
    "cbsa",
    "county",
    "dma",
    "zipcode",
  ];

  for (const field of locationFields) {
    if (hasOwn(data, field)) {
      targeting[field] =
        normalizeLocation(
          data[field],
        );
    } else if (
      hasOwn(current, field)
    ) {
      targeting[field] =
        normalizeLocation(
          current[field],
        );
    }
  }

  /* -------------------------------------------------------
     COUNTRY
  ------------------------------------------------------- */

  if (hasOwn(data, "country")) {
    targeting.country =
      typeof data.country === "string"
        ? data.country.trim()
        : "";
  }

  /* -------------------------------------------------------
     LANGUAGE
  ------------------------------------------------------- */

  if (hasOwn(data, "language")) {
    targeting.language =
      typeof data.language === "string"
        ? data.language.trim()
        : "English";
  }

  /* -------------------------------------------------------
     CATEGORY
  ------------------------------------------------------- */

  if (hasOwn(data, "category")) {
    targeting.category =
      typeof data.category === "string"
        ? data.category.trim()
        : "";
  }

  /* -------------------------------------------------------
     AGE
  ------------------------------------------------------- */

  if (hasOwn(data, "age")) {
    targeting.age = data.age;
  }

  /* -------------------------------------------------------
     INCOME
  ------------------------------------------------------- */

  if (hasOwn(data, "income")) {
    targeting.income = data.income;
  }

  /* -------------------------------------------------------
     ADVANCED TARGETING
  ------------------------------------------------------- */

  if (
    hasOwn(
      data,
      "advancedTargeting",
    )
  ) {
    targeting.advancedTargeting =
      Array.isArray(
        data.advancedTargeting,
      )
        ? data.advancedTargeting
        : [];
  }

  /* -------------------------------------------------------
     QUOTA NESTING
  ------------------------------------------------------- */

  if (
    hasOwn(
      data,
      "quotaNesting",
    )
  ) {
    targeting.quotaNesting =
      Array.isArray(
        data.quotaNesting,
      )
        ? data.quotaNesting
        : [];
  }

  return targeting;
}

/* =========================================================
   TARGETING -> SCREENER
========================================================= */

/**
 * Convert database targeting values into an array.
 *
 * Examples:
 *
 * "Male"
 * -> ["Male"]
 *
 * "Male, Female"
 * -> ["Male", "Female"]
 *
 * "All"
 * -> ["Male", "Female"]
 */
function targetingOptions(
  value: unknown,
  options: string[],
): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) =>
            String(item).trim(),
          )
          .filter(Boolean),
      ),
    ).filter((item) =>
      options.includes(item),
    );
  }

  if (
    typeof value !== "string"
  ) {
    return [];
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return [];
  }

  if (normalized === "All") {
    return [...options];
  }

  return Array.from(
    new Set(
      normalized
        .split(",")
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean)
        .filter((item) =>
          options.includes(item),
        ),
    ),
  );
}

/* =========================================================
   CREATE SCREENER OPTION ID
========================================================= */

function createOptionId(
  questionId: string,
  index: number,
  label: string,
) {
  const cleanLabel =
    label
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        "_",
      )
      .replace(
        /^_+|_+$/g,
        "",
      );

  return `${questionId}_OPTION_${index + 1}_${cleanLabel}`;
}

/* =========================================================
   CREATE SCREENER OPTIONS

   IMPORTANT:

   Project schema expects:

   options: [
     {
       id,
       label,
       isQualifying
     }
   ]

   NOT:

   options: ["Male", "Female"]
========================================================= */

function buildScreenerOptions(
  questionId: string,
  values: string[],
) {
  return values.map(
    (label, index) => ({
      id: createOptionId(
        questionId,
        index,
        label,
      ),
      label,
      isQualifying: true,
    }),
  );
}

/* =========================================================
   CREATE ONE TARGETING QUESTION
========================================================= */

function buildTargetingQuestion(
  questionId: string,
  questionText: string,
  values: string[],
) {
  if (!values.length) {
    return null;
  }

  return {
    id: questionId,

    questionText,

    category: "targeting",

    type: "single_choice",

    options:
      buildScreenerOptions(
        questionId,
        values,
      ),

    terminationReason:
      "Does not meet the selected targeting criteria.",
  };
}

/* =========================================================
   GENERATE TARGETING SCREENER QUESTIONS
========================================================= */

function generateScreenerQuestionsFromTargeting(
  targeting: Record<string, any>,
) {
  const questions: any[] = [];

  /* -------------------------------------------------------
     GENDER
  ------------------------------------------------------- */

  const genderValues =
    targetingOptions(
      targeting.gender,
      GENDER_OPTIONS,
    );

  const genderQuestion =
    buildTargetingQuestion(
      "TARGET_GENDER",
      "What is your gender?",
      genderValues,
    );

  if (genderQuestion) {
    questions.push(
      genderQuestion,
    );
  }

  /* -------------------------------------------------------
     HISPANIC ORIGIN
  ------------------------------------------------------- */

  const hispanicValues =
    targetingOptions(
      targeting.hispanicOrigin,
      HISPANIC_OPTIONS,
    );

  const hispanicQuestion =
    buildTargetingQuestion(
      "TARGET_HISPANIC_ORIGIN",
      "Are you Hispanic or Latino?",
      hispanicValues,
    );

  if (hispanicQuestion) {
    questions.push(
      hispanicQuestion,
    );
  }

  /* -------------------------------------------------------
     RELATIONSHIP
  ------------------------------------------------------- */

  const relationshipValues =
    targetingOptions(
      targeting.relationship,
      RELATIONSHIP_OPTIONS,
    );

  const relationshipQuestion =
    buildTargetingQuestion(
      "TARGET_RELATIONSHIP",
      "What is your relationship status?",
      relationshipValues,
    );

  if (relationshipQuestion) {
    questions.push(
      relationshipQuestion,
    );
  }

  /* -------------------------------------------------------
     CHILDREN
  ------------------------------------------------------- */

  const childrenValues =
    targetingOptions(
      targeting.children,
      CHILDREN_OPTIONS,
    );

  const childrenQuestion =
    buildTargetingQuestion(
      "TARGET_CHILDREN",
      "Do you have children?",
      childrenValues,
    );

  if (childrenQuestion) {
    questions.push(
      childrenQuestion,
    );
  }

  /* -------------------------------------------------------
     EMPLOYMENT
  ------------------------------------------------------- */

  const employmentValues =
    targetingOptions(
      targeting.employment,
      EMPLOYMENT_OPTIONS,
    );

  const employmentQuestion =
    buildTargetingQuestion(
      "TARGET_EMPLOYMENT",
      "What is your employment status?",
      employmentValues,
    );

  if (employmentQuestion) {
    questions.push(
      employmentQuestion,
    );
  }

  /* -------------------------------------------------------
     EDUCATION
  ------------------------------------------------------- */

  const educationValues =
    targetingOptions(
      targeting.education,
      EDUCATION_OPTIONS,
    );

  const educationQuestion =
    buildTargetingQuestion(
      "TARGET_EDUCATION",
      "What is your highest level of education?",
      educationValues,
    );

  if (educationQuestion) {
    questions.push(
      educationQuestion,
    );
  }

  /* -------------------------------------------------------
     DEVICE
  ------------------------------------------------------- */

  const deviceValues =
    targetingOptions(
      targeting.device,
      DEVICE_OPTIONS,
    );

  const deviceQuestion =
    buildTargetingQuestion(
      "TARGET_DEVICE",
      "Which device do you primarily use?",
      deviceValues,
    );

  if (deviceQuestion) {
    questions.push(
      deviceQuestion,
    );
  }

  return questions;
}

/* =========================================================
   REGENERATE SCREENER FROM TARGETING

   Important:

   - Existing targeting questions are removed.
   - Manually-created/non-targeting questions remain.
   - New targeting questions are added.
========================================================= */

function regenerateScreenerFromTargeting(
  project: any,
) {
  const targeting =
    ((project as any).targeting ??
      {}) as Record<
      string,
      any
    >;

  const generatedQuestions =
    generateScreenerQuestionsFromTargeting(
      targeting,
    );

  const currentScreener =
    ((project as any).screener ??
      {}) as Record<
      string,
      any
    >;

  const currentQuestions =
    Array.isArray(
      currentScreener.questions,
    )
      ? currentScreener.questions
      : [];

  /*
   * Keep manually-created questions.
   *
   * Any question with category "targeting"
   * belongs to automatic targeting generation
   * and will be replaced.
   */
  const nonTargetingQuestions =
    currentQuestions.filter(
      (question: any) =>
        question?.category !==
        "targeting",
    );

  (project as any).screener = {
    ...currentScreener,

    questions: [
      ...nonTargetingQuestions,
      ...generatedQuestions,
    ],
  };

  return generatedQuestions;
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(
  req: Request,
  { params }: Ctx,
) {
  try {
    await connectDB();

    /* -------------------------------------------------------
       AUTH
    ------------------------------------------------------- */

    const userId =
      await getUserId();

    if (!userId) {
      return unauthorized();
    }

    /* -------------------------------------------------------
       PARAMS
    ------------------------------------------------------- */

    const { id } =
      await params;

    if (
      !id ||
      !isValidObjectId(id)
    ) {
      return fail(
        "Invalid project ID",
        400,
      );
    }

    /* -------------------------------------------------------
       BODY
    ------------------------------------------------------- */

    const body =
      await req.json();

    const section =
      body?.section;

    const data =
      body?.data;

    if (!section) {
      return fail(
        "Section is required",
        400,
      );
    }

    if (
      !data ||
      typeof data !== "object"
    ) {
      return fail(
        "Invalid section data",
        400,
      );
    }

    const allowedSections = [
      "basic",
      "sample",
      "targeting",
      "quotas",
      "surveySetup",
      "screener",
      "routing",
      "review",
    ];

    if (
      !allowedSections.includes(
        section,
      )
    ) {
      return fail(
        `Invalid section: ${section}`,
        400,
      );
    }

    /* -------------------------------------------------------
       FIND PROJECT
    ------------------------------------------------------- */

    const project =
      await Project.findById(id);

    if (!project) {
      return fail(
        "Project not found",
        404,
      );
    }

    /* -------------------------------------------------------
       OWNER CHECK
    ------------------------------------------------------- */

    const projectOwnerId =
      (project as any)
        .createdBy ??
      (project as any)
        .ownerId ??
      (project as any)
        .userId ??
      (project as any)
        .owner;

    if (
      projectOwnerId &&
      String(projectOwnerId) !==
        String(userId)
    ) {
      return fail(
        "Forbidden",
        403,
      );
    }

    /* -------------------------------------------------------
       DRAFT CHECK
    ------------------------------------------------------- */

    if (
      (project as any).status &&
      (project as any).status !==
        "draft"
    ) {
      return fail(
        "Only draft projects can be edited",
        400,
      );
    }

    /* =======================================================
       BASIC
    ======================================================= */

    if (section === "basic") {
      const allowedBasicFields = [
        "surveyTitle",
        "country",
        "audienceType",
        "audienceDescription",
        "loi",
        "ir",
      ];

      for (
        const field of
          allowedBasicFields
      ) {
        if (
          hasOwn(
            data,
            field,
          )
        ) {
          (project as any)[
            field
          ] =
            data[field];
        }
      }
    }

    /* =======================================================
       SAMPLE
    ======================================================= */

    if (section === "sample") {
      if (
        hasOwn(
          data,
          "sampleSize",
        )
      ) {
        (project as any)
          .sampleSize =
          data.sampleSize;
      }

      if (
        hasOwn(
          data,
          "loi",
        )
      ) {
        (project as any).loi =
          data.loi;
      }

      if (
        hasOwn(
          data,
          "ir",
        )
      ) {
        (project as any).ir =
          data.ir;
      }

      if (
        hasOwn(
          data,
          "estimate",
        )
      ) {
        (project as any)
          .estimate =
          data.estimate;
      }

      if (
        hasOwn(
          data,
          "feasibility",
        )
      ) {
        (project as any)
          .feasibility =
          data.feasibility;
      }
    }

    /* =======================================================
       TARGETING

       IMPORTANT:
       Targeting is normalized first.
       Screener is then generated from the NEW targeting.
    ======================================================= */

    if (
      section === "targeting"
    ) {
      const currentTargeting =
        ((project as any)
          .targeting ??
          {}) as Record<
          string,
          any
        >;

      const normalizedTargeting =
        normalizeTargeting(
          data,
          currentTargeting,
        );

      /*
       * Save the new targeting
       * into the Mongoose document.
       */
      (project as any)
        .targeting =
        normalizedTargeting;

      /*
       * Automatically regenerate
       * targeting-based screener.
       */
      regenerateScreenerFromTargeting(
        project,
      );
    }

    /* =======================================================
       QUOTAS
    ======================================================= */

    if (
      section === "quotas"
    ) {
      const currentTargeting =
        ((project as any)
          .targeting ??
          {}) as Record<
          string,
          any
        >;

      (project as any)
        .targeting = {
        ...currentTargeting,

        quotaNesting:
          data.quotaNesting ??
          [],
      };
    }

    /* =======================================================
       SURVEY SETUP
    ======================================================= */

    if (
      section ===
      "surveySetup"
    ) {
      const current =
        ((project as any)
          .surveySetup ??
          {}) as Record<
          string,
          any
        >;

      (project as any)
        .surveySetup = {
        ...current,
        ...data,
      };
    }

    /* =======================================================
       SCREENER

       Manual screener edits are allowed.

       We DO NOT regenerate here unless
       targeting was edited.
    ======================================================= */

    if (
      section === "screener"
    ) {
      const current =
        ((project as any)
          .screener ??
          {}) as Record<
          string,
          any
        >;

      (project as any)
        .screener = {
        ...current,
        ...data,
      };
    }

    /* =======================================================
       ROUTING
    ======================================================= */

    if (
      section === "routing"
    ) {
      const current =
        ((project as any)
          .routing ??
          {}) as Record<
          string,
          any
        >;

      (project as any)
        .routing = {
        ...current,
        ...data,
      };
    }

    /* =======================================================
       REVIEW
    ======================================================= */

    if (
      section === "review"
    ) {
      if (
        hasOwn(
          data,
          "reviewNotes",
        )
      ) {
        (project as any)
          .reviewNotes =
          data.reviewNotes;
      }
    }

    /* =======================================================
       VALIDATE + SAVE
    ======================================================= */

    await project.validate();

    await project.save();

    return NextResponse.json({
      success: true,

      message:
        "Project updated successfully",

      project,
    });
  } catch (error: any) {
    console.error(
      "PATCH /api/projects/[id] ERROR:",
      error,
    );

    console.error(
      "Error name:",
      error?.name,
    );

    console.error(
      "Error message:",
      error?.message,
    );

    console.error(
      "Validation errors:",
      error?.errors,
    );

    /* -------------------------------------------------------
       MONGOOSE VALIDATION ERROR
    ------------------------------------------------------- */

    if (
      error?.name ===
      "ValidationError"
    ) {
      const validationErrors: Record<
        string,
        string
      > = {};

      for (
        const [
          key,
          value,
        ] of Object.entries(
          error.errors ?? {},
        )
      ) {
        const item =
          value as any;

        validationErrors[
          key
        ] =
          item?.message ??
          "Validation error";
      }

      return NextResponse.json(
        {
          success: false,

          message:
            "Validation failed",

          errors:
            validationErrors,
        },
        {
          status: 400,
        },
      );
    }

    /* -------------------------------------------------------
       MONGOOSE CAST ERROR
    ------------------------------------------------------- */

    if (
      error?.name ===
      "CastError"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `Invalid value for ${error.path}`,

          value:
            error.value,
        },
        {
          status: 400,
        },
      );
    }

    /* -------------------------------------------------------
       OTHER ERROR
    ------------------------------------------------------- */

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  req: Request,
  { params }: Ctx,
) {
  try {
    await connectDB();

    const userId =
      await getUserId();

    if (!userId) {
      return unauthorized();
    }

    const { id } =
      await params;

    if (
      !id ||
      !isValidObjectId(id)
    ) {
      return fail(
        "Invalid project ID",
        400,
      );
    }

    const project =
      await Project.findById(
        id,
      ).lean();

    if (!project) {
      return fail(
        "Project not found",
        404,
      );
    }

    const projectOwnerId =
      (project as any)
        .createdBy ??
      (project as any)
        .ownerId ??
      (project as any)
        .userId ??
      (project as any)
        .owner;

    if (
      projectOwnerId &&
      String(projectOwnerId) !==
        String(userId)
    ) {
      return fail(
        "Forbidden",
        403,
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error(
      "GET /api/projects/[id] ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  req: Request,
  { params }: Ctx,
) {
  try {
    await connectDB();

    const userId =
      await getUserId();

    if (!userId) {
      return unauthorized();
    }

    const { id } =
      await params;

    if (
      !id ||
      !isValidObjectId(id)
    ) {
      return fail(
        "Invalid project ID",
        400,
      );
    }

    const project =
      await Project.findById(id);

    if (!project) {
      return fail(
        "Project not found",
        404,
      );
    }

    const projectOwnerId =
      (project as any)
        .createdBy ??
      (project as any)
        .ownerId ??
      (project as any)
        .userId ??
      (project as any)
        .owner;

    if (
      projectOwnerId &&
      String(projectOwnerId) !==
        String(userId)
    ) {
      return fail(
        "Forbidden",
        403,
      );
    }

    await Project.findByIdAndDelete(
      id,
    );

    return NextResponse.json({
      success: true,

      message:
        "Project deleted successfully",
    });
  } catch (error: any) {
    console.error(
      "DELETE /api/projects/[id] ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}