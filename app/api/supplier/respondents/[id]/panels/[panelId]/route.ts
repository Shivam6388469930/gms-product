import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getAuthenticatedSupplier } from "@/lib/supplier-auth";
import Respondent from "@/models/Respondent";
import SupplierPanel from "@/models/SupplierPanel";
import PanelRespondent from "@/models/PanelRespondent";
import mongoose from "mongoose";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; panelId: string }> }
) {
  try {
    const { id, panelId } = await context.params;
    await connectDB();

    const supplierCtx = await getAuthenticatedSupplier();
    if (!supplierCtx) {
      return NextResponse.json(
        { success: false, error: "Supplier context not found or unauthorized" },
        { status: 401 }
      );
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const query: Record<string, any> = {
      supplierCode: supplierCtx.supplierCode,
      ...(isMongoId ? { $or: [{ _id: id }, { respondentId: id }] } : { respondentId: id }),
    };

    const respondent = await Respondent.findOne(query);
    if (!respondent) {
      return NextResponse.json({ success: false, error: "Respondent not found" }, { status: 404 });
    }

    // Remove from array
    respondent.panels = respondent.panels.filter(
      (p: any) => p.toString() !== panelId
    );
    await respondent.save();

    await PanelRespondent.deleteOne({
      panelId,
      respondentId: respondent._id,
    });

    await SupplierPanel.findByIdAndUpdate(panelId, {
      $inc: { activeMembers: -1 },
    });

    return NextResponse.json({
      success: true,
      message: "Removed respondent from panel",
      panels: respondent.panels,
    });
  } catch (error: any) {
    console.error("DELETE /api/supplier/respondents/[id]/panels/[panelId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove panel" },
      { status: 500 }
    );
  }
}
