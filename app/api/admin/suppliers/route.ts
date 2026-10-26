// app/api/admin/suppliers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Supply from "@/models/Supply";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const audienceType = searchParams.get("audienceType") || "";
    const active = searchParams.get("active");

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { supplierName: { $regex: search, $options: "i" } },
        { supplierCode: { $regex: search, $options: "i" } },
      ];
    }
    if (country) query.country = country;
    if (audienceType) query.audienceType = audienceType;
    if (active !== null && active !== "") query.active = active === "true";

    const [suppliers, total] = await Promise.all([
      Supply.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Supply.countDocuments(query),
    ]);

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin suppliers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const supplier = await Supply.create(body);
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error("Admin create supplier error:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
