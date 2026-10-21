import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import { getUserId } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/projects/[id]/screener
 * Updates screener configuration, questions, and IP fraud rules
 */
export async function PUT(req: NextRequest, { params }: RouteContext) {
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

    const body = await req.json();
    const { enabled, blockDuplicateIp, strictIpTermination, questions } = body;

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

    if (!project.screener) {
      project.screener = {
        enabled: true,
        blockDuplicateIp: true,
        strictIpTermination: true,
        questions: [],
      };
    }

    if (typeof enabled === "boolean") project.screener.enabled = enabled;
    if (typeof blockDuplicateIp === "boolean")
      project.screener.blockDuplicateIp = blockDuplicateIp;
    if (typeof strictIpTermination === "boolean")
      project.screener.strictIpTermination = strictIpTermination;

    if (Array.isArray(questions)) {
      project.screener.questions = questions;
    }

    await project.save();

    return NextResponse.json({
      success: true,
      message: "Screener configuration updated successfully.",
      screener: project.screener,
    });
  } catch (error) {
    console.error("Screener update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update screener" },
      { status: 500 }
    );
  }
}
