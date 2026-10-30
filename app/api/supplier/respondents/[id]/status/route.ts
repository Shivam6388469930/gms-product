import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getAuthenticatedSupplier } from "@/lib/supplier-auth";
import Respondent from "@/models/Respondent";
import mongoose from "mongoose";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const supplierCtx = await getAuthenticatedSupplier();
    if (!supplierCtx) {
      return NextResponse.json(
        { success: false, error: "Supplier context not found or unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.status) {
      return NextResponse.json(
        { success: false, error: "Status field is required (Active, Inactive, Blocked, Suspended)" },
        { status: 400 }
      );
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const query: Record<string, any> = {
      supplierCode: supplierCtx.supplierCode,
      ...(isMongoId ? { $or: [{ _id: id }, { respondentId: id }] } : { respondentId: id }),
    };

    const respondent = await Respondent.findOne(query);
    if (!respondent) {
      return NextResponse.json(
        { success: false, error: "Respondent not found" },
        { status: 404 }
      );
    }

    respondent.status = body.status;
    await respondent.save();

    return NextResponse.json({
      success: true,
      message: `Respondent status updated to ${body.status}`,
      status: respondent.status,
      respondent,
    });
  } catch (error: any) {
    console.error("PATCH /api/supplier/respondents/[id]/status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
