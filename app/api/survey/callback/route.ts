import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/config/db";
import RespondentSession from "@/models/RespondentSession";
import Project from "@/models/Project";
import Respondent from "@/models/Respondent";
import SupplierAllocation from "@/models/SupplierAllocation";
import SupplierPanel from "@/models/SupplierPanel";
import ProjectSupply from "@/models/ProjectSupply";
import Transaction from "@/models/Transaction";

import { findProjectByIdOrProjectId } from "@/lib/project-resolver";
import { createAuditLog } from "@/lib/audit-log";
import { dispatchWebhooks } from "@/lib/webhooks";
import { replaceRespondentPlaceholder } from "@/lib/survey-urls";

type Outcome =
  | "complete"
  | "terminate"
  | "quota"
  | "quality_fail"
  | "abandoned";

type SessionStatus =
  | "started"
  | "completed"
  | "terminated"
  | "screened_out"
  | "quota_full"
  | "quality_fail"
  | "abandoned";

const TERMINAL_STATUSES: SessionStatus[] = [
  "completed",
  "terminated",
  "screened_out",
  "quota_full",
  "quality_fail",
  "abandoned",
];

function normalizeOutcome(value: string): Outcome {
  const status = String(value || "complete").toLowerCase().trim();

  if (
    status.includes("screen") ||
    status.includes("terminate") ||
    status.includes("terminated") ||
    status.includes("disqual")
  ) {
    return "terminate";
  }

  if (status.includes("quota")) {
    return "quota";
  }

  if (
    status.includes("quality") ||
    status.includes("fraud") ||
    status.includes("reject")
  ) {
    return "quality_fail";
  }

  if (status.includes("abandon")) {
    return "abandoned";
  }

  return "complete";
}

function outcomeToSessionStatus(outcome: Outcome): SessionStatus {
  switch (outcome) {
    case "complete":
      return "completed";

    case "terminate":
      return "terminated";

    case "quota":
      return "quota_full";

    case "quality_fail":
      return "quality_fail";

    case "abandoned":
      return "abandoned";
  }
}

function outcomeToResultStatus(outcome: Outcome) {
  switch (outcome) {
    case "complete":
      return "complete";

    case "quota":
      return "quota";

    default:
      return "terminate";
  }
}

function getBaseUrl(req: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    req.nextUrl.origin
  ).replace(/\/$/, "");
}

function buildResultUrl(
  req: NextRequest,
  outcome: Outcome,
  rid: string,
  project?: any
) {
  const setup = project?.surveySetup || {};
  let targetUrl = "";

  if (outcome === "complete") {
    targetUrl = setup.qualificationUrl || setup.redirectUrl || "";
  } else if (outcome === "terminate") {
    targetUrl = setup.terminationUrl || "";
  } else if (outcome === "quota") {
    targetUrl = setup.quotaUrl || setup.terminationUrl || "";
  } else if (outcome === "quality_fail") {
    targetUrl = setup.securityTerminateUrl || setup.terminationUrl || "";
  }

  targetUrl = String(targetUrl || "").trim();
  if (targetUrl) {
    let resolved = replaceRespondentPlaceholder(targetUrl, rid);
    const emptyParam =
      /([?&](?:rid|respondent_?id|panel+ist_?id|panellist_?id|uid|pid)=)(?=&|$)/i;
    if (emptyParam.test(resolved)) {
      resolved = resolved.replace(
        emptyParam,
        (match, p1) => `${p1}${encodeURIComponent(rid)}`
      );
    }
    try {
      const parsed = new URL(resolved, req.url);
      if (!parsed.pathname.startsWith("/api/survey/callback")) {
        return parsed.toString();
      }
    } catch {
      if (!resolved.startsWith("/api/survey/callback")) {
        return resolved;
      }
    }
  }

  const baseUrl = getBaseUrl(req);
  const status = outcomeToResultStatus(outcome);

  return `${baseUrl}/survey/result?status=${encodeURIComponent(
    status
  )}&rid=${encodeURIComponent(rid)}`;
}

