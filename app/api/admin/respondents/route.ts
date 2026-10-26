import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import RespondentSession from "@/models/RespondentSession";
import Project from "@/models/Project";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const supplierCode = searchParams.get("supplierCode") || "";
    const projectId = searchParams.get("projectId") || "";
    const minFraudScore = searchParams.get("minFraudScore");

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { respondentId: { $regex: search, $options: "i" } },
        { ip: { $regex: search, $options: "i" } },
        { deviceFingerprint: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (supplierCode) query.supplierCode = supplierCode;
    if (projectId) query.project = projectId;
    if (minFraudScore) query.fraudScore = { $gte: parseInt(minFraudScore) };

    const [respondents, total, statsAgg] = await Promise.all([
      RespondentSession.find(query)
        .populate("project", "surveyTitle country")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RespondentSession.countDocuments(query),
      RespondentSession.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statsMap: Record<string, number> = {};
    statsAgg.forEach((s) => {
      statsMap[s._id] = s.count;
    });

    return NextResponse.json({
      respondents,
      stats: {
        total: await RespondentSession.countDocuments(),
        completed: statsMap["completed"] || 0,
        screened_out: statsMap["screened_out"] || 0,
        quota_full: statsMap["quota_full"] || 0,
        quality_reject: statsMap["quality_reject"] || 0,
        blocked:
          (statsMap["blocked_duplicate_ip"] || 0) +
          (statsMap["blocked_exclusion"] || 0) +
          (statsMap["blocked_fingerprint"] || 0),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin respondents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch respondents" },
      { status: 500 }
    );
  }
}
