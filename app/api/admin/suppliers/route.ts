// app/api/admin/suppliers/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongoose";
import Supply from "@/models/Supply";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10)
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || "20", 10)
      )
    );

    const search = searchParams.get("search")?.trim() || "";
    const country = searchParams.get("country")?.trim() || "";
    const audienceType =
      searchParams.get("audienceType")?.trim() || "";
    const active = searchParams.get("active");

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        {
          supplierName: {
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
        {
          supplierEmail: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (country) {
      query.country = {
        $regex: country,
        $options: "i",
      };
    }

    if (audienceType) {
      query.audienceType = audienceType;
    }

    if (active !== null && active !== "") {
      query.active = active === "true";
    }

    const [suppliers, total] = await Promise.all([
      Supply.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Supply.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin suppliers GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch suppliers",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  let createdSupplierId: string | null = null;

  try {
    await connectDB();

    const body = await request.json();

    const supplierName = String(body.supplierName || "").trim();
    const supplierCode = String(body.supplierCode || "").trim();
    const supplierEmail = String(body.supplierEmail || "")
      .trim()
      .toLowerCase();

    const country = String(body.country || "").trim();

    const audienceType = String(
      body.audienceType || "consumer"
    ).trim();

    const audienceDescription = String(
      body.audienceDescription || ""
    ).trim();

    const availableSample = Number(body.availableSample || 0);
    const baseCpi = Number(body.baseCpi || 0);
    const historicalIr = Number(body.historicalIr || 0);
    const averageLoi = Number(body.averageLoi || 0);
    const qualityScore = Number(body.qualityScore || 0);

    // -----------------------------------------
    // Validation
    // -----------------------------------------

    if (!supplierName) {
      return NextResponse.json(
        {
          success: false,
          error: "Supplier name is required",
        },
        { status: 400 }
      );
    }

    if (!supplierCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Supplier code is required",
        },
        { status: 400 }
      );
    }

    if (!supplierEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Supplier email is required",
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(supplierEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid supplier email",
        },
        { status: 400 }
      );
    }

    if (!country) {
      return NextResponse.json(
        {
          success: false,
          error: "Country is required",
        },
        { status: 400 }
      );
    }

    if (
      !["consumer", "b2b", "healthcare"].includes(
        audienceType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid audience type",
        },
        { status: 400 }
      );
    }

    if (qualityScore < 0 || qualityScore > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Quality score must be between 0 and 100",
        },
        { status: 400 }
      );
    }

    if (historicalIr < 0 || historicalIr > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Historical IR must be between 0 and 100",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Check duplicate supply record
    // -----------------------------------------

    const existingSupply = await Supply.findOne({
      supplierCode,
      country,
      audienceType,
    }).lean();

    if (existingSupply) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A supplier with this supplier code, country and audience type already exists",
        },
        { status: 409 }
      );
    }

    // -----------------------------------------
    // Check supplier email/user
    // -----------------------------------------

    const existingUser = await User.findOne({
      email: supplierEmail,
    }).lean();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This email is already registered to another user",
        },
        { status: 409 }
      );
    }

    // -----------------------------------------
    // Create Supply
    // -----------------------------------------

    const supplier = await Supply.create({
      supplierName,
      supplierCode,
      supplierEmail,
      country,
      audienceType,
      audienceDescription,

      availableSample,
      baseCpi,
      historicalIr,
      averageLoi,
      qualityScore,

      active: true,
      lastUpdatedAt: new Date(),
    });

    createdSupplierId = supplier._id.toString();

    // -----------------------------------------
    // Supplier login
    //
    // Email:
    // supplierEmail
    //
    // Initial password:
    // supplierEmail
    //
    // Password is HASHED before storing.
    // -----------------------------------------

    const hashedPassword = await bcrypt.hash(
      supplierEmail,
      12
    );

    const supplierUser = await User.create({
      name: supplierName,
      email: supplierEmail,
      password: hashedPassword,

      role: "supplier",

      emailVerified: true,
      isBlocked: false,

      supplierCode,
      supplierId: supplier._id,
    });

    // -----------------------------------------
    // Success
    // -----------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Supplier and supplier login created successfully",

        supplier: {
          _id: supplier._id,
          supplierName: supplier.supplierName,
          supplierCode: supplier.supplierCode,
          supplierEmail: supplier.supplierEmail,
          country: supplier.country,
          audienceType: supplier.audienceType,
          availableSample: supplier.availableSample,
          baseCpi: supplier.baseCpi,
          historicalIr: supplier.historicalIr,
          averageLoi: supplier.averageLoi,
          qualityScore: supplier.qualityScore,
          active: supplier.active,
        },

        user: {
          _id: supplierUser._id,
          name: supplierUser.name,
          email: supplierUser.email,
          role: supplierUser.role,
          supplierId: supplierUser.supplierId,
          supplierCode: supplierUser.supplierCode,
        },

        login: {
          email: supplierEmail,
          initialPassword: supplierEmail,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error(
      "Admin create supplier error:",
      error
    );

    // -----------------------------------------
    // Rollback supplier if User creation failed
    // -----------------------------------------

    if (createdSupplierId) {
      try {
        await Supply.findByIdAndDelete(
          createdSupplierId
        );
      } catch (rollbackError) {
        console.error(
          "Supplier rollback failed:",
          rollbackError
        );
      }
    }

    // Mongo duplicate key
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Duplicate supplier or supplier user already exists",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create supplier",
      },
      {
        status: 500,
      }
    );
  }
}