import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Payment from "@/models/Payment";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = { ...body };
    if (body.status === "paid") {
      updateData.paidAt = new Date();
    }

    const payment = await Payment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
