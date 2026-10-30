// import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "@/config/db";
// import Supply from "@/models/Supply";
// import SupplierPanel from "@/models/SupplierPanel";

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const search = searchParams.get("search") || "";
//     const category = searchParams.get("category") || "";
//     const status = searchParams.get("status") || "";
//     const supplierCode = searchParams.get("supplierCode") || "";

//     await connectDB();

//     // 1. Fetch real supply records from Supply collection
//     const supplyQuery: Record<string, unknown> = {};
//     if (supplierCode) supplyQuery.supplierCode = supplierCode;
//     if (search) {
//       supplyQuery.$or = [
//         { supplierName: { $regex: search, $options: "i" } },
//         { country: { $regex: search, $options: "i" } },
//         { audienceType: { $regex: search, $options: "i" } },
//       ];
//     }
//     if (category && category !== "all" && category !== "All") {
//       supplyQuery.audienceType = category.toLowerCase().includes("b2b")
//         ? "b2b"
//         : category.toLowerCase().includes("health")
//         ? "healthcare"
//         : "consumer";
//     }
//     if (status && status !== "all" && status !== "All") {
//       supplyQuery.active = status === "Active" || status === "active";
//     }

//     const realSupplies = await Supply.find(supplyQuery).sort({ createdAt: -1 }).lean();

//     // 2. Fetch custom panels from SupplierPanel collection
//     const panelQuery: Record<string, unknown> = {};
//     if (supplierCode) panelQuery.supplierCode = supplierCode;
//     if (search) {
//       panelQuery.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { country: { $regex: search, $options: "i" } },
//         { category: { $regex: search, $options: "i" } },
//       ];
//     }
//     if (category && category !== "all" && category !== "All") {
//       panelQuery.category = category;
//     }
//     if (status && status !== "all" && status !== "All") {
//       panelQuery.status = status;
//     }

//     const customPanels = await SupplierPanel.find(panelQuery).sort({ createdAt: -1 }).lean();

//     // Map real supplies to panel objects
//     const mappedSupplies = realSupplies.map((s: any) => {
//       const categoryLabel =
//         s.audienceType === "b2b"
//           ? "B2B Tech"
//           : s.audienceType === "healthcare"
//           ? "Healthcare HCP"
//           : "Consumer";

//       return {
//         id: s._id.toString(),
//         name: `${s.supplierName} - ${s.country} (${s.audienceType.toUpperCase()})`,
//         category: categoryLabel,
//         country: s.country || "US",
//         activeMembers: s.availableSample || 10000,
//         responseRate: s.historicalIr || 45,
//         avgCompletionTime: s.averageLoi || 10,
//         qualityIndex: s.qualityScore || 92.5,
//         status: s.active ? "Active" : "Paused",
//         lastRefreshed: new Date(s.lastUpdatedAt || s.updatedAt || s.createdAt).toISOString().split("T")[0],
//         supplierCode: s.supplierCode,
//         isSupplySource: true,
//       };
//     });

//     const mappedCustom = customPanels.map((p: any) => ({
//       id: p._id.toString(),
//       name: p.name,
//       category: p.category,
//       country: p.country,
//       activeMembers: p.activeMembers,
//       responseRate: p.responseRate,
//       avgCompletionTime: p.avgCompletionTime,
//       qualityIndex: p.qualityIndex,
//       status: p.status,
//       lastRefreshed: p.lastRefreshed || new Date(p.updatedAt || p.createdAt).toISOString().split("T")[0],
//       supplierCode: p.supplierCode,
//       isSupplySource: false,
//     }));

//     // Avoid duplicate entries
//     const seenNames = new Set<string>();
//     const allPanels: any[] = [];
//     for (const p of [...mappedCustom, ...mappedSupplies]) {
//       const normName = p.name.toLowerCase().replace(/\s*-\s*[a-z0-9\s()]+\([a-z0-9\s()]+\)$/i, "").trim();
//       if (!seenNames.has(normName)) {
//         seenNames.add(normName);
//         allPanels.push(p);
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       dataSource: "database",
//       panels: allPanels,
//       total: allPanels.length,
//     });
//   } catch (error: any) {
//     console.error("GET /api/supplier/panels error:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message || "Failed to load supplier panels",
//         panels: [],
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json().catch(() => null);
//     if (!body || !body.name) {
//       return NextResponse.json(
//         { success: false, error: "Panel name is required" },
//         { status: 400 }
//       );
//     }

//     await connectDB();

//     const supplierCode = body.supplierCode || "1001";
//     const category = body.category || "Consumer";
//     const country = body.country || "US";
//     const activeMembers = Number(body.activeMembers) || 10000;
//     const responseRate = Number(body.responseRate) || 50;
//     const avgCompletionTime = Number(body.avgCompletionTime) || 10;
//     const qualityIndex = Number(body.qualityIndex) || 94.5;
//     const status = body.status || "Active";
//     const today = new Date().toISOString().split("T")[0];

//     const audienceType = category.toLowerCase().includes("b2b")
//       ? "b2b"
//       : category.toLowerCase().includes("health")
//       ? "healthcare"
//       : "consumer";

//     // 1. Create in Supply collection so platform feasibility and sample routing can use it
//     try {
//       await Supply.create({
//         supplierName: body.name.trim(),
//         supplierCode,
//         country,
//         audienceType,
//         availableSample: activeMembers,
//         baseCpi: 2.5,
//         historicalIr: responseRate,
//         averageLoi: avgCompletionTime,
//         qualityScore: qualityIndex,
//         active: status === "Active",
//         lastUpdatedAt: new Date(),
//       });
//     } catch (supplyErr) {
//       console.warn("Supply upsert notice:", supplyErr);
//     }

//     // 2. Create in SupplierPanel
//     const panel = await SupplierPanel.create({
//       supplierCode,
//       name: body.name.trim(),
//       category,
//       country,
//       activeMembers,
//       responseRate,
//       avgCompletionTime,
//       qualityIndex,
//       status,
//       lastRefreshed: today,
//       description: body.description || "",
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         dataSource: "database",
//         panel: {
//           id: panel._id.toString(),
//           name: panel.name,
//           category: panel.category,
//           country: panel.country,
//           activeMembers: panel.activeMembers,
//           responseRate: panel.responseRate,
//           avgCompletionTime: panel.avgCompletionTime,
//           qualityIndex: panel.qualityIndex,
//           status: panel.status,
//           lastRefreshed: panel.lastRefreshed,
//         },
//       },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     console.error("POST /api/supplier/panels error:", error);
//     return NextResponse.json(
//       { success: false, error: error.message || "Failed to create panel" },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import SupplierPanel from "@/models/SupplierPanel";
import User from "@/models/User";

import { getUserId } from "@/lib/auth";

function normalizeCategory(category: string) {
  const value = category.toLowerCase().trim();

  if (value.includes("b2b")) return "B2B Tech";
  if (value.includes("health")) return "Healthcare HCP";
  if (value.includes("gen z") || value.includes("youth")) {
    return "Gen Z & Youth";
  }
  if (value.includes("finance") || value.includes("bank")) {
    return "Finance & Banking";
  }

  return "Consumer";
}

function normalizeStatus(status: string) {
  const value = status.toLowerCase().trim();

  switch (value) {
    case "active":
      return "active";

    case "inactive":
      return "inactive";

    case "paused":
      return "paused";

    case "archived":
      return "archived";

    default:
      return "";
  }
}

/**
 * Get authenticated supplier from JWT cookie.
 *
 * getUserId() returns ONLY the user ID.
 * We then fetch the complete User document.
 */
