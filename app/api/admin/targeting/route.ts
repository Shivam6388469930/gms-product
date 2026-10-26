import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/Project";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const query: Record<string, unknown> = {};
    if (projectId) query._id = projectId;

    const projects = await Project.find(query)
      .select("surveyTitle country audienceType targeting screener status")
      .lean();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Admin targeting error:", error);
    return NextResponse.json(
      { error: "Failed to fetch targeting" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { projectId, targeting, screener } = body;

    const updateData: Record<string, any> = {};
    if (targeting) updateData.targeting = targeting;
    if (screener) updateData.screener = screener;

    const project = await Project.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Update targeting error:", error);
    return NextResponse.json(
      { error: "Failed to update targeting" },
      { status: 500 }
    );
  }
}
