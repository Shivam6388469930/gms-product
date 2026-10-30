import { NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import { getUserId } from "@/lib/auth";

import User from "@/models/User";
import Respondent from "@/models/Respondent";
import RespondentSession from "@/models/RespondentSession";
import SupplierAllocation from "@/models/SupplierAllocation";
import "@/models/Project";

function mapStatus(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "complete") return "completed";
  if (s === "screened_out" || s === "screenout" || s === "terminated") return "screened_out";
  if (s === "quota_full" || s === "overquota") return "quota_full";
  if (s === "quality_reject" || s === "rejected" || s === "fraud") return "quality_reject";
  return s || "in_progress";
}

export async function GET() {
  try {
    await connectDB();

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized", logs: [] }, { status: 401 });
    }

    const supplier: any = await User.findById(userId).lean();
    if (!supplier || supplier.role !== "supplier" || supplier.isBlocked) {
      return NextResponse.json(
        { success: false, error: "Supplier access required", logs: [] },
        { status: 403 }
      );
    }

    // Respondents that belong to this supplier (from the session, never from the client)
    const respondents: any[] = await Respondent.find({ supplierId: supplier._id })
      .select("_id respondentId country")
      .lean();

    if (respondents.length === 0) {
      return NextResponse.json({ success: true, logs: [] });
    }

    const countryByRid = new Map<string, string>();
    const ids: string[] = [];
    for (const r of respondents) {
      ids.push(r.respondentId, String(r._id));
      countryByRid.set(r.respondentId, r.country || "");
      countryByRid.set(String(r._id), r.country || "");
    }

    const sessions: any[] = await RespondentSession.find({ respondentId: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("project", "surveyTitle country cpi estimate")
      .lean();

    // CPI this supplier gets per project
    const allocs: any[] = await SupplierAllocation.find({ supplierId: supplier._id })
      .select("project allocatedCpi")
      .lean();
    const cpiByProject = new Map<string, number>();
    for (const a of allocs) cpiByProject.set(String(a.project), Number(a.allocatedCpi || 0));

    const logs = sessions.map((s) => {
      const p = s.project || {};
      const pid = String(p._id || s.project || "");
      const status = mapStatus(s.status);
      const cpi =
        cpiByProject.get(pid) || Number(p.cpi || p.estimate?.estimatedCpi || 0) || 2.5;

      const when = new Date(s.completedAt || s.startedAt || s.createdAt);
      const ua = String(s.userAgent || "").toLowerCase();

      return {
        id: String(s._id),
        sessionId: `SES-${String(s._id).slice(-6).toUpperCase()}`,
        respondentId: String(s.respondentId),
        projectId: pid ? `PRJ-${pid.slice(-4).toUpperCase()}` : "PRJ-LIVE",
        projectTitle: p.surveyTitle || "Research Study",
        country: p.country || countryByRid.get(String(s.respondentId)) || "US",
        device: ua.includes("ipad") || ua.includes("tablet")
          ? "Tablet"
          : ua.includes("mobi")
          ? "Mobile"
          : "Desktop",
        ipAddress: s.ip || "0.0.0.0",
        fraudScore: Number(s.fraudScore || 0),
        durationSeconds: Number(s.durationSeconds || 0),
        status,
        earnedCpi: status === "completed" ? cpi : 0,
        date: when.toISOString().split("T")[0],
        timestamp: when.toISOString(),
      };
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("GET /api/supplier/activity error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load activity", logs: [] },
      { status: 500 }
    );
  }
}