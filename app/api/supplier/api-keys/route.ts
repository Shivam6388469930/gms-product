import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import ApiKey from "@/models/ApiKey";
import crypto from "crypto";

export async function GET() {
  try {
    await connectDB();

    const keys = await ApiKey.find({}).sort({ createdAt: -1 }).lean();

    const mapped = keys.map((k: any) => ({
      id: k._id.toString(),
      name: k.name,
      keyPrefix: `${k.keyPrefix}...`,
      createdAt: new Date(k.createdAt).toISOString().split("T")[0],
      lastUsed: k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never",
      status: k.status,
    }));

    return NextResponse.json({
      success: true,
      dataSource: "database",
      apiKeys: mapped,
    });
  } catch (error: any) {
    console.error("GET /api/supplier/api-keys error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load API keys",
        apiKeys: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name?.trim() || "Supplier Routing API Key";

    const rawSecret = `gms_live_${crypto.randomBytes(16).toString("hex")}`;
    const keyPrefix = rawSecret.substring(0, 14);
    const keyHash = crypto.createHash("sha256").update(rawSecret).digest("hex");

    await connectDB();

    const created = await ApiKey.create({
      name,
      keyPrefix,
      keyHash,
      scopes: ["read:projects", "write:postbacks", "read:panels"],
      status: "active",
    });

    return NextResponse.json(
      {
        success: true,
        dataSource: "database",
        apiKey: {
          id: created._id.toString(),
          name: created.name,
          keyPrefix: `${keyPrefix}...`,
          fullKey: rawSecret,
          createdAt: new Date(created.createdAt).toISOString().split("T")[0],
          lastUsed: "Never",
          status: "active",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/supplier/api-keys error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: "keyId is required" },
        { status: 400 }
      );
    }

    await connectDB();
    await ApiKey.findByIdAndUpdate(keyId, { status: "revoked" });

    return NextResponse.json({
      success: true,
      message: "API Key revoked successfully",
      revokedKeyId: keyId,
    });
  } catch (error: any) {
    console.error("DELETE /api/supplier/api-keys error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
