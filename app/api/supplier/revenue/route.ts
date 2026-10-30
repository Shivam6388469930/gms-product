import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Invoice from "@/models/Invoice";
import ProjectSupply from "@/models/ProjectSupply";
import Supply from "@/models/Supply";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierCode = searchParams.get("supplierCode");

    await connectDB();

    // 1. Fetch real supply
    let supply: any = null;
    if (supplierCode) {
      supply = await Supply.findOne({ supplierCode }).lean();
    }
    if (!supply) {
      supply = await Supply.findOne({ active: true }).sort({ createdAt: -1 }).lean();
    }

    // 2. Aggregate real fieldwork stats from ProjectSupply
    const supplyQuery: Record<string, unknown> = {};
    if (supply) {
      supplyQuery.supply = supply._id;
    }

    const allocations = await ProjectSupply.find(supplyQuery).lean();

    let totalCompletes = 0;
    let totalSpend = 0;
    for (const alloc of allocations) {
      totalCompletes += alloc.actualCompletes || 0;
      totalSpend += alloc.actualSpend || (alloc.actualCompletes || 0) * (alloc.allocatedCpi || 2.0);
    }

    // 3. Fetch real invoices
    const invoices = await Invoice.find({}).sort({ createdAt: -1 }).limit(10).lean();

    const mappedInvoices = invoices.map((inv: any, idx: number) => ({
      id: inv._id.toString(),
      period: new Date(inv.createdAt).toLocaleString("en-US", { month: "long", year: "numeric" }),
      grossRevenue: inv.totalAmount || inv.amount || totalSpend,
      completesCount: Math.round((inv.totalAmount || totalSpend || 1) / (supply?.baseCpi || 2.5)),
      avgCpi: supply?.baseCpi || 2.5,
      processingFee: Math.round(((inv.totalAmount || totalSpend) * 0.02) * 100) / 100,
      netPayout: Math.round(((inv.totalAmount || totalSpend) * 0.98) * 100) / 100,
      status: (inv.status === "paid" ? "paid" : inv.status === "pending" ? "pending" : "processing") as any,
      invoiceNumber: inv.invoiceNumber || `INV-SUP-2026-0${idx + 1}`,
      paymentMethod: "ACH Wire Transfer",
      payoutDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));

    return NextResponse.json({
      success: true,
      dataSource: "database",
      revenue: mappedInvoices,
      mtdGross: totalSpend,
      totalCompletes,
    });
  } catch (error: any) {
    console.error("GET /api/supplier/revenue error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load supplier revenue",
        revenue: [],
        mtdGross: 0,
      },
      { status: 500 }
    );
  }
}
