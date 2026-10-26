import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import SystemSetting from "@/models/SystemSetting";


export async function GET() {
  try {
    await connectDB();

    const storedSettings = await SystemSetting.find().lean();
    const settingsMap: Record<string, any> = {};
    storedSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // Baseline settings
    const defaultSettings = {
      platformName: "GMS Research Platform",
      appUrl: process.env.APP_URL || "https://gms-product.vercel.app",
      smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
      smtpPort: process.env.SMTP_PORT || "587",
      smtpUser: process.env.SMTP_USER || "tronxx123456@gmail.com",
      smtpFrom: process.env.SMTP_FROM || "tronxx123456@gmail.com",
      accessTokenExpiry: "15m",
      refreshTokenExpiry: "7d",
      maxLoginAttempts: "5",
      requireEmailVerification: true,
      enableNotifications: true,
      emailOnNewUser: true,
      emailOnNewProject: false,
      darkMode: true,
      compactMode: false,
      speederLoiThreshold: 30,
      minFraudScoreBlock: 80,
      autoQuotaCapping: true,
      defaultCurrency: "USD",
      ...settingsMap,
    };

    return NextResponse.json({ settings: defaultSettings });
  } catch (error) {
    console.error("Admin settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const operations = Object.entries(body).map(([key, value]) =>
      SystemSetting.findOneAndUpdate(
        { key },
        { $set: { key, value, updatedBy: "Super Admin" } },
        { upsert: true, new: true }
      )
    );

    await Promise.all(operations);

    return NextResponse.json({ success: true, message: "Settings saved" });
  } catch (error) {
    console.error("Admin settings POST error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
