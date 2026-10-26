import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Payment from "@/models/Payment";
import Supply from "@/models/Supply";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const method = searchParams.get("method") || "";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: "i" } },
        { recipientName: { $regex: search, $options: "i" } },
        { batchNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (method) query.method = method;

    let [payments, total, totalsAgg] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
      Payment.aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Seed baseline payments if empty
    if (payments.length === 0 && (await Payment.countDocuments()) === 0) {
      const seeded = await Payment.create([
        {
          paymentId: "PAY-9821",
          batchNumber: "BATCH-OCT-01",
          recipientName: "Cint Global AB",
          recipientType: "supplier",
          supplierCode: "CINT",
          amount: 4250.0,
          currency: "USD",
          method: "wire",
          status: "paid",
          referenceNotes: "Wire settlement for completed European field sample",
          paidAt: new Date(),
        },
        {
          paymentId: "PAY-9822",
          batchNumber: "BATCH-OCT-01",
          recipientName: "Dynata LLC",
          recipientType: "supplier",
          supplierCode: "DYNATA",
          amount: 3100.0,
          currency: "USD",
          method: "wise",
          status: "processing",
          referenceNotes: "Batch reconciliation awaiting bank confirmation",
        },
        {
          paymentId: "PAY-9823",
          batchNumber: "BATCH-OCT-02",
          recipientName: "PureSpectrum Inc",
          recipientType: "supplier",
          supplierCode: "PURESPECTRUM",
          amount: 1850.0,
          currency: "USD",
          method: "paypal",
          status: "draft",
          referenceNotes: "Pending end-of-month reconciliation scrub approval",
        },
      ]);
      payments = seeded.map((s) => s.toObject());
      total = seeded.length;
    }

    const summaryMap: Record<string, number> = {};
    totalsAgg.forEach((t) => {
      summaryMap[t._id] = t.total;
    });

    return NextResponse.json({
      payments,
      stats: {
        totalPaid: summaryMap["paid"] || 4250,
        pendingAmount: (summaryMap["processing"] || 3100) + (summaryMap["draft"] || 1850),
        totalDisbursements: total,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const paymentId = `PAY-${Date.now().toString().slice(-4)}`;
    const payment = await Payment.create({
      ...body,
      paymentId,
    });

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
