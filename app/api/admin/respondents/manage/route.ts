import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import Respondent from "@/models/Respondent";
import User from "@/models/User";
import Supply from "@/models/Supply";
import SupplierPanel from "@/models/SupplierPanel";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 20))
    );
    const search = String(searchParams.get("search") || "").trim();
    const status = String(searchParams.get("status") || "").trim();
    const supplierId = String(searchParams.get("supplierId") || "").trim();
    const panelId = String(searchParams.get("panelId") || "").trim();

    const query: Record<string, any> = {};

    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };
      query.$or = [
        { respondentId: regex },
        { externalId: regex },
        { firstName: regex },
        { lastName: regex },
        { name: regex },
        { email: regex },
        { phone: regex },
        { supplierCode: regex },
      ];
    }

    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (panelId) {
      query.$or = [
        ...(query.$or || []),
        { panelId },
        { panels: panelId },
      ];
    }

    const [items, total, stats] = await Promise.all([
      Respondent.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Respondent.countDocuments(query),

      Respondent.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const supplierIds = [
      ...new Set(
        items
          .map((item: any) => String(item.supplierId || ""))
          .filter(Boolean)
      ),
    ];

    const panelIds = [
      ...new Set(
        items
          .flatMap((item: any) => [
            item.panelId ? String(item.panelId) : "",
            ...(item.panels || []).map((id: any) => String(id)),
          ])
          .filter(Boolean)
      ),
    ];

    const [suppliers, panels] = await Promise.all([
      supplierIds.length
        ? Supply.find({ _id: { $in: supplierIds } })
            .select(
              "_id supplierName supplierCode supplierEmail country audienceType availableSample baseCpi historicalIr averageLoi qualityScore active"
            )
            .lean()
        : [],
      panelIds.length
        ? SupplierPanel.find({ _id: { $in: panelIds } })
            .select("_id name category country status")
            .lean()
        : [],
    ]);

    const supplierMap = new Map(
      suppliers.map((supplier: any) => [String(supplier._id), supplier])
    );

    const panelMap = new Map(
      panels.map((panel: any) => [String(panel._id), panel])
    );

    const respondents = items.map((item: any) => ({
      ...item,
      supplier: item.supplierId
        ? supplierMap.get(String(item.supplierId)) || null
        : null,
      panel:
        item.panelId
          ? panelMap.get(String(item.panelId)) || null
          : item.panels?.[0]
            ? panelMap.get(String(item.panels[0])) || null
            : null,
    }));

    const statsMap: Record<string, number> = {};
    for (const stat of stats) statsMap[String(stat._id)] = stat.count;

    return NextResponse.json({
      success: true,
      respondents,
      stats: {
        total: await Respondent.countDocuments(),
        active: statsMap.Active || 0,
        inactive: statsMap.Inactive || 0,
        blocked: statsMap.Blocked || 0,
        suspended: statsMap.Suspended || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/respondents/manage error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch respondents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const supplierId = String(body.supplierId || "").trim();
    const panelId = String(body.panelId || "").trim();

    if (!firstName || !lastName || !email || !supplierId) {
      return NextResponse.json(
        {
          success: false,
          error: "firstName, lastName, email and supplierId are required",
        },
        { status: 400 }
      );
    }

    const supplier = await Supply.findById(supplierId).lean();
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const existingRespondent = await Respondent.findOne({ email }).lean();
    if (existingRespondent) {
      return NextResponse.json(
        { success: false, error: "A respondent with this email already exists" },
        { status: 409 }
      );
    }

    const count = await Respondent.countDocuments();
    const respondentId = `R${String(count + 1).padStart(5, "0")}`;

    const plainPassword = email;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await User.create({
      name: `${firstName} ${lastName}`.trim(),
      email,
      password: hashedPassword,
      role: "respondent",
      emailVerified: true,
      isBlocked: false,
      mustChangePassword: true,
      respondentId,
    });

    try {
      const panel = panelId
        ? await SupplierPanel.findOne({
            _id: panelId,
            supplierId: supplier._id,
          }).lean()
        : null;

      const respondent = await Respondent.create({
        respondentId,
        externalId: String(body.externalId || "").trim(),
        supplierId: supplier._id,
        userId: user._id,
        supplierCode: String(supplier.supplierCode || "").trim(),
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone: String(body.phone || "").trim(),
        country: String(body.country || supplier.country || "US").trim(),
        state: String(body.state || "").trim(),
        city: String(body.city || "").trim(),
        gender: String(body.gender || "Unspecified").trim(),
        dateOfBirth: String(body.dateOfBirth || "").trim(),
        age:
          body.age !== undefined && body.age !== ""
            ? Number(body.age)
            : undefined,
        employment: String(body.employment || "").trim(),
        industry: String(body.industry || "").trim(),
        jobTitle: String(body.jobTitle || "").trim(),
        education: String(body.education || "").trim(),
        incomeRange: String(body.incomeRange || "").trim(),
        panelId: panel?._id,
        panels: panel ? [panel._id] : [],
        status: body.status || "Active",
        qualityScore: Number(body.qualityScore ?? 95),
        fraudRiskScore: Number(body.fraudRiskScore ?? 5),
        lastActiveAt: new Date(),
      });

      return NextResponse.json(
        {
          success: true,
          message: "Respondent created successfully",
          respondent,
          credentials: {
            respondentId,
            email,
            password: plainPassword,
            mustChangePassword: true,
          },
        },
        { status: 201 }
      );
    } catch (respondentError) {
      await User.deleteOne({ _id: user._id });
      throw respondentError;
    }
  } catch (error: any) {
    console.error("POST /api/admin/respondents/manage error:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Duplicate respondent or user information" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create respondent" },
      { status: 500 }
    );
  }
}
