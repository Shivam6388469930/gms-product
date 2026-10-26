import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import FraudRule from "@/models/FraudRule";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const rule = await FraudRule.findByIdAndDelete(id);
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Rule deleted" });
  } catch (error) {
    console.error("Delete fraud rule error:", error);
    return NextResponse.json(
      { error: "Failed to delete fraud rule" },
      { status: 500 }
    );
  }
}
