import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import SupplierProject from "@/models/SupplierProject";
import { INITIAL_SUPPLIER_PROJECTS } from "@/lib/supplier-data";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierCode = searchParams.get("supplierCode") || "SUP_APEX";

    await connectDB();
    await SupplierProject.deleteMany({ supplierCode });

    const docs = INITIAL_SUPPLIER_PROJECTS.map((p) => ({
      supplierCode,
      projectId: p.projectId,
      title: p.title,
      clientName: p.clientName,
      audience: p.audience,
      country: p.country,
      sampleRequired: p.sampleRequired,
      sampleDelivered: p.sampleDelivered,
      cpi: p.cpi,
      totalValue: p.totalValue,
      loi: p.loi,
      ir: p.ir,
      status: p.status,
      receivedDate: p.receivedDate,
      deadlineDate: p.deadlineDate,
      surveyUrlTemplate: p.surveyUrlTemplate,
      qualityScoreRequired: p.qualityScoreRequired,
      description: p.description,
    }));

    const inserted = await SupplierProject.insertMany(docs);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${inserted.length} supplier projects into MongoDB`,
      count: inserted.length,
    });
  } catch (error: any) {
    console.error("POST /api/supplier/projects/seed error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed projects" },
      { status: 500 }
    );
  }
}
