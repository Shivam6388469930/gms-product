import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/config/db";
import { getUserId } from "@/lib/auth";

import User from "@/models/User";
import Respondent from "@/models/Respondent";
import RespondentSession from "@/models/RespondentSession";
import Project from "@/models/Project";
import Supply from "@/models/Supply";
import SupplierPanel from "@/models/SupplierPanel";

function toStringValue(value: any): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toObjectIdString(value: any): string {
  if (!value) return "";

  try {
    return value.toString();
  } catch {
    return "";
  }
}

function getSupplierName(supplier: any): string {
  if (!supplier) return "";

  return (
    toStringValue(supplier.name) ||
    toStringValue(supplier.supplierName) ||
    toStringValue(supplier.companyName) ||
    toStringValue(supplier.businessName) ||
    toStringValue(supplier.organizationName) ||
    toStringValue(supplier.company) ||
    toStringValue(supplier.title) ||
    toStringValue(supplier.displayName) ||
    toStringValue(supplier.panelName) ||
    ""
  );
}

function getSupplierEmail(supplier: any): string {
  if (!supplier) return "";

  return (
    toStringValue(supplier.email) ||
    toStringValue(supplier.contactEmail) ||
    toStringValue(supplier.supplierEmail) ||
    toStringValue(supplier.businessEmail) ||
    ""
  );
}

