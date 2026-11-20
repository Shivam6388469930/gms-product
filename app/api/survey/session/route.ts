import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import RespondentSession from "@/models/RespondentSession";
import { findProjectByIdOrProjectId } from "@/lib/project-resolver";
import {
  buildClientSurveyUrl,
  isRespondentPlaceholder,
} from "@/lib/survey-urls";

/**
 * POST /api/survey/session
 *
 * Creates/retrieves a respondent survey session.
 *
 * IMPORTANT:
 * This route now uses the same RespondentSession architecture
 * as /api/survey/start.
 *
 * It does NOT create SurveySession records.
 *
 * Example:
 *
 * POST /api/survey/session
 *
 * {
 *   "projectId": "GMS82473",
 *   "respondentId": "TEST001",
 *   "supplierCode": "SUP001"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));

    const projectId = String(
      body.projectId ||
      body.pid ||
      body.project ||
      ""
    ).trim();

    const respondentId = String(
      body.respondentId ||
      body.rid ||
      body.respondent ||
      ""
    ).trim();

    const supplierCode = String(
      body.supplierCode ||
      body.sup ||
      body.source ||
      "DIRECT"
    ).trim();

    // =========================================================
    // 1. VALIDATE PROJECT
    // =========================================================

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required",
          error: "Project ID is required",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 2. VALIDATE RESPONDENT
    // =========================================================

    if (!respondentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Respondent ID is required",
          error: "Respondent ID is required",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 3. REJECT PLACEHOLDER
    // =========================================================

    if (isRespondentPlaceholder(respondentId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Actual respondent ID is required. The placeholder was not replaced.",
          error:
            "Respondent ID placeholder was not replaced",
          example:
            `${req.nextUrl.origin}/api/survey/session?pid=${encodeURIComponent(
              projectId
            )}&rid=TEST001`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 4. VALIDATE RESPONDENT FORMAT
    // =========================================================

    if (
      !/^[a-zA-Z0-9_.\-@]{1,256}$/.test(
        respondentId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid respondent ID format",
          error: "Invalid respondent ID format",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 5. FIND PROJECT
    // =========================================================

    const project =
      await findProjectByIdOrProjectId(projectId);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
          error: "Project not found",
          requestedProjectId: projectId,
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 6. VALIDATE PROJECT STATUS
    // =========================================================

    const normalizedStatus = String(
      project.status || ""
    )
      .toLowerCase()
      .trim();

    const allowedStatuses = [
      "live",
      "active",
    ];

    if (
      !allowedStatuses.includes(
        normalizedStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Project is currently ${project.status || "inactive"
            }.`,
          error: "Project is not accepting new respondents",
          projectId:
            project.projectId ||
            String(project._id),
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 7. GET CLIENT SURVEY URL
    // =========================================================

    const rawSurveyUrl = String(
      project.surveySetup?.surveyUrl ||
      project.surveyUrl ||
      ""
    ).trim();

    if (!rawSurveyUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Survey URL is not configured for this project.",
          error:
            "Survey URL is not configured",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 8. REQUEST INFORMATION
    // =========================================================

    const clientIp =
      req.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    const userAgent =
      req.headers.get("user-agent") || "";

    // =========================================================
    // 9. FIND EXISTING RESPONDENT SESSION
    // =========================================================

    let session =
      await RespondentSession.findOne({
        project: project._id,
        respondentId,
      });

    // =========================================================
    // 10. HANDLE EXISTING SESSION
    // =========================================================

    if (session) {
      const status = String(
        session.status || ""
      )
        .toLowerCase()
        .trim();

      // -------------------------------------------------------
      // COMPLETED
      // -------------------------------------------------------

      if (status === "completed") {
        return NextResponse.json({
          success: true,
          alreadyFinished: true,
          outcome: "complete",
          respondentId,
          projectId:
            project.projectId ||
            String(project._id),
          resultUrl:
            `/survey/result?status=complete&rid=${encodeURIComponent(
              respondentId
            )}`,
        });
      }

      // -------------------------------------------------------
      // TERMINATED
      // -------------------------------------------------------

      if (
        status === "terminated" ||
        status === "terminate" ||
        status === "screened_out"
      ) {
        return NextResponse.json({
          success: true,
          alreadyFinished: true,
          outcome: "terminate",
          respondentId,
          projectId:
            project.projectId ||
            String(project._id),
          resultUrl:
            `/survey/result?status=terminate&rid=${encodeURIComponent(
              respondentId
            )}`,
        });
      }

      // -------------------------------------------------------
      // QUOTA
      // -------------------------------------------------------

      if (status === "quota_full") {
        return NextResponse.json({
          success: true,
          alreadyFinished: true,
          outcome: "quota",
          respondentId,
          projectId:
            project.projectId ||
            String(project._id),
          resultUrl:
            `/survey/result?status=quota&rid=${encodeURIComponent(
              respondentId
            )}`,
        });
      }

      // -------------------------------------------------------
      // ACTIVE SESSION
      //
      // DO NOT increment starts again.
      // -------------------------------------------------------

      session.ip = clientIp;
      session.userAgent = userAgent;

      if (supplierCode) {
        session.supplierCode =
          supplierCode;
      }

      session.targetSurveyUrl =
        rawSurveyUrl;

      await session.save();
    } else {
      // =======================================================
      // 11. CREATE NEW RESPONDENT SESSION
      // =======================================================

      session =
        await RespondentSession.create({
          project: project._id,

          projectId:
            project.projectId ||
            String(project._id),

          respondentId,

          supplierCode,

          ip: clientIp,

          userAgent,

          status: "started",

          startedAt: new Date(),

          targetSurveyUrl:
            rawSurveyUrl,
        });

      // =======================================================
      // 12. INCREMENT PROJECT START
      // =======================================================

      if (!project.progress) {
        project.progress = {
          starts: 0,
          completes: 0,
          screenouts: 0,
          quotaFull: 0,
          qualityRejects: 0,
          spend: 0,
        };
      }

      project.progress.starts =
        Number(
          project.progress.starts || 0
        ) + 1;

      await project.save();
    }

    // =========================================================
    // 13. DETERMINE RESPONDENT PARAMETER
    // =========================================================

    let respondentParam = String(
      project.respondentParam || ""
    ).trim();

    if (!respondentParam) {
      const match =
        rawSurveyUrl.match(
          /[?&]([^=&]+)=\{(?:respondentId|respondentID|respondent_id|rid|RID)\}/i
        );

      if (match?.[1]) {
        respondentParam =
          match[1];
      }
    }

    if (!respondentParam) {
      respondentParam = "rid";
    }

    // =========================================================
    // 14. BUILD CLIENT SURVEY URL
    // =========================================================

    const finalClientUrl =
      buildClientSurveyUrl(
        rawSurveyUrl,
        respondentId,
        respondentParam
      );

    if (!finalClientUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to build client survey URL",
          error:
            "Unable to build client survey URL",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 15. GENERATE REDIRECT URLs
    // =========================================================

    const baseUrl =
      (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        req.nextUrl.origin
      )
        .trim()
        .replace(/\/+$/, "");

    const encodedProjectId =
      encodeURIComponent(
        project.projectId ||
        String(project._id)
      );

    const encodedRespondentId =
      encodeURIComponent(
        respondentId
      );

    const completeUrl =
      `${baseUrl}/api/survey/redirect/complete` +
      `?pid=${encodedProjectId}` +
      `&rid=${encodedRespondentId}`;

    const terminateUrl =
      `${baseUrl}/api/survey/redirect/terminate` +
      `?pid=${encodedProjectId}` +
      `&rid=${encodedRespondentId}`;

    const quotaUrl =
      `${baseUrl}/api/survey/redirect/quota` +
      `?pid=${encodedProjectId}` +
      `&rid=${encodedRespondentId}`;

    // =========================================================
    // 16. RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        session: {
          id: String(session._id),
          status: session.status,
          respondentId,
          projectId:
            project.projectId ||
            String(project._id),
          supplierCode:
            session.supplierCode,
          startedAt:
            session.startedAt,
        },

        survey: {
          title:
            project.surveyTitle ||
            project.name ||
            "Survey",

          country:
            project.country || "",

          estimatedLoi:
            project.loi || 10,

          targetSurveyUrl:
            finalClientUrl,
        },

        redirects: {
          complete: completeUrl,
          terminate: terminateUrl,
          quota: quotaUrl,
        },

        message:
          "Survey session created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "POST /api/survey/session error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to create survey session",
        error:
          "Failed to create survey session",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/survey/session
 *
 * Gets the existing RespondentSession.
 *
 * Example:
 *
 * /api/survey/session?pid=GMS82473&rid=TEST001
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams =
      req.nextUrl.searchParams;

    const projectId = (
      searchParams.get("pid") ||
      searchParams.get("projectId") ||
      searchParams.get("project") ||
      ""
    ).trim();

    const respondentId = (
      searchParams.get("rid") ||
      searchParams.get("respondentId") ||
      searchParams.get("respondent") ||
      ""
    ).trim();

    // =========================================================
    // VALIDATION
    // =========================================================

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required",
        },
        { status: 400 }
      );
    }

    if (!respondentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Respondent ID is required",
        },
        { status: 400 }
      );
    }

    if (
      isRespondentPlaceholder(
        respondentId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Actual respondent ID is required",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // FIND PROJECT
    // =========================================================

    const project =
      await findProjectByIdOrProjectId(
        projectId
      );

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // FIND SESSION
    // =========================================================

    const session =
      await RespondentSession.findOne({
        project: project._id,
        respondentId,
      }).lean();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Survey session not found",
          projectId,
          respondentId,
        },
        { status: 404 }
      );
    }

    // =========================================================
    // BUILD CLIENT URL
    // =========================================================

    const rawSurveyUrl = String(
      project.surveySetup?.surveyUrl ||
      project.surveyUrl ||
      ""
    ).trim();

    let respondentParam = String(
      project.respondentParam || ""
    ).trim();

    if (!respondentParam) {
      const match =
        rawSurveyUrl.match(
          /[?&]([^=&]+)=\{(?:respondentId|respondentID|respondent_id|rid|RID)\}/i
        );

      if (match?.[1]) {
        respondentParam =
          match[1];
      }
    }

    if (!respondentParam) {
      respondentParam = "rid";
    }

    const targetSurveyUrl =
      buildClientSurveyUrl(
        rawSurveyUrl,
        respondentId,
        respondentParam
      );

    // =========================================================
    // REDIRECT URLS
    // =========================================================

    const baseUrl =
      (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        req.nextUrl.origin
      )
        .trim()
        .replace(/\/+$/, "");

    const encodedProjectId =
      encodeURIComponent(
        project.projectId ||
        String(project._id)
      );

    const encodedRespondentId =
      encodeURIComponent(
        respondentId
      );

    return NextResponse.json({
      success: true,

      session: {
        id: String(session._id),

        status: session.status,

        projectId:
          project.projectId ||
          String(project._id),

        respondentId:
          session.respondentId,

        supplierCode:
          session.supplierCode,

        startedAt:
          session.startedAt,

        targetSurveyUrl,

        redirects: {
          complete:
            `${baseUrl}/api/survey/redirect/complete?pid=${encodedProjectId}&rid=${encodedRespondentId}`,

          terminate:
            `${baseUrl}/api/survey/redirect/terminate?pid=${encodedProjectId}&rid=${encodedRespondentId}`,

          quota:
            `${baseUrl}/api/survey/redirect/quota?pid=${encodedProjectId}&rid=${encodedRespondentId}`,
        },
      },
    });
  } catch (error: any) {
    console.error(
      "GET /api/survey/session error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to retrieve survey session",
      },
      { status: 500 }
    );
  }
}