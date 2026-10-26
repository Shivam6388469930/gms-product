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
    const country = searchParams.get("country") || "";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { surveyTitle: { $regex: search, $options: "i" } },
        { "surveySetup.surveyUrl": { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (country) query.country = country;

    const [surveys, total, statusAgg] = await Promise.all([
      Project.find(query)
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
      Project.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts: Record<string, number> = {};
    statusAgg.forEach((s) => {
      statusCounts[s._id] = s.count;
    });

    return NextResponse.json({
      surveys,
      stats: {
        total: await Project.countDocuments(),
        live: statusCounts["live"] || 0,
        paused: statusCounts["paused"] || 0,
        draft: statusCounts["draft"] || 0,
        stopped: statusCounts["stopped"] || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin surveys error:", error);
    return NextResponse.json(
      { error: "Failed to fetch surveys" },
      { status: 500 }
    );
  }
}
