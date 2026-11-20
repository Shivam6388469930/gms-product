// app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Supply from "@/models/Supply";
import Project from "@/models/Project";
import AuditLog from "@/models/AuditLog";
import RespondentSession from "@/models/RespondentSession";
import Transaction from "@/models/Transaction";
import FraudRule from "@/models/FraudRule";


export async function GET() {
  try {
    await connectDB();

    const [
      totalUsers,
      activeSuppliers,
      totalProjects,
      liveProjects,
      recentLogs,
      usersByRole,
      projectsByStatus,
      sessionStatusAgg,
      transactionsAgg,
      blockedUsers,
      verifiedUsers,
      fraudRulesActive,
    ] = await Promise.all([
      User.countDocuments(),
      Supply.countDocuments({ active: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: "live" }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      RespondentSession.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ emailVerified: true }),
      FraudRule.countDocuments({ active: true }),
    ]);

    const statusMap = new Map<string, number>();
    let totalRespondents = 0;
    for (const item of sessionStatusAgg) {
      statusMap.set(String(item._id), item.count);
      totalRespondents += item.count;
    }

    const completedSessions = statusMap.get("completed") || 0;
    const screenoutSessions = (statusMap.get("screened_out") || 0) + (statusMap.get("terminate") || 0) + (statusMap.get("terminated") || 0);
    const quotaFullSessions = statusMap.get("quota_full") || 0;
    const qualityRejects = statusMap.get("quality_reject") || 0;
    const fraudBlocks =
      (statusMap.get("blocked_duplicate_ip") || 0) +
      (statusMap.get("blocked_exclusion") || 0) +
      (statusMap.get("blocked_fingerprint") || 0);

    // Conversion rate
    const conversionRate =
      totalRespondents > 0
        ? ((completedSessions / totalRespondents) * 100).toFixed(1)
        : "0.0";

    return NextResponse.json({
      stats: {
        totalUsers,
        activeSuppliers,
        totalProjects,
        liveProjects,
        blockedUsers,
        verifiedUsers,
        totalRespondents,
        completedSessions,
        screenoutSessions,
        quotaFullSessions,
        qualityRejects,
        fraudBlocks,
        conversionRate,
        fraudRulesActive,
      },
      usersByRole,
      projectsByStatus,
      transactionsSummary: transactionsAgg,
      recentActivity: recentLogs,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
