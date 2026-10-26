// app/api/admin/seed-roles/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Role from "@/models/Role";

const defaultRoles = [
  {
    name: "admin",
    description: "Full access to all platform resources",
    isSystem: true,
    permissions: [
      { resource: "users", actions: ["create", "read", "update", "delete"] },
      { resource: "suppliers", actions: ["create", "read", "update", "delete"] },
      { resource: "projects", actions: ["create", "read", "update", "delete"] },
      { resource: "invoices", actions: ["create", "read", "update", "delete"] },
      { resource: "audit_logs", actions: ["read"] },
      { resource: "roles", actions: ["create", "read", "update", "delete"] },
      { resource: "settings", actions: ["read", "update"] },
      { resource: "reports", actions: ["create", "read"] },
      { resource: "surveys", actions: ["create", "read", "update", "delete"] },
    ],
  },
  {
    name: "manager",
    description: "Can manage projects, suppliers, and view reports",
    isSystem: true,
    permissions: [
      { resource: "users", actions: ["read"] },
      { resource: "suppliers", actions: ["create", "read", "update"] },
      { resource: "projects", actions: ["create", "read", "update", "delete"] },
      { resource: "invoices", actions: ["read", "create"] },
      { resource: "audit_logs", actions: ["read"] },
      { resource: "reports", actions: ["create", "read"] },
      { resource: "surveys", actions: ["create", "read", "update"] },
    ],
  },
  {
    name: "user",
    description: "Standard user with project access",
    isSystem: true,
    permissions: [
      { resource: "projects", actions: ["create", "read", "update"] },
      { resource: "suppliers", actions: ["read"] },
      { resource: "surveys", actions: ["create", "read", "update"] },
      { resource: "reports", actions: ["read"] },
    ],
  },
  {
    name: "viewer",
    description: "Read-only access to projects and reports",
    isSystem: true,
    permissions: [
      { resource: "projects", actions: ["read"] },
      { resource: "suppliers", actions: ["read"] },
      { resource: "reports", actions: ["read"] },
      { resource: "surveys", actions: ["read"] },
    ],
  },
];

export async function POST() {
  try {
    await connectDB();

    let created = 0;
    let skipped = 0;

    for (const roleData of defaultRoles) {
      const exists = await Role.findOne({ name: roleData.name });
      if (exists) {
        skipped++;
        continue;
      }
      await Role.create(roleData);
      created++;
    }

    return NextResponse.json({
      message: `Roles seeded: ${created} created, ${skipped} skipped (already exist)`,
      created,
      skipped,
    });
  } catch (error) {
    console.error("Seed roles error:", error);
    return NextResponse.json(
      { error: "Failed to seed roles" },
      { status: 500 }
    );
  }
}
