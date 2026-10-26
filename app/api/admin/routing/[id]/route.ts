import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import RoutingRule from "@/models/RoutingRule";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const rule = await RoutingRule.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!rule) {
      return NextResponse.json({ error: "Routing rule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error("Update routing rule error:", error);
    return NextResponse.json(
      { error: "Failed to update routing rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const rule = await RoutingRule.findByIdAndDelete(id);
    if (!rule) {
      return NextResponse.json({ error: "Routing rule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete routing rule error:", error);
    return NextResponse.json(
      { error: "Failed to delete routing rule" },
      { status: 500 }
    );
  }
}
