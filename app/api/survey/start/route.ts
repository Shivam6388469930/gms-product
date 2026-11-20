import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import RespondentSession from "@/models/RespondentSession";
import { findProjectByIdOrProjectId } from "@/lib/project-resolver";
import {
  buildClientSurveyUrl,
  isRespondentPlaceholder,
} from "@/lib/survey-urls";

/**
 * GET /api/survey/start
 *
 * Public survey entry gateway for panelists.
 *
 * Example:
 * /api/survey/start?pid=GMS82473&rid=TEST001
 *
 * Workflow:
 *
 * Supplier / Panel
 *        ↓
 * GMS Entry URL
 *        ↓
 * Validate project + respondent
 *        ↓
 * Create / retrieve RespondentSession
 *        ↓
 * Build client survey URL
 *        ↓
 * Redirect respondent to client survey
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // =========================================================
    // 1. READ PROJECT ID
    // =========================================================

    const pid = (
      searchParams.get("pid") ||
      searchParams.get("projectId") ||
      searchParams.get("project") ||
      ""
    ).trim();

    // =========================================================
    // 2. READ RESPONDENT ID
    // =========================================================

    const rid = (
      searchParams.get("rid") ||
      searchParams.get("respondentId") ||
      searchParams.get("respondent") ||
      ""
    ).trim();

    // =========================================================
    // 3. VALIDATE PROJECT ID
    // =========================================================

    if (!pid) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID (pid) is required",
          message: "Project ID (pid) is required",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 4. VALIDATE RESPONDENT ID
    // =========================================================

    if (!rid) {
      return NextResponse.json(
        {
          success: false,
          error: "Respondent ID (rid) is required",
          message: "Respondent ID (rid) is required",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 5. REJECT PLACEHOLDER RESPONDENT ID
    //
    // Example of invalid request:
    //
    // rid={respondentId}
    //
    // The supplier/panel must replace it with:
    //
    // rid=TEST001
    // =========================================================

    if (isRespondentPlaceholder(rid)) {
      return NextResponse.json(
        {
          success: false,
          error: "Respondent ID placeholder was not replaced",
          message:
            "The supplier/client must replace {respondentId} with the actual respondent ID before calling the survey endpoint.",
          respondentId: rid,
          example:
            `${req.nextUrl.origin}/api/survey/start?pid=${encodeURIComponent(
              pid
            )}&rid=TEST001`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 6. VALIDATE RESPONDENT ID FORMAT
    // =========================================================

    if (!/^[a-zA-Z0-9_.\-@]{1,256}$/.test(rid)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid respondent ID format",
          message: "Invalid respondent ID format",
          respondentId: rid,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 7. CONNECT DATABASE
    // =========================================================

    await connectDB();

    // =========================================================
    // 8. FIND PROJECT
    // =========================================================

    const project = await findProjectByIdOrProjectId(pid);

    if (!project) {
      console.warn(
        `[Survey Start] Project not found: ${pid}`
      );

      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
          message: "Project not found",
          requestedProjectId: pid,
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 9. VALIDATE PROJECT STATUS
    //
    // Public production entry should normally be:
    // live / active
    //
    // Draft/testing should not be publicly accessible.
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

    if (!allowedStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Project is currently ${project.status || "inactive"
            }. New survey entries are closed.`,
          message: `Project is currently ${project.status || "inactive"
            }. New survey entries are closed.`,
          projectId:
            project.projectId || String(project._id),
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 10. GET CLIENT SURVEY URL
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
          error:
            "Survey URL is not configured for this project.",
          message:
            "Survey URL is not configured for this project.",
          projectId:
            project.projectId || String(project._id),
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 11. REQUEST METADATA
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

    const supplierCode =
      (
        searchParams.get("sup") ||
        searchParams.get("supplierCode") ||
        searchParams.get("source") ||
        "DIRECT"
      ).trim();

    const now = new Date();

    // =========================================================
    // 12. FIND EXISTING SESSION
    //
    // IMPORTANT:
    // Search by the exact MongoDB project reference + respondent.
    //
    // This prevents:
    //
    // Project A + TEST001
    //
    // from accidentally matching:
    //
    // Project B + TEST001
    // =========================================================

    let session =
      await RespondentSession.findOne({
        project: project._id,
        respondentId: rid,
      });

    // =========================================================
    // 13. EXISTING SESSION
    // =========================================================

    if (session) {
      const currentStatus = String(
        session.status || ""
      )
        .toLowerCase()
        .trim();

      // -------------------------------------------------------
      // Already completed
      // -------------------------------------------------------

      if (currentStatus === "completed") {
        return NextResponse.redirect(
          new URL(
            `/survey/result?status=complete&rid=${encodeURIComponent(
              rid
            )}`,
            req.url
          )
        );
      }

      // -------------------------------------------------------
      // Already terminated / screened out
      // -------------------------------------------------------

      if (
        currentStatus === "screened_out" ||
        currentStatus === "terminate" ||
        currentStatus === "terminated"
      ) {
        return NextResponse.redirect(
          new URL(
            `/survey/result?status=terminate&rid=${encodeURIComponent(
              rid
            )}`,
            req.url
          )
        );
      }

      // -------------------------------------------------------
      // Already quota full
      // -------------------------------------------------------

      if (currentStatus === "quota_full") {
        return NextResponse.redirect(
          new URL(
            `/survey/result?status=quota&rid=${encodeURIComponent(
              rid
            )}`,
            req.url
          )
        );
      }

      // -------------------------------------------------------
      // Existing active session
      //
      // Do NOT increment starts again.
      // -------------------------------------------------------

      session.ip = clientIp;
      session.userAgent = userAgent;

      // Keep supplier information updated if available.
      if (supplierCode) {
        session.supplierCode = supplierCode;
      }

      // Keep target URL synchronized.
      session.targetSurveyUrl = rawSurveyUrl;

      await session.save();

      console.log(
        `[Survey Start] Existing session reused: ` +
        `project=${project.projectId || project._id
        } ` +
        `respondent=${rid}`
      );
    } else {
      // =======================================================
      // 14. CREATE NEW SESSION
      // =======================================================

      session =
        await RespondentSession.create({
          project: project._id,

          projectId:
            project.projectId ||
            String(project._id),

          respondentId: rid,

          supplierCode,

          ip: clientIp,

          userAgent,

          status: "started",

          startedAt: now,

          targetSurveyUrl: rawSurveyUrl,
        });

      // =======================================================
      // 15. INCREMENT PROJECT START COUNTER
      //
      // Only happens when a NEW RespondentSession is created.
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
        Number(project.progress.starts || 0) + 1;

      await project.save();

      console.log(
        `[Survey Start] New session created: ` +
        `project=${project.projectId || project._id
        } ` +
        `respondent=${rid}`
      );
    }

    // =========================================================
    // 16. DETERMINE RESPONDENT PARAMETER
    //
    // Example client URL:
    //
    // https://client.com/survey?pid=GMS82473&rid={respondentId}
    //
    // This detects:
    //
    // rid
    //
    // automatically.
    // =========================================================

    let respondentParam = String(
      project.respondentParam || ""
    ).trim();

    if (!respondentParam) {
      const match = rawSurveyUrl.match(
        /[?&]([^=&]+)=\{(?:respondentId|respondentID|respondent_id|rid|RID)\}/i
      );

      if (match?.[1]) {
        respondentParam = match[1];
      }
    }

    // Default parameter.
    if (!respondentParam) {
      respondentParam = "rid";
    }

    // =========================================================
    // 17. BUILD FINAL CLIENT URL
    // =========================================================

    const finalClientUrl =
      buildClientSurveyUrl(
        rawSurveyUrl,
        rid,
        respondentParam
      );

    if (!finalClientUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to build client survey URL",
          message:
            "Unable to build client survey URL",
          projectId:
            project.projectId || String(project._id),
          respondentId: rid,
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 18. LOG FINAL REDIRECT
    // =========================================================

    console.log(
      `[Survey Start] ` +
      `project=${project.projectId || project._id
      } ` +
      `respondent=${rid} ` +
      `respondentParam=${respondentParam} ` +
      `target=${finalClientUrl}`
    );

    // =========================================================
    // 19. JSON MODE
    //
    // Useful for testing:
    //
    // ?redirect=false
    //
    // or:
    //
    // Accept: application/json
    // =========================================================

    if (
      searchParams.get("redirect") ===
      "false" ||
      req.headers
        .get("accept")
        ?.includes("application/json")
    ) {
      return NextResponse.json({
        success: true,

        projectId:
          project.projectId ||
          String(project._id),

        respondentId: rid,

        respondentParam,

        targetSurveyUrl:
          finalClientUrl,

        sessionId: String(session._id),

        sessionStatus:
          session.status,

        message:
          "Survey session started successfully",
      });
    }

    // =========================================================
    // 20. REDIRECT TO CLIENT SURVEY
    // =========================================================

    return NextResponse.redirect(
      finalClientUrl
    );
  } catch (error: any) {
    console.error(
      "GET /api/survey/start error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to initiate survey entry",
        message:
          "Failed to initiate survey entry",
      },
      { status: 500 }
    );
  }
}