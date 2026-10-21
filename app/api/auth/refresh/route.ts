// src/app/api/auth/refresh/route.ts

import { NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import RefreshToken from "@/models/RefreshToken";
import User from "@/models/User";

import {
  createAccessToken,
  generateRandomToken,
  hashToken,
} from "@/lib/token";

export async function POST() {
  try {
    await connectDB();

    const refreshToken =
      (
        await import("next/headers")
      ).cookies();

    const token =
      (await refreshToken).get(
        "refreshToken"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Refresh token is missing",
        },
        { status: 401 }
      );
    }

    const tokenHash =
      hashToken(token);

    const storedToken =
      await RefreshToken.findOne({
        tokenHash,
        revoked: false,
        expiresAt: {
          $gt: new Date(),
        },
      });

    if (!storedToken) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or expired refresh token",
        },
        { status: 401 }
      );
    }

    const user =
      await User.findById(
        storedToken.userId
      );

    if (!user || user.isBlocked) {
      storedToken.revoked = true;
      await storedToken.save();

      return NextResponse.json(
        {
          success: false,
          message: "User is unavailable",
        },
        { status: 403 }
      );
    }

    // Revoke old refresh token
    storedToken.revoked = true;
    await storedToken.save();

    // Create new tokens
    const newAccessToken =
      createAccessToken(
        user._id.toString()
      );

    const newRefreshToken =
      generateRandomToken();

    await RefreshToken.create({
      userId: user._id,
      tokenHash:
        hashToken(newRefreshToken),
      expiresAt: new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000
      ),
      revoked: false,
    });

    const response =
      NextResponse.json({
        success: true,
        message:
          "Token refreshed successfully",
      });

    response.cookies.set(
      "accessToken",
      newAccessToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      }
    );

    response.cookies.set(
      "refreshToken",
      newRefreshToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/api/auth",
        maxAge:
          7 * 24 * 60 * 60,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "REFRESH_ERROR:",
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