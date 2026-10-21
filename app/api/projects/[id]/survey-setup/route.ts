import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { connectDB } from "@/config/db";
import { getUserId } from "@/lib/auth";
import Project from "@/models/Project";

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

    const user = await getUserId();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Project ID
    // --------------------------------------------------

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project ID",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Database
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 4. Find project belonging to current user
    // --------------------------------------------------

    const project = await Project.findOne({
      _id: id,
      owner: user,
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

    // --------------------------------------------------
    // 5. Project must still be configurable
    // --------------------------------------------------

    // if (project.status !== "draft") {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message:
    //         "Survey setup can only be changed while the project is in draft status",
    //     },
    //     { status: 400 }
    //   );
    // }

    // --------------------------------------------------
    // 6. Parse request
    // --------------------------------------------------

    const body = await req.json();

    const {
      surveyUrl,
      surveyType,
      estimatedLoi,
      redirectUrl,
      terminationUrl,
      qualificationUrl,
    } = body;

    // --------------------------------------------------
    // 7. Validate survey URL
    // --------------------------------------------------

    if (
      typeof surveyUrl !== "string" ||
      !surveyUrl.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Survey URL is required",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 8. Validate survey type
    // --------------------------------------------------

    if (
      surveyType !== "external" &&
      surveyType !== "internal"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid survey type",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 9. Validate LOI
    // --------------------------------------------------

    const loi = Number(estimatedLoi);

    if (!Number.isFinite(loi) || loi <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Estimated LOI must be greater than 0",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 10. Keep Survey LOI consistent with Project LOI
    // --------------------------------------------------

    if (loi !== project.loi) {
      return NextResponse.json(
        {
          success: false,
          message: `Survey LOI must match project LOI of ${project.loi} minutes`,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 11. Save
    // --------------------------------------------------

    project.surveySetup = {
      surveyUrl: surveyUrl.trim(),

      surveyType,

      estimatedLoi: loi,

      redirectUrl:
        typeof redirectUrl === "string"
          ? redirectUrl.trim()
          : "",

      terminationUrl:
        typeof terminationUrl === "string"
          ? terminationUrl.trim()
          : "",

      qualificationUrl:
        typeof qualificationUrl === "string"
          ? qualificationUrl.trim()
          : "",

      status: "ready",
    };

    await project.save();

    // --------------------------------------------------
    // 12. Response
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Survey setup saved successfully",
      surveySetup: project.surveySetup,
    });
  } catch (error) {
    console.error(
      "Survey setup POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save survey setup",
      },
      { status: 500 }
    );
  }
}


export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const user = await getUserId();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
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
      owner: user,
    }).select("name country audienceType sampleSize loi ir surveySetup");

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project._id,
        name: project.name,
        country: project.country,
        audienceType: project.audienceType,
        sampleSize: project.sampleSize,
        loi: project.loi,
        ir: project.ir,
        surveySetup:
          project.surveySetup || {
            status: "not_configured",
          },
      },
    });
  } catch (error) {
    console.error(
      "Survey setup GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load survey setup",
      },
      { status: 500 }
    );
  }
}