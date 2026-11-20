import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/Project";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";
import SupplierAllocation from "@/models/SupplierAllocation";
import Supply from "@/models/Supply";
import User from "@/models/User";

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

    if (body.action === "removeSupplier") {
      const supplierId = String(body.supplierId || "");
      if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        return NextResponse.json(
          { success: false, error: "A valid supplierId is required" },
          { status: 400 }
        );
      }

      const supplier = await User.findOne({
        _id: supplierId,
        role: "supplier",
      }).lean();
      if (!supplier) {
        return NextResponse.json(
          { success: false, error: "Supplier not found" },
          { status: 404 }
        );
      }

      const supply = await Supply.findOne({
        $or: [
          ...(supplier.supplierCode
            ? [{ supplierCode: supplier.supplierCode }]
            : []),
          ...(supplier.supplierId
            ? [{ _id: supplier.supplierId }]
            : []),
          { supplierEmail: supplier.email },
        ],
      }).lean();
      const supplierCode = supplier.supplierCode || supply?.supplierCode;
      if (!supplierCode) {
        return NextResponse.json(
          { success: false, error: "Supplier has no linked supply profile" },
          { status: 400 }
        );
      }

      await SupplierAllocation.findOneAndUpdate(
        { project: id, supplierId },
        {
          $set: { status: "removed" },
          $setOnInsert: {
            project: id,
            supplierId,
            supplierCode,
            ...(supply ? { supply: supply._id } : {}),
            allocatedSample: 0,
            allocatedCpi: 0,
            routingPercent: 0,
            priority: 1,
            allocatedAt: new Date(),
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      await createAuditLog({
        actorId: admin._id?.toString(),
        actorName: admin.name,
        actorEmail: admin.email,
        actorRole: admin.role,
        action: "ADMIN_REMOVE_SUPPLIER_FROM_PROJECT",
        resource: "Project",
        resourceId: id,
        description: `Admin removed supplier '${supplier.name}' from project '${before.surveyTitle || id}'`,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "Supplier removed from project",
      });
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
