// src/app/api/auth/verify-email/route.ts

import { NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import User from "@/models/User";

import {
  hashToken,
} from "@/lib/token";

export async function POST(
  request: Request
) {
  try {
    await connectDB();

    const body = await request.json();

    const token = body.token;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification token is required",
        },
        { status: 400 }
      );
    }

    const tokenHash =
      hashToken(token);

    const user =
      await User.findOne({
        emailVerificationToken:
          tokenHash,
        emailVerificationExpires: {
          $gt: new Date(),
        },
      }).select(
        "+emailVerificationToken +emailVerificationExpires"
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or expired verification token",
        },
        { status: 400 }
      );
    }

    user.emailVerified = true;

    user.emailVerificationToken =
      undefined;

    user.emailVerificationExpires =
      undefined;

    await user.save();

    return NextResponse.json({
      success: true,
      message:
        "Email verified successfully",
    });
  } catch (error) {
    console.error(
      "VERIFY_EMAIL_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}