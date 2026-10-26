import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]/export
 * Generates and downloads a CSV of all respondent fieldwork sessions
 * for the project (compatible with PureSpectrum & Cint / Fulcrum reconciliations).
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Invalid project ID", 400);

    await connectDB();

    const project = await Project.findOne({
      _id: id,
      $or: [{ owner: userId }, { user: userId }],
    }).lean();
    if (!project) return fail("Project not found", 404);

    const sessions = await RespondentSession.find({ project: id })
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV content
    const headers = [
      "Respondent ID",
      "Supplier Code",
      "Status",
      "IP Address",
      "Country",
      "Passed Screener",
      "Device Fingerprint",
      "Fraud Score",
      "Cross-Project Duplicate",
      "Duration (Seconds)",
      "Terminated Reason",
      "Started At",
      "Completed At",
      "Created At",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = sessions.map((s) => [
      escapeCsv(s.respondentId),
      escapeCsv(s.supplierCode || "DIRECT"),
      escapeCsv(s.status),
      escapeCsv(s.ip),
      escapeCsv(s.country || ""),
      escapeCsv(s.passedScreener ? "YES" : "NO"),
      escapeCsv(s.deviceFingerprint || ""),
      escapeCsv(s.fraudScore || 0),
      escapeCsv(s.crossProjectDuplicate ? "YES" : "NO"),
      escapeCsv(s.durationSeconds || 0),
      escapeCsv(s.terminatedReason || ""),
      escapeCsv(s.startedAt ? new Date(s.startedAt).toISOString() : ""),
      escapeCsv(s.completedAt ? new Date(s.completedAt).toISOString() : ""),
      escapeCsv(s.createdAt ? new Date(s.createdAt).toISOString() : ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const safeTitle = (project.surveyTitle || "project").replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `${safeTitle}_fieldwork_${id}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return fail("Failed to export fieldwork data", 500);
  }
}
