import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import ApiKey from "@/models/ApiKey";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const key = await ApiKey.findByIdAndUpdate(
      id,
      { $set: { status: "revoked" } },
      { new: true }
    );

    if (!key) {
      return NextResponse.json({ error: "API Key not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "API Key revoked" });
  } catch (error) {
    console.error("Revoke API key error:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
