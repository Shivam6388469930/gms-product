import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/config/db";
import { getUserId } from "@/lib/auth";

import User from "@/models/User";
import Respondent from "@/models/Respondent";
import SupplierPanel from "@/models/SupplierPanel";
import PanelRespondent from "@/models/PanelRespondent";

/**
 * Same identity source as /api/supplier/panels:
 * JWT -> userId -> User document.
 */
async function getCurrentSupplier() {
  const userId = await getUserId();
  if (!userId) return null;

  const user: any = await User.findById(userId).lean();
  if (!user || user.role !== "supplier" || user.isBlocked) return null;

  return {
    supplierId: user._id,
    supplierCode: user.supplierCode || "",
  };
}

/** Respondent must belong to this supplier (by supplierId). */
function buildRespondentQuery(id: string, supplierId: any) {
  const isMongoId = mongoose.Types.ObjectId.isValid(id);

  return {
    supplierId,
    ...(isMongoId
      ? { $or: [{ _id: id }, { respondentId: id }] }
      : { respondentId: id }),
  };
}

/** Panel must belong to this supplier (by supplierId, or supplierCode as fallback). */
function buildPanelOwnerFilter(supplierCtx: {
  supplierId: any;
  supplierCode: string;
}) {
  const or: Record<string, any>[] = [{ supplierId: supplierCtx.supplierId }];

  if (supplierCtx.supplierCode) {
    or.push({ supplierCode: supplierCtx.supplierCode });
  }

  return { $or: or };
}

const unauthorized = (extra: Record<string, any> = {}) =>
  NextResponse.json(
    {
      success: false,
      error: "Supplier context not found or unauthorized",
      ...extra,
    },
    { status: 401 }
  );

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const supplierCtx = await getCurrentSupplier();
    if (!supplierCtx) return unauthorized({ panels: [] });

    const respondent: any = await Respondent.findOne(
      buildRespondentQuery(id, supplierCtx.supplierId)
    )
      .populate("panels")
      .lean();

    if (!respondent) {
      return NextResponse.json(
        { success: false, error: "Respondent not found", panels: [] },
        { status: 404 }
      );
    }

    // All panels this supplier owns, so the UI can offer them for assignment
    const availablePanels = await SupplierPanel.find(
      buildPanelOwnerFilter(supplierCtx)
    )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      panels: respondent.panels || [],
      availablePanels,
    });
  } catch (error: any) {
    console.error("GET /api/supplier/respondents/[id]/panels error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load panels",
        panels: [],
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST                                                                       */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const supplierCtx = await getCurrentSupplier();
    if (!supplierCtx) return unauthorized();

    const body = await request.json().catch(() => null);

    if (!body || !body.panelId) {
      return NextResponse.json(
        { success: false, error: "panelId is required" },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(String(body.panelId))) {
      return NextResponse.json(
        { success: false, error: "Invalid panel ID" },
        { status: 400 }
      );
    }

    const respondent: any = await Respondent.findOne(
      buildRespondentQuery(id, supplierCtx.supplierId)
    );

    if (!respondent) {
      return NextResponse.json(
        { success: false, error: "Respondent not found" },
        { status: 404 }
      );
    }

    const panel: any = await SupplierPanel.findOne({
      _id: body.panelId,
      ...buildPanelOwnerFilter(supplierCtx),
    });

    if (!panel) {
      return NextResponse.json(
        { success: false, error: "Panel not found under your supplier account" },
        { status: 404 }
      );
    }

    if (String(panel.status || "").toLowerCase() !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Respondent cannot be added to an inactive panel",
        },
        { status: 400 }
      );
    }

    // Already enrolled?
    const alreadyAssigned = (respondent.panels || []).some(
      (p: any) => p.toString() === panel._id.toString()
    );

    if (alreadyAssigned) {
      const current: any = await Respondent.findById(respondent._id)
        .populate("panels")
        .lean();

      return NextResponse.json({
        success: true,
        message: `Respondent is already enrolled in panel ${panel.name}`,
        panels: current?.panels || [],
      });
    }

    respondent.panels.push(panel._id);

    // Keep the primary panelId in sync if the respondent had none
    if (!respondent.panelId) {
      respondent.panelId = panel._id;
    }

    await respondent.save();

    await PanelRespondent.findOneAndUpdate(
      { panelId: panel._id, respondentId: respondent._id },
      {
        $set: {
          panelId: panel._id,
          respondentId: respondent._id,
          supplierId: supplierCtx.supplierId,
          supplierCode: supplierCtx.supplierCode || "",
          status: "Active",
        },
        $setOnInsert: {
          joinedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Use the counters your SupplierPanel schema actually has
    await SupplierPanel.updateOne(
      { _id: panel._id },
      {
        $inc: {
          respondentCount: 1,
          activeRespondentCount: respondent.status === "Active" ? 1 : 0,
        },
      }
    );

    const updated: any = await Respondent.findById(respondent._id)
      .populate("panels")
      .lean();

    return NextResponse.json({
      success: true,
      message: `Enrolled ${respondent.name} into ${panel.name}`,
      panels: updated?.panels || [],
    });
  } catch (error: any) {
    console.error("POST /api/supplier/respondents/[id]/panels error:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Respondent is already enrolled in this panel" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign panel" },
      { status: 500 }
    );
  }
}