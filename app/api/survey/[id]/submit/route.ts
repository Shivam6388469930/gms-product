import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";
import {
  getClientIp,
  generateDefaultScreenerQuestions,
  evaluateScreener,
} from "@/lib/screener-helper";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/survey/[id]/submit
 * Evaluates screener answers.
 * If pass -> qualifies and redirects to Main Survey URL.
 * If fail -> terminates, logs screenout, and permanently blacklists the respondent IP from ever taking the survey again.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { answers, respondentId, supplierCode, testIp } = body;

    const rid =
      respondentId ||
      `RESP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const source = supplierCode || "DIRECT";

    // Detect client IP
    const clientIp = testIp ? String(testIp).trim() : getClientIp(req);

    await connectDB();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Survey not found" },
        { status: 404 }
      );
    }

    // Anti-fraud duplicate IP check:
    // If this IP has already screened out, completed, or been blocked, reject immediately!
    const priorAttempt = await RespondentSession.findOne({
      project: project._id,
      ip: clientIp,
      status: {
        $in: ["screened_out", "blocked_duplicate_ip", "completed"],
      },
    });

    if (priorAttempt) {
      return NextResponse.json(
        {
          success: false,
          passed: false,
          terminated: true,
          reason: "duplicate_ip",
          message:
            "Survey Access Terminated: This IP address has previously attempted this survey and was screened out. Re-entry from this IP address is strictly and permanently disabled.",
          redirectUrl:
            project.surveySetup?.terminationUrl || "/survey/terminated",
        },
        { status: 403 }
      );
    }

    // Get active screener questions
    let questions = project.screener?.questions;
    if (!questions || !questions.length) {
      questions = generateDefaultScreenerQuestions(project);
    }

    // Evaluate screener submission
    const evaluation = evaluateScreener(questions, answers || {});

    // Prepare main survey target URL if qualified
    let mainSurveyUrl = project.surveySetup?.surveyUrl || "";
    if (mainSurveyUrl) {
      // Replace standard RID tokens
      mainSurveyUrl = mainSurveyUrl
        .replace(/\[RID\]/gi, rid)
        .replace(/\{\{RID\}\}/gi, rid)
        .replace(/\[respondent_id\]/gi, rid);

      // Append RID parameter if not present
      if (!mainSurveyUrl.includes(rid)) {
        const separator = mainSurveyUrl.includes("?") ? "&" : "?";
        mainSurveyUrl = `${mainSurveyUrl}${separator}rid=${encodeURIComponent(
          rid
        )}&source=${encodeURIComponent(source)}`;
      }
    } else {
      mainSurveyUrl = `/survey/sample-complete?rid=${encodeURIComponent(rid)}`;
    }

    const terminationUrl =
      project.surveySetup?.terminationUrl ||
      `/survey/terminated?reason=${encodeURIComponent(
        evaluation.reason || "Did not meet study criteria"
      )}`;

    if (evaluation.passed) {
      // QUALIFIED:
      // Record respondent qualification session
      await RespondentSession.create({
        project: project._id,
        respondentId: rid,
        supplierCode: source,
        ip: clientIp,
        userAgent: req.headers.get("user-agent") || "",
        status: "qualified",
        passedScreener: true,
        screenerAnswers: evaluation.detailedAnswers,
        targetSurveyUrl: mainSurveyUrl,
      });

      // Increment starts on project
      project.progress = project.progress || { starts: 0 };
      project.progress.starts = (project.progress.starts || 0) + 1;
      await project.save();

      return NextResponse.json({
        success: true,
        passed: true,
        message: "Screener passed! Redirecting to main survey.",
        redirectUrl: mainSurveyUrl,
        respondentId: rid,
        ip: clientIp,
      });
    } else {
      // TERMINATED / SCREENED OUT:
      // Record permanent screenout for this IP!
      // This ensures this IP can NEVER run this survey again!
      await RespondentSession.create({
        project: project._id,
        respondentId: rid,
        supplierCode: source,
        ip: clientIp,
        userAgent: req.headers.get("user-agent") || "",
        status: "screened_out",
        passedScreener: false,
        screenerAnswers: evaluation.detailedAnswers,
        terminatedReason: evaluation.reason || "Failed screener criteria",
      });

      // Increment screenouts and starts on project
      project.progress = project.progress || {
        starts: 0,
        screenouts: 0,
      };
      project.progress.starts = (project.progress.starts || 0) + 1;
      project.progress.screenouts = (project.progress.screenouts || 0) + 1;
      await project.save();

      return NextResponse.json({
        success: true,
        passed: false,
        terminated: true,
        reason: evaluation.reason,
        message:
          "Screener failed. You did not meet the criteria for this survey. Your IP address has been recorded and you cannot re-attempt this survey.",
        redirectUrl: terminationUrl,
        ip: clientIp,
      });
    }
  } catch (error) {
    console.error("Screener submit error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to evaluate screener submission" },
      { status: 500 }
    );
  }
}
