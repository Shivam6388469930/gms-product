// src/app/api/auth/logout/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/config/db";
import RefreshToken from "@/models/RefreshToken";

import {
  hashToken,
} from "@/lib/token";

export async function POST() {
  try {
    await connectDB();

    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "refreshToken"
      )?.value;

    if (token) {
      await RefreshToken.findOneAndUpdate(
        {
          tokenHash:
            hashToken(token),
        },
        {
          revoked: true,
        }
      );
    }

    const response =
      NextResponse.json({
        success: true,
        message: "Logout successful",
      });

    response.cookies.set("accessToken", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    response.cookies.set("refreshToken", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error(
      "LOGOUT_ERROR:",
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