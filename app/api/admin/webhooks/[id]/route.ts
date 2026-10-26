import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import AdminWebhook from "@/models/AdminWebhook";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const webhook = await AdminWebhook.findByIdAndDelete(id);
    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Webhook deleted" });
  } catch (error) {
    console.error("Delete webhook error:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
