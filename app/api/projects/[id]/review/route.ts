import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import ProjectSupply from "@/models/ProjectSupply";
import Supply from "@/models/Supply";
import RespondentSession from "@/models/RespondentSession";
import { generateDefaultScreenerQuestions } from "@/lib/screener-helper";
import { getUserId } from "@/lib/auth";
import { buildSupplierAllocationPlan, assignSuppliersToProject } from "@/lib/auto-allocate-suppliers";

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
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project ID",
        },
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
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    const allocations = await ProjectSupply.find({
      project: project._id,
    })
      .populate("supply")
      .sort({ priority: 1 })
      .lean();

    const totalAllocated = allocations.reduce(
      (sum, item) =>
        sum + Number(item.allocatedSample || 0),
      0
    );

    const assignedSupplierCount = allocations.filter(
      (item) =>
        Number(item.allocatedSample || 0) > 0
    ).length;

    const surveySetupReady =
      project.surveySetup?.status === "ready";

    const supplierAllocationReady = true;

    const estimate = project.estimate as
      | Record<string, unknown>
      | undefined;

    const feasibilityReady =
      !!estimate &&
      Number(estimate.expectedCompletes || 0) > 0;

    const pricingReady =
      !!estimate &&
      Number(estimate.cpiMin || 0) > 0 &&
      Number(estimate.cpiMax || 0) > 0;

    const screenerConfig =
      project.screener &&
        Array.isArray(project.screener.questions) &&
        project.screener.questions.length > 0
        ? project.screener
        : {
          enabled: true,
          blockDuplicateIp: true,
          strictIpTermination: true,
          questions: generateDefaultScreenerQuestions(project),
        };

    const checks = {
      feasibility: feasibilityReady,
      pricing: pricingReady,
      surveySetup: surveySetupReady,
      supplierAllocation: supplierAllocationReady,
      screenerReady:
        Boolean(screenerConfig.enabled) &&
        screenerConfig.questions.length > 0,
      projectDraft: project.status === "draft",
    };

    const canLaunch = Object.values(checks).every(Boolean);

    // Fetch respondent sessions & IP fraud metrics
    const sessions = await RespondentSession.find({
      project: project._id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const totalStarts = await RespondentSession.countDocuments({
      project: project._id,
    });

    const screenedOutCount = await RespondentSession.countDocuments({
      project: project._id,
      status: "screened_out",
    });

    const qualifiedCount = await RespondentSession.countDocuments({
      project: project._id,
      status: { $in: ["qualified", "completed"] },
    });

    const blockedDuplicateIpCount = await RespondentSession.countDocuments({
      project: project._id,
      status: "blocked_duplicate_ip",
    });

    const blockedIpsList = await RespondentSession.distinct("ip", {
      project: project._id,
      status: { $in: ["screened_out", "blocked_duplicate_ip"] },
    });

    return NextResponse.json({
      success: true,

      project: {
        _id: project._id,
        name: project.name || project.surveyTitle,
        surveyTitle: project.surveyTitle,
        country: project.country,
        audienceType: project.audienceType,
        audienceDescription:
          project.audienceDescription,
        sampleSize: project.sampleSize,
        loi: project.loi,
        ir: project.ir,
        status: project.status,
        progress: project.progress,
      },

      estimate: project.estimate,

      surveySetup: project.surveySetup,

      screener: screenerConfig,

      routing: allocations,

      summary: {
        requiredSample: project.sampleSize,
        allocatedSample: totalAllocated,
        remainingSample:
          project.sampleSize - totalAllocated,
        supplierCount: assignedSupplierCount,
      },

      liveSurveyUrl: `/survey/${project._id}`,

      respondentStats: {
        totalStarts,
        qualifiedCount,
        screenedOutCount,
        blockedDuplicateIpCount,
        blockedIpsCount: blockedIpsList.length,
        blockedIps: blockedIpsList,
        recentSessions: sessions,
      },

      checks,

      canLaunch,
    });
  } catch (error) {
    console.error("Review GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load project review",
      },
      { status: 500 }
    );
  }
}


/**
 * POST /api/projects/[id]/review
 *
 * Final launch endpoint.
 *
 * This endpoint performs all launch validations
 * server-side before changing the project to live.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project ID",
        },
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
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    /*
     * Launch only from draft.
     */
    if (project.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only draft projects can be launched.",
        },
        { status: 400 }
      );
    }

    /*
     * Survey Setup validation.
     */
    if (
      project.surveySetup?.status !== "ready"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Survey Setup is not completed.",
        },
        { status: 400 }
      );
    }

    /*
     * Feasibility validation.
     */
    const estimate = project.estimate as
      | Record<string, unknown>
      | undefined;

    if (
      !estimate ||
      Number(estimate.expectedCompletes || 0) <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Feasibility has not been completed.",
        },
        { status: 400 }
      );
    }

    /*
     * Pricing validation.
     */
    if (
      Number(estimate.cpiMin || 0) <= 0 ||
      Number(estimate.cpiMax || 0) <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pricing has not been completed.",
        },
        { status: 400 }
      );
    }

    /*
     * Automatic supplier allocation on launch if needed.
     */
    let allocations = await ProjectSupply.find({
      project: project._id,
      status: {
        $in: ["active", "completed"],
      },
    });

    if (!allocations.length) {
      try {
        const plan = await buildSupplierAllocationPlan(
          project.country || "US",
          (project.audienceType as any) || "consumer",
          project.sampleSize || 100
        );
        await assignSuppliersToProject(project as any, plan);
        allocations = await ProjectSupply.find({
          project: project._id,
        });
      } catch (allocErr) {
        console.warn("Auto supplier assignment warning on launch:", allocErr);
      }
    }

    /*
     * Verify allocated sample does not exceed
     * current supplier availability.
     */
    const supplyIds = allocations.map(
      (allocation) => allocation.supply
    );

    const supplies = await Supply.find({
      _id: { $in: supplyIds },
    }).lean();

    const supplyMap = new Map(
      supplies.map((supply) => [
        supply._id.toString(),
        supply,
      ])
    );

    for (const allocation of allocations) {
      const supply = supplyMap.get(
        allocation.supply.toString()
      );

      if (!supply) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One of the allocated suppliers no longer exists.",
          },
          { status: 400 }
        );
      }

      if (
        allocation.allocatedSample >
        supply.availableSample
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${supply.supplierName} does not have enough ` +
              `available sample.`,
          },
          { status: 400 }
        );
      }
    }

    /*
     * Everything passed.
     */
    if (!project.screener || !project.screener.questions?.length) {
      project.screener = {
        enabled: true,
        blockDuplicateIp: true,
        strictIpTermination: true,
        questions: generateDefaultScreenerQuestions(project),
      };
    }

    project.status = "live";
    project.launchedAt = new Date();

    await project.save();

    return NextResponse.json({
      success: true,
      message: "Project launched successfully.",
      project: {
        _id: project._id,
        status: project.status,
        launchedAt: project.launchedAt,
      },
    });
  } catch (error) {
    console.error("Project launch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to launch project",
      },
      { status: 500 }
    );
  }
}
