import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import Supply from "@/models/Supply";
import ProjectSupply from "@/models/ProjectSupply";
import RespondentSession from "@/models/RespondentSession";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierCode = searchParams.get("supplierCode");

    await connectDB();

    let supply: any = null;
    if (supplierCode) {
      supply = await Supply.findOne({ supplierCode }).lean();
    }
    if (!supply) {
      supply = await Supply.findOne({ active: true }).sort({ createdAt: -1 }).lean();
    }

    const supplyFilter: Record<string, unknown> = {};
    if (supply) {
      supplyFilter.supply = supply._id;
    }

    const [allocations, allProjects, totalSupplies, completedSessions, flaggedSessions] =
      await Promise.all([
        ProjectSupply.find(supplyFilter).lean(),
        Project.find({ status: { $in: ["live", "draft", "paused"] } }).lean(),
        Supply.find({ active: true }).lean(),
        RespondentSession.countDocuments({ status: "completed" }),
        RespondentSession.countDocuments({ fraudScore: { $gt: 80 } }),
      ]);

    const allocatedProjectIds = new Set(allocations.map((a: any) => a.project?.toString()));

    // Active & paused
    const activeProjectsCount = allocations.filter((a: any) => a.status === "active").length;
    const completedProjectsCount = allocations.filter((a: any) => a.status === "completed").length;

    // Incoming are live/draft platform projects not yet allocated to this supplier
    const incomingProjectsCount = allProjects.filter(
      (p: any) => !allocatedProjectIds.has(p._id.toString())
    ).length;

    const totalDelivered = allocations.reduce(
      (acc: number, a: any) => acc + (a.actualCompletes || 0),
      0
    );

    const totalPanelists = totalSupplies.reduce(
      (acc: number, s: any) => acc + (s.availableSample || 0),
      0
    );

    const avgQuality =
      totalSupplies.length > 0
        ? Math.round(
            (totalSupplies.reduce((acc: number, s: any) => acc + (s.qualityScore || 90), 0) /
              totalSupplies.length) *
              10
          ) / 10
        : 90;

    const mtdRevenue = allocations.reduce(
      (acc: number, a: any) =>
        acc + (a.actualSpend || (a.actualCompletes || 0) * (a.allocatedCpi || 2.0)),
      0
    );

    return NextResponse.json({
      success: true,
      dataSource: "database",
      stats: {
        incomingProjects: incomingProjectsCount,
        activeProjects: activeProjectsCount,
        completedProjects: completedProjectsCount,
        totalDelivered,
        panelsCount: totalSupplies.length,
        totalPanelists,
        avgQualityIndex: avgQuality,
        mtdRevenue,
        recentCompletes: completedSessions,
        flaggedAttempts: flaggedSessions,
      },
    });
  } catch (error: any) {
    console.error("GET /api/supplier/stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load supplier stats",
        stats: {
          incomingProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalDelivered: 0,
          panelsCount: 0,
          totalPanelists: 0,
          avgQualityIndex: 0,
          mtdRevenue: 0,
          recentCompletes: 0,
          flaggedAttempts: 0,
        },
      },
      { status: 500 }
    );
  }
}
