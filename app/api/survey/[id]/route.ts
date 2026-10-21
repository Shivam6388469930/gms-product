import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";
import { getClientIp, generateDefaultScreenerQuestions } from "@/lib/screener-helper";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/survey/[id]
 * Checks respondent IP address eligibility and returns screener questions if allowed.
 * Enforces: "never that user ip run survey again"
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

    const project = await Project.findById(id).lean();

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

    // IP ANTI-FRAUD & DUPLICATE CHECK:
    // Check if this IP address has ever attempted this survey and was screened out, completed, or blocked.
    const existingSession = await RespondentSession.findOne({
      project: project._id,
      ip: clientIp,
      status: {
        $in: ["screened_out", "blocked_duplicate_ip", "completed"],
      },
    }).lean();

    if (existingSession) {
      // Record this duplicate attempt
      await RespondentSession.create({
        project: project._id,
        respondentId: rid,
        supplierCode,
        ip: clientIp,
        userAgent: req.headers.get("user-agent") || "",
        status: "blocked_duplicate_ip",
        passedScreener: false,
        terminatedReason: `Duplicate IP attempt blocked. Previous attempt status: ${existingSession.status}`,
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
