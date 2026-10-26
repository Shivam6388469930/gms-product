import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/Project";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {};

    if (body.status) updateData.status = body.status;
    if (body.surveyTitle) updateData.surveyTitle = body.surveyTitle;
    if (body.loi !== undefined) updateData.loi = body.loi;
    if (body.ir !== undefined) updateData.ir = body.ir;
    if (body.surveySetup) {
      for (const [k, v] of Object.entries(body.surveySetup)) {
        updateData[`surveySetup.${k}`] = v;
      }
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Update survey error:", error);
    return NextResponse.json(
      { error: "Failed to update survey" },
      { status: 500 }
    );
  }
}
