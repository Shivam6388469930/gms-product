import { NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import { fail, unauthorized } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { parseSupplierInput } from "@/lib/supplier-validation";
import Supply from "@/models/Supply";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    await connectDB();
    const suppliers = await Supply.find({})
      .sort({ supplierName: 1, country: 1 })
      .lean();

    return NextResponse.json({ success: true, suppliers });
  } catch (error) {
    console.error("GET /api/suppliers error:", error);
    return fail("Failed to load suppliers", 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await request.json().catch(() => null);
    const parsed = parseSupplierInput(body);
    if (!parsed.ok) return fail(parsed.message, 400);

    await connectDB();
    const supplier = await Supply.create({
      ...parsed.value,
      lastUpdatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, supplier },
      { status: 201 }
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return fail(
        "A supplier with this code, country, and audience already exists",
        409
      );
    }
    console.error("POST /api/suppliers error:", error);
    return fail("Failed to create supplier", 500);
  }
}
