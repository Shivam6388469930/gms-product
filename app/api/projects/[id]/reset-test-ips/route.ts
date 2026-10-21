import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";
import { getUserId } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/projects/[id]/reset-test-ips
 * Allows project owner to reset IP logs or unblock test IPs
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
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

    const body = await req.json().catch(() => ({}));
    const { targetIp } = body;

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

    let deletedCount = 0;
    if (targetIp) {
      const result = await RespondentSession.deleteMany({
        project: project._id,
        ip: targetIp.trim(),
      });
      deletedCount = result.deletedCount || 0;
    } else {
      const result = await RespondentSession.deleteMany({
        project: project._id,
      });
      deletedCount = result.deletedCount || 0;
    }

    return NextResponse.json({
      success: true,
      message: targetIp
        ? `Unblocked IP ${targetIp} (${deletedCount} sessions cleared).`
        : `Reset all ${deletedCount} respondent sessions for this project.`,
      deletedCount,
    });
  } catch (error) {
    console.error("Reset test IP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset test IPs" },
      { status: 500 }
    );
  }
}
