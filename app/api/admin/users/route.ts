// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (status === "blocked") query.isBlocked = true;
    if (status === "verified") query.emailVerified = true;
    if (status === "unverified") query.emailVerified = false;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -emailVerificationToken -passwordResetToken")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, email, password, role, supplierCode, respondentId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || "client",
      supplierCode,
      respondentId,
      emailVerified: true,
    });

    const userObj = user.toObject();
    delete (userObj as { password?: string }).password;

    await createAuditLog({
      actorId: admin._id?.toString(),
      actorName: admin.name,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "ADMIN_CREATE_USER",
      resource: "User",
      resourceId: user._id.toString(),
      description: `Admin created user '${user.name}' with role '${user.role}'`,
      after: userObj,
    }).catch(() => {});

    return NextResponse.json({ user: userObj }, { status: 201 });
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
