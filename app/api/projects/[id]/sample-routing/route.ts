import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import Supply from "@/models/Supply";
import ProjectSupply from '@/models/ProjectSupply';
import SupplierAllocation from '@/models/SupplierAllocation';
import SupplierProject from '@/models/SupplierProject';
import User from '@/models/User';
import { getUserId } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOne({
      _id: id,
      owner: userId,
    }).lean();

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const supplies = await Supply.find({
      country: project.country,
      audienceType: project.audienceType,
      active: true,
      availableSample: { $gt: 0 },
    })
      .sort({
        qualityScore: -1,
        priority: 1,
      })
      .lean();

    const allocations = await ProjectSupply.find({
      project: id,
    })
      .populate("supply")
      .sort({ priority: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      project: {
        _id: project._id,
        name: project.name,
        country: project.country,
        audienceType: project.audienceType,
        sampleSize: project.sampleSize,
        loi: project.loi,
        ir: project.ir,
        status: project.status,
        surveySetup: project.surveySetup,
      },
      supplies,
      allocations,
    });
  } catch (error) {
    console.error("Sample routing GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load sample routing",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOne({
      _id: id,
      owner: userId,
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sample routing can only be configured while the project is in draft status",
        },
        { status: 400 }
      );
    }

    if (project.surveySetup?.status !== "ready") {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete Survey Setup before configuring sample routing",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const routing = Array.isArray(body.routing)
      ? body.routing
      : [];

    if (!routing.length) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one supplier is required",
        },
        { status: 400 }
      );
    }

    const supplierIds = routing.map(
      (item: { supplyId: string }) => item.supplyId
    );

    const uniqueSupplierIds = new Set(supplierIds);

    if (uniqueSupplierIds.size !== supplierIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate suppliers are not allowed",
        },
        { status: 400 }
      );
    }

    const supplies = await Supply.find({
      _id: { $in: supplierIds },
      country: project.country,
      audienceType: project.audienceType,
      active: true,
    });

    if (supplies.length !== routing.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more selected suppliers are invalid for this project",
        },
        { status: 400 }
      );
    }

    const supplyMap = new Map(
      supplies.map((supply) => [
        supply._id.toString(),
        supply,
      ])
    );

    let totalAllocated = 0;

    const normalizedRouting = routing.map(
      (
        item: {
          supplyId: string;
          allocatedSample: number;
          routingPercent?: number;
          priority?: number;
        },
        index: number
      ) => {
        const supply = supplyMap.get(item.supplyId);

        if (!supply) {
          throw new Error("Invalid supplier");
        }

        const allocatedSample = Number(item.allocatedSample);

        if (
          !Number.isFinite(allocatedSample) ||
          allocatedSample <= 0
        ) {
          throw new Error(
            `Invalid allocated sample for ${supply.supplierName}`
          );
        }

        if (allocatedSample > supply.availableSample) {
          throw new Error(
            `${supply.supplierName} does not have enough available sample`
          );
        }

        totalAllocated += allocatedSample;

        return {
          supply: supply._id,
          allocatedSample,
          allocatedCpi: supply.baseCpi,
          routingPercent: Number(item.routingPercent ?? 0),
          priority: Number(item.priority ?? index + 1),
        };
      }
    );

    if (totalAllocated < project.sampleSize) {
      return NextResponse.json(
        {
          success: false,
          message: `Allocated sample (${totalAllocated}) is less than required sample (${project.sampleSize})`,
        },
        { status: 400 }
      );
    }

    if (totalAllocated > project.sampleSize) {
      return NextResponse.json(
        {
          success: false,
          message: `Allocated sample (${totalAllocated}) exceeds required sample (${project.sampleSize})`,
        },
        { status: 400 }
      );
    }

    await ProjectSupply.deleteMany({
      project: project._id,
    });

    const documents = normalizedRouting.map((item: {
      supply: any;
      allocatedSample: number;
      allocatedCpi: number;
      routingPercent: number;
      priority: number;
    }) => ({
      project: project._id,
      supply: item.supply,
      allocatedSample: item.allocatedSample,
      allocatedCpi: item.allocatedCpi,
      routingPercent: item.routingPercent,
      priority: item.priority,
      status: "active",
      allocatedAt: new Date(),
    }));

    await ProjectSupply.insertMany(documents);

    // Sync to SupplierAllocation and SupplierProject for each supplier
    await SupplierAllocation.deleteMany({ project: project._id });
    for (const doc of documents) {
      const supplyDoc = supplyMap.get(doc.supply.toString());
      let supplierUser = await User.findOne({
        $or: [
          { supplierCode: supplyDoc?.supplierCode },
          { supplierId: supplyDoc?._id },
        ],
      });
      if (!supplierUser) {
        supplierUser = await User.findOne({ role: 'supplier' });
      }
      if (supplierUser) {
        await SupplierAllocation.create({
          project: project._id,
          supplierId: supplierUser._id,
          supplierCode: supplyDoc?.supplierCode || supplierUser.supplierCode || 'SUP-001',
          supply: doc.supply,
          allocatedSample: doc.allocatedSample,
          allocatedCpi: doc.allocatedCpi,
          routingPercent: doc.routingPercent,
          priority: doc.priority,
          status: 'active',
          allocatedAt: new Date(),
        });

        // Also ensure SupplierProject exists for supplier project dashboard
        await SupplierProject.findOneAndUpdate(
          { supplierCode: supplyDoc?.supplierCode || supplierUser.supplierCode || 'SUP-001', projectId: project._id.toString() },
          {
            $set: {
              title: project.surveyTitle || 'Survey Study',
              clientName: (project.owner as any)?.name || 'Buyer',
              audience: project.audienceType || 'consumer',
              country: project.country || 'US',
              sampleRequired: doc.allocatedSample,
              cpi: doc.allocatedCpi,
              totalValue: doc.allocatedSample * doc.allocatedCpi,
              loi: project.loi || 10,
              ir: project.ir || 30,
              status: 'active',
              deadlineDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              description: project.audienceDescription || '',
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sample routing saved successfully",
      totalAllocated,
      requiredSample: project.sampleSize,
      allocations: documents,
    });
  } catch (error) {
    console.error("Sample routing POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to save sample routing",
      },
      { status: 500 }
    );
  }
}