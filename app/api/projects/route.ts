import { NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";
import { parseProjectInput } from "@/lib/project-validation";
import { estimateProject } from "@/lib/feasibility";

/* =========================================================
   GET /api/projects
========================================================= */

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return unauthorized();
    }

    await connectDB();

    const projects = await Project.find({
      owner: userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("GET /api/projects error:", error);

    return fail("Something went wrong", 500);
  }
}

/* =========================================================
   POST /api/projects
========================================================= */

export async function POST(req: Request) {
  try {
    /* -------------------------------------------------------
       AUTH
    ------------------------------------------------------- */

    const userId = await getUserId();

    if (!userId) {
      return unauthorized();
    }

    /* -------------------------------------------------------
       BODY
    ------------------------------------------------------- */

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return fail("Invalid request body", 400);
    }

    console.log("POST /api/projects body:", body);

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    const parsed = parseProjectInput(body);

    if (!parsed.ok) {
      console.error(
        "Project validation failed:",
        parsed.message
      );

      return fail(parsed.message, 400);
    }

    /* -------------------------------------------------------
       DATABASE
    ------------------------------------------------------- */

    await connectDB();

    /* -------------------------------------------------------
       FEASIBILITY
    ------------------------------------------------------- */

    let estimate;

    try {
      estimate = await estimateProject(parsed.value);
    } catch (error) {
      console.error(
        "Project feasibility calculation failed:",
        error
      );

      return fail(
        "Unable to calculate project feasibility.",
        500
      );
    }

    /* -------------------------------------------------------
       CREATE PROJECT
    ------------------------------------------------------- */

    // const project = await Project.create({
    //   owner: userId,

    //   /* =========================
    //      BASIC INFO
    //   ========================= */

    //   surveyTitle: parsed.value.surveyTitle,

    //   country: parsed.value.country,

    //   audienceType: parsed.value.audienceType,

    //   audienceDescription:
    //     parsed.value.audienceDescription ?? "",

    //   /* =========================
    //      FEASIBILITY INPUT
    //   ========================= */

    //   sampleSize: parsed.value.sampleSize,

    //   loi: parsed.value.loi,

    //   ir: parsed.value.ir,

    //   estimate,

    //   /* =========================
    //      TARGETING
    //   ========================= */

    //   targeting: {
    //     country:
    //       parsed.value.targeting?.country ??
    //       parsed.value.country,

    //     language:
    //       parsed.value.targeting?.language ??
    //       "English",

    //     category:
    //       parsed.value.targeting?.category ??
    //       "",

    //     gender:
    //       parsed.value.targeting?.gender ??
    //       "All",

    //     age:
    //       parsed.value.targeting?.age ??
    //       "All",

    //     income:
    //       parsed.value.targeting?.income ??
    //       "All",

    //     hispanicOrigin:
    //       parsed.value.targeting?.hispanicOrigin ??
    //       "All",

    //     relationship:
    //       parsed.value.targeting?.relationship ??
    //       "All",

    //     children:
    //       parsed.value.targeting?.children ??
    //       "All",

    //     employment:
    //       parsed.value.targeting?.employment ??
    //       "All",

    //     education:
    //       parsed.value.targeting?.education ??
    //       "All",

    //     device:
    //       parsed.value.targeting?.device ??
    //       "All",

    //     advancedTargeting:
    //       parsed.value.targeting?.advancedTargeting ??
    //       [],

    //     location: {
    //       region:
    //         parsed.value.targeting?.location?.region ??
    //         [],

    //       division:
    //         parsed.value.targeting?.location?.division ??
    //         [],

    //       state:
    //         parsed.value.targeting?.location?.state ??
    //         [],

    //       csa:
    //         parsed.value.targeting?.location?.csa ??
    //         [],

    //       cbsa:
    //         parsed.value.targeting?.location?.cbsa ??
    //         [],

    //       county:
    //         parsed.value.targeting?.location?.county ??
    //         [],

    //       dma:
    //         parsed.value.targeting?.location?.dma ??
    //         [],

    //       zipcode:
    //         parsed.value.targeting?.location?.zipcode ??
    //         [],
    //     },

    //     quotaNesting:
    //       parsed.value.targeting?.quotaNesting ??
    //       [],
    //   },

    //   /* =========================
    //      SURVEY SETUP
    //   ========================= */

    //   surveySetup: {
    //     surveyUrl: "",
    //     surveyType: "external",
    //     estimatedLoi: parsed.value.loi,
    //     redirectUrl: "",
    //     terminationUrl: "",
    //     qualificationUrl: "",
    //     status: "not_configured",
    //   },

    //   /* =========================
    //      STATUS
    //   ========================= */

    //   status: "draft",

    //   /* =========================
    //      PROGRESS
    //   ========================= */

    //   progress: {
    //     starts: 0,
    //     completes: 0,
    //     screenouts: 0,
    //     quotaFull: 0,
    //     qualityRejects: 0,
    //     spend: 0,
    //   },
    // });

    // Extract quotas and overquotaConfig from the raw body (not validated by parseProjectInput)
    const quotas = Array.isArray(body.quotas) ? body.quotas : [];
    const overquotaConfig = body.overquotaConfig && typeof body.overquotaConfig === "object"
      ? {
          bufferPercent: Number(body.overquotaConfig.bufferPercent) || 0,
          action: body.overquotaConfig.action || "terminate",
          redirectUrl: String(body.overquotaConfig.redirectUrl || ""),
        }
      : { bufferPercent: 5, action: "terminate", redirectUrl: "" };

    const project = await Project.create({
  owner: userId,

  surveyTitle: parsed.value.surveyTitle,

  country: parsed.value.country,

  audienceType: parsed.value.audienceType,

  audienceDescription:
    parsed.value.audienceDescription ?? "",

  sampleSize: parsed.value.sampleSize,

  loi: parsed.value.loi,

  ir: parsed.value.ir,

  estimate,

  targeting: parsed.value.targeting,

  quotas,

  overquotaConfig,

  surveySetup: {
    surveyUrl: "",
    surveyType: "external",
    estimatedLoi: parsed.value.loi,
    redirectUrl: "",
    terminationUrl: "",
    qualificationUrl: "",
    status: "not_configured",
  },

  status: "draft",

  progress: {
    starts: 0,
    completes: 0,
    screenouts: 0,
    quotaFull: 0,
    qualityRejects: 0,
    spend: 0,
  },
});
    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        project,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    /* =======================================================
       IMPORTANT: SHOW REAL ERROR
    ======================================================= */

    console.error("======================================");
    console.error("POST /api/projects FAILED");
    console.error("======================================");

    console.error("Error:", error);
    console.error("Message:", error?.message);
    console.error("Name:", error?.name);
    console.error("Code:", error?.code);
    console.error("Errors:", error?.errors);

    /* -------------------------------------------------------
       MONGOOSE VALIDATION ERROR
    ------------------------------------------------------- */

    if (error?.name === "ValidationError") {
      const validationErrors = Object.values(
        error.errors ?? {}
      ).map((item: any) => ({
        field: item.path,
        message: item.message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: "Project validation failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       MONGOOSE CAST ERROR
    ------------------------------------------------------- */

    if (error?.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid value for ${error.path}`,
          error: error.message,
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       DUPLICATE KEY
    ------------------------------------------------------- */

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "A project with this value already exists.",
          error: error.keyValue,
        },
        { status: 409 }
      );
    }

    /* -------------------------------------------------------
       GENERIC ERROR
    ------------------------------------------------------- */

    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error?.message ||
              "Something went wrong"
            : "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}