import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/config/db";
import { getUserId } from "@/lib/auth";

import User from "@/models/User";
import Respondent from "@/models/Respondent";
import SupplierPanel from "@/models/SupplierPanel";
import PanelRespondent from "@/models/PanelRespondent";

function normalizeRespondentStatus(value: unknown) {
  const status = String(value || "").trim();
  const allowed = ["Active", "Inactive", "Blocked", "Suspended"];
  return allowed.includes(status) ? status : "Active";
}



async function getCurrentSupplier() {
  const userId = await getUserId();
  if (!userId) return null;

  const user: any = await User.findById(userId).lean();
  if (!user || user.role !== "supplier" || user.isBlocked) return null;

  return {
    supplierId: user._id,
    supplierCode: user.supplierCode || "",
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const supplierCtx = await getCurrentSupplier();

    if (!supplierCtx) {
      return NextResponse.json(
        {
          success: false,
          error: "Supplier context not found or unauthorized",
          respondents: [],
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "15", 10) || 15)
    );

    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const panelId = (searchParams.get("panelId") || "").trim();
    const country = (searchParams.get("country") || "").trim();
    const gender = (searchParams.get("gender") || "").trim();
    const ageGroup = (searchParams.get("ageGroup") || "").trim();
    const minQuality = Number(searchParams.get("minQuality") || 0);

    // supplierId ALWAYS comes from the JWT, never from the client
    const query: Record<string, any> = {
      supplierId: supplierCtx.supplierId,
    };

    if (status && ["Active", "Inactive", "Blocked", "Suspended"].includes(status)) {
      query.status = status;
    }

    if (panelId && mongoose.isValidObjectId(panelId)) {
      query.panels = new mongoose.Types.ObjectId(panelId);
    }

    if (country) query.country = country;
    if (gender) query.gender = gender;

    if (ageGroup) {
      switch (ageGroup) {
        case "under25":
          query.age = { $lt: 25 };
          break;
        case "25-34":
          query.age = { $gte: 25, $lte: 34 };
          break;
        case "35-49":
          query.age = { $gte: 35, $lte: 49 };
          break;
        case "50plus":
          query.age = { $gte: 50 };
          break;
      }
    }

    if (Number.isFinite(minQuality) && minQuality > 0) {
      query.qualityScore = { $gte: minQuality };
    }

    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { respondentId: rx },
        { externalId: rx },
        { name: rx },
        { firstName: rx },
        { lastName: rx },
        { email: rx },
      ];
    }

    const [respondents, total] = await Promise.all([
      Respondent.find(query)
        .populate("panels", "name category country status")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Respondent.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      respondents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    console.error("GET /api/supplier/respondents error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to load respondents",
        respondents: [],
      },
      { status: 500 }
    );
  }
}

/**
 * respondentId is unique across the WHOLE collection,
 * so the next number must come from the highest existing ID
 * (not from a per-supplier count).
 */
