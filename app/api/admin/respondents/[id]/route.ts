import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import RespondentSession from "@/models/RespondentSession";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const session = await RespondentSession.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!session) {
      return NextResponse.json(
        { error: "Respondent session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Update respondent session error:", error);
    return NextResponse.json(
      { error: "Failed to update respondent session" },
      { status: 500 }
    );
  }
}
