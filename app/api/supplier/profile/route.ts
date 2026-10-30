import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Supply from "@/models/Supply";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const requestedCode = searchParams.get("supplierCode");

    const allSupplies = await Supply.find({ active: true }).sort({ createdAt: -1 }).lean();

    if (allSupplies.length === 0) {
      // Create an initial active supply node if none exist
      const initialSupply = await Supply.create({
        supplierName: "GMS Global Sample Network",
        supplierCode: "1001",
        country: "US",
        audienceType: "consumer",
        availableSample: 5000,
        baseCpi: 2.5,
        historicalIr: 45,
        averageLoi: 12,
        qualityScore: 92,
        active: true,
      });

      return NextResponse.json({
        success: true,
        supplier: {
          supplierName: initialSupply.supplierName,
          supplierCode: initialSupply.supplierCode,
          country: initialSupply.country,
          audienceType: initialSupply.audienceType,
          availableSample: initialSupply.availableSample,
          baseCpi: initialSupply.baseCpi,
          qualityScore: initialSupply.qualityScore,
        },
        availableSuppliers: [
          {
            supplierName: initialSupply.supplierName,
            supplierCode: initialSupply.supplierCode,
            country: initialSupply.country,
          },
        ],
      });
    }

    let activeSupply = allSupplies[0];
    if (requestedCode) {
      const match = allSupplies.find((s: any) => s.supplierCode === requestedCode);
      if (match) activeSupply = match;
    }

    const availableSuppliers = allSupplies.map((s: any) => ({
      supplierName: s.supplierName,
      supplierCode: s.supplierCode,
      country: s.country,
      audienceType: s.audienceType,
    }));

    return NextResponse.json({
      success: true,
      supplier: {
        supplierName: (activeSupply as any).supplierName,
        supplierCode: (activeSupply as any).supplierCode,
        country: (activeSupply as any).country,
        audienceType: (activeSupply as any).audienceType,
        availableSample: (activeSupply as any).availableSample,
        baseCpi: (activeSupply as any).baseCpi,
        qualityScore: (activeSupply as any).qualityScore,
      },
      availableSuppliers,
    });
  } catch (error: any) {
    console.error("GET /api/supplier/profile error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load supplier profile" },
      { status: 500 }
    );
  }
}