async function generateRespondentId() {
  const last: any = await Respondent.findOne({ respondentId: /^R\d+$/ })
    .sort({ respondentId: -1 })
    .collation({ locale: "en", numericOrdering: true })
    .select("respondentId")
    .lean();

  const lastNumber = last
    ? parseInt(String(last.respondentId).slice(1), 10)
    : 0;

  const next = (Number.isFinite(lastNumber) ? lastNumber : 0) + 1;

  return `R${String(next).padStart(5, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // ============================================================
    // AUTHENTICATED SUPPLIER (same identity source as /api/supplier/panels)
    // ============================================================

    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supplierUser: any = await User.findById(userId).lean();

    if (!supplierUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (supplierUser.role !== "supplier") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Supplier access required." },
        { status: 403 }
      );
    }

    if (supplierUser.isBlocked) {
      return NextResponse.json(
        { success: false, error: "Your supplier account is blocked." },
        { status: 403 }
      );
    }

    const supplierCtx = {
      supplierId: supplierUser._id,
      supplierCode: supplierUser.supplierCode || "",
    };

    // ============================================================
    // BODY
    // ============================================================

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      externalId,
      country,
      state,
      city,
      gender,
      dateOfBirth,
      age,
      employment,
      industry,
      jobTitle,
      education,
      incomeRange,
      panelId,
      status,
    } = body as Record<string, any>;

    // ============================================================
    // VALIDATION
    // ============================================================

    if (
      !String(firstName || "").trim() ||
      !String(lastName || "").trim() ||
      !String(email || "").trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "First name, last name, and email are required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // ============================================================
    // CHECK DUPLICATE RESPONDENT
    // ============================================================

    const existingRespondent = await Respondent.findOne({
      supplierId: supplierCtx.supplierId,
      email: normalizedEmail,
    }).lean();

    if (existingRespondent) {
      return NextResponse.json(
        {
          success: false,
          error: "A respondent with this email already exists for this supplier",
        },
        { status: 409 }
      );
    }

    // ============================================================
    // CHECK GLOBAL USER EMAIL
    // ============================================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    }).lean();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "A user account already exists with this email address",
        },
        { status: 409 }
      );
    }

    // ============================================================
    // PANEL VALIDATION + OWNERSHIP
    // ============================================================

    let panel: any = null;

    const requestedPanelId = String(panelId || "").trim();

    if (
      requestedPanelId &&
      requestedPanelId !== "all" &&
      requestedPanelId !== "All"
    ) {
      if (!mongoose.isValidObjectId(requestedPanelId)) {
        return NextResponse.json(
          { success: false, error: "Invalid panel ID" },
          { status: 400 }
        );
      }

      panel = await SupplierPanel.findById(requestedPanelId).lean();

      if (!panel) {
        return NextResponse.json(
          { success: false, error: "Panel not found" },
          { status: 404 }
        );
      }

      const authenticatedSupplierId = String(supplierCtx.supplierId);

      const authenticatedSupplierCode = String(supplierCtx.supplierCode || "")
        .trim()
        .toLowerCase();

      const panelSupplierId = panel.supplierId ? String(panel.supplierId) : "";

      const panelSupplierCode = panel.supplierCode
        ? String(panel.supplierCode).trim().toLowerCase()
        : "";

      const ownsBySupplierId =
        Boolean(panelSupplierId) &&
        authenticatedSupplierId === panelSupplierId;

      const ownsBySupplierCode =
        Boolean(authenticatedSupplierCode) &&
        Boolean(panelSupplierCode) &&
        authenticatedSupplierCode === panelSupplierCode;

      if (!ownsBySupplierId && !ownsBySupplierCode) {
        console.error("Supplier panel ownership mismatch", {
          panelId: requestedPanelId,
          panelSupplierId,
          panelSupplierCode,
          authenticatedSupplierId,
          authenticatedSupplierCode,
        });

        return NextResponse.json(
          {
            success: false,
            error: "Panel does not belong to the authenticated supplier",
          },
          { status: 403 }
        );
      }

      if (String(panel.status || "").toLowerCase() !== "active") {
        return NextResponse.json(
          {
            success: false,
            error: "Respondent cannot be added to an inactive panel",
          },
          { status: 400 }
        );
      }
    }

    // ============================================================
    // GENERATE GLOBALLY UNIQUE RESPONDENT ID
    // ============================================================

    const respondentId = await generateRespondentId();

    const normalizedStatus = normalizeRespondentStatus(status);

    // ============================================================
    // INITIAL PASSWORD (= respondent email, stored as bcrypt hash)
    // ============================================================

    const bcrypt = await import("bcryptjs");

    const hashedPassword = await bcrypt.hash(normalizedEmail, 12);

    // ============================================================
    // CREATE RESPONDENT USER ACCOUNT
    // ============================================================

    const respondentUser: any = await User.create({
      name: `${String(firstName).trim()} ${String(lastName).trim()}`.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "respondent",
      emailVerified: false,
      isBlocked: false,
      mustChangePassword: true,
      respondentId,
    });

    // ============================================================
    // CREATE RESPONDENT
    // ============================================================

    let newRespondent: any;

    try {
      newRespondent = await Respondent.create({
        respondentId,
        externalId: String(externalId || "").trim(),
        supplierId: supplierCtx.supplierId,
        userId: respondentUser._id,
        supplierCode: supplierCtx.supplierCode || "",
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        name: `${String(firstName).trim()} ${String(lastName).trim()}`,
        email: normalizedEmail,
        phone: String(phone || "").trim(),
        country: String(country || "US").trim(),
        state: String(state || "").trim(),
        city: String(city || "").trim(),
        gender: String(gender || "Unspecified").trim(),
        dateOfBirth: String(dateOfBirth || "").trim(),
        age:
          age !== undefined && age !== null && age !== ""
            ? Number(age)
            : undefined,
        employment: String(employment || "").trim(),
        industry: String(industry || "").trim(),
        jobTitle: String(jobTitle || "").trim(),
        education: String(education || "").trim(),
        incomeRange: String(incomeRange || "").trim(),
        panelId: panel ? panel._id : undefined,
        panels: panel ? [panel._id] : [],
        status: normalizedStatus as any,
        qualityScore: 98.4,
        fraudRiskScore: 1.6,
        totalSurveys: 0,
        completedSurveys: 0,
        screenouts: 0,
        quotaFull: 0,
        qualityRejects: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        lastActiveAt: new Date(),
      });
    } catch (respondentError) {
      // Prevent orphan User account
      await User.deleteOne({ _id: respondentUser._id });
      throw respondentError;
    }

    // ============================================================
    // CREATE PANEL RESPONDENT RELATIONSHIP
    // ============================================================

    if (panel) {
      await PanelRespondent.findOneAndUpdate(
        {
          panelId: panel._id,
          respondentId: newRespondent._id,
        },
        {
          $set: {
            panelId: panel._id,
            respondentId: newRespondent._id,
            supplierId: supplierCtx.supplierId,
            supplierCode: supplierCtx.supplierCode || "",
            status: "Active",
          },
          $setOnInsert: {
            joinedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      await SupplierPanel.updateOne(
        { _id: panel._id },
        {
          $inc: {
            respondentCount: 1,
            activeRespondentCount: normalizedStatus === "Active" ? 1 : 0,
          },
        }
      );
    }

    // ============================================================
    // POPULATE RESPONSE
    // ============================================================

    const populatedRespondent = await Respondent.findById(newRespondent._id)
      .populate(
        "panels",
        "name category country status respondentCount activeRespondentCount"
      )
      .populate(
        "userId",
        "name email role emailVerified isBlocked mustChangePassword respondentId"
      )
      .populate("supplierId", "name email role supplierCode")
      .lean();

    // ============================================================
    // SUCCESS
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          `Respondent ${newRespondent.name} ` +
          `(${newRespondent.respondentId}) ` +
          `and respondent user account created successfully.`,

        respondent: populatedRespondent,

        credentials: {
          respondentId: newRespondent.respondentId,
          email: normalizedEmail,
          password: normalizedEmail,
          mustChangePassword: true,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/supplier/respondents error:", error);

    if (error?.code === 11000) {
      const duplicate = error?.keyValue || {};
      const field = Object.keys(error?.keyPattern || duplicate).join(", ");

      console.error("Duplicate key:", duplicate);

      return NextResponse.json(
        {
          success: false,
          error: field
            ? `Duplicate value for: ${field}`
            : "A user or respondent with the same unique information already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create respondent",
      },
      { status: 500 }
    );
  }
}