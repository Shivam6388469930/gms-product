import { NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";
import { parseProjectInput } from "@/lib/project-validation";
import { estimateProject } from "@/lib/feasibility";
import {
  assignSuppliersToProject,
  buildSupplierAllocationPlan,
  SupplierAllocationError,
  type SupplierAllocationPlan,
} from "@/lib/auto-allocate-suppliers";

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
      .select("-screener.questions -quotaNesting")
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

    let supplierPlan: SupplierAllocationPlan;

    try {
      supplierPlan = await buildSupplierAllocationPlan(
        parsed.value.country,
        parsed.value.audienceType,
        parsed.value.sampleSize
      );
    } catch (error) {
      if (error instanceof SupplierAllocationError) {
        return fail(error.message, 400);
      }
      throw error;
    }

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

    // Extract quotas and overquotaConfig from the raw body (not validated by parseProjectInput)
    const quotas = Array.isArray(body.quotas) ? body.quotas : [];
    const overquotaConfig = body.overquotaConfig && typeof body.overquotaConfig === "object"
      ? {
        bufferPercent: Number(body.overquotaConfig.bufferPercent) || 0,
        action: body.overquotaConfig.action || "terminate",
        redirectUrl: String(body.overquotaConfig.redirectUrl || ""),
      }
      : { bufferPercent: 5, action: "terminate", redirectUrl: "" };

    const rawSurveyUrl = String(body.surveyUrl || body.surveySetup?.surveyUrl || "").trim();
    const customPid = String(body.projectId || "").trim();

    const project = await Project.create({
      owner: userId,
      projectId: customPid || undefined,
      clientName: String(body.clientName || body.client || "").trim(),
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      surveyUrl: rawSurveyUrl,
      respondentParam: body.respondentParam || "rid",

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
        surveyUrl: rawSurveyUrl,
        surveyType: "external",
        estimatedLoi: parsed.value.loi,
        redirectUrl: "",
        terminationUrl: "",
        qualificationUrl: "",
        status: rawSurveyUrl ? "ready" : "not_configured",
      },

      status: body.status || "draft",

      progress: {
        starts: 0,
        completes: 0,
        screenouts: 0,
        quotaFull: 0,
        qualityRejects: 0,
        spend: 0,
      },
    });

    await assignSuppliersToProject(project, supplierPlan);

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