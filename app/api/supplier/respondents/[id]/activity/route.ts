import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getAuthenticatedSupplier } from "@/lib/supplier-auth";
import Respondent from "@/models/Respondent";
import RespondentSession from "@/models/RespondentSession";
import Project from "@/models/Project";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const supplierCtx = await getAuthenticatedSupplier();
    if (!supplierCtx) {
      return NextResponse.json(
        { success: false, error: "Supplier context not found or unauthorized", logs: [] },
        { status: 401 }
      );
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const query: Record<string, any> = {
      supplierCode: supplierCtx.supplierCode,
      ...(isMongoId ? { $or: [{ _id: id }, { respondentId: id }] } : { respondentId: id }),
    };

    const respondent = await Respondent.findOne(query);
    if (!respondent) {
      return NextResponse.json(
        { success: false, error: "Respondent not found", logs: [] },
        { status: 404 }
      );
    }

    const sessions = await RespondentSession.find({
      $or: [
        { respondentId: respondent.respondentId },
        { respondentId: respondent._id.toString() },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("project", "surveyTitle country cpi")
      .lean();

    const logs = sessions.map((s: any) => {
      const proj = s.project as any;
      const pidStr = proj?._id ? proj._id.toString() : "";

      let device = "Desktop";
      if (s.userAgent) {
        const ua = s.userAgent.toLowerCase();
        if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) {
          device = "Mobile";
        } else if (ua.includes("tablet") || ua.includes("ipad")) {
          device = "Tablet";
        }
      }

      return {
        id: s._id.toString(),
        sessionId: `SES-${s._id.toString().slice(-6).toUpperCase()}`,
        respondentId: respondent.respondentId,
        projectTitle: proj?.surveyTitle || "Consumer Research Study",
        projectId: pidStr ? `PRJ-${pidStr.slice(-4).toUpperCase()}` : "PRJ-LIVE",
        country: s.country || proj?.country || "US",
        device,
        ipAddress: s.ip || "127.0.0.1",
        fraudScore: s.fraudScore || 0,
        qualityScore: Math.max(0, 100 - (s.fraudScore || 0)),
        durationSeconds: s.durationSeconds || 0,
        durationMinutes: s.durationSeconds ? Math.round(s.durationSeconds / 60) : 0,
        status: s.status,
        earnedCpi: s.status === "completed" ? (proj?.cpi || 2.5) : 0,
        startedAt: s.startedAt || s.createdAt,
        completedAt: s.completedAt || null,
        timestamp: s.createdAt
          ? new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now",
        date: s.createdAt
          ? new Date(s.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      };
    });

    return NextResponse.json({
      success: true,
      respondentId: respondent.respondentId,
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error("GET /api/supplier/respondents/[id]/activity error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load activity", logs: [] },
      { status: 500 }
    );
  }
}
