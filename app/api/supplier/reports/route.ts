import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getCurrentUser } from "@/lib/auth";
import SupplierAllocation from "@/models/SupplierAllocation";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const currentUser: any = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isSupplier = currentUser.role === "supplier";
    const isAdmin = currentUser.role === "admin" || currentUser.role === "manager";

    if (!isSupplier && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Supplier access required" },
        { status: 403 }
      );
    }

    // Suppliers can ONLY access their own data
    const query: Record<string, any> = {};
    if (!isAdmin) {
      const orConditions: any[] = [{ supplierId: currentUser._id }];
      if (currentUser.supplierCode) {
        orConditions.push({ supplierCode: currentUser.supplierCode });
      }
      query.$or = orConditions;
    }

    // Fetch allocations for this supplier
    const allocations: any[] = await SupplierAllocation.find(query)
      .populate("project")
      .sort({ updatedAt: -1 })
      .lean();

    // Map project-wise breakdown
    let totalStarts = 0;
    let totalCompletes = 0;
    let totalScreenouts = 0;
    let totalQuotaFull = 0;
    let totalQualityRejects = 0;

    const countryMap = new Map<
      string,
      { completes: number; totalSpend: number; count: number }
    >();

    const projects = allocations
      .filter((alloc) => alloc.project && alloc.status !== "removed")
      .map((alloc) => {
        const p = alloc.project;
        const quota = Number(alloc.allocatedSample || p.sampleSize || 0);
        const completes = Number(alloc.actualCompletes || 0);
        const disqualifications = Number(alloc.actualTerminates || 0);
        const quotaFull = Number(alloc.actualQuotaFull || 0);
        const starts = Math.max(
          Number(alloc.actualStarts || 0),
          completes + disqualifications + quotaFull
        );
        const remaining = Math.max(0, quota - completes);
        const cpi = Number(alloc.allocatedCpi || p.cpi || p.estimate?.estimatedCpi || 2.5);
        const conversionRate =
          starts > 0 ? Math.round((completes / starts) * 1000) / 10 : 0;

        totalStarts += starts;
        totalCompletes += completes;
        totalScreenouts += disqualifications;
        totalQuotaFull += quotaFull;

        // Group by country
        const country = p.country || "US";
        const existingCountry = countryMap.get(country) || {
          completes: 0,
          totalSpend: 0,
          count: 0,
        };
        existingCountry.completes += completes;
        existingCountry.totalSpend += completes * cpi;
        existingCountry.count += 1;
        countryMap.set(country, existingCountry);

        return {
          id: p._id.toString(),
          projectId: p.projectId || p._id.toString().slice(-6).toUpperCase(),
          title: p.surveyTitle || "Research Study",
          country,
          audience: p.audienceType || "consumer",
          cpi,
          quota,
          completes,
          disqualifications,
          quotaFull,
          remaining,
          starts,
          conversionRate,
          status: alloc.status || p.status || "active",
        };
      });

    const countryPerformance = Array.from(countryMap.entries()).map(
      ([country, data]) => ({
        country,
        completes: data.completes,
        avgCpi:
          data.completes > 0
            ? Math.round((data.totalSpend / data.completes) * 100) / 100
            : 2.5,
        conversion:
          totalStarts > 0
            ? `${((data.completes / totalStarts) * 100).toFixed(1)}%`
            : "0.0%",
      })
    );

    const overallConversion =
      totalStarts > 0
        ? ((totalCompletes / totalStarts) * 100).toFixed(1)
        : "0.0";

    const funnelStats = {
      totalStarts,
      qualified: totalCompletes + totalQuotaFull,
      completed: totalCompletes,
      screenouts: totalScreenouts,
      overquota: totalQuotaFull,
      qualityRejects: totalQualityRejects,
    };

    return NextResponse.json({
      success: true,
      funnelStats,
      conversionRate: overallConversion,
      countryPerformance,
      projects,
    });
  } catch (error: any) {
    console.error("GET /api/supplier/reports error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate supplier reports" },
      { status: 500 }
    );
  }
}
