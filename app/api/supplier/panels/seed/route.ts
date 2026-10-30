import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import SupplierPanel from "@/models/SupplierPanel";
import { INITIAL_SUPPLIER_PANELS } from "@/lib/supplier-data";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierCode = searchParams.get("supplierCode") || "SUP_APEX";

    await connectDB();

    // Clear existing for this supplier
    await SupplierPanel.deleteMany({ supplierCode });

    const docs = INITIAL_SUPPLIER_PANELS.map((p) => ({
      supplierCode,
      name: p.name,
      category: p.category,
      country: p.country,
      activeMembers: p.activeMembers,
      responseRate: p.responseRate,
      avgCompletionTime: p.avgCompletionTime,
      qualityIndex: p.qualityIndex,
      status: p.status,
      lastRefreshed: new Date().toISOString().split("T")[0],
    }));

    const inserted = await SupplierPanel.insertMany(docs);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${inserted.length} supplier panels into MongoDB`,
      count: inserted.length,
      panels: inserted.map((doc) => ({
        id: doc._id.toString(),
        name: doc.name,
        category: doc.category,
        country: doc.country,
        activeMembers: doc.activeMembers,
        responseRate: doc.responseRate,
        avgCompletionTime: doc.avgCompletionTime,
        qualityIndex: doc.qualityIndex,
        status: doc.status,
        lastRefreshed: doc.lastRefreshed,
      })),
    });
  } catch (error: any) {
    console.error("POST /api/supplier/panels/seed error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed panels" },
      { status: 500 }
    );
  }
}
