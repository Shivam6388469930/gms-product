import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import ApiKey from "@/models/ApiKey";
import crypto from "crypto";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    let keys = await ApiKey.find().sort({ createdAt: -1 }).lean();

    // If empty, seed baseline key
    if (keys.length === 0 && (await ApiKey.countDocuments()) === 0) {
      const seeded = await ApiKey.create({
        name: "Cint Exchange Integration Key",
        keyPrefix: "gms_live_cint91a",
        keyHash: crypto.createHash("sha256").update("sample_secret_key_1").digest("hex"),
        scopes: ["read:projects", "write:surveys", "read:respondents"],
        rateLimit: 300,
        status: "active",
        lastUsedAt: new Date(),
      });
      keys = [seeded.toObject()];
    }

    return NextResponse.json({
      keys,
      stats: {
        activeKeys: keys.filter((k) => k.status === "active").length,
        revokedKeys: keys.filter((k) => k.status === "revoked").length,
        total: keys.length,
      },
    });
  } catch (error) {
    console.error("Admin API keys error:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, scopes, rateLimit } = body;

    if (!name) {
      return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }

    const rawToken = `gms_live_${crypto.randomBytes(24).toString("hex")}`;
    const keyPrefix = rawToken.slice(0, 16);
    const keyHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const key = await ApiKey.create({
      name,
      keyPrefix,
      keyHash,
      scopes: scopes || ["read:projects"],
      rateLimit: rateLimit || 60,
      status: "active",
    });

    return NextResponse.json(
      {
        success: true,
        key,
        plainTextSecret: rawToken, // Returned ONLY once upon creation!
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
