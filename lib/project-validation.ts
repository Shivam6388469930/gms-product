import {
  AUDIENCES,
  COUNTRIES,
  type ProjectInput,
  type AdvancedTargeting,
} from "./project-config";

/* =========================================================
   RESULT TYPE
========================================================= */

type Result =
  | {
      ok: true;
      value: ProjectInput;
    }
  | {
      ok: false;
      message: string;
    };

/* =========================================================
   HELPERS
========================================================= */

const inRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return (
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
};

const numberValue = (
  value: unknown
): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);

    return Number.isFinite(parsed)
      ? parsed
      : undefined;
  }

  return undefined;
};

const stringValue = (
  value: unknown,
  fallback = ""
): string => {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
};

const stringArray = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) => item.trim())
    .filter(Boolean);
};

/* =========================================================
   OBJECT HELPER
========================================================= */

const objectValue = (
  value: unknown
): Record<string, any> => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as Record<string, any>;
};

/* =========================================================
   ADVANCED TARGETING
========================================================= */

const advancedTargetingArray = (
  value: unknown
): AdvancedTargeting[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is AdvancedTargeting => {
      return (
        item !== null &&
        typeof item === "object" &&
        !Array.isArray(item)
      );
    }
  );
};

/* =========================================================
   QUOTA NESTING
========================================================= */

const quotaNestingArray = (
  value: unknown
): unknown[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value;
};

/* =========================================================
   TARGETING VALIDATION
========================================================= */

function parseTargeting(
  body: Record<string, any>,
  projectCountry: string
) {
  const targeting = objectValue(
    body.targeting
  );

  const location = objectValue(
    targeting.location
  );

  /* -------------------------------------------------------
     COUNTRY
  ------------------------------------------------------- */

  const targetingCountry = stringValue(
    targeting.country,
    projectCountry
  );

  if (
    targetingCountry &&
    !COUNTRIES.some(
      (country) =>
        country.code === targetingCountry
    )
  ) {
    throw new Error(
      "Choose a supported targeting country"
    );
  }

  /* -------------------------------------------------------
     COUNTRY CONSISTENCY
  ------------------------------------------------------- */

  if (
    targetingCountry &&
    targetingCountry !== projectCountry
  ) {
    throw new Error(
      "Targeting country must match project country"
    );
  }

  /* -------------------------------------------------------
     TARGETING
  ------------------------------------------------------- */

  return {
    country: targetingCountry,

    language: stringValue(
      targeting.language,
      "English"
    ),

    category: stringValue(
      targeting.category,
      ""
    ),

    gender: stringValue(
      targeting.gender,
      "All"
    ),

    age:
      targeting.age !== undefined &&
      targeting.age !== null
        ? targeting.age
        : "All",

    income:
      targeting.income !== undefined &&
      targeting.income !== null
        ? targeting.income
        : "All",

    hispanicOrigin: stringValue(
      targeting.hispanicOrigin,
      "All"
    ),

    relationship: stringValue(
      targeting.relationship,
      "All"
    ),

    children: stringValue(
      targeting.children,
      "All"
    ),

    employment: stringValue(
      targeting.employment,
      "All"
    ),

    education: stringValue(
      targeting.education,
      "All"
    ),

    device: stringValue(
      targeting.device,
      "All"
    ),

    /* -------------------------------------------------------
       ADVANCED TARGETING
    ------------------------------------------------------- */

    advancedTargeting:
      advancedTargetingArray(
        targeting.advancedTargeting
      ),

    /* -------------------------------------------------------
       LOCATION
    ------------------------------------------------------- */

    location: {
      region: stringArray(
        location.region
      ),

      division: stringArray(
        location.division
      ),

      state: stringArray(
        location.state
      ),

      csa: stringArray(
        location.csa
      ),

      cbsa: stringArray(
        location.cbsa
      ),

      county: stringArray(
        location.county
      ),

      dma: stringArray(
        location.dma
      ),

      zipcode: stringArray(
        location.zipcode
      ),
    },

    /* -------------------------------------------------------
       QUOTA NESTING
    ------------------------------------------------------- */

    quotaNesting:
      quotaNestingArray(
        targeting.quotaNesting
      ),
  };
}

/* =========================================================
   PROJECT INPUT VALIDATION
========================================================= */

export function parseProjectInput(
  body: any,
  requireSurveyTitle = true
): Result {
  /* -------------------------------------------------------
     SAFE BODY
  ------------------------------------------------------- */

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return {
      ok: false,
      message: "Invalid project data",
    };
  }

  /* -------------------------------------------------------
     BASIC VALUES
  ------------------------------------------------------- */

  const surveyTitle = stringValue(
    body.surveyTitle
  );

  const audienceDescription =
    stringValue(
      body.audienceDescription
    );

  const country = stringValue(
    body.country
  );

  const audienceType = stringValue(
    body.audienceType
  );

  /* -------------------------------------------------------
     NUMERIC VALUES
  ------------------------------------------------------- */

  const sampleSize = numberValue(
    body.sampleSize
  );

  const loi = numberValue(
    body.loi
  );

  const ir = numberValue(
    body.ir
  );

  /* =======================================================
     SURVEY TITLE
  ======================================================= */

  if (requireSurveyTitle) {
    if (
      surveyTitle.length < 2 ||
      surveyTitle.length > 120
    ) {
      return {
        ok: false,
        message:
          "Survey title must be 2–120 characters",
      };
    }
  }

  /* =======================================================
     COUNTRY
  ======================================================= */

  const countryExists =
    COUNTRIES.some(
      (countryOption) =>
        countryOption.code === country
    );

  if (!countryExists) {
    return {
      ok: false,
      message:
        "Choose a supported country",
    };
  }

  /* =======================================================
     AUDIENCE TYPE
  ======================================================= */

  const audienceExists =
    AUDIENCES.some(
      (audienceOption) =>
        audienceOption.value ===
        audienceType
    );

  if (!audienceExists) {
    return {
      ok: false,
      message:
        "Choose a valid audience type",
    };
  }

  /* =======================================================
     SAMPLE SIZE
  ======================================================= */

  if (
    sampleSize === undefined ||
    !inRange(
      sampleSize,
      1,
      100000
    ) ||
    !Number.isInteger(sampleSize)
  ) {
    return {
      ok: false,
      message:
        "Sample size must be a whole number between 1 and 100,000",
    };
  }

  /* =======================================================
     LOI
  ======================================================= */

  if (
    loi === undefined ||
    !inRange(loi, 1, 60) ||
    !Number.isInteger(loi)
  ) {
    return {
      ok: false,
      message:
        "LOI must be a whole number between 1 and 60 minutes",
    };
  }

  /* =======================================================
     INCIDENCE RATE
  ======================================================= */

  if (
    ir === undefined ||
    !inRange(ir, 1, 100)
  ) {
    return {
      ok: false,
      message:
        "Incidence rate must be between 1 and 100%",
    };
  }

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  if (
    audienceDescription.length > 500
  ) {
    return {
      ok: false,
      message:
        "Audience description is too long (max 500 characters)",
    };
  }

  /* =======================================================
     TARGETING
  ======================================================= */

  let targeting;

  try {
    targeting = parseTargeting(
      body,
      country
    );
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Invalid targeting data",
    };
  }

  /* =======================================================
     FINAL RESULT
  ======================================================= */

  return {
    ok: true,

    value: {
      surveyTitle,

      country: country as any,

      audienceType: audienceType as any,

      audienceDescription,

      sampleSize,

      loi,

      ir,

      targeting: targeting as any,
    },
  };
}