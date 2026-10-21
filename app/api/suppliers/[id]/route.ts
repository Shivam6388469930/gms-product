import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import { fail, unauthorized } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { parseSupplierInput } from "@/lib/supplier-validation";
import ProjectSupply from "@/models/ProjectSupply";
import Supply from "@/models/Supply";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Supplier not found", 404);

    const body = await request.json().catch(() => null);
    const parsed = parseSupplierInput(body, true);
    if (!parsed.ok) return fail(parsed.message, 400);

    await connectDB();
    const update = { ...parsed.value };
    if (parsed.value.availableSample !== undefined) {
      Object.assign(update, { lastUpdatedAt: new Date() });
    }
    const supplier = await Supply.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!supplier) return fail("Supplier not found", 404);
    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return fail(
        "A supplier with this code, country, and audience already exists",
        409
      );
    }
    console.error("PATCH /api/suppliers/[id] error:", error);
    return fail("Failed to update supplier", 500);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Supplier not found", 404);

    await connectDB();
    const supplier = await Supply.findById(id).select("_id").lean();
    if (!supplier) return fail("Supplier not found", 404);

    const hasAllocations = await ProjectSupply.exists({ supply: id });
    if (hasAllocations) {
      return fail(
        "This supplier is used by a project and cannot be deleted",
        409
      );
    }

    await Supply.findByIdAndDelete(id);
    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/suppliers/[id] error:", error);
    return fail("Failed to delete supplier", 500);
  }
}