async function processCallback(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;

    let pid =
      searchParams.get("pid") ||
      searchParams.get("projectId") ||
      searchParams.get("project");

    let rid =
      searchParams.get("rid") ||
      searchParams.get("respondentId") ||
      searchParams.get("respondent");

    let statusParam =
      searchParams.get("status") ||
      searchParams.get("outcome") ||
      searchParams.get("result") ||
      "complete";

    let reason = searchParams.get("reason") || "";

    /*
     * Support POST JSON
     */
    if (req.method === "POST") {
      try {
        const body = await req.json();

        if (body.pid) pid = String(body.pid);
        if (body.projectId) pid = String(body.projectId);
        if (body.project) pid = String(body.project);

        if (body.rid) rid = String(body.rid);
        if (body.respondentId) rid = String(body.respondentId);
        if (body.respondent) rid = String(body.respondent);

        if (body.status) statusParam = String(body.status);
        if (body.outcome) statusParam = String(body.outcome);
        if (body.result) statusParam = String(body.result);

        if (body.reason) reason = String(body.reason);
      } catch {
        // Empty/non-JSON POST body is allowed.
      }
    }

    /*
     * ---------------------------------------------------------
     * 1. VALIDATE INPUT
     * ---------------------------------------------------------
     */

    if (!pid) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing project ID (pid)",
        },
        { status: 400 }
      );
    }

    if (!rid) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing respondent ID (rid)",
        },
        { status: 400 }
      );
    }

    pid = String(pid).trim();
    rid = String(rid).trim();

    if (!rid || rid.length > 256) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid respondent ID",
        },
        { status: 400 }
      );
    }

    /*
     * Prevent placeholder values from being treated
     * as real respondents.
     */
    const invalidRespondentValues = new Set([
      "",
      "undefined",
      "null",
      "none",
      "nan",
      "unknown",
      "test",
      "[object object]",
      "{respondentid}",
      "{respondentId}",
      "{respondent_id}",
      "{rid}",
      "{respondent}",
    ]);

    if (invalidRespondentValues.has(rid.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid respondent ID",
        },
        { status: 400 }
      );
    }

    /*
     * Keep respondent IDs reasonably safe for URL/database use.
     */
    if (!/^[a-zA-Z0-9_.\-@]{1,256}$/.test(rid)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid respondent ID format",
        },
        { status: 400 }
      );
    }

    const outcome = normalizeOutcome(statusParam);
    const newStatus = outcomeToSessionStatus(outcome);

    /*
     * ---------------------------------------------------------
     * 2. FIND PROJECT
     * ---------------------------------------------------------
     */

    const project = await findProjectByIdOrProjectId(pid);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
          pid,
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. FIND RESPONDENT SESSION
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * We use EXACT project + respondent combination.
     *
     * Do NOT search only by respondentId because the same
     * respondent can potentially participate in multiple projects.
     */

    const session = await RespondentSession.findOne({
      project: project._id,
      respondentId: rid,
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Respondent session not found",
          pid,
          rid,
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. IDEMPOTENCY / DUPLICATE CALLBACK PROTECTION
     * ---------------------------------------------------------
     *
     * This is VERY important.
     *
     * A client may call complete URL more than once.
     * Browser refreshes, retries, duplicate redirects, etc.
     *
     * We only process the first terminal transition.
     */

    const currentStatus = String(session.status) as SessionStatus;

    if (TERMINAL_STATUSES.includes(currentStatus)) {
      const resultUrl = buildResultUrl(req, outcome, rid, project);

      const redirectParam = searchParams.get("redirect");

      const wantsJson =
        redirectParam === "false" ||
        req.headers
          .get("accept")
          ?.toLowerCase()
          .includes("application/json");

      if (wantsJson) {
        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          status: currentStatus,
          resultUrl,
          projectId: project._id.toString(),
          respondentId: rid,
        });
      }

      return NextResponse.redirect(resultUrl);
    }

    /*
     * ---------------------------------------------------------
     * 5. CALCULATE DURATION
     * ---------------------------------------------------------
     */

    const now = new Date();

    const startedAt =
      session.startedAt ||
      (session as any).createdAt ||
      now;

    const durationSeconds = Math.max(
      1,
      Math.round(
        (now.getTime() - new Date(startedAt).getTime()) / 1000
      )
    );

    /*
     * ---------------------------------------------------------
     * 6. QUALITY / SPEED CHECK
     * ---------------------------------------------------------
     */

    let fraudScore = Number((session as any).fraudScore || 0);

    const estimatedLoi =
      Number(
        project.surveySetup?.estimatedLoi ||
        (project as any).loi ||
        10
      );

    const expectedLoiSeconds = estimatedLoi * 60;

    let finalOutcome = outcome;
    let finalStatus = newStatus;

    if (
      finalOutcome === "complete" &&
      durationSeconds < expectedLoiSeconds * 0.2
    ) {
      finalOutcome = "quality_fail";
      finalStatus = "quality_fail";

      fraudScore = Math.min(100, fraudScore + 60);

      reason =
        reason ||
        `Speeding violation: completed in ${durationSeconds}s (expected approximately ${expectedLoiSeconds}s)`;
    }

    /*
     * ---------------------------------------------------------
     * 7. ATOMIC SESSION UPDATE
     * ---------------------------------------------------------
     *
     * Only one request is allowed to change the session from
     * non-terminal -> terminal.
     *
     * This prevents duplicate counters.
     */

    const updatedSession: any =
      await (RespondentSession as any).findOneAndUpdate(
        {
          _id: session._id,
          status: {
            $nin: TERMINAL_STATUSES,
          },
        },
        {
          $set: {
            status: finalStatus,
            completedAt: now,
            ...(reason ? { terminateReason: reason } : {}),
            ...(Number.isFinite(fraudScore)
              ? { fraudScore }
              : {}),
            durationSeconds,
          },
        },
        {
          new: true,
        }
      );

    /*
     * Another request won the race.
     */
    if (!updatedSession) {
      const latestSession =
        await RespondentSession.findById(session._id);

      const latestStatus =
        latestSession?.status || finalStatus;

      const resultUrl = buildResultUrl(
        req,
        finalOutcome,
        rid,
        project
      );

      const redirectParam = searchParams.get("redirect");

      const wantsJson =
        redirectParam === "false" ||
        req.headers
          .get("accept")
          ?.toLowerCase()
          .includes("application/json");

      if (wantsJson) {
        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          status: latestStatus,
          resultUrl,
          projectId: project._id.toString(),
          respondentId: rid,
        });
      }

      return NextResponse.redirect(resultUrl);
    }

    /*
     * From this point onward, THIS request owns the outcome.
     * Therefore counters should be incremented exactly once.
     */

    const cpi = Number(
      (updatedSession as any).cpi ||
      project.estimate?.estimatedCpi ||
      2.5
    );

    const reward = Number(
      (updatedSession as any).rewardAmount ||
      Math.round(cpi * 0.7 * 100) / 100
    );

    /*
     * ---------------------------------------------------------
     * 8. UPDATE PROJECT
     * ---------------------------------------------------------
     */

    project.progress = project.progress || {
      starts: 0,
      completes: 0,
      screenouts: 0,
      quotaFull: 0,
      qualityRejects: 0,
      spend: 0,
    };

    if (finalOutcome === "complete") {
      project.progress.completes =
        Number(project.progress.completes || 0) + 1;

      project.progress.spend =
        Math.round(
          (
            Number(project.progress.spend || 0) +
            cpi
          ) * 100
        ) / 100;

      if (
        project.sampleSize &&
        project.progress.completes >= project.sampleSize
      ) {
        project.status = "completed";
      }
    } else if (finalOutcome === "terminate") {
      project.progress.screenouts =
        Number(project.progress.screenouts || 0) + 1;
    } else if (finalOutcome === "quota") {
      project.progress.quotaFull =
        Number(project.progress.quotaFull || 0) + 1;
    } else if (finalOutcome === "quality_fail") {
      project.progress.qualityRejects =
        Number(project.progress.qualityRejects || 0) + 1;
    }

    await project.save();

    /*
     * ---------------------------------------------------------
     * 9. UPDATE SUPPLIER
     * ---------------------------------------------------------
     */

    const supplierId =
      (updatedSession as any).supplierId ||
      (updatedSession as any).supplier;

    if (supplierId) {
      const supplierInc: Record<string, number> = {};

      if (finalOutcome === "complete") {
        supplierInc.actualCompletes = 1;
        supplierInc.actualSpend = cpi;
      } else if (finalOutcome === "terminate") {
        supplierInc.actualTerminates = 1;
      } else if (finalOutcome === "quota") {
        supplierInc.actualQuotaFull = 1;
      }

      if (Object.keys(supplierInc).length > 0) {
        await SupplierAllocation.updateOne(
          {
            project: project._id,
            supplierId,
          },
          {
            $inc: supplierInc,
          }
        ).catch((err) => {
          console.error(
            "SupplierAllocation update error:",
            err
          );
        });

        await ProjectSupply.updateOne(
          {
            project: project._id,
          },
          {
            $inc: supplierInc,
          }
        ).catch((err) => {
          console.error(
            "ProjectSupply update error:",
            err
          );
        });
      }
    }

    /*
     * ---------------------------------------------------------
     * 10. UPDATE PANEL
     * ---------------------------------------------------------
     */

    const panelId = (updatedSession as any).panel;

    if (panelId) {
      const panelInc: Record<string, number> = {};

      if (finalOutcome === "complete") {
        panelInc.totalCompletes = 1;
      } else if (finalOutcome === "terminate") {
        panelInc.totalTerminates = 1;
      } else if (finalOutcome === "quota") {
        panelInc.totalQuotaFull = 1;
      }

      if (Object.keys(panelInc).length > 0) {
        await SupplierPanel.updateOne(
          {
            _id: panelId,
          },
          {
            $inc: panelInc,
          }
        ).catch((err) => {
          console.error(
            "SupplierPanel update error:",
            err
          );
        });
      }
    }

    /*
     * ---------------------------------------------------------
     * 11. UPDATE RESPONDENT
     * ---------------------------------------------------------
     *
     * Only do this when the session actually has a linked
     * Respondent MongoDB _id.
     */

    const respondentMongoId =
      (updatedSession as any).respondent;

    if (respondentMongoId) {
      const respondentInc: Record<string, number> = {
        totalSurveys: 1,
      };

      if (finalOutcome === "complete") {
        respondentInc.completedSurveys = 1;
        respondentInc.totalEarnings = reward;
        respondentInc.pendingEarnings = reward;
      } else if (finalOutcome === "terminate") {
        respondentInc.screenouts = 1;
      } else if (finalOutcome === "quota") {
        respondentInc.quotaFull = 1;
      } else if (finalOutcome === "quality_fail") {
        respondentInc.qualityRejects = 1;
      }

      await Respondent.updateOne(
        {
          _id: respondentMongoId,
        },
        {
          $inc: respondentInc,
          $set: {
            lastActiveAt: now,
          },
        }
      ).catch((err) => {
        console.error(
          "Respondent update error:",
          err
        );
      });
    }

    /*
     * ---------------------------------------------------------
     * 12. FINANCE
     * ---------------------------------------------------------
     */

    if (finalOutcome === "complete") {
      const txId = `TX-${Date.now()
        .toString(36)
        .toUpperCase()}-${crypto
          .randomBytes(3)
          .toString("hex")
          .toUpperCase()}`;

      await Transaction.create({
        transactionId: txId,
        project: project._id,
        owner: project.owner,
        supplierCode:
          (updatedSession as any).supplierCode ||
          "SUP-001",
        type: "cpi_charge",
        amount: cpi,
        currency: "USD",
        status: "completed",
        description: `Fieldwork completion charge for '${project.surveyTitle || project.projectId || pid
          }' (Respondent: ${rid})`,
        referenceId: updatedSession._id.toString(),
      }).catch((err) => {
        console.error(
          "Transaction create error:",
          err
        );
      });
    }

    /*
     * ---------------------------------------------------------
     * 13. AUDIT LOG
     * ---------------------------------------------------------
     */

    await createAuditLog({
      action:
        finalOutcome === "complete"
          ? "SURVEY_SESSION_COMPLETED"
          : `SURVEY_SESSION_${finalStatus.toUpperCase()}`,

      resource: "RespondentSession",

      resourceId: updatedSession._id.toString(),

      description: `Respondent ${rid} ended with status '${finalStatus}' on project '${project.surveyTitle || pid
        }'`,

      metadata: {
        projectId: project._id.toString(),
        respondentId: rid,
        status: finalStatus,
        outcome: finalOutcome,
        cpi,
        reward,
        durationSeconds,
        fraudScore,
        completedAt: now.toISOString(),
      },
    }).catch((err) => {
      console.error("Audit log error:", err);
    });

    /*
     * ---------------------------------------------------------
     * 14. WEBHOOK
     * ---------------------------------------------------------
     */

    try {
      let eventName = "respondent.screenout";

      if (finalOutcome === "complete") {
        eventName = "respondent.complete";
      } else if (finalOutcome === "quota") {
        eventName = "respondent.quota_full";
      } else if (finalOutcome === "quality_fail") {
        eventName = "respondent.quality_fail";
      }

      await dispatchWebhooks(
        ((project as any).webhooks || []) as any[],
        eventName as any,
        {
          projectId: project._id.toString(),
          respondentId: rid,
          status: finalStatus,
          outcome: finalOutcome,
          durationSeconds,
          fraudScore,
          completedAt: now.toISOString(),
        }
      );
    } catch (err) {
      console.error("Webhook dispatch error:", err);
    }

    /*
     * ---------------------------------------------------------
     * 15. RESPONSE
     * ---------------------------------------------------------
     */

    const resultUrl = buildResultUrl(
      req,
      finalOutcome,
      rid,
      project
    );

    const redirectParam = searchParams.get("redirect");

    const wantsJson =
      redirectParam === "false" ||
      req.headers
        .get("accept")
        ?.toLowerCase()
        .includes("application/json");

    if (wantsJson) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: false,
        status: finalStatus,
        outcome: finalOutcome,
        projectId: project._id.toString(),
        respondentId: rid,
        durationSeconds,
        cpi,
        reward,
        fraudScore,
        resultUrl,
      });
    }

    return NextResponse.redirect(resultUrl);
  } catch (error: any) {
    console.error("Survey callback error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to process survey callback",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(req: NextRequest) {
  return processCallback(req);
}

export async function POST(req: NextRequest) {
  return processCallback(req);
}