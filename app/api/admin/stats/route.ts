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
      totalRespondents,
      completedSessions,
      screenoutSessions,
      quotaFullSessions,
      qualityRejects,
      fraudBlocks,
      transactionsAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Supply.countDocuments({ active: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: "live" }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      RespondentSession.countDocuments(),
      RespondentSession.countDocuments({ status: "completed" }),
      RespondentSession.countDocuments({ status: "screened_out" }),
      RespondentSession.countDocuments({ status: "quota_full" }),
      RespondentSession.countDocuments({ status: "quality_reject" }),
      RespondentSession.countDocuments({
        status: {
          $in: ["blocked_duplicate_ip", "blocked_exclusion", "blocked_fingerprint"],
        },
      }),
      Transaction.aggregate([
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const verifiedUsers = await User.countDocuments({ emailVerified: true });
    const fraudRulesActive = await FraudRule.countDocuments({ active: true });

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
