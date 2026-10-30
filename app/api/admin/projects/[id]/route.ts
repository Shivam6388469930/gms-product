import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/Project";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const before = await Project.findById(id).lean();
    if (!before) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    await createAuditLog({
      actorId: admin._id?.toString(),
      actorName: admin.name,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "ADMIN_UPDATE_PROJECT",
      resource: "Project",
      resourceId: id,
      description: `Admin updated project '${(project as any)?.surveyTitle || id}'`,
      before,
      after: project,
    }).catch(() => {});

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await createAuditLog({
      actorId: admin._id?.toString(),
      actorName: admin.name,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "ADMIN_DELETE_PROJECT",
      resource: "Project",
      resourceId: id,
      description: `Admin deleted project '${(project as any).surveyTitle || id}'`,
      before: project,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
