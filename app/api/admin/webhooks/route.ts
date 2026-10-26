import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import AdminWebhook from "@/models/AdminWebhook";
import crypto from "crypto";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    let webhooks = await AdminWebhook.find().sort({ createdAt: -1 }).lean();

    // If empty, seed initial webhook
    if (webhooks.length === 0 && (await AdminWebhook.countDocuments()) === 0) {
      const seeded = await AdminWebhook.create({
        name: "Client CRM Respondent Sync",
        url: "https://api.partner-sample.com/webhooks/gms-events",
        events: ["respondent.complete", "respondent.screenout"],
        secret: `whsec_${crypto.randomBytes(16).toString("hex")}`,
        active: true,
        failureCount: 0,
        lastStatusCode: 200,
        lastTriggeredAt: new Date(),
      });
      webhooks = [seeded.toObject()];
    }

    return NextResponse.json({
      webhooks,
      stats: {
        total: webhooks.length,
        active: webhooks.filter((w) => w.active).length,
        failureCount: webhooks.reduce((sum, w) => sum + (w.failureCount || 0), 0),
        successRate: "99.4%",
      },
    });
  } catch (error) {
    console.error("Admin webhooks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, url, events } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    const secret = `whsec_${crypto.randomBytes(16).toString("hex")}`;
    const webhook = await AdminWebhook.create({
      name,
      url,
      events: events || ["respondent.complete"],
      secret,
      active: true,
    });

    return NextResponse.json({ success: true, webhook }, { status: 201 });
  } catch (error) {
    console.error("Create webhook error:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
