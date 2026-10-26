// app/api/admin/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Role from "@/models/Role";

export async function GET() {
  try {
    await connectDB();
    const roles = await Role.find().sort({ name: 1 }).lean();
    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Admin roles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    const existing = await Role.findOne({ name: name.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Role already exists" },
        { status: 409 }
      );
    }

    const role = await Role.create({
      name: name.toLowerCase(),
      description: description || "",
      permissions: permissions || [],
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error("Admin create role error:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, name, description, permissions } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Role id is required" },
        { status: 400 }
      );
    }

    const role = await Role.findByIdAndUpdate(
      id,
      { name, description, permissions },
      { new: true, runValidators: true }
    ).lean();

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Admin update role error:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Role id is required" },
        { status: 400 }
      );
    }

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system roles" },
        { status: 403 }
      );
    }

    await Role.findByIdAndDelete(id);
    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Admin delete role error:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
