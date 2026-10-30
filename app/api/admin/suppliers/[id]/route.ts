import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongoose";
import Supply from "@/models/Supply";
import User from "@/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const supplier = await Supply.findById(id).lean();

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error("Admin get supplier error:", error);

    return NextResponse.json(
      { error: "Failed to fetch supplier" },
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

    // --------------------------------------------------
    // Find existing supplier
    // --------------------------------------------------
    const existingSupplier = await Supply.findById(id);

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Normalize fields
    // --------------------------------------------------
    const updateData = {
      ...body,
    };

    if (typeof updateData.supplierName === "string") {
      updateData.supplierName = updateData.supplierName.trim();
    }

    if (typeof updateData.supplierEmail === "string") {
      updateData.supplierEmail = updateData.supplierEmail
        .trim()
        .toLowerCase();
    }

    if (typeof updateData.supplierCode === "string") {
      updateData.supplierCode = updateData.supplierCode.trim();
    }

    // --------------------------------------------------
    // Validate supplier email
    // --------------------------------------------------
    if (
      updateData.supplierEmail !== undefined &&
      !updateData.supplierEmail
    ) {
      return NextResponse.json(
        { error: "Supplier email is required" },
        { status: 400 }
      );
    }

    if (
      updateData.supplierEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.supplierEmail)
    ) {
      return NextResponse.json(
        { error: "Please provide a valid supplier email" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Find linked supplier user
    // --------------------------------------------------
    const linkedUser = await User.findOne({
      supplierId: existingSupplier._id,
      role: "supplier",
    });

    // --------------------------------------------------
    // If supplier email changes
    // --------------------------------------------------
    if (
      updateData.supplierEmail &&
      updateData.supplierEmail !== existingSupplier.supplierEmail
    ) {
      const emailOwner = await User.findOne({
        email: updateData.supplierEmail,
        _id: { $ne: linkedUser?._id },
      });

      if (emailOwner) {
        return NextResponse.json(
          {
            error: "This email is already registered with another user",
          },
          { status: 409 }
        );
      }
    }

    // --------------------------------------------------
    // Update Supplier
    // --------------------------------------------------
    const supplier = await Supply.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Update linked Supplier User
    // --------------------------------------------------
    if (linkedUser) {
      const userUpdate: Record<string, any> = {};

      if (updateData.supplierName !== undefined) {
        userUpdate.name = updateData.supplierName;
      }

      if (updateData.supplierCode !== undefined) {
        userUpdate.supplierCode = updateData.supplierCode;
      }

      // ----------------------------------------------
      // Email changed
      // Password remains supplier email
      // ----------------------------------------------
      if (
        updateData.supplierEmail &&
        updateData.supplierEmail !== linkedUser.email
      ) {
        userUpdate.email = updateData.supplierEmail;

        // Initial/login password = supplier email
        userUpdate.password = await bcrypt.hash(
          updateData.supplierEmail,
          10
        );
      }

      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(
          linkedUser._id,
          userUpdate,
          {
            new: true,
            runValidators: true,
          }
        );
      }
    }

    // --------------------------------------------------
    // If linked User does not exist
    // Create it automatically
    // --------------------------------------------------
    if (!linkedUser) {
      const supplierEmail =
        supplier.supplierEmail?.trim().toLowerCase();

      if (supplierEmail) {
        const existingUser = await User.findOne({
          email: supplierEmail,
        });

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(
            supplierEmail,
            10
          );

          await User.create({
            name: supplier.supplierName,
            email: supplierEmail,
            password: hashedPassword,
            role: "supplier",
            emailVerified: true,
            isBlocked: false,
            supplierCode: supplier.supplierCode,
            supplierId: supplier._id,
          });
        } else if (
          existingUser.role === "supplier" &&
          !existingUser.supplierId
        ) {
          // Link an existing supplier user
          await User.findByIdAndUpdate(existingUser._id, {
            supplierId: supplier._id,
            supplierCode: supplier.supplierCode,
          });
        }
      }
    }

    // --------------------------------------------------
    // Return updated supplier
    // --------------------------------------------------
    return NextResponse.json({
      success: true,
      supplier,
      message: "Supplier updated successfully",
    });
  } catch (error: any) {
    console.error("Admin update supplier error:", error);

    // Mongo duplicate key
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          error:
            "Supplier or supplier user with these details already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error?.message || "Failed to update supplier",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const supplier = await Supply.findById(id);

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Delete supplier
    // --------------------------------------------------
    await Supply.findByIdAndDelete(id);

    // --------------------------------------------------
    // Block linked supplier user instead of deleting it
    // --------------------------------------------------
    // This keeps the user record for audit/history.
    await User.updateMany(
      {
        supplierId: supplier._id,
        role: "supplier",
      },
      {
        $set: {
          isBlocked: true,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete supplier error:", error);

    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}