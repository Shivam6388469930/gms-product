import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getAuthenticatedSupplier } from "@/lib/supplier-auth";
import SupplierPanel from "@/models/SupplierPanel";
import Respondent from "@/models/Respondent";
import PanelRespondent from "@/models/PanelRespondent";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const supplierCtx = await getAuthenticatedSupplier();
    if (!supplierCtx) {
      return NextResponse.json(
        { success: false, error: "Supplier context not found or unauthorized", respondents: [] },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid panel ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const panel = await SupplierPanel.findOne({
      _id: id,
      supplierCode: supplierCtx.supplierCode,
    }).lean();

    if (!panel) {
      return NextResponse.json({ success: false, error: "Panel not found" }, { status: 404 });
    }

    const query: Record<string, any> = {
      supplierCode: supplierCtx.supplierCode,
      panels: new mongoose.Types.ObjectId(id),
    };

    if (search) {
      query.$or = [
        { respondentId: { $regex: search, $options: "i" } },
        { externalId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const respondents = await Respondent.find(query).sort({ createdAt: -1 }).lean();

    // Also calculate panel live stats
    const totalCount = respondents.length;
    const activeCount = respondents.filter((r) => r.status === "Active").length;
    const avgQuality =
      totalCount > 0
        ? Math.round(
            (respondents.reduce((acc, r) => acc + (r.qualityScore || 95), 0) / totalCount) * 10
          ) / 10
        : (panel as any).qualityIndex || 95.0;

    return NextResponse.json({
      success: true,
      panel: {
        id: (panel as any)._id.toString(),
        name: (panel as any).name,
        category: (panel as any).category,
        country: (panel as any).country,
        activeMembers: (panel as any).activeMembers,
        qualityIndex: (panel as any).qualityIndex,
        status: (panel as any).status,
        stats: {
          totalRespondents: totalCount,
          activeRespondents: activeCount,
          availableRespondents: activeCount,
          qualityScore: avgQuality,
        },
      },
      respondents,
    });
  } catch (error: any) {
    console.error("GET /api/supplier/panels/[id]/respondents error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load panel respondents", respondents: [] },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const supplierCtx = await getAuthenticatedSupplier();
    if (!supplierCtx) {
      return NextResponse.json(
        { success: false, error: "Supplier context not found or unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const panel = await SupplierPanel.findOne({
      _id: id,
      supplierCode: supplierCtx.supplierCode,
    });
    if (!panel) {
      return NextResponse.json({ success: false, error: "Panel not found" }, { status: 404 });
    }

    // Case 1: Adding an existing respondent by ID
    if (body.existingRespondentId) {
      const isMongoId = mongoose.Types.ObjectId.isValid(body.existingRespondentId);
      const query = {
        supplierCode: supplierCtx.supplierCode,
        ...(isMongoId
          ? { $or: [{ _id: body.existingRespondentId }, { respondentId: body.existingRespondentId }] }
          : { respondentId: body.existingRespondentId }),
      };

      const respondent = await Respondent.findOne(query);
      if (!respondent) {
        return NextResponse.json(
          { success: false, error: "Respondent not found under your supplier account" },
          { status: 404 }
        );
      }

      if (!respondent.panels.some((p: any) => p.toString() === panel._id.toString())) {
        respondent.panels.push(panel._id);
        await respondent.save();

        await PanelRespondent.findOneAndUpdate(
          { panelId: panel._id, respondentId: respondent._id },
          {
            panelId: panel._id,
            respondentId: respondent._id,
            supplierCode: supplierCtx.supplierCode,
            status: "Active",
            joinedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        await SupplierPanel.findByIdAndUpdate(panel._id, { $inc: { activeMembers: 1 } });
      }

      return NextResponse.json({
        success: true,
        message: `Assigned ${respondent.name} to panel ${panel.name}`,
        respondent,
      });
    }

    // Case 2: Creating a new respondent directly inside this panel
    const { firstName, lastName, email, phone, externalId, country, gender, age, status } = body;
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: "firstName, lastName, and email are required" },
        { status: 400 }
      );
    }

    const count = await Respondent.countDocuments({ supplierCode: supplierCtx.supplierCode });
    const idSuffix = String(count + 1).padStart(5, "0");
    const respondentId = `R${idSuffix}`;

    const newRespondent = await Respondent.create({
      respondentId,
      externalId: externalId || "",
      supplierCode: supplierCtx.supplierCode,
      supplierId: supplierCtx.supplierId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.toLowerCase().trim(),
      phone: phone || "",
      country: country || panel.country || "US",
      gender: gender || "Unspecified",
      age: age ? Number(age) : undefined,
      panels: [panel._id],
      status: status || "Active",
      qualityScore: 98.4,
      fraudRiskScore: 1.6,
      totalSurveys: 0,
      completedSurveys: 0,
      totalEarnings: 0,
      lastActiveAt: new Date(),
    });

    await PanelRespondent.create({
      panelId: panel._id,
      respondentId: newRespondent._id,
      supplierCode: supplierCtx.supplierCode,
      status: "Active",
      joinedAt: new Date(),
    });

    await SupplierPanel.findByIdAndUpdate(panel._id, { $inc: { activeMembers: 1 } });

    return NextResponse.json(
      {
        success: true,
        message: `Created and enrolled ${newRespondent.name} into panel ${panel.name}`,
        respondent: newRespondent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/supplier/panels/[id]/respondents error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add respondent to panel" },
      { status: 500 }
    );
  }
}
