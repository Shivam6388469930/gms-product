import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/Project";
import SupplierAllocation from "@/models/SupplierAllocation";
import Supply from "@/models/Supply";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";


export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

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
        { projectId: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (audienceType) query.audienceType = audienceType;

    const [projects, total, statusAgg, spendAgg] = await Promise.all([
      Project.find(query)
        .select("-screener.questions -quotaNesting")
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
            totalStarts: { $sum: "$progress.starts" },
            totalScreenouts: { $sum: "$progress.screenouts" },
            totalQuotaFull: { $sum: "$progress.quotaFull" },
            totalTarget: { $sum: "$sampleSize" },
          },
        },
      ]),
    ]);

    const statusCounts: Record<string, number> = {};
    statusAgg.forEach((s) => {
      statusCounts[s._id] = s.count;
    });

    const totals = spendAgg[0] || {
      totalSpend: 0,
      totalCompletes: 0,
      totalStarts: 0,
      totalScreenouts: 0,
      totalQuotaFull: 0,
      totalTarget: 0,
    };

    const allocations = await SupplierAllocation.find({
      project: { $in: projects.map((project) => project._id) },
    })
      .populate<{
        supplierId: {
          _id: mongoose.Types.ObjectId;
          name?: string;
          email?: string;
          supplierCode?: string;
        } | null;
      }>("supplierId", "name email supplierCode")
      .sort({ allocatedAt: -1 })
      .lean();

    const suppliersByProject = new Map<string, Map<string, {
      id: string;
      name: string;
      email: string;
      supplierCode: string;
      status: string;
    }>>();

    for (const allocation of allocations) {
      const supplier = allocation.supplierId;
      if (!supplier?._id) continue;

      const projectId = allocation.project.toString();
      const suppliers = suppliersByProject.get(projectId) || new Map();
      suppliers.set(supplier._id.toString(), {
        id: supplier._id.toString(),
        name: supplier.name || supplier.supplierCode || "Supplier",
        email: supplier.email || "",
        supplierCode: supplier.supplierCode || allocation.supplierCode,
        status: allocation.status,
      });
      suppliersByProject.set(projectId, suppliers);
    }

    const marketMatches = projects.map((project) => ({
      country: project.country,
      audienceType: project.audienceType,
    }));
    const supplyProfiles = marketMatches.length
      ? await Supply.find({
          active: true,
          availableSample: { $gt: 0 },
          $or: marketMatches,
        }).lean()
      : [];
    const supplierCodes = [...new Set(
      supplyProfiles.map((supply) => supply.supplierCode).filter(Boolean)
    )];
    const supplyIds = supplyProfiles.map((supply) => supply._id);
    const supplierEmails = [...new Set(
      supplyProfiles.map((supply) => supply.supplierEmail).filter(Boolean)
    )];

    const supplierUsers = supplierCodes.length || supplyIds.length || supplierEmails.length
      ? await User.find({
          role: "supplier",
          $or: [
            ...(supplierCodes.length ? [{ supplierCode: { $in: supplierCodes } }] : []),
            ...(supplyIds.length ? [{ supplierId: { $in: supplyIds } }] : []),
            ...(supplierEmails.length ? [{ email: { $in: supplierEmails } }] : []),
          ],
        })
          .select("name email supplierCode supplierId")
          .lean()
      : [];

    const usersByCode = new Map(
      supplierUsers
        .filter((supplier) => supplier.supplierCode)
        .map((supplier) => [supplier.supplierCode, supplier])
    );
    const usersBySupplyId = new Map(
      supplierUsers
        .filter((supplier) => supplier.supplierId)
        .map((supplier) => [supplier.supplierId!.toString(), supplier])
    );
    const usersByEmail = new Map(
      supplierUsers.map((supplier) => [supplier.email.toLowerCase(), supplier])
    );

    for (const project of projects) {
      const projectId = project._id.toString();
      const suppliers = suppliersByProject.get(projectId) || new Map();
      const matchingProfiles = supplyProfiles.filter(
        (supply) =>
          supply.country === project.country &&
          supply.audienceType === project.audienceType
      );

      for (const supply of matchingProfiles) {
        const supplier =
          usersByCode.get(supply.supplierCode) ||
          usersBySupplyId.get(supply._id.toString()) ||
          usersByEmail.get(supply.supplierEmail.toLowerCase());
        if (!supplier || suppliers.has(supplier._id.toString())) continue;

        suppliers.set(supplier._id.toString(), {
          id: supplier._id.toString(),
          name: supplier.name || supplier.supplierCode || "Supplier",
          email: supplier.email || "",
          supplierCode: supplier.supplierCode || supply.supplierCode,
          status: "incoming",
        });
      }

      suppliersByProject.set(projectId, suppliers);
    }

    return NextResponse.json({
      projects: projects.map((project) => ({
        ...project,
        supplierAllocations:
          Array.from(
            suppliersByProject.get(project._id.toString())?.values() || []
          ),
      })),
      stats: {
        total: await Project.countDocuments(),
        live: statusCounts["live"] || 0,
        paused: statusCounts["paused"] || 0,
        draft: statusCounts["draft"] || 0,
        stopped: statusCounts["stopped"] || 0,
        totalSpend: totals.totalSpend || 0,
        totalCompletes: totals.totalCompletes || 0,
        totalStarts: totals.totalStarts || 0,
        totalScreenouts: totals.totalScreenouts || 0,
        totalQuotaFull: totals.totalQuotaFull || 0,
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
