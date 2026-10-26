import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";
import Invoice from "@/models/Invoice";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";

/**
 * GET /api/dashboard
 * Returns aggregate analytics for the authenticated user's projects.
 */
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    await connectDB();

    // All projects owned by user
    const projects = await Project.find({ owner: userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalProjects = projects.length;
    const liveProjects = projects.filter((p: any) => p.status === "live").length;
    const draftProjects = projects.filter((p: any) => p.status === "draft").length;
    const pausedProjects = projects.filter((p: any) => p.status === "paused").length;
    const stoppedProjects = projects.filter((p: any) => p.status === "stopped").length;

    // Aggregate progress across all projects
    let totalStarts = 0;
    let totalCompletes = 0;
    let totalScreenouts = 0;
    let totalQuotaFull = 0;
    let totalQualityRejects = 0;
    let totalSpend = 0;
    let totalSampleNeeded = 0;

    for (const p of projects) {
      const prog = (p as any).progress || {};
      totalStarts += Number(prog.starts || 0);
      totalCompletes += Number(prog.completes || 0);
      totalScreenouts += Number(prog.screenouts || 0);
      totalQuotaFull += Number(prog.quotaFull || 0);
      totalQualityRejects += Number(prog.qualityRejects || 0);
      totalSpend += Number(prog.spend || 0);
      totalSampleNeeded += Number((p as any).sampleSize || 0);
    }

    const overallConversionRate =
      totalStarts > 0
        ? Math.round((totalCompletes / totalStarts) * 10000) / 100
        : 0;

    const overallFillRate =
      totalSampleNeeded > 0
        ? Math.round((totalCompletes / totalSampleNeeded) * 10000) / 100
        : 0;

    // Recent sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const projectIds = projects.map((p: any) => p._id);

    const recentSessionStats = await RespondentSession.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Build daily trend data
    const dailyTrend: Record<
      string,
      { date: string; completes: number; screenouts: number; starts: number }
    > = {};

    for (const stat of recentSessionStats) {
      const date = stat._id.date;
      if (!dailyTrend[date]) {
        dailyTrend[date] = { date, completes: 0, screenouts: 0, starts: 0 };
      }
      if (stat._id.status === "completed") {
        dailyTrend[date].completes += stat.count;
      } else if (stat._id.status === "screened_out") {
        dailyTrend[date].screenouts += stat.count;
      }
      dailyTrend[date].starts += stat.count;
    }

    const trend = Object.values(dailyTrend).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Invoice summary
    let invoiceSummary = { total: 0, paid: 0, outstanding: 0, disputed: 0 };
    try {
      const invoices = await Invoice.find({ owner: userId }).lean();
      for (const inv of invoices) {
        const invAny = inv as any;
        invoiceSummary.total += Number(invAny.total || 0);
        if (invAny.status === "paid") invoiceSummary.paid += Number(invAny.total || 0);
        if (invAny.status === "issued") invoiceSummary.outstanding += Number(invAny.total || 0);
        if (invAny.status === "disputed") invoiceSummary.disputed += Number(invAny.total || 0);
      }
    } catch {
      // Invoice model may not exist yet
    }

    // Top 5 recent projects with key metrics
    const recentProjects = projects.slice(0, 5).map((p: any) => ({
      _id: p._id,
      surveyTitle: p.surveyTitle,
      country: p.country,
      audienceType: p.audienceType,
      status: p.status,
      sampleSize: p.sampleSize,
      completes: p.progress?.completes || 0,
      spend: p.progress?.spend || 0,
      createdAt: p.createdAt,
    }));

    // Alerts for underperforming projects
    const alerts: { projectId: string; title: string; type: string; message: string }[] = [];

    for (const p of projects) {
      const pAny = p as any;
      if (pAny.status !== "live") continue;

      const completes = Number(pAny.progress?.completes || 0);
      const sampleSize = Number(pAny.sampleSize || 0);
      const fillRate = sampleSize > 0 ? completes / sampleSize : 0;

      // Launched more than 3 days ago but less than 10% fill
      if (pAny.launchedAt) {
        const daysSinceLaunch =
          (Date.now() - new Date(pAny.launchedAt).getTime()) / 86400000;

        if (daysSinceLaunch > 3 && fillRate < 0.1) {
          alerts.push({
            projectId: String(pAny._id),
            title: pAny.surveyTitle,
            type: "low_fill_rate",
            message: `Only ${Math.round(fillRate * 100)}% filled after ${Math.round(daysSinceLaunch)} days. Consider increasing CPI or adjusting targeting.`,
          });
        }
      }

      // Soft launch auto-paused
      if (pAny.softLaunch?.autopaused) {
        alerts.push({
          projectId: String(pAny._id),
          title: pAny.surveyTitle,
          type: "soft_launch_paused",
          message: `Soft launch threshold reached. Review data quality and resume.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      dashboard: {
        projects: {
          total: totalProjects,
          live: liveProjects,
          draft: draftProjects,
          paused: pausedProjects,
          stopped: stoppedProjects,
        },
        fieldwork: {
          starts: totalStarts,
          completes: totalCompletes,
          screenouts: totalScreenouts,
          quotaFull: totalQuotaFull,
          qualityRejects: totalQualityRejects,
          spend: totalSpend,
          sampleNeeded: totalSampleNeeded,
          conversionRate: overallConversionRate,
          fillRate: overallFillRate,
        },
        trend,
        invoiceSummary,
        recentProjects,
        alerts,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return fail("Something went wrong", 500);
  }
}
