import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import Respondent from "@/models/Respondent";
import User from "@/models/User";
import Supply from "@/models/Supply";
import SupplierPanel from "@/models/SupplierPanel";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const respondent: any = await Respondent.findById(id).lean();

    if (!respondent) {
      return NextResponse.json(
        { success: false, error: "Respondent not found" },
        { status: 404 }
      );
    }

    const [user, supplier, panels] = await Promise.all([
      User.findById(respondent.userId)
        .select(
          "_id name email role emailVerified isBlocked mustChangePassword respondentId createdAt"
        )
        .lean(),

      respondent.supplierId
        ? Supply.findById(respondent.supplierId)
            .select(
              "_id supplierName supplierCode supplierEmail country audienceType audienceDescription availableSample baseCpi historicalIr averageLoi qualityScore active lastUpdatedAt"
            )
            .lean()
        : null,

      respondent.panels?.length
        ? SupplierPanel.find({ _id: { $in: respondent.panels } })
            .select("_id name category country status respondentCount activeRespondentCount")
            .lean()
        : [],
    ]);

    return NextResponse.json({
      success: true,
      respondent: {
        ...respondent,
        user,
        supplier,
        panels,
      },
    });
  } catch (error) {
    console.error("GET admin respondent detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch respondent" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const respondent: any = await Respondent.findById(id);

    if (!respondent) {
      return NextResponse.json(
        { success: false, error: "Respondent not found" },
        { status: 404 }
      );
    }

    const allowedFields = [
      "externalId",
      "firstName",
      "lastName",
      "phone",
      "country",
      "state",
      "city",
      "gender",
      "dateOfBirth",
      "age",
      "employment",
      "industry",
      "jobTitle",
      "education",
      "incomeRange",
      "status",
      "qualityScore",
      "fraudRiskScore",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        respondent[field] =
          typeof body[field] === "string"
            ? body[field].trim()
            : body[field];
      }
    }

    if (body.firstName !== undefined || body.lastName !== undefined) {
      respondent.name =
        `${respondent.firstName || ""} ${respondent.lastName || ""}`.trim();
    }

    if (body.supplierId !== undefined) {
      const supplier = await Supply.findById(body.supplierId).lean();

      if (!supplier) {
        return NextResponse.json(
          { success: false, error: "Supplier not found" },
          { status: 404 }
        );
      }

      respondent.supplierId = supplier._id;
      respondent.supplierCode = String(supplier.supplierCode || "").trim();

      if (body.panelId) {
        const panel = await SupplierPanel.findOne({
          _id: body.panelId,
          supplierId: supplier._id,
        }).lean();

        if (!panel) {
          return NextResponse.json(
            { success: false, error: "Panel does not belong to this supplier" },
            { status: 400 }
          );
        }

        respondent.panelId = panel._id;
        respondent.panels = [panel._id];
      } else {
        respondent.panelId = undefined;
        respondent.panels = [];
      }
    } else if (body.panelId !== undefined) {
      const panel = await SupplierPanel.findById(body.panelId).lean();

      if (!panel) {
        return NextResponse.json(
          { success: false, error: "Panel not found" },
          { status: 404 }
        );
      }

      if (
        respondent.supplierId &&
        String(panel.supplierId) !== String(respondent.supplierId)
      ) {
        return NextResponse.json(
          { success: false, error: "Panel does not belong to respondent supplier" },
          { status: 400 }
        );
      }

      respondent.panelId = panel._id;
      respondent.panels = [panel._id];
    }

    await respondent.save();

    if (respondent.userId) {
      const userUpdate: Record<string, any> = {};

      if (body.firstName !== undefined || body.lastName !== undefined) {
        userUpdate.name = respondent.name;
      }

      if (body.email !== undefined) {
        const email = String(body.email).trim().toLowerCase();

        const duplicate = await User.findOne({
          email,
          _id: { $ne: respondent.userId },
        }).lean();

        if (duplicate) {
          return NextResponse.json(
            { success: false, error: "Another user already uses this email" },
            { status: 409 }
          );
        }

        userUpdate.email = email;
        userUpdate.password = await bcrypt.hash(email, 10);
        userUpdate.mustChangePassword = true;
        respondent.email = email;
        await respondent.save();
      }

      if (body.status !== undefined) {
        userUpdate.isBlocked =
          body.status === "Blocked" || body.status === "Suspended";
      }

      if (Object.keys(userUpdate).length) {
        await User.findByIdAndUpdate(respondent.userId, userUpdate);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Respondent updated successfully",
      respondent,
    });
  } catch (error: any) {
    console.error("PATCH admin respondent error:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update respondent" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const respondent: any = await Respondent.findById(id);

    if (!respondent) {
      return NextResponse.json(
        { success: false, error: "Respondent not found" },
        { status: 404 }
      );
    }

    // Soft-delete: preserve respondent history and sessions.
    respondent.status = "Blocked";
    await respondent.save();

    if (respondent.userId) {
      await User.findByIdAndUpdate(respondent.userId, {
        isBlocked: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Respondent blocked successfully",
    });
  } catch (error) {
    console.error("DELETE admin respondent error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to block respondent" },
      { status: 500 }
    );
  }
}
