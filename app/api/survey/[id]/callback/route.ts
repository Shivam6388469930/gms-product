import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";
import Respondent from "@/models/Respondent";
import ProjectSupply from "@/models/ProjectSupply";
import { dispatchWebhooks } from "@/lib/webhooks";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET & POST /api/survey/[id]/callback
 * Cint / PureSpectrum style Return / Callback router.
 * Survey platforms (Qualtrics, Decipher, etc.) redirect respondents here upon completion or termination.
 * 
 * Query / Body parameters:
 *  - rid: Respondent ID
 *  - status: "complete" | "screenout" | "quotafull" | "quality_reject"
 *  - reason: optional text
 */
async function handleCallback(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid project ID" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    let rid = searchParams.get("rid") || searchParams.get("respondentId");
    let statusParam = (searchParams.get("status") || "complete").toLowerCase().trim();
    let reason = searchParams.get("reason") || "";

    // Support POST JSON payloads as well
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.rid) rid = body.rid;
        if (body.respondentId) rid = body.respondentId;
        if (body.status) statusParam = String(body.status).toLowerCase().trim();
        if (body.reason) reason = body.reason;
      } catch {}
    }

    if (!rid) {
      return NextResponse.json({ success: false, message: "Missing rid parameter" }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    // Find the respondent session (by project and rid)
    let session = await RespondentSession.findOne({
      project: project._id,
      respondentId: rid,
    }).sort({ createdAt: -1 });

    const now = new Date();
    const startedAt = session?.startedAt || session?.createdAt || now;
    const durationSeconds = Math.max(1, Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000));

    // Normalize status
    let normalizedStatus: "completed" | "screened_out" | "quota_full" | "quality_reject" = "completed";
    if (statusParam.includes("screen")) normalizedStatus = "screened_out";
    else if (statusParam.includes("quota")) normalizedStatus = "quota_full";
    else if (statusParam.includes("reject") || statusParam.includes("fraud") || statusParam.includes("speed")) normalizedStatus = "quality_reject";
    else if (statusParam.includes("comp")) normalizedStatus = "completed";

    // PureScore™ Fraud & Speed Check for Completes:
    // If respondent took less than 25% of expected LOI, flag as suspected speeder
    let fraudScore = session?.fraudScore || 0;
    const expectedLoiSeconds = (project.surveySetup?.estimatedLoi || project.loi || 10) * 60;
    if (normalizedStatus === "completed" && durationSeconds < expectedLoiSeconds * 0.25) {
      fraudScore = Math.min(100, fraudScore + 60);
      reason = reason || `Speeding detected: finished in ${durationSeconds}s (target ${expectedLoiSeconds}s)`;
    }

    // Update or create session
    if (session) {
      session.status = normalizedStatus;
      session.completedAt = now;
      session.durationSeconds = durationSeconds;
      session.fraudScore = fraudScore;
      if (reason) session.terminatedReason = reason;
      await session.save();
    } else {
      session = await RespondentSession.create({
        project: project._id,
        respondentId: rid,
        supplierCode: "DIRECT",
        ip: "0.0.0.0",
        userAgent: req.headers.get("user-agent") || "",
        status: normalizedStatus,
        passedScreener: normalizedStatus === "completed",
        terminatedReason: reason,
        startedAt,
        completedAt: now,
        durationSeconds,
        fraudScore,
      });
    }

    // Update project progress
    project.progress = project.progress || {
      starts: 0,
      completes: 0,
      screenouts: 0,
      quotaFull: 0,
      qualityRejects: 0,
      spend: 0,
    };

    const estimatedCpi = Number(project.estimate?.estimatedCpi || 2.5);

    if (normalizedStatus === "completed") {
      project.progress.completes = (project.progress.completes || 0) + 1;
      project.progress.spend = Math.round(((project.progress.spend || 0) + estimatedCpi) * 100) / 100;

      // Update ProjectSupply for supplier allocation tracking
      if (session.supplierCode && session.supplierCode !== "DIRECT") {
        await ProjectSupply.findOneAndUpdate(
          { project: project._id },
          {
            $inc: {
              actualCompletes: 1,
              actualSpend: estimatedCpi,
            },
          }
        ).catch(() => {});
      }

      // Check if project hit target sample size
      const targetSample = Number(project.sampleSize || 0);
      if (targetSample > 0 && (project.progress.completes || 0) >= targetSample) {
        project.status = "completed";
        try {
          dispatchWebhooks((project.webhooks || []) as any[], "project.complete", {
            projectId: String(project._id),
            surveyTitle: project.surveyTitle,
            completes: project.progress.completes,
            targetSample,
          });
        } catch {}
      }

      // Dispatch respondent.complete webhook
      try {
        dispatchWebhooks((project.webhooks || []) as any[], "respondent.complete", {
          projectId: String(project._id),
          respondentId: rid,
          supplierCode: session.supplierCode,
          durationSeconds,
          fraudScore,
          completedAt: now.toISOString(),
        });
      } catch {}
    } else if (normalizedStatus === "screened_out") {
      project.progress.screenouts = (project.progress.screenouts || 0) + 1;
      try {
        dispatchWebhooks((project.webhooks || []) as any[], "respondent.screenout", {
          projectId: String(project._id),
          respondentId: rid,
          supplierCode: session.supplierCode,
          reason,
        });
      } catch {}
    } else if (normalizedStatus === "quota_full") {
      project.progress.quotaFull = (project.progress.quotaFull || 0) + 1;
      try {
        dispatchWebhooks((project.webhooks || []) as any[], "respondent.quota_full", {
          projectId: String(project._id),
          respondentId: rid,
          supplierCode: session.supplierCode,
        });
      } catch {}
    } else if (normalizedStatus === "quality_reject") {
      project.progress.qualityRejects = (project.progress.qualityRejects || 0) + 1;
    }

    // Synchronize participation and earnings to Respondent profile if present in panel database
    try {
      const respInc: Record<string, number> = { totalSurveys: 1 };
      if (normalizedStatus === "completed") {
        respInc.completedSurveys = 1;
        respInc.totalEarnings = estimatedCpi;
        respInc.pendingEarnings = estimatedCpi;
      } else if (normalizedStatus === "screened_out") {
        respInc.screenouts = 1;
      } else if (normalizedStatus === "quota_full") {
        respInc.quotaFull = 1;
      } else if (normalizedStatus === "quality_reject") {
        respInc.qualityRejects = 1;
      }

      await Respondent.findOneAndUpdate(
        {
          $or: [
            { respondentId: rid },
            ...(mongoose.Types.ObjectId.isValid(rid) ? [{ _id: rid }] : []),
          ],
        },
        {
          $inc: respInc,
          $set: { lastActiveAt: now },
        }
      ).catch(() => {});
    } catch {}

    await project.save();

    // Determine redirect destination
    const redirectParam = searchParams.get("redirect");
    if (redirectParam === "false" || req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({
        success: true,
        status: normalizedStatus,
        respondentId: rid,
        durationSeconds,
        fraudScore,
      });
    }

    // Redirect user to completion or termination page
    if (normalizedStatus === "completed") {
      const targetUrl = project.surveySetup?.qualificationUrl || `/survey/sample-complete?rid=${encodeURIComponent(rid)}`;
      return NextResponse.redirect(new URL(targetUrl, req.url));
    } else {
      const termUrl = project.surveySetup?.terminationUrl || `/survey/terminated?reason=${encodeURIComponent(reason || normalizedStatus)}`;
      return NextResponse.redirect(new URL(termUrl, req.url));
    }
  } catch (error) {
    console.error("Survey callback error:", error);
    return NextResponse.json({ success: false, message: "Callback failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  return handleCallback(req, context);
}

export async function POST(req: NextRequest, context: RouteContext) {
  return handleCallback(req, context);
}
