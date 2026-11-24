import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/config/db";
import RespondentSession from "@/models/RespondentSession";
import Project from "@/models/Project";
import SupplierAllocation from "@/models/SupplierAllocation";
import {
  isRespondentPlaceholder,
  replaceRespondentPlaceholder,
} from "@/lib/survey-urls";

type Outcome = "complete" | "terminate" | "quota" | "security";

type FinalStatus =
  | "completed"
  | "terminated"
  | "quota_full";

const TERMINAL_STATUSES = [
  "completed",
  "terminated",
  "terminate",
  "screened_out",
  "quota_full",
] as const;

/* =========================================================
   STATUS HELPERS
========================================================= */

function getDatabaseStatus(outcome: Outcome): FinalStatus {
  switch (outcome) {
    case "complete":
      return "completed";

    case "terminate":
    case "security":
      return "terminated";

    case "quota":
      return "quota_full";
  }
}

function getResultStatus(status: string): Outcome {
  const normalized = String(status || "")
    .toLowerCase()
    .trim();

  if (normalized === "completed") {
    return "complete";
  }

  if (normalized === "quota_full") {
    return "quota";
  }

  return "terminate";
}

/* =========================================================
   PROJECT ID NORMALIZATION
========================================================= */

function normalizeProjectId(value: string) {
  return String(value || "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

/* =========================================================
   FIND PROJECT
========================================================= */

async function findProject(
  projectId: string,
  respondentId: string
) {
  const normalizedProjectId = normalizeProjectId(projectId);

  /*
   * ---------------------------------------------------------
   * 1. Exact business projectId
   *
   * Example:
   * GMS82473
   * ---------------------------------------------------------
   */

  let project = await Project.findOne({
    projectId: normalizedProjectId,
  });

  if (project) {
    return project;
  }

  /*
   * ---------------------------------------------------------
   * 2. Case-insensitive projectId fallback
   *
   * Handles:
   * GMS82473
   * gms82473
   * Gms82473
   * ---------------------------------------------------------
   */

  const escapedProjectId =
    normalizedProjectId.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  project = await Project.findOne({
    projectId: {
      $regex: `^${escapedProjectId}$`,
      $options: "i",
    },
  });

  if (project) {
    return project;
  }

  /*
   * ---------------------------------------------------------
   * 3. MongoDB ObjectId fallback
   * ---------------------------------------------------------
   */

  if (
    mongoose.Types.ObjectId.isValid(
      normalizedProjectId
    )
  ) {
    project = await Project.findById(
      normalizedProjectId
    );

    if (project) {
      return project;
    }
  }

  /*
   * ---------------------------------------------------------
   * 4. RespondentSession fallback
   *
   * If an entry request already created a RespondentSession,
   * we can use its linked project.
   *
   * IMPORTANT:
   * We still verify that the supplied pid matches the
   * project's projectId.
   * ---------------------------------------------------------
   */

  const existingSession =
    await RespondentSession.findOne({
      respondentId,
    })
      .sort({
        startedAt: -1,
        createdAt: -1,
      })
      .populate("project");

  if (existingSession?.project) {
    const sessionProject: any =
      existingSession.project;

    const sessionProjectId =
      String(
        sessionProject.projectId || ""
      ).trim();

    if (
      sessionProjectId &&
      sessionProjectId.toLowerCase() ===
        normalizedProjectId.toLowerCase()
    ) {
      return sessionProject;
    }
  }

  return null;
}

/* =========================================================
   RESOLVE FINAL REDIRECT DESTINATION
========================================================= */

function getDestinationUrl(
  project: any,
  outcome: Outcome,
  respondentId: string,
  req: NextRequest
): URL {
  let targetUrl = "";

  const setup = project?.surveySetup || {};

  if (outcome === "complete") {
    targetUrl = setup.qualificationUrl || setup.redirectUrl || "";
  } else if (outcome === "terminate") {
    targetUrl = setup.terminationUrl || "";
  } else if (outcome === "quota") {
    targetUrl = setup.quotaUrl || setup.terminationUrl || "";
  } else if (outcome === "security") {
    targetUrl = setup.securityTerminateUrl || setup.terminationUrl || "";
  }

  targetUrl = String(targetUrl || "").trim();

  // If a valid external or custom redirect URL is configured
  if (targetUrl) {
    // Replace respondent placeholder: {{ID}}, {respondentId}, %7B%7BID%7D%7D, etc.
    let resolved = replaceRespondentPlaceholder(targetUrl, respondentId);

    // If there is an empty parameter e.g. &pid= or &rid=, fill it
    const emptyParam =
      /([?&](?:rid|respondent_?id|panel+ist_?id|panellist_?id|uid|pid)=)(?=&|$)/i;
    if (emptyParam.test(resolved)) {
      resolved = resolved.replace(
        emptyParam,
        (match, p1) => `${p1}${encodeURIComponent(respondentId)}`
      );
    }

    try {
      const parsed = new URL(resolved, req.url);
      const isInternalRedirectLoop =
        parsed.pathname.startsWith("/api/survey/redirect");
      if (!isInternalRedirectLoop) {
        return parsed;
      }
    } catch {
      // Relative URL or parse failure
      if (!resolved.startsWith("/api/survey/redirect")) {
        return new URL(resolved, req.url);
      }
    }
  }

  // Fallback to internal survey result page
  const resultUrl = new URL("/survey/result", req.url);
  resultUrl.searchParams.set(
    "status",
    outcome === "security" ? "terminate" : outcome
  );
  resultUrl.searchParams.set("rid", respondentId);
  if (project?.projectId) {
    resultUrl.searchParams.set("pid", project.projectId);
  }
  return resultUrl;
}

/* =========================================================
   MAIN HANDLER
========================================================= */

export async function handleSurveyRedirect(
  req: NextRequest,
  options: {
    outcome: Outcome;
  }
) {
  try {
    await connectDB();

    const searchParams =
      req.nextUrl.searchParams;

    /* =======================================================
       1. READ QUERY PARAMETERS
    ======================================================= */

    let respondentId =
      searchParams.get("rid") ||
      searchParams.get("respondentId") ||
      searchParams.get("respondent") ||
      "";

    let projectId =
      searchParams.get("pid") ||
      searchParams.get("projectId") ||
      searchParams.get("project") ||
      "";

    respondentId = respondentId.trim();
    projectId = projectId.trim();

    /* =======================================================
       2. SUPPORT POST BODY
    ======================================================= */

    if (req.method === "POST") {
      try {
        const body = await req.json();

        if (body?.rid) {
          respondentId = String(
            body.rid
          ).trim();
        }

        if (body?.respondentId) {
          respondentId = String(
            body.respondentId
          ).trim();
        }

        if (body?.respondent) {
          respondentId = String(
            body.respondent
          ).trim();
        }

        if (body?.pid) {
          projectId = String(
            body.pid
          ).trim();
        }

        if (body?.projectId) {
          projectId = String(
            body.projectId
          ).trim();
        }

        if (body?.project) {
          projectId = String(
            body.project
          ).trim();
        }
      } catch {
        /*
         * Query parameters are still valid
         * if POST body isn't JSON.
         */
      }
    }

    /* =======================================================
       3. VALIDATE RESPONDENT ID
    ======================================================= */

    if (!respondentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Respondent ID is required",
          message:
            "Respondent ID is required",
        },
        { status: 400 }
      );
    }

    /*
     * Reject template placeholders.
     *
     * Example:
     * {respondentId}
     * {{respondentId}}
     * [respondentId]
     */

    if (
      isRespondentPlaceholder(
        respondentId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid respondent ID",
          message:
            "Callback URL template detected. Replace {respondentId} with a real respondent ID.",
          respondentId,
          example:
            `/api/survey/redirect/${options.outcome}?pid=GMS82473&rid=TEST001`,
        },
        { status: 400 }
      );
    }

    /*
     * Same validation used by the entry route.
     */

    if (
      !/^[a-zA-Z0-9_.\-@]{1,256}$/.test(
        respondentId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid respondent ID format",
          message:
            "Invalid respondent ID format",
          respondentId,
        },
        { status: 400 }
      );
    }

    /* =======================================================
       4. PROJECT ID REQUIRED
    ======================================================= */

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
          message:
            "Project ID (pid) is required",
          respondentId,
          example:
            `/api/survey/redirect/${options.outcome}?pid=GMS82473&rid=${encodeURIComponent(
              respondentId
            )}`,
        },
        { status: 400 }
      );
    }

    const normalizedProjectId =
      normalizeProjectId(projectId);

    /*
     * Reject invalid project placeholders.
     */

    if (
      !normalizedProjectId ||
      /^\{.*\}$/.test(
        normalizedProjectId
      ) ||
      /^\[.*\]$/.test(
        normalizedProjectId
      ) ||
      [
        "undefined",
        "null",
        "none",
      ].includes(
        normalizedProjectId.toLowerCase()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project ID",
          message:
            "Project ID must be replaced with the actual project ID.",
          projectId,
        },
        { status: 400 }
      );
    }

    /* =======================================================
       5. FIND PROJECT
    ======================================================= */

    const project = await findProject(
      normalizedProjectId,
      respondentId
    );

    if (!project) {
      console.error(
        "❌ SURVEY REDIRECT - PROJECT NOT FOUND",
        {
          requestedProjectId:
            normalizedProjectId,
          respondentId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
          message: `No project found with projectId "${normalizedProjectId}".`,
          requestedProjectId:
            normalizedProjectId,
          respondentId,
        },
        { status: 404 }
      );
    }

    console.log(
      "✅ SURVEY REDIRECT - PROJECT FOUND",
      {
        mongoId:
          project._id.toString(),
        projectId:
          project.projectId,
        respondentId,
      }
    );

    /* =======================================================
       6. FIND EXACT RESPONDENT SESSION
    ======================================================= */

    const session =
      await RespondentSession.findOne({
        project: project._id,
        respondentId,
      }).sort({
        startedAt: -1,
        createdAt: -1,
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Survey session not found",
          message:
            "No survey session was found for this respondent and project.",
          projectId:
            project.projectId ||
            normalizedProjectId,
          respondentId,
        },
        { status: 404 }
      );
    }

    console.log(
      "✅ SURVEY REDIRECT - SESSION FOUND",
      {
        sessionId:
          session._id.toString(),
        projectId:
          project.projectId,
        respondentId,
        currentStatus:
          session.status,
      }
    );

    /* =======================================================
       7. CHECK CURRENT STATUS
    ======================================================= */

    const currentStatus =
      String(session.status || "")
        .toLowerCase()
        .trim();

    /* =======================================================
       8. DUPLICATE CALLBACK
    ======================================================= */

    if (
      TERMINAL_STATUSES.includes(
        currentStatus as any
      )
    ) {
      const existingResult =
        getResultStatus(
          currentStatus
        );

      console.log(
        "[Survey Redirect] Duplicate/final callback ignored:",
        {
          project:
            project.projectId ||
            project._id,
          respondent:
            respondentId,
          existingStatus:
            currentStatus,
          incomingOutcome:
            options.outcome,
        }
      );

      const destination = getDestinationUrl(
        project,
        existingResult,
        respondentId,
        req
      );

      return NextResponse.redirect(destination);
    }

    /* =======================================================
       9. DETERMINE NEW DATABASE STATUS
    ======================================================= */

    const newStatus =
      getDatabaseStatus(
        options.outcome
      );

    /* =======================================================
       10. ATOMIC SESSION UPDATE
    ======================================================= */

    const now = new Date();

    const updateData: Record<
      string,
      any
    > = {
      status: newStatus,
    };

    /*
     * Only set fields that are already used by
     * your RespondentSession architecture.
     */

    if (
      newStatus === "completed"
    ) {
      updateData.completedAt =
        now;
    }

    if (
      newStatus === "terminated"
    ) {
      updateData.terminatedAt =
        now;

      updateData.terminatedReason =
        options.outcome === "security"
          ? "Security termination"
          : (session as any).terminatedReason ||
            "Terminated by client survey platform";
    }

    if (
      newStatus === "quota_full"
    ) {
      updateData.quotaAt = now;

      updateData.terminatedReason =
        "Quota full";
    }

    /*
     * IMPORTANT:
     *
     * Only a non-terminal session can be updated.
     *
     * This protects against:
     *
     * complete + complete
     * complete + terminate
     * terminate + terminate
     * quota + quota
     *
     * etc.
     */

    const updatedSession =
      await RespondentSession.findOneAndUpdate(
        {
          _id: session._id,

          status: {
            $nin: [
              "completed",
              "terminated",
              "terminate",
              "screened_out",
              "quota_full",
            ],
          },
        },
        {
          $set: updateData,
        },
        {
          new: true,
        }
      );

    /* =======================================================
       11. ANOTHER CALLBACK WON THE RACE
    ======================================================= */

    if (!updatedSession) {
      const latestSession =
        await RespondentSession.findById(
          session._id
        );

      const latestStatus =
        String(
          latestSession?.status ||
            newStatus
        );

      console.log(
        "[Survey Redirect] Session already finalized:",
        {
          respondentId,
          latestStatus,
        }
      );

      const destination = getDestinationUrl(
        project,
        getResultStatus(latestStatus),
        respondentId,
        req
      );

      return NextResponse.redirect(destination);
    }

    /* =======================================================
       12. UPDATE PROJECT STATISTICS
    ======================================================= */

    let progressField: string | null =
      null;

    if (
      options.outcome ===
      "complete"
    ) {
      progressField =
        "progress.completes";
    }

    if (
      options.outcome ===
      "terminate"
    ) {
      progressField =
        "progress.screenouts";
    }

    if (
      options.outcome ===
      "quota"
    ) {
      progressField =
        "progress.quotaFull";
    }

    if (progressField) {
      const currentCompletes = Number(project.progress?.completes || 0);
      const isNowCompleted =
        options.outcome === "complete" &&
        project.sampleSize &&
        currentCompletes + 1 >= Number(project.sampleSize);

      await Project.updateOne(
        {
          _id: project._id,
        },
        {
          $inc: {
            [progressField]: 1,
          },
          ...(isNowCompleted ? { $set: { status: "completed" } } : {}),
        }
      );
    }

    // Update SupplierAllocation statistics
    const supCode = (updatedSession as any).supplierCode;
    if (supCode) {
      const supInc: Record<string, number> = {};
      const cpi = Number(project.estimate?.estimatedCpi || (project as any).cpi || 2.5);

      if (options.outcome === "complete") {
        supInc.actualCompletes = 1;
        supInc.actualSpend = cpi;
      } else if (options.outcome === "terminate" || options.outcome === "security") {
        supInc.actualTerminates = 1;
      } else if (options.outcome === "quota") {
        supInc.actualQuotaFull = 1;
      }

      if (Object.keys(supInc).length > 0) {
        await SupplierAllocation.updateOne(
          { project: project._id, supplierCode: supCode },
          { $inc: supInc }
        ).catch((allocErr) => {
          console.warn("SupplierAllocation stats update error in redirect handler:", allocErr);
        });
      }
    }

    /* =======================================================
       13. SUCCESS LOG
    ======================================================= */

    console.log(
      "✅ SURVEY REDIRECT SUCCESS",
      {
        outcome:
          options.outcome,
        databaseStatus:
          newStatus,
        project:
          project.projectId ||
          project._id.toString(),
        respondent:
          respondentId,
        sessionId:
          updatedSession._id.toString(),
      }
    );

    /* =======================================================
       14. REDIRECT DESTINATION
    ======================================================= */

    const destination = getDestinationUrl(
      project,
      options.outcome,
      respondentId,
      req
    );

    return NextResponse.redirect(destination);
  } catch (error: any) {
    console.error(
      "❌ handleSurveyRedirect error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to process survey redirect",
        message:
          "Failed to process survey redirect",
      },
      {
        status: 500,
      }
    );
  }
}