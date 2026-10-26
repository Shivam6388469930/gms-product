import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/Project";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const audienceType = searchParams.get("audienceType") || "";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { surveyTitle: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (audienceType) query.audienceType = audienceType;

    const [projects, total, statusAgg, spendAgg] = await Promise.all([
      Project.find(query)
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
      Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Project.aggregate([
        {
          $group: {
            _id: null,
            totalSpend: { $sum: "$progress.spend" },
            totalCompletes: { $sum: "$progress.completes" },
            totalTarget: { $sum: "$sampleSize" },
          },
        },
      ]),
    ]);

    const statusCounts: Record<string, number> = {};
    statusAgg.forEach((s) => {
      statusCounts[s._id] = s.count;
    });

    const totals = spendAgg[0] || { totalSpend: 0, totalCompletes: 0, totalTarget: 0 };

    return NextResponse.json({
      projects,
      stats: {
        total: await Project.countDocuments(),
        live: statusCounts["live"] || 0,
        paused: statusCounts["paused"] || 0,
        draft: statusCounts["draft"] || 0,
        stopped: statusCounts["stopped"] || 0,
        totalSpend: totals.totalSpend || 0,
        totalCompletes: totals.totalCompletes || 0,
        totalTarget: totals.totalTarget || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
