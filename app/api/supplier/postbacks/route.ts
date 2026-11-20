import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";

const POSTBACK_FIELDS = [
  "complete",
  "disqualified",
  "quotaFull",
  "securityTerminate",
] as const;

type PostbackUrls = Record<(typeof POSTBACK_FIELDS)[number], string>;

const emptyPostbackUrls: PostbackUrls = {
  complete: "",
  disqualified: "",
  quotaFull: "",
  securityTerminate: "",
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "supplier") {
      return NextResponse.json(
        { success: false, message: "Supplier access required" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      postbackUrls: {
        ...emptyPostbackUrls,
        ...currentUser.supplierPostbackUrls,
      },
    });
  } catch (error) {
    console.error("GET /api/supplier/postbacks error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load postback URLs" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "supplier") {
      return NextResponse.json(
        { success: false, message: "Supplier access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const postbackUrls = {} as PostbackUrls;

    for (const field of POSTBACK_FIELDS) {
      const value = body?.[field];
      if (typeof value !== "string") {
        return NextResponse.json(
          { success: false, message: `A ${field} URL is required` },
          { status: 400 }
        );
      }

      const trimmed = value.trim();
      if (trimmed && !isHttpUrl(trimmed)) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} must be an absolute HTTP or HTTPS URL`,
          },
          { status: 400 }
        );
      }

      postbackUrls[field] = trimmed;
    }

    await connectDB();
    await User.findByIdAndUpdate(
      currentUser._id,
      { $set: { supplierPostbackUrls: postbackUrls } },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Postback URLs saved",
      postbackUrls,
    });
  } catch (error) {
    console.error("PATCH /api/supplier/postbacks error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save postback URLs" },
      { status: 500 }
    );
  }
}
