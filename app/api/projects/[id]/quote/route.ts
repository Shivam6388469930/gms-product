import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import PriceQuote from "@/models/PriceQuote";

import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";

import {
  calculatePrice,
} from "@/lib/pricing";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  req: Request,
  { params }: Ctx
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return unauthorized();
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail(
        "Project not found",
        404
      );
    }

    const body = await req.json().catch(
      () => ({})
    );

    await connectDB();

    /*
     * IMPORTANT:
     *
     * Always load the project using the
     * authenticated user.
     *
     * Never trust projectId from the body.
     */

    const project = await Project.findOne({
      _id: id,
      owner: userId,
    }).lean();

    if (!project) {
      return fail(
        "Project not found",
        404
      );
    }

    if (!project.estimate) {
      return fail(
        "Project does not have a feasibility estimate",
        409
      );
    }


    const urgency =
      body?.urgency === "urgent" ||
        body?.urgency === "very_urgent"
        ? body.urgency
        : "normal";

    const qualityTier =
      body?.qualityTier === "premium" ||
        body?.qualityTier === "healthcare_b2b"
        ? body.qualityTier
        : "standard";

    const programmingFee =
      typeof body?.programmingFee === "number" &&
        body.programmingFee >= 0
        ? body.programmingFee
        : 0;

    const projectManagementFee =
      typeof body?.projectManagementFee === "number" &&
        body.projectManagementFee >= 0
        ? body.projectManagementFee
        : 0;

    const analyticsFee =
      typeof body?.analyticsFee === "number" &&
        body.analyticsFee >= 0
        ? body.analyticsFee
        : 0;

    const marginPercent =
      typeof body?.marginPercent === "number" &&
        body.marginPercent >= 0 &&
        body.marginPercent <= 100
        ? body.marginPercent
        : 0;

    const currency =
      ["USD", "EUR", "GBP", "INR"].includes(
        body?.currency
      )
        ? body.currency
        : "USD";

    const pricing = calculatePrice({
      project: {
        surveyTitle: project.surveyTitle || project.name || "Untitled",
        country: project.country,
        audienceType: project.audienceType,
        audienceDescription:
          project.audienceDescription ?? "",
        sampleSize: project.sampleSize,
        loi: project.loi,
        ir: project.ir,
        targeting: (project.targeting as any) ?? {},
        quotas: project.quotas ?? [],
      },

      estimate: project.estimate,

      urgency,
      qualityTier,

      programmingFee,
      projectManagementFee,
      analyticsFee,

      marginPercent,

      currency,
    });

    /*
     * Quote expiry.
     *
     * Example: valid for 7 days.
     */

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );

    const quote =
      await PriceQuote.create({
        project: project._id,
        owner: userId,

        ...pricing,

        urgency,
        qualityTier,

        expiresAt,
        status: "active",
      });

    return NextResponse.json(
      {
        success: true,

        quote: {
          id: quote._id,
          projectId: project._id,

          baseCpi:
            pricing.baseCpi,

          finalCpi:
            pricing.finalCpi,

          sampleCost:
            pricing.sampleCost,

          programmingFee:
            pricing.programmingFee,

          projectManagementFee:
            pricing.projectManagementFee,

          analyticsFee:
            pricing.analyticsFee,

          subtotal:
            pricing.subtotal,

          marginPercent:
            pricing.marginPercent,

          marginAmount:
            pricing.marginAmount,

          total:
            pricing.total,

          currency:
            pricing.currency,

          urgency,

          qualityTier,

          assumptions:
            pricing.assumptions,

          tiers:
            pricing.tiers,

          expiresAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create price quote error:",
      error
    );

    return fail(
      "Something went wrong",
      500
    );
  }
}