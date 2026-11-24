// src/app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/config/db";
import User from "@/models/User";
import Respondent from "@/models/Respondent";
import { getOrCreateInternalSupplier, INTERNAL_SUPPLIER_CODE } from "@/lib/internal-supplier";

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
    const rawRole = body.role?.trim().toLowerCase();
    const allowedRoles = ["client", "supplier", "respondent", "user", "admin"];
    const role = allowedRoles.includes(rawRole) ? rawRole : "client";

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

    // Prepare supplier and respondent details if registering as respondent
    let supplierCode: string | undefined = undefined;
    let supplierId: any = undefined;
    let respondentId: string | undefined = undefined;

    if (role === "respondent") {
      const internalSupplier = await getOrCreateInternalSupplier();
      supplierCode = INTERNAL_SUPPLIER_CODE;
      supplierId = internalSupplier.supplierId;
      respondentId = `RESP_${Date.now().toString(36).toUpperCase()}_${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      ...(supplierCode ? { supplierCode } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(respondentId ? { respondentId } : {}),

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

    // Create linked Respondent document under Internal Supplier
    if (role === "respondent" && respondentId && supplierId) {
      try {
        const nameParts = name.split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || "Respondent";
        const lastName = nameParts.slice(1).join(" ") || "Panelist";

        await Respondent.create({
          respondentId,
          userId: user._id,
          supplierId,
          supplierCode: INTERNAL_SUPPLIER_CODE,
          firstName,
          lastName,
          name,
          email,
          country: "US",
          status: "Active",
          qualityScore: 100,
          fraudRiskScore: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          totalSurveys: 0,
          completedSurveys: 0,
          screenouts: 0,
          quotaFull: 0,
          qualityRejects: 0,
          lastActiveAt: new Date(),
        });
      } catch (respErr: any) {
        console.warn("[Register] Could not pre-create Respondent document:", respErr?.message);
      }
    }

    const appUrl =
      process.env.APP_URL ||
      "https://gms-product.vercel.app/";

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
          role: user.role,
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