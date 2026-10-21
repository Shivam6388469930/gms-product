// src/app/api/auth/reset-password/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/config/db";
import User from "@/models/User";
import RefreshToken from "@/models/RefreshToken";

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
    const password = body.password;

    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Token and password are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters",
        },
        { status: 400 }
      );
    }

    const tokenHash =
      hashToken(token);

    const user =
      await User.findOne({
        passwordResetToken:
          tokenHash,
        passwordResetExpires: {
          $gt: new Date(),
        },
      }).select(
        "+passwordResetToken +passwordResetExpires"
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or expired reset token",
        },
        { status: 400 }
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    user.password =
      hashedPassword;

    user.passwordResetToken =
      undefined;

    user.passwordResetExpires =
      undefined;

    await user.save();

    // Logout all existing sessions
    await RefreshToken.updateMany(
      {
        userId: user._id,
        revoked: false,
      },
      {
        revoked: true,
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Password reset successfully. Please login again.",
    });
  } catch (error) {
    console.error(
      "RESET_PASSWORD_ERROR:",
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