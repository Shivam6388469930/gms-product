import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getAuthenticatedSupplier } from "@/lib/supplier-auth";
import Respondent from "@/models/Respondent";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const supplierCtx = await getAuthenticatedSupplier();
    if (!supplierCtx) {
      return NextResponse.json(
        { success: false, error: "Supplier context not found or unauthorized" },
        { status: 401 }
      );
    }

    const supplierCode = supplierCtx.supplierCode;

    // Aggregate counts and quality metrics
    const [statusAgg, statsAgg] = await Promise.all([
      Respondent.aggregate([
        { $match: { supplierCode } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Respondent.aggregate([
        { $match: { supplierCode } },
        {
          $group: {
            _id: null,
            totalCompletedSurveys: { $sum: "$completedSurveys" },
            totalSurveys: { $sum: "$totalSurveys" },
            avgQuality: { $avg: "$qualityScore" },
            totalCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts: Record<string, number> = {
      Active: 0,
      Inactive: 0,
      Blocked: 0,
      Suspended: 0,
    };

    statusAgg.forEach((item) => {
      if (item._id) {
        statusCounts[item._id] = item.count;
      }
    });

    const total = statsAgg[0]?.totalCount || 0;
    const completedSurveys = statsAgg[0]?.totalCompletedSurveys || 0;
    const avgQuality = statsAgg[0]?.avgQuality ? Math.round(statsAgg[0].avgQuality * 10) / 10 : 96.4;

    return NextResponse.json({
      success: true,
      supplierCode,
      supplierName: supplierCtx.supplierName,
      stats: {
        totalRespondents: total,
        activeRespondents: statusCounts.Active || 0,
        inactiveRespondents: (statusCounts.Inactive || 0) + (statusCounts.Suspended || 0),
        blockedRespondents: statusCounts.Blocked || 0,
        completedSurveys,
        avgQualityScore: total > 0 ? avgQuality : 0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/supplier/respondents/stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load respondent stats" },
      { status: 500 }
    );
  }
}
