// src/app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/config/db";
import User from "@/models/User";

import {
  generateRandomToken,
  hashToken,
} from "@/lib/token";

import { isDisposableEmail } from "@/lib/disposable-email";

import {
  sendVerificationEmail,
} from "@/lib/email";

export async function POST(
  request: Request
) {
  try {
    await connectDB();

    const body = await request.json();

    const name = body.name?.trim();
    const email =
      body.email?.trim().toLowerCase();
    const password = body.password;

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email and password are required",
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

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address",
        },
        { status: 400 }
      );
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Temporary email addresses are not allowed",
        },
        { status: 400 }
      );
    }

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email is already registered",
        },
        { status: 409 }
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const verificationToken =
      generateRandomToken();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,

      emailVerified: false,

      emailVerificationToken:
        hashToken(verificationToken),

      emailVerificationExpires:
        new Date(
          Date.now() +
            30 * 60 * 1000
        ),

      isBlocked: false,
    });

    const appUrl =
      process.env.APP_URL ||
      "http://localhost:3000";

    const verificationUrl =
      `${appUrl}/auth/verify-email?token=${verificationToken}`;

    await sendVerificationEmail(
      email,
      name,
      verificationUrl
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful. Please verify your email.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "REGISTER_ERROR:",
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