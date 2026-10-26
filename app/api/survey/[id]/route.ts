import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";
import { getClientIp, generateDefaultScreenerQuestions } from "@/lib/screener-helper";
import { dispatchWebhooks } from "@/lib/webhooks";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/survey/[id]
 * Checks respondent eligibility (IP, exclusion list, fingerprint, soft launch)
 * and returns screener questions if allowed.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Survey Link" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Survey not found" },
        { status: 404 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode") || "live";
    const testIp = searchParams.get("test_ip") || req.headers.get("x-simulated-ip");
    const rid = searchParams.get("rid") || `RESP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const supplierCode = searchParams.get("source") || "DIRECT";
    const fingerprint = searchParams.get("fp") || req.headers.get("x-device-fingerprint") || "";

    // Detect client IP
    const clientIp = testIp ? testIp.trim() : getClientIp(req);

    // Verify project is active unless in test mode
    if (project.status !== "live" && mode !== "test") {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
          reason: "project_not_live",
          message: `This survey is currently ${project.status}. Please contact your sample provider.`,
        },
        { status: 403 }
      );
    }

    // ─── SOFT LAUNCH AUTO-PAUSE CHECK ───
    if (
      project.status === "live" &&
      project.softLaunch?.enabled &&
      !project.softLaunch?.autopaused &&
      mode !== "test"
    ) {
      const currentStarts = Number(project.progress?.starts || 0);
      if (currentStarts >= project.softLaunch.threshold) {
        project.softLaunch.autopaused = true;
        project.softLaunch.autopausedAt = new Date();
        project.status = "paused";
        await project.save();

        // Dispatch webhook
        try {
          dispatchWebhooks(
            (project.webhooks || []) as any[],
            "project.soft_launch_paused",
            {
              projectId: String(project._id),
              surveyTitle: project.surveyTitle,
              threshold: project.softLaunch.threshold,
              currentStarts,
            }
          );
        } catch {}

        return NextResponse.json(
          {
            success: false,
            allowed: false,
            reason: "soft_launch_paused",
            message: "This survey has been paused for quality review. Please try again later.",
          },
          { status: 403 }
        );
      }
    }

    // ─── EXCLUSION LIST CHECK ───
    if (
      project.exclusionList &&
      project.exclusionList.length > 0 &&
      project.exclusionList.includes(rid)
    ) {
      await RespondentSession.create({
        project: project._id,
        respondentId: rid,
        supplierCode,
        ip: clientIp,
        userAgent: req.headers.get("user-agent") || "",
        status: "blocked_exclusion",
        passedScreener: false,
        terminatedReason: "Respondent is on the exclusion list.",
        deviceFingerprint: fingerprint,
        country: project.country,
      }).catch((e) => console.error("Error logging exclusion session:", e));

      return NextResponse.json(
        {
          success: false,
          allowed: false,
          reason: "excluded",
          message: "You are not eligible for this survey.",
          terminationUrl: project.surveySetup?.terminationUrl || "",
        },
        { status: 403 }
      );
    }

    // ─── IP ANTI-FRAUD & DUPLICATE CHECK ───
    const existingSession = await RespondentSession.findOne({
      project: project._id,
      ip: clientIp,
      status: {
        $in: ["screened_out", "blocked_duplicate_ip", "completed", "blocked_exclusion", "blocked_fingerprint"],
      },
    }).lean();

    if (existingSession) {
      await RespondentSession.create({
        project: project._id,
        respondentId: rid,
        supplierCode,
        ip: clientIp,
        userAgent: req.headers.get("user-agent") || "",
        status: "blocked_duplicate_ip",
        passedScreener: false,
        terminatedReason: `Duplicate IP attempt blocked. Previous attempt status: ${existingSession.status}`,
        deviceFingerprint: fingerprint,
        country: project.country,
      }).catch((e) => console.error("Error logging duplicate IP session:", e));

      return NextResponse.json(
        {
          success: false,
          allowed: false,
          reason: "duplicate_ip",
          ip: clientIp,
          message:
            "Access Denied: This IP address has already attempted or been screened out of this survey. In compliance with ESOMAR/GRBN sample-quality guidelines, each IP address is strictly limited to one attempt. Re-entry is permanently barred.",
          previousStatus: existingSession.status,
          terminationUrl: project.surveySetup?.terminationUrl || "",
        },
        { status: 403 }
      );
    }

    // ─── CROSS-PROJECT FINGERPRINT DEDUP ───
    if (fingerprint) {
      const fpDuplicate = await RespondentSession.findOne({
        deviceFingerprint: fingerprint,
        project: { $ne: project._id },
        status: "completed",
        createdAt: { $gte: new Date(Date.now() - 7 * 86400000) }, // last 7 days
      }).lean();

      if (fpDuplicate) {
        await RespondentSession.create({
          project: project._id,
          respondentId: rid,
          supplierCode,
          ip: clientIp,
          userAgent: req.headers.get("user-agent") || "",
          status: "blocked_fingerprint",
          passedScreener: false,
          terminatedReason: "Cross-project duplicate detected via device fingerprint.",
          deviceFingerprint: fingerprint,
          crossProjectDuplicate: true,
          country: project.country,
        }).catch((e) => console.error("Error logging fingerprint dup session:", e));

        return NextResponse.json(
          {
            success: false,
            allowed: false,
            reason: "fingerprint_duplicate",
            message: "You have recently participated in a similar study and are not eligible at this time.",
            terminationUrl: project.surveySetup?.terminationUrl || "",
          },
          { status: 403 }
        );
      }
    }

    // Screener questions
    let questions = project.screener?.questions;
    if (!questions || !questions.length) {
      questions = generateDefaultScreenerQuestions(project);
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      ip: clientIp,
      project: {
        _id: project._id,
        surveyTitle: project.surveyTitle,
        country: project.country,
        audienceType: project.audienceType,
        loi: project.loi,
        estimatedLoi: project.surveySetup?.estimatedLoi || project.loi,
      },
      screener: {
        enabled: project.screener?.enabled ?? true,
        questions,
      },
      respondentId: rid,
      supplierCode,
      mode,
    });
  } catch (error) {
    console.error("Survey entry error:", error);
    return NextResponse.json(
      { success: false, message: "Error initializing survey session" },
      { status: 500 }
    );
  }
}

