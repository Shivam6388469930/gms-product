import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getAuthenticatedSupplier } from "@/lib/supplier-auth";
import Respondent from "@/models/Respondent";
import SupplierPanel from "@/models/SupplierPanel";
import PanelRespondent from "@/models/PanelRespondent";

interface ImportRow {
  externalId?: string;
  firstName: string;
  lastName: string;
  email: string;
  country?: string;
  gender?: string;
  age?: number | string;
  panel?: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const supplierCtx = await getAuthenticatedSupplier();
    if (!supplierCtx) {
      return NextResponse.json(
        { success: false, error: "Supplier context not found or unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.rows)) {
      return NextResponse.json(
        { success: false, error: "A 'rows' array is required" },
        { status: 400 }
      );
    }

    const { rows, dryRun = false } = body;
    const supplierCode = supplierCtx.supplierCode;

    // Fetch existing emails for this supplier to detect duplicates
    const existingRespondents = await Respondent.find(
      { supplierCode },
      { email: 1, respondentId: 1, externalId: 1 }
    ).lean();

    const existingEmails = new Set(existingRespondents.map((r: any) => r.email?.toLowerCase()));
    const existingExternals = new Set(
      existingRespondents.map((r: any) => r.externalId).filter(Boolean)
    );

    // Fetch panels for name resolution
    const supplierPanels = await SupplierPanel.find({ supplierCode }).lean();
    const panelMapByName = new Map<string, any>();
    supplierPanels.forEach((p: any) => {
      panelMapByName.set(p.name.toLowerCase().trim(), p);
      panelMapByName.set(p._id.toString(), p);
    });

    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const duplicateRows: any[] = [];
    const seenBatchEmails = new Set<string>();

    let currentCount = existingRespondents.length;

    for (let i = 0; i < rows.length; i++) {
      const row: ImportRow = rows[i];
      const email = row.email?.trim().toLowerCase();
      const firstName = row.firstName?.trim();
      const lastName = row.lastName?.trim();

      if (!email || !firstName || !lastName) {
        invalidRows.push({
          row: i + 1,
          data: row,
          reason: "Missing required fields (firstName, lastName, or email)",
        });
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        invalidRows.push({
          row: i + 1,
          data: row,
          reason: `Invalid email format: ${email}`,
        });
        continue;
      }

      if (existingEmails.has(email) || seenBatchEmails.has(email)) {
        duplicateRows.push({
          row: i + 1,
          data: row,
          reason: `Email already exists: ${email}`,
        });
        continue;
      }

      seenBatchEmails.add(email);

      // Panel resolution
      let matchedPanel: any = null;
      if (row.panel) {
        matchedPanel = panelMapByName.get(row.panel.toLowerCase().trim());
      }

      currentCount++;
      const idSuffix = String(currentCount).padStart(5, "0");
      const respondentId = `R${idSuffix}`;

      let parsedAge: number | undefined = undefined;
      if (row.age) {
        const n = parseInt(String(row.age), 10);
        if (!isNaN(n) && n >= 13 && n <= 120) parsedAge = n;
      }

      validRows.push({
        respondentId,
        externalId: row.externalId?.trim() || "",
        supplierCode,
        supplierId: supplierCtx.supplierId,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        country: row.country?.trim() || "US",
        gender: row.gender?.trim() || "Unspecified",
        age: parsedAge,
        panels: matchedPanel ? [matchedPanel._id] : [],
        status: "Active",
        qualityScore: 97.5,
        fraudRiskScore: 2.1,
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
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        summary: {
          totalRows: rows.length,
          validCount: validRows.length,
          invalidCount: invalidRows.length,
          duplicateCount: duplicateRows.length,
        },
        sampleValid: validRows.slice(0, 5),
        invalidRows: invalidRows.slice(0, 10),
        duplicateRows: duplicateRows.slice(0, 10),
      });
    }

    // Execute insertion
    if (validRows.length > 0) {
      const inserted = await Respondent.insertMany(validRows);

      // Create panel relationships where applicable
      for (const resp of inserted) {
        if (resp.panels && resp.panels.length > 0) {
          for (const pid of resp.panels) {
            await PanelRespondent.create({
              panelId: pid,
              respondentId: resp._id,
              supplierCode,
              status: "Active",
              joinedAt: new Date(),
            }).catch(() => {});

            await SupplierPanel.findByIdAndUpdate(pid, {
              $inc: { activeMembers: 1 },
            }).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${validRows.length} respondents into your panel.`,
      summary: {
        totalRows: rows.length,
        importedCount: validRows.length,
        invalidCount: invalidRows.length,
        duplicateCount: duplicateRows.length,
      },
    });
  } catch (error: any) {
    console.error("POST /api/supplier/respondents/import error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process import" },
      { status: 500 }
    );
  }
}
