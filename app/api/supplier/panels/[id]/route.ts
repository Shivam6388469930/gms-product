import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import SupplierPanel from "@/models/SupplierPanel";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    let panel = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      panel = await SupplierPanel.findById(id).lean();
    }

    if (!panel) {
      return NextResponse.json(
        { success: false, error: "Panel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      panel: {
        id: (panel as any)._id.toString(),
        name: (panel as any).name,
        category: (panel as any).category,
        country: (panel as any).country,
        activeMembers: (panel as any).activeMembers,
        responseRate: (panel as any).responseRate,
        avgCompletionTime: (panel as any).avgCompletionTime,
        qualityIndex: (panel as any).qualityIndex,
        status: (panel as any).status,
        lastRefreshed: (panel as any).lastRefreshed,
      },
    });
  } catch (error: any) {
    console.error("GET /api/supplier/panels/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch panel" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid panel ID" },
        { status: 400 }
      );
    }

    const updated = await SupplierPanel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(body.name && { name: body.name.trim() }),
          ...(body.category && { category: body.category }),
          ...(body.country && { country: body.country }),
          ...(body.activeMembers !== undefined && {
            activeMembers: Number(body.activeMembers),
          }),
          ...(body.responseRate !== undefined && {
            responseRate: Number(body.responseRate),
          }),
          ...(body.avgCompletionTime !== undefined && {
            avgCompletionTime: Number(body.avgCompletionTime),
          }),
          ...(body.qualityIndex !== undefined && {
            qualityIndex: Number(body.qualityIndex),
          }),
          ...(body.status && { status: body.status }),
          lastRefreshed: new Date().toISOString().split("T")[0],
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Panel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      panel: {
        id: (updated as any)._id.toString(),
        name: (updated as any).name,
        category: (updated as any).category,
        country: (updated as any).country,
        activeMembers: (updated as any).activeMembers,
        responseRate: (updated as any).responseRate,
        avgCompletionTime: (updated as any).avgCompletionTime,
        qualityIndex: (updated as any).qualityIndex,
        status: (updated as any).status,
        lastRefreshed: (updated as any).lastRefreshed,
      },
    });
  } catch (error: any) {
    console.error("PUT /api/supplier/panels/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update panel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Mock ID or legacy format
      return NextResponse.json({
        success: true,
        message: `Panel ${id} deleted (mock)`,
      });
    }

    const deleted = await SupplierPanel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Panel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Panel successfully removed from inventory",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("DELETE /api/supplier/panels/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete panel" },
      { status: 500 }
    );
  }
}