async function getCurrentSupplier() {
  const userId = await getUserId();

  if (!userId) {
    return null;
  }

  const user = await User.findById(userId).lean();

  if (!user) {
    return null;
  }

  return user;
}

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get logged-in user from JWT cookie
    const currentUser = await getCurrentSupplier();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          panels: [],
        },
        { status: 401 }
      );
    }

    // Only supplier accounts can access supplier panels
    if (currentUser.role !== "supplier") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden. Supplier access required.",
          panels: [],
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const country = searchParams.get("country")?.trim() || "";

    /**
     * IMPORTANT:
     *
     * Supplier ID is ALWAYS taken from JWT.
     * Frontend cannot change supplierId.
     */
    const panelQuery: Record<string, any> = {
      supplierId: currentUser._id,
    };

    /* Search */
    if (search) {
      panelQuery.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          country: {
            $regex: search,
            $options: "i",
          },
        },
        {
          category: {
            $regex: search,
            $options: "i",
          },
        },
        {
          supplierCode: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /* Category */
    if (category && category.toLowerCase() !== "all") {
      panelQuery.category = normalizeCategory(category);
    }

    /* Status */
    if (status && status.toLowerCase() !== "all") {
      const normalizedStatus = normalizeStatus(status);

      if (normalizedStatus) {
        panelQuery.status = normalizedStatus;
      }
    }

    /* Country */
    if (country && country.toLowerCase() !== "all") {
      panelQuery.country = {
        $regex: `^${country}$`,
        $options: "i",
      };
    }

    const panels = await SupplierPanel.find(panelQuery)
      .sort({ createdAt: -1 })
      .lean();

    const mappedPanels = panels.map((panel: any) => ({
      id: panel._id.toString(),

      name: panel.name,

      description: panel.description || "",

      supplierId: panel.supplierId?.toString() || null,

      supplierCode:
        panel.supplierCode || currentUser.supplierCode || "",

      country: panel.country || "",

      countries: panel.countries || [],

      language: panel.language || "en",

      languages: panel.languages || [],

      category: panel.category,

      status: panel.status,

      respondentCount: panel.respondentCount || 0,

      activeRespondentCount:
        panel.activeRespondentCount || 0,

      targeting: panel.targeting || {
        genders: [],
        ageRange: {},
        states: [],
        cities: [],
        education: [],
        employment: [],
        occupations: [],
        income: [],
        maritalStatus: [],
        industries: [],
      },

      qualityScore: panel.qualityScore ?? 100,

      fraudRate: panel.fraudRate ?? 0,

      totalInvites: panel.totalInvites || 0,

      totalStarts: panel.totalStarts || 0,

      totalCompletes: panel.totalCompletes || 0,

      totalTerminates: panel.totalTerminates || 0,

      totalQuotaFull: panel.totalQuotaFull || 0,

      createdAt: panel.createdAt,

      updatedAt: panel.updatedAt,
    }));

    return NextResponse.json({
      success: true,

      dataSource: "database",

      supplier: {
        id: currentUser._id.toString(),
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        supplierCode: currentUser.supplierCode || null,
      },

      panels: mappedPanels,

      total: mappedPanels.length,
    });
  } catch (error: any) {
    console.error(
      "GET /api/supplier/panels error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to load supplier panels",

        panels: [],
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST                                                                       */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get logged-in supplier
    const currentUser = await getCurrentSupplier();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Only supplier can create panels
    if (currentUser.role !== "supplier") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden. Only supplier accounts can create panels.",
        },
        { status: 403 }
      );
    }

    // Blocked supplier cannot create panel
    if (currentUser.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: "Your supplier account is blocked.",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 }
      );
    }

    /* Panel name */

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Panel name is required",
        },
        { status: 400 }
      );
    }

    /* Category */

    const category = normalizeCategory(
      body.category || "Consumer"
    );

    /* Status */

    const status =
      normalizeStatus(body.status || "active") ||
      "active";

    /* Country */

    const country =
      typeof body.country === "string"
        ? body.country.trim()
        : "";

    /* Countries */

    const countries = Array.isArray(body.countries)
      ? body.countries
          .filter(
            (item: unknown): item is string =>
              typeof item === "string"
          )
          .map((item: string) => item.trim())
          .filter(Boolean)
      : country
        ? [country]
        : [];

    /* Languages */

    const languages = Array.isArray(body.languages)
      ? body.languages
          .filter(
            (item: unknown): item is string =>
              typeof item === "string"
          )
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

    /* Targeting */

    const targeting = {
      genders: Array.isArray(body.targeting?.genders)
        ? body.targeting.genders
        : [],

      ageRange: {
        min:
          body.targeting?.ageRange?.min !== undefined
            ? Number(body.targeting.ageRange.min)
            : undefined,

        max:
          body.targeting?.ageRange?.max !== undefined
            ? Number(body.targeting.ageRange.max)
            : undefined,
      },

      states: Array.isArray(body.targeting?.states)
        ? body.targeting.states
        : [],

      cities: Array.isArray(body.targeting?.cities)
        ? body.targeting.cities
        : [],

      education: Array.isArray(body.targeting?.education)
        ? body.targeting.education
        : [],

      employment: Array.isArray(body.targeting?.employment)
        ? body.targeting.employment
        : [],

      occupations: Array.isArray(
        body.targeting?.occupations
      )
        ? body.targeting.occupations
        : [],

      income: Array.isArray(body.targeting?.income)
        ? body.targeting.income
        : [],

      maritalStatus: Array.isArray(
        body.targeting?.maritalStatus
      )
        ? body.targeting.maritalStatus
        : [],

      industries: Array.isArray(
        body.targeting?.industries
      )
        ? body.targeting.industries
        : [],
    };

    /**
     * CREATE PANEL
     *
     * supplierId comes ONLY from authenticated user.
     *
     * Frontend does NOT send supplierId.
     */
    const panel = await SupplierPanel.create({
      name,

      description:
        typeof body.description === "string"
          ? body.description.trim()
          : "",

      supplierId: currentUser._id,

      supplierCode:
        currentUser.supplierCode || undefined,

      country,

      countries,

      language:
        typeof body.language === "string"
          ? body.language
          : "en",

      languages,

      category,

      status,

      respondentCount: 0,

      activeRespondentCount: 0,

      targeting,

      qualityScore:
        body.qualityScore !== undefined
          ? Number(body.qualityScore)
          : 100,

      fraudRate:
        body.fraudRate !== undefined
          ? Number(body.fraudRate)
          : 0,

      totalInvites: 0,

      totalStarts: 0,

      totalCompletes: 0,

      totalTerminates: 0,

      totalQuotaFull: 0,
    });

    return NextResponse.json(
      {
        success: true,

        dataSource: "database",

        panel: {
          id: panel._id.toString(),

          name: panel.name,

          description: panel.description || "",

          supplierId: panel.supplierId.toString(),

          supplierCode: panel.supplierCode || "",

          country: panel.country || "",

          countries: panel.countries || [],

          language: panel.language || "en",

          languages: panel.languages || [],

          category: panel.category,

          status: panel.status,

          respondentCount:
            panel.respondentCount,

          activeRespondentCount:
            panel.activeRespondentCount,

          targeting: panel.targeting,

          qualityScore:
            panel.qualityScore,

          fraudRate:
            panel.fraudRate,

          totalInvites:
            panel.totalInvites,

          totalStarts:
            panel.totalStarts,

          totalCompletes:
            panel.totalCompletes,

          totalTerminates:
            panel.totalTerminates,

          totalQuotaFull:
            panel.totalQuotaFull,

          createdAt:
            panel.createdAt,

          updatedAt:
            panel.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "POST /api/supplier/panels error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to create supplier panel",
      },
      { status: 500 }
    );
  }
}
