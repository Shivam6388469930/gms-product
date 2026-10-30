import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/config/db";
import { getUserId } from "@/lib/auth";

import User from "@/models/User";
import Respondent from "@/models/Respondent";
import PanelRespondent from "@/models/PanelRespondent";
import RespondentSession from "@/models/RespondentSession";
import SupplierPanel from "@/models/SupplierPanel";

const ALLOWED_STATUSES = ["Active", "Inactive", "Blocked", "Suspended"];

/**
 * Same identity source as /api/supplier/panels and POST /api/supplier/respondents:
 * JWT -> userId -> User document.
 */
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

/** Respondent must belong to this supplier (by supplierId, not supplierCode). */
function buildQuery(id: string, supplierId: any) {
  const isMongoId = mongoose.Types.ObjectId.isValid(id);

  return {
    supplierId,
    ...(isMongoId
      ? { $or: [{ _id: id }, { respondentId: id }] }
      : { respondentId: id }),
  };
}

const unauthorized = () =>
  NextResponse.json(
    { success: false, error: "Supplier context not found or unauthorized" },
    { status: 401 }
  );

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const supplierCtx = await getCurrentSupplier();
    if (!supplierCtx) return unauthorized();

    const respondent: any = await Respondent.findOne(
      buildQuery(id, supplierCtx.supplierId)
    )
      .populate(
        "panels",
        "name category country status respondentCount activeRespondentCount qualityScore"
      )
      .lean();

    if (!respondent) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Respondent not found or does not belong to your supplier account",
        },
        { status: 404 }
      );
    }

    const recentSessions = await RespondentSession.find({
      $or: [
        { respondentId: respondent.respondentId },
        { respondentId: respondent._id.toString() },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("project", "surveyTitle country cpi sampleSize")
      .lean();

    const activities = recentSessions.map((s: any) => ({
      id: s._id.toString(),
      projectId: s.project?._id
        ? `PRJ-${s.project._id.toString().slice(-4).toUpperCase()}`
        : "PRJ-LIVE",
      projectTitle: s.project?.surveyTitle || "Consumer Research Study",
      startedAt: s.startedAt || s.createdAt,
      completedAt: s.completedAt || null,
      durationMinutes: s.durationSeconds ? Math.round(s.durationSeconds / 60) : 0,
      outcome: s.status,
      reward: s.status === "completed" ? s.project?.cpi || 2.5 : 0,
      qualityScore: Math.max(0, 100 - (s.fraudScore || 0)),
      fraudRisk: s.fraudScore || 0,
      ip: s.ip || "127.0.0.1",
      device: s.userAgent?.toLowerCase().includes("mobi") ? "Mobile" : "Desktop",
    }));

    return NextResponse.json({ success: true, respondent, activities });
  } catch (error: any) {
    console.error("GET /api/supplier/respondents/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load respondent" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* PUT                                                                        */
/* -------------------------------------------------------------------------- */

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const supplierCtx = await getCurrentSupplier();
    if (!supplierCtx) return unauthorized();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const respondent: any = await Respondent.findOne(
      buildQuery(id, supplierCtx.supplierId)
    );

    if (!respondent) {
      return NextResponse.json(
        { success: false, error: "Respondent not found" },
        { status: 404 }
      );
    }

    const oldStatus = respondent.status;

    // ---------------- Email change: must stay unique ----------------
    if (body.email) {
      const newEmail = String(body.email).toLowerCase().trim();

      if (newEmail !== respondent.email) {
        const emailTaken = await User.findOne({
          email: newEmail,
          _id: { $ne: respondent.userId },
        }).lean();

        if (emailTaken) {
          return NextResponse.json(
            {
              success: false,
              error: "A user account already exists with this email address",
            },
            { status: 409 }
          );
        }

        respondent.email = newEmail;
      }
    }

    // ---------------- Status validation ----------------
    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(String(body.status))) {
        return NextResponse.json(
          { success: false, error: "Invalid status value" },
          { status: 400 }
        );
      }
      respondent.status = body.status;
    }

    // ---------------- Age validation ----------------
    if (body.age !== undefined && body.age !== "" && body.age !== null) {
      const age = Number(body.age);
      if (!Number.isFinite(age) || age < 13 || age > 120) {
        return NextResponse.json(
          { success: false, error: "Age must be between 13 and 120" },
          { status: 400 }
        );
      }
      respondent.age = age;
    }

    // ---------------- Quality score validation ----------------
    if (body.qualityScore !== undefined) {
      const q = Number(body.qualityScore);
      if (!Number.isFinite(q) || q < 0 || q > 100) {
        return NextResponse.json(
          { success: false, error: "Quality score must be between 0 and 100" },
          { status: 400 }
        );
      }
      respondent.qualityScore = q;
    }

    // ---------------- Plain editable fields ----------------
    if (body.firstName) respondent.firstName = String(body.firstName).trim();
    if (body.lastName) respondent.lastName = String(body.lastName).trim();
    if (body.firstName || body.lastName) {
      respondent.name = `${respondent.firstName} ${respondent.lastName}`.trim();
    }

    if (body.phone !== undefined) respondent.phone = body.phone;
    if (body.externalId !== undefined) respondent.externalId = body.externalId;
    if (body.country) respondent.country = body.country;
    if (body.state !== undefined) respondent.state = body.state;
    if (body.city !== undefined) respondent.city = body.city;
    if (body.gender) respondent.gender = body.gender;
    if (body.dateOfBirth !== undefined) respondent.dateOfBirth = body.dateOfBirth;
    if (body.employment !== undefined) respondent.employment = body.employment;
    if (body.industry !== undefined) respondent.industry = body.industry;
    if (body.jobTitle !== undefined) respondent.jobTitle = body.jobTitle;
    if (body.education !== undefined) respondent.education = body.education;
    if (body.incomeRange !== undefined) respondent.incomeRange = body.incomeRange;
    if (body.demographics) respondent.demographics = body.demographics;

    await respondent.save();

    // ---------------- Keep the login account in sync ----------------
    const userUpdate: Record<string, any> = {
      name: respondent.name,
      email: respondent.email,
    };

    if (body.status !== undefined) {
      userUpdate.isBlocked =
        respondent.status === "Blocked" || respondent.status === "Suspended";
    }

    await User.updateOne({ _id: respondent.userId }, { $set: userUpdate });

    // ---------------- Keep panel active counters in sync ----------------
    if (oldStatus !== respondent.status && respondent.panels?.length) {
      const wasActive = oldStatus === "Active";
      const isActive = respondent.status === "Active";

      if (wasActive !== isActive) {
        await SupplierPanel.updateMany(
          { _id: { $in: respondent.panels } },
          { $inc: { activeRespondentCount: isActive ? 1 : -1 } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Respondent profile updated successfully",
      respondent,
    });
  } catch (error: any) {
    console.error("PUT /api/supplier/respondents/[id] error:", error);

    if (error?.code === 11000) {
      const field = Object.keys(error?.keyPattern || error?.keyValue || {}).join(", ");
      return NextResponse.json(
        {
          success: false,
          error: field ? `Duplicate value for: ${field}` : "Duplicate value",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update respondent" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE                                                                     */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const supplierCtx = await getCurrentSupplier();
    if (!supplierCtx) return unauthorized();

    const respondent: any = await Respondent.findOne(
      buildQuery(id, supplierCtx.supplierId)
    );

    if (!respondent) {
      return NextResponse.json(
        { success: false, error: "Respondent not found" },
        { status: 404 }
      );
    }

    // Decrement the correct panel counters
    if (respondent.panels?.length) {
      await SupplierPanel.updateMany(
        { _id: { $in: respondent.panels } },
        {
          $inc: {
            respondentCount: -1,
            activeRespondentCount: respondent.status === "Active" ? -1 : 0,
          },
        }
      );
    }

    // Remove panel junction records, respondent, and the auto-created login account
    await PanelRespondent.deleteMany({ respondentId: respondent._id });
    await Respondent.deleteOne({ _id: respondent._id });

    if (respondent.userId) {
      await User.deleteOne({ _id: respondent.userId, role: "respondent" });
    }

    return NextResponse.json({
      success: true,
      message: `Respondent ${respondent.name} deleted successfully`,
    });
  } catch (error: any) {
    console.error("DELETE /api/supplier/respondents/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete respondent" },
      { status: 500 }
    );
  }
}