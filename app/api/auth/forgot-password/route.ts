// src/app/api/auth/forgot-password/route.ts

import { NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import User from "@/models/User";

import {
  generateRandomToken,
  hashToken,
} from "@/lib/token";

import {
  sendPasswordResetEmail,
} from "@/lib/email";

export async function POST(
  request: Request
) {
  try {
    await connectDB();

    const body = await request.json();

    const email =
      body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    const user =
      await User.findOne({
        email,
      });

    // Do not reveal whether the email exists.
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If the email exists, a reset link has been sent.",
      });
    }

    const resetToken =
      generateRandomToken();

    user.passwordResetToken =
      hashToken(resetToken);

    user.passwordResetExpires =
      new Date(
        Date.now() +
          30 * 60 * 1000
      );

    await user.save();

    const appUrl =
      process.env.APP_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${appUrl}/auth/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(
      user.email,
      user.name,
      resetUrl
    );

    return NextResponse.json({
      success: true,
      message:
        "If the email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error(
      "FORGOT_PASSWORD_ERROR:",
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