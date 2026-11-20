// app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/config/db";
import User from "@/models/User";
import RefreshToken from "@/models/RefreshToken";

import {
  createAccessToken,
  generateRandomToken,
  hashToken,
} from "@/lib/token";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));

    const email = body.email ? String(body.email).trim().toLowerCase() : "";
    const password = body.password ? String(body.password) : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been blocked",
        },
        { status: 403 }
      );
    }

    const userRole = String(user.role || "client").toLowerCase();
    const isAdminOrManager = userRole === "admin" || userRole === "manager";
    const skipEmailCheck = process.env.SKIP_EMAIL_VERIFICATION === "true";

    if (!user.emailVerified && !isAdminOrManager && !skipEmailCheck) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your email first",
        },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const accessToken = createAccessToken(
      user._id.toString(),
      user.role || "client"
    );

    const refreshToken = generateRandomToken();
    const refreshTokenHash = hashToken(refreshToken);

    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: tokenExpiry,
      revoked: false,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "client",
      },
    });

    const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAge,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAge,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
