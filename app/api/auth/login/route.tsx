// src/app/api/auth/login/route.ts

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

export async function POST(
  request: Request
) {
  try {
    await connectDB();

    const body = await request.json();

    const email =
      body.email?.trim().toLowerCase();

    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email and password are required",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      email,
    }).select(
      "+password"
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password",
        },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account has been blocked",
        },
        { status: 403 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please verify your email first",
        },
        { status: 403 }
      );
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const accessToken =
      createAccessToken(
        user._id.toString()
      );

    const refreshToken =
      generateRandomToken();

    const refreshTokenHash =
      hashToken(refreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000
      ),
      revoked: false,
    });

    const response =
      NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });

    response.cookies.set(
      "accessToken",
      accessToken,
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
      refreshToken,
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
      "LOGIN_ERROR:",
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