import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/config/db";
import SurveySession, { SurveySessionStatus } from "@/models/SurveySession";
import Project from "@/models/Project";
import Respondent from "@/models/Respondent";
import SupplierAllocation from "@/models/SupplierAllocation";
import SupplierPanel from "@/models/SupplierPanel";
import ProjectSupply from "@/models/ProjectSupply";
import Transaction from "@/models/Transaction";
import { createAuditLog } from "@/lib/audit-log";
import { dispatchWebhooks } from "@/lib/webhooks";

/**
 * GET & POST /api/survey/callback
 * Handles the complete return flow:
 * Survey -> Complete / Terminate / Quota Full / Quality Fail
 * Updates Buyer + Supplier + Panel + Respondent + Finance + Admin
 */
async function processCallback(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    let token = searchParams.get("token") || searchParams.get("sessionToken");
    let statusParam = (searchParams.get("status") || "complete").toLowerCase().trim();
    let reason = searchParams.get("reason") || "";
    let rid = searchParams.get("rid") || searchParams.get("respondentId");

    // Support POST JSON payloads
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.token) token = body.token;
        if (body.sessionToken) token = body.sessionToken;
        if (body.status) statusParam = String(body.status).toLowerCase().trim();
        if (body.reason) reason = body.reason;
        if (body.rid) rid = body.rid;
        if (body.respondentId) rid = body.respondentId;
      } catch {}
    }

    // Resolve SurveySession by token or fallback to respondentId
    let session: any = null;
    if (token) {
      session = await SurveySession.findOne({ sessionToken: token });
    }
    if (!session && rid) {
      session = await SurveySession.findOne({ respondentId: rid }).sort({ createdAt: -1 });
    }

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Survey session not found for token / respondent ID" },
        { status: 404 }
      );
    }

    // Normalize outcome status
    let normalizedStatus: SurveySessionStatus = "complete";
    if (statusParam.includes("screen") || statusParam.includes("term")) {
      normalizedStatus = "terminate";
    } else if (statusParam.includes("quota")) {
      normalizedStatus = "quota_full";
    } else if (statusParam.includes("qual") || statusParam.includes("fraud") || statusParam.includes("reject")) {
      normalizedStatus = "quality_fail";
    } else if (statusParam.includes("abandon")) {
      normalizedStatus = "abandoned";
    } else {
      normalizedStatus = "complete";
    }

    const now = new Date();
    const startedAt = session.startedAt || session.createdAt || now;
    const durationSeconds = Math.max(1, Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000));

    // Fetch related project
    const project = await Project.findById(session.project);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Associated project not found" },
        { status: 404 }
      );
    }

    // Speeding & PureScore Quality Check
    let fraudScore = session.fraudScore || 0;
    const expectedLoiSeconds = (project.surveySetup?.estimatedLoi || project.loi || 10) * 60;
    if (normalizedStatus === "complete" && durationSeconds < expectedLoiSeconds * 0.20) {
      normalizedStatus = "quality_fail";
      fraudScore = Math.min(100, fraudScore + 60);
      reason = reason || `Speeding violation: completed in ${durationSeconds}s (expected ~${expectedLoiSeconds}s)`;
    }

    // 1. UPDATE SURVEY SESSION
    session.status = normalizedStatus;
    session.completedAt = now;
    session.durationSeconds = durationSeconds;
    session.fraudScore = fraudScore;
    if (reason) session.terminateReason = reason;
    await session.save();

    const cpi = Number(session.cpi || project.estimate?.estimatedCpi || 2.5);
    const reward = Number(session.rewardAmount || Math.round(cpi * 0.7 * 100) / 100);

    // 2. UPDATE BUYER (Project Progress)
    project.progress = project.progress || {
      starts: 0,
      completes: 0,
      screenouts: 0,
      quotaFull: 0,
      qualityRejects: 0,
      spend: 0,
    };

    if (normalizedStatus === "complete") {
      project.progress.completes = (project.progress.completes || 0) + 1;
      project.progress.spend = Math.round(((project.progress.spend || 0) + cpi) * 100) / 100;

      // Auto-complete project if target sample reached
      if (project.sampleSize && (project.progress.completes || 0) >= project.sampleSize) {
        project.status = "completed";
      }
    } else if (normalizedStatus === "terminate") {
      project.progress.screenouts = (project.progress.screenouts || 0) + 1;
    } else if (normalizedStatus === "quota_full") {
      project.progress.quotaFull = (project.progress.quotaFull || 0) + 1;
    } else if (normalizedStatus === "quality_fail") {
      project.progress.qualityRejects = (project.progress.qualityRejects || 0) + 1;
    }
    await project.save();

    // 3. UPDATE SUPPLIER (SupplierAllocation & ProjectSupply)
    if (session.supplier) {
      const suppUpdate: Record<string, any> = {};
      if (normalizedStatus === "complete") {
        suppUpdate.$inc = { actualCompletes: 1, actualSpend: cpi };
      } else if (normalizedStatus === "terminate") {
        suppUpdate.$inc = { actualTerminates: 1 };
      } else if (normalizedStatus === "quota_full") {
        suppUpdate.$inc = { actualQuotaFull: 1 };
      }

      await SupplierAllocation.updateOne(
        { project: project._id, supplierId: session.supplier },
        suppUpdate
      ).catch(() => {});

      await ProjectSupply.updateOne(
        { project: project._id },
        suppUpdate
      ).catch(() => {});
    }

    // 4. UPDATE PANEL (SupplierPanel)
    if (session.panel) {
      const panelInc: Record<string, number> = {};
      if (normalizedStatus === "complete") panelInc.totalCompletes = 1;
      else if (normalizedStatus === "terminate") panelInc.totalTerminates = 1;
      else if (normalizedStatus === "quota_full") panelInc.totalQuotaFull = 1;

      await SupplierPanel.updateOne(
        { _id: session.panel },
        { $inc: panelInc }
      ).catch(() => {});
    }

    // 5. UPDATE RESPONDENT (Earnings & Activity)
    if (session.respondent) {
      const respInc: Record<string, number> = { totalSurveys: 1 };
      if (normalizedStatus === "complete") {
        respInc.completedSurveys = 1;
        respInc.totalEarnings = reward;
        respInc.pendingEarnings = reward;
      } else if (normalizedStatus === "terminate") {
        respInc.screenouts = 1;
      } else if (normalizedStatus === "quota_full") {
        respInc.quotaFull = 1;
      } else if (normalizedStatus === "quality_fail") {
        respInc.qualityRejects = 1;
      }

      await Respondent.updateOne(
        { _id: session.respondent },
        {
          $inc: respInc,
          $set: { lastActiveAt: now },
        }
      ).catch(() => {});
    }

    // 6. UPDATE FINANCE (Create Transaction Ledger)
    if (normalizedStatus === "complete") {
      const txId = `TX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      await Transaction.create({
        transactionId: txId,
        project: project._id,
        owner: project.owner,
        supplierCode: session.supplierCode || "SUP-001",
        type: "cpi_charge",
        amount: cpi,
        currency: "USD",
        status: "completed",
        description: `Fieldwork completion charge for '${project.surveyTitle}' (Session: ${session.sessionToken.slice(0, 8)})`,
        referenceId: session.sessionToken,
      }).catch((err) => console.error("Transaction create error:", err));
    }

    // 7. UPDATE ADMIN (Audit Log)
    await createAuditLog({
      action:
        normalizedStatus === "complete"
          ? "SURVEY_SESSION_COMPLETED"
          : `SURVEY_SESSION_${normalizedStatus.toUpperCase()}`,
      resource: "SurveySession",
      resourceId: session._id.toString(),
      description: `Survey session ${session.sessionToken.slice(0, 8)} ended with status '${normalizedStatus}' on project '${project.surveyTitle}'`,
      metadata: {
        sessionToken: session.sessionToken,
        projectId: project._id.toString(),
        respondentId: session.respondentId,
        status: normalizedStatus,
        cpi,
        reward,
        durationSeconds,
        fraudScore,
      },
    }).catch(() => {});

    // 8. DISPATCH WEBHOOKS
    try {
      const eventName =
        normalizedStatus === "complete"
          ? "respondent.complete"
          : normalizedStatus === "quota_full"
          ? "respondent.quota_full"
          : "respondent.screenout";

      dispatchWebhooks((project.webhooks || []) as any[], eventName, {
        projectId: project._id.toString(),
        sessionToken: session.sessionToken,
        respondentId: session.respondentId,
        status: normalizedStatus,
        durationSeconds,
        fraudScore,
        completedAt: now.toISOString(),
      });
    } catch {}

    // 9. CLIENT RESPONSE OR REDIRECT
    const redirectParam = searchParams.get("redirect");
    const wantsJson = redirectParam === "false" || req.headers.get("accept")?.includes("application/json");

    if (wantsJson) {
      return NextResponse.json({
        success: true,
        status: normalizedStatus,
        durationSeconds,
        cpi,
        reward,
        fraudScore,
      });
    }

    // Redirect to complete or terminated view
    if (normalizedStatus === "complete") {
      const targetUrl =
        project.surveySetup?.qualificationUrl ||
        `/survey/sample-complete?token=${encodeURIComponent(session.sessionToken)}`;
      return NextResponse.redirect(new URL(targetUrl, req.url));
    } else {
      const termUrl =
        project.surveySetup?.terminationUrl ||
        `/survey/terminated?status=${encodeURIComponent(normalizedStatus)}&reason=${encodeURIComponent(reason || normalizedStatus)}`;
      return NextResponse.redirect(new URL(termUrl, req.url));
    }
  } catch (error: any) {
    console.error("Survey callback error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process survey callback" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return processCallback(req);
}

export async function POST(req: NextRequest) {
  return processCallback(req);
}

