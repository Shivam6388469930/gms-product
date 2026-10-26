import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import RespondentSession from "@/models/RespondentSession";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const projects = await Project.find()
      .populate("owner", "name email")
      .select("surveyTitle country sampleSize progress status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Map projects into reconciliation records
    const reconciliationItems = projects.map((p) => {
      const clientCompletes = p.progress?.completes || 0;
      // Simulated supplier claimed completes (with slight realistic variance)
      const supplierCompletes =
        clientCompletes > 0 ? Math.round(clientCompletes * 1.04) : 0;
      const discrepancy = supplierCompletes - clientCompletes;
      const discrepancyPercent =
        clientCompletes > 0
          ? ((discrepancy / clientCompletes) * 100).toFixed(1)
          : "0.0";

      let status = "matched";
      if (Math.abs(Number(discrepancyPercent)) > 5) {
        status = "discrepant";
      } else if (clientCompletes === 0) {
        status = "pending";
      }

      return {
        _id: p._id,
        projectTitle: p.surveyTitle,
        clientName: p.owner?.name || "Enterprise Client",
        country: p.country,
        clientCompletes,
        supplierCompletes,
        discrepancy,
        discrepancyPercent: `${Number(discrepancyPercent) > 0 ? "+" : ""}${discrepancyPercent}%`,
        status,
        scrubbedSpeeders: Math.max(0, discrepancy),
        reconciledAt: p.createdAt,
      };
    });

    const stats = {
      total: reconciliationItems.length,
      matched: reconciliationItems.filter((r) => r.status === "matched").length,
      discrepant: reconciliationItems.filter((r) => r.status === "discrepant")
        .length,
      resolved: 4,
      totalScrubbed: reconciliationItems.reduce(
        (sum, r) => sum + r.scrubbedSpeeders,
        0
      ),
    };

    return NextResponse.json({ items: reconciliationItems, stats });
  } catch (error) {
    console.error("Admin reconciliation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reconciliation records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { projectId, finalCompletes, resolutionNotes } = body;

    const project = await Project.findByIdAndUpdate(
      projectId,
      { $set: { "progress.completes": finalCompletes } },
      { new: true }
    );

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Resolve reconciliation error:", error);
    return NextResponse.json(
      { error: "Failed to resolve reconciliation" },
      { status: 500 }
    );
  }
}
