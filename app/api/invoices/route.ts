import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";

/**
 * GET /api/invoices
 * Lists all invoices for the authenticated user.
 */
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    await connectDB();

    const invoices = await Invoice.find({ owner: userId })
      .populate("project", "surveyTitle country audienceType sampleSize")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return fail("Something went wrong", 500);
  }
}

/**
 * POST /api/invoices
 * Generates an invoice for a project based on its current progress.
 */
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const { projectId } = body;

    if (!projectId) return fail("projectId is required", 400);

    await connectDB();

    const project = await Project.findOne({ _id: projectId, owner: userId }).lean();
    if (!project) return fail("Project not found", 404);

    const p = project as any;
    const completes = Number(p.progress?.completes || 0);
    const spend = Number(p.progress?.spend || 0);

    if (completes === 0) {
      return fail("No completes to invoice", 400);
    }

    // Generate invoice number
    const count = await Invoice.countDocuments({ owner: userId });
    const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;

    // Calculate CPI from estimate
    const estimatedCpi = p.estimate
      ? ((p.estimate.cpiMin || 0) + (p.estimate.cpiMax || 0)) / 2
      : 0;

    const sampleCost = Math.round(completes * estimatedCpi * 100) / 100;
    const taxPercent = 0; // Can be configured per region
    const tax = Math.round(sampleCost * (taxPercent / 100) * 100) / 100;
    const total = Math.round((sampleCost + tax) * 100) / 100;

    const invoice = await Invoice.create({
      project: p._id,
      owner: userId,
      invoiceNumber,
      items: [
        {
          description: `Sample delivery — ${p.surveyTitle}`,
          quantity: completes,
          unitPrice: estimatedCpi,
          total: sampleCost,
        },
      ],
      subtotal: sampleCost,
      tax,
      taxPercent,
      total,
      currency: "USD",
      status: "draft",
      dueAt: new Date(Date.now() + 30 * 86400000), // Net 30
      reconciliation: {
        buyerCompletes: completes,
        supplierCompletes: 0,
        discrepancy: completes,
        status: "pending",
      },
    });

    return NextResponse.json(
      { success: true, message: "Invoice created", invoice },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/invoices error:", error);
    return fail("Something went wrong", 500);
  }
}