function getSupplierCode(supplier: any): string {
  if (!supplier) return "";

  return (
    toStringValue(supplier.supplierCode) ||
    toStringValue(supplier.code) ||
    toStringValue(supplier.panelCode) ||
    ""
  );
}

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    // ============================================================
    // AUTHENTICATED USER
    // ============================================================

    const userId = await getUserId();

    let user: any = null;
    let respondent: any = null;

    if (userId) {
      user = await User.findById(userId)
        .select("-password")
        .lean();

      if (user) {
        // ========================================================
        // FIND RESPONDENT
        // ========================================================

        const conditions: any[] = [
          {
            userId: user._id,
          },
        ];

        if (user.email) {
          conditions.push({
            email: String(user.email)
              .trim()
              .toLowerCase(),
          });
        }

        if (user.respondentId) {
          conditions.push({
            respondentId: user.respondentId,
          });
        }

        respondent = await Respondent.findOne({
          $or: conditions,
        })
          .populate(
            "panels",
            "name category country"
          )
          .lean();

        // ========================================================
        // CREATE RESPONDENT IF MISSING
        // ========================================================

        if (
          !respondent &&
          ["respondent", "user"].includes(
            String(user.role || "").toLowerCase()
          )
        ) {
          const activeSupply = await Supply.findOne({
            active: true,
          }).lean();

          const supplierCode =
            toStringValue(
              (activeSupply as any)?.supplierCode
            ) || "1452";

          const count =
            await Respondent.countDocuments({
              supplierCode,
            });

          const respondentId = `R${String(
            count + 1
          ).padStart(5, "0")}`;

          const names = String(user.name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

          const firstName =
            names[0] || "Respondent";

          const lastName =
            names.slice(1).join(" ") || "Member";

          const newResp =
            await Respondent.create({
              respondentId,
              userId: user._id,

              supplierCode,

              // Keep the actual supplier ID.
              supplierId:
                (activeSupply as any)?._id || null,

              firstName,
              lastName,

              name:
                user.name ||
                `${firstName} ${lastName}`,

              email: user.email
                ? String(user.email)
                    .trim()
                    .toLowerCase()
                : "",

              country: "US",
              status: "Active",

              qualityScore: 98.4,
              fraudRiskScore: 1.6,

              totalEarnings: 348.5,
              pendingEarnings: 42.5,
            });

          await User.findByIdAndUpdate(
            user._id,
            {
              respondentId:
                newResp.respondentId,
            }
          );

          respondent = newResp.toObject();
        }
      }
    }

    // ============================================================
    // FALLBACK RESPONDENT
    // ============================================================

    if (!respondent) {
      respondent = await Respondent.findOne({
        status: "Active",
      })
        .populate(
          "panels",
          "name category country"
        )
        .sort({
          createdAt: -1,
        })
        .lean();
    }

    if (!respondent) {
      return NextResponse.json(
        {
          success: false,
          error: "Respondent profile not found",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // SUPPLIER LOOKUP
    // ============================================================

    let supplier: any = null;
    let supplierSource = "";

    const respondentSupplierId =
      toObjectIdString(
        respondent.supplierId
      );

    const respondentSupplierCode =
      toStringValue(
        respondent.supplierCode
      );

    const userSupplierId = toObjectIdString(
      user?.supplierId
    );

    const userSupplierCode =
      toStringValue(user?.supplierCode);

    console.log(
      "========================================"
    );

    console.log(
      "Respondent:",
      respondent.respondentId
    );

    console.log(
      "Respondent supplierId:",
      respondentSupplierId
    );

    console.log(
      "Respondent supplierCode:",
      respondentSupplierCode
    );

    console.log(
      "User supplierId:",
      userSupplierId
    );

    console.log(
      "User supplierCode:",
      userSupplierCode
    );

    // ============================================================
    // 1. TRY SUPPLY BY RESPONDENT SUPPLIER ID
    // ============================================================

    if (respondentSupplierId) {
      try {
        supplier = await Supply.findById(
          respondentSupplierId
        ).lean();

        if (supplier) {
          supplierSource =
            "Supply / respondent.supplierId";
        }
      } catch (error) {
        console.error(
          "Supply lookup by respondent supplierId failed:",
          error
        );
      }
    }

    // ============================================================
    // 2. TRY SUPPLIER PANEL BY RESPONDENT SUPPLIER ID
    // ============================================================

    if (
      !supplier &&
      respondentSupplierId
    ) {
      try {
        supplier =
          await SupplierPanel.findById(
            respondentSupplierId
          ).lean();

        if (supplier) {
          supplierSource =
            "SupplierPanel / respondent.supplierId";
        }
      } catch (error) {
        console.error(
          "SupplierPanel lookup by respondent supplierId failed:",
          error
        );
      }
    }

    // ============================================================
    // 3. TRY SUPPLY BY RESPONDENT SUPPLIER CODE
    // ============================================================

    if (
      !supplier &&
      respondentSupplierCode
    ) {
      supplier = await Supply.findOne({
        supplierCode:
          respondentSupplierCode,
      }).lean();

      if (supplier) {
        supplierSource =
          "Supply / respondent.supplierCode";
      }
    }

    // ============================================================
    // 4. TRY SUPPLIER PANEL BY RESPONDENT CODE
    // ============================================================

    if (
      !supplier &&
      respondentSupplierCode
    ) {
      supplier =
        await SupplierPanel.findOne({
          $or: [
            {
              supplierCode:
                respondentSupplierCode,
            },
            {
              code:
                respondentSupplierCode,
            },
            {
              panelCode:
                respondentSupplierCode,
            },
          ],
        }).lean();

      if (supplier) {
        supplierSource =
          "SupplierPanel / respondent.supplierCode";
      }
    }

    // ============================================================
    // 5. TRY SUPPLY BY USER SUPPLIER ID
    // ============================================================

    if (
      !supplier &&
      userSupplierId
    ) {
      try {
        supplier = await Supply.findById(
          userSupplierId
        ).lean();

        if (supplier) {
          supplierSource =
            "Supply / user.supplierId";
        }
      } catch (error) {
        console.error(
          "Supply lookup by user supplierId failed:",
          error
        );
      }
    }

    // ============================================================
    // 6. TRY SUPPLIER PANEL BY USER SUPPLIER ID
    // ============================================================

    if (
      !supplier &&
      userSupplierId
    ) {
      try {
        supplier =
          await SupplierPanel.findById(
            userSupplierId
          ).lean();

        if (supplier) {
          supplierSource =
            "SupplierPanel / user.supplierId";
        }
      } catch (error) {
        console.error(
          "SupplierPanel lookup by user supplierId failed:",
          error
        );
      }
    }

    // ============================================================
    // 7. TRY SUPPLY BY USER SUPPLIER CODE
    // ============================================================

    if (
      !supplier &&
      userSupplierCode
    ) {
      supplier = await Supply.findOne({
        supplierCode:
          userSupplierCode,
      }).lean();

      if (supplier) {
        supplierSource =
          "Supply / user.supplierCode";
      }
    }

    // ============================================================
    // 8. TRY SUPPLIER PANEL BY USER CODE
    // ============================================================

    if (
      !supplier &&
      userSupplierCode
    ) {
      supplier =
        await SupplierPanel.findOne({
          $or: [
            {
              supplierCode:
                userSupplierCode,
            },
            {
              code:
                userSupplierCode,
            },
            {
              panelCode:
                userSupplierCode,
            },
          ],
        }).lean();

      if (supplier) {
        supplierSource =
          "SupplierPanel / user.supplierCode";
      }
    }

    // ============================================================
    // SUPPLIER DISPLAY DATA
    // ============================================================

    const resolvedSupplierName =
      getSupplierName(supplier);

    const resolvedSupplierEmail =
      getSupplierEmail(supplier);

    const resolvedSupplierCode =
      getSupplierCode(supplier);

    const supplierName =
      resolvedSupplierName ||
      respondentSupplierCode ||
      userSupplierCode
        ? resolvedSupplierName ||
          `Supplier ${
            respondentSupplierCode ||
            userSupplierCode
          }`
        : "Unknown Supplier";

    const supplierEmail =
      resolvedSupplierEmail;

    const supplierId =
      supplier?._id
        ? supplier._id.toString()
        : respondentSupplierId ||
          userSupplierId ||
          "";

    const supplierCode =
      resolvedSupplierCode ||
      respondentSupplierCode ||
      userSupplierCode ||
      "";

    // ============================================================
    // DEBUG
    // ============================================================

    console.log(
      "Found Supplier:",
      supplier
        ? {
            _id:
              supplier._id?.toString?.() ||
              supplier._id,
            name:
              supplier.name,
            supplierName:
              supplier.supplierName,
            companyName:
              supplier.companyName,
            businessName:
              supplier.businessName,
            email:
              supplier.email,
            supplierCode:
              supplier.supplierCode,
            code:
              supplier.code,
            panelCode:
              supplier.panelCode,
          }
        : null
    );

    console.log(
      "Supplier Result:",
      {
        supplierId,
        supplierCode,
        supplierName,
        supplierEmail,
        supplierSource,
      }
    );

    console.log(
      "========================================"
    );

    // ============================================================
    // LIVE PROJECTS
    // ============================================================

    const liveProjects =
      await Project.find({
        status: {
          $in: ["live", "draft"],
        },
      })
        .sort({
          createdAt: -1,
        })
        .limit(6)
        .lean();

    // ============================================================
    // OPPORTUNITIES
    // ============================================================

    const matchedOpportunities =
      liveProjects.map((p: any) => {
        const cpiVal = Number(
          p.cpi ||
            p.estimate?.estimatedCpi ||
            2.5
        );

        const points = Math.round(
          cpiVal * 100
        );

        const pidStr =
          p._id.toString();

        return {
          id: pidStr,

          surveyCode: `SRV-${pidStr
            .slice(-4)
            .toUpperCase()}`,

          title:
            p.surveyTitle ||
            "Consumer Opinion & Preference Study",

          category:
            p.audienceType === "b2b"
              ? "Technology"
              : "Lifestyle & Consumer",

          estimatedLoi:
            p.loi ||
            p.estimatedLoi ||
            10,

          rewardAmount:
            cpiVal,

          points,

          matchScore: 96,

          expiresInHours: 72,

          deviceAllowed: [
            "Desktop",
            "Mobile",
            "Tablet",
          ],

          qualificationHint:
            "Targeting consumers and business professionals in " +
            (p.country || "US"),

          difficulty:
            "Moderate" as const,

          status:
            "available" as const,
        };
      });

    // ============================================================
    // RESPONDENT HISTORY
    // ============================================================

    const sessions =
      await RespondentSession.find({
        $or: [
          {
            respondentId:
              respondent.respondentId,
          },
          {
            respondentId:
              respondent._id.toString(),
          },
        ],
      })
        .sort({
          createdAt: -1,
        })
        .limit(20)
        .populate(
          "project",
          "surveyTitle country cpi"
        )
        .lean();

    const sessionHistory =
      sessions.map((s: any) => ({
        id: s._id.toString(),

        surveyCode:
          `SRV-${
            s.project?._id
              ? s.project._id
                  .toString()
                  .slice(-4)
                  .toUpperCase()
              : "LIVE"
          }`,

        title:
          s.project?.surveyTitle ||
          "Consumer Research Study",

        completedAt:
          s.completedAt
            ? new Date(
                s.completedAt
              ).toLocaleDateString()
            : new Date(
                s.createdAt
              ).toLocaleDateString(),

        loiMinutes:
          s.durationSeconds
            ? Math.round(
                s.durationSeconds / 60
              )
            : 10,

        rewardEarned:
          s.status === "completed"
            ? s.project?.cpi || 2.5
            : 0.1,

        pointsEarned:
          s.status === "completed"
            ? Math.round(
                (s.project?.cpi ||
                  2.5) * 100
              )
            : 10,

        status:
          s.status === "completed"
            ? "approved"
            : s.status,
      }));

    // ============================================================
    // RESPONDENT RESPONSE
    // ============================================================

    const respondentResponse = {
      id: respondent._id.toString(),

      respondentId:
        respondent.respondentId ||
        "",

      name:
        respondent.name ||
        [
          respondent.firstName,
          respondent.lastName,
        ]
          .filter(Boolean)
          .join(" ") ||
        user?.name ||
        "Respondent",

      firstName:
        respondent.firstName ||
        "",

      lastName:
        respondent.lastName ||
        "",

      email:
        respondent.email ||
        user?.email ||
        "",

      country:
        respondent.country ||
        "US",

      qualityScore: Number(
        respondent.qualityScore ??
          98.4
      ),

      tierName:
        Number(
          respondent.qualityScore ??
            98.4
        ) >= 95
          ? "Gold Panelist"
          : "Silver Panelist",

      totalEarnings: Number(
        respondent.totalEarnings ??
          0
      ),

      pendingEarnings: Number(
        respondent.pendingEarnings ??
          0
      ),

      pointsBalance: Math.round(
        Number(
          respondent.pendingEarnings ??
            0
        ) * 100
      ),

      status:
        respondent.status ||
        "Active",

      panels:
        respondent.panels || [],

      // ========================================================
      // SUPPLIER
      // ========================================================

      supplier: {
        id: supplierId,

        name: supplierName,

        email: supplierEmail,

        supplierCode,

        status:
          supplier?.status ||
          "Active",
      },

      // Direct fields
      supplierId,

      supplierName,

      supplierEmail,

      supplierCode,
    };

    // ============================================================
    // FINAL RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        respondent:
          respondentResponse,

        opportunities:
          matchedOpportunities,

        history:
          sessionHistory,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error(
      "GET /api/respondent/profile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to load respondent profile",
      },
      {
        status: 500,
      }
    );
  }
}