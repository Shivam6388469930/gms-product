// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";

export async function GET(
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
    const user = await User.findById(id)
      .select("-password -emailVerificationToken -passwordResetToken")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

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

    const allowedFields = ["name", "email", "role", "isBlocked", "emailVerified", "supplierCode", "respondentId"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const before = await User.findById(id).lean();
    if (!before) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .select("-password -emailVerificationToken -passwordResetToken")
      .lean();

    // Audit log admin action
    await createAuditLog({
      actorId: admin._id?.toString(),
      actorName: admin.name,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "ADMIN_UPDATE_USER",
      resource: "User",
      resourceId: id,
      description: `Admin updated user '${user?.name || id}' (${Object.keys(updates).join(", ")})`,
      before,
      after: user,
    }).catch(() => {});

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Audit log admin action
    await createAuditLog({
      actorId: admin._id?.toString(),
      actorName: admin.name,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "ADMIN_DELETE_USER",
      resource: "User",
      resourceId: id,
      description: `Admin deleted user '${user.name}' (${user.email})`,
      before: user,
    }).catch(() => {});

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
