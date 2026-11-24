import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getUserId } from "@/lib/auth";
import User from "@/models/User";
import Respondent from "@/models/Respondent";
import RespondentSession from "@/models/RespondentSession";
import Project from "@/models/Project";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Find the respondent record
    const respondent = await Respondent.findOne({
      $or: [
        { userId: user._id },
        { email: String(user.email || "").toLowerCase() },
        ...(user.respondentId ? [{ respondentId: user.respondentId }] : []),
      ],
    }).lean();

    const respondentIdStr = respondent?.respondentId || user.respondentId || `R-${user._id.toString().slice(-6)}`;
    const userCountry = respondent?.country || (user as any).country || "US";

    // 1. Completed Sessions
    const completedSessions = await RespondentSession.find({
      $or: [
        { respondentId: respondentIdStr },
        ...(respondent ? [{ respondentId: respondent._id.toString() }] : []),
      ],
      status: "completed",
    })
      .sort({ completedAt: -1, createdAt: -1 })
      .populate("project", "surveyTitle country loi cpi estimate projectId")
      .lean();

    const completed = completedSessions.map((s: any) => {
      const p = s.project || {};
      const cpiVal = Number(p.cpi || p.estimate?.estimatedCpi || 2.5);
      return {
        id: s._id.toString(),
        surveyCode: p.projectId || `SRV-${s._id.toString().slice(-6).toUpperCase()}`,
        title: p.surveyTitle || "Completed Research Study",
        country: p.country || "US",
        completedAt: s.completedAt || s.createdAt,
        timeTaken: s.durationSeconds ? `${Math.round(s.durationSeconds / 60)} mins` : `${p.loi || 10} mins`,
        rewardEarned: cpiVal,
        pointsEarned: Math.round(cpiVal * 100),
        status: "approved",
        receiptId: `REC-${s._id.toString().slice(-8).toUpperCase()}`,
      };
    });

    // 2. In-Progress Sessions (started but not yet terminal)
    const inProgressSessions = await RespondentSession.find({
      $or: [
        { respondentId: respondentIdStr },
        ...(respondent ? [{ respondentId: respondent._id.toString() }] : []),
      ],
      status: "started",
    })
      .sort({ startedAt: -1, createdAt: -1 })
      .populate("project", "surveyTitle country loi cpi estimate projectId surveyUrl surveySetup")
      .lean();

    const inProgressProjectIds = new Set(
      inProgressSessions.map((s: any) => s.project?._id?.toString()).filter(Boolean)
    );

    const completedProjectIds = new Set(
      completedSessions.map((s: any) => s.project?._id?.toString()).filter(Boolean)
    );

    const inProgressList = inProgressSessions.map((s: any) => {
      const p = s.project || {};
      const cpiVal = Number(p.cpi || p.estimate?.estimatedCpi || 2.5);
      const url =
        s.targetSurveyUrl ||
        p.surveySetup?.surveyUrl ||
        p.surveyUrl ||
        `/api/survey/start?pid=${p.projectId || p._id}&rid=${respondentIdStr}`;

      return {
        id: s._id.toString(),
        projectId: p._id?.toString() || "",
        surveyCode: p.projectId || `SRV-${s._id.toString().slice(-6).toUpperCase()}`,
        title: p.surveyTitle || "In-Flight Research Study",
        country: p.country || userCountry,
        estimatedLoi: p.loi || 10,
        rewardAmount: cpiVal,
        points: Math.round(cpiVal * 100),
        status: "in_progress",
        startedAt: s.startedAt || s.createdAt,
        resumeUrl: url,
        progress: 50,
      };
    });

    // 3. Available Live Surveys
    const availableProjects = await Project.find({
      status: "live",
      _id: { $nin: Array.from(completedProjectIds) },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const availableList = availableProjects
      .filter((p: any) => {
        // Must have quota remaining
        if (p.sampleSize && Number(p.progress?.completes || 0) >= Number(p.sampleSize)) {
          return false;
        }
        return true;
      })
      .map((p: any) => {
        const cpiVal = Number(p.cpi || p.estimate?.estimatedCpi || 2.5);
        const url = `/api/survey/start?pid=${p.projectId || p._id}&rid=${respondentIdStr}`;

        return {
          id: p._id.toString(),
          projectId: p._id.toString(),
          surveyCode: p.projectId || `SRV-${p._id.toString().slice(-6).toUpperCase()}`,
          title: p.surveyTitle || "Consumer Research Study",
          country: p.country || "US",
          category: p.audienceType || "General Consumer",
          estimatedLoi: p.loi || 10,
          rewardAmount: cpiVal,
          points: Math.round(cpiVal * 100),
          status: inProgressProjectIds.has(p._id.toString()) ? "in_progress" : "available",
          startUrl: url,
          remainingQuota: Math.max(0, (p.sampleSize || 100) - Number(p.progress?.completes || 0)),
        };
      });

    const totalEarned = completed.reduce((sum, item) => sum + item.rewardEarned, 0);

    return NextResponse.json({
      success: true,
      respondentId: respondentIdStr,
      inProgress: inProgressList,
      available: availableList,
      completed,
      summary: {
        inProgressCount: inProgressList.length,
        availableCount: availableList.length,
        completedCount: completed.length,
        totalEarned: Math.round(totalEarned * 100) / 100,
        pointsEarned: Math.round(totalEarned * 100),
      },
    });
  } catch (error: any) {
    console.error("GET /api/respondent/surveys error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load surveys" },
      { status: 500 }
    );
  }
}
