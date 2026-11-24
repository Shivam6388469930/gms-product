import "server-only";

import bcrypt from "bcryptjs";
import User from "@/models/User";
import Supply from "@/models/Supply";

export const INTERNAL_SUPPLIER_CODE = "INTERNAL";
export const INTERNAL_SUPPLIER_NAME = "Internal Supplier";
export const INTERNAL_SUPPLIER_EMAIL = "internalsupplier@gmsresearch.com";

/**
 * Ensures that the system "Internal Supplier" exists in both the User
 * (role="supplier") and Supply collections. Returns the supplier User,
 * Supply record, and supplierCode.
 */
export async function getOrCreateInternalSupplier() {
  // 1. Look for existing supplier user
  let supplierUser = await User.findOne({
    role: "supplier",
    $or: [
      { supplierCode: INTERNAL_SUPPLIER_CODE },
      { email: INTERNAL_SUPPLIER_EMAIL },
      { name: { $regex: /^internal\s+supplier$/i } },
    ],
  });

  // 2. Look for existing Supply document
  let supplyRecord = await Supply.findOne({
    $or: [
      { supplierCode: INTERNAL_SUPPLIER_CODE },
      { supplierEmail: INTERNAL_SUPPLIER_EMAIL },
      { supplierName: { $regex: /^internal\s+supplier$/i } },
    ],
  });

  // 3. Create Supply record if missing
  if (!supplyRecord) {
    try {
      supplyRecord = await Supply.create({
        supplierName: INTERNAL_SUPPLIER_NAME,
        supplierCode: INTERNAL_SUPPLIER_CODE,
        supplierEmail: INTERNAL_SUPPLIER_EMAIL,
        country: "US",
        audienceType: "consumer",
        audienceDescription: "Internal respondent panel for direct platform participation",
        availableSample: 50000,
        baseCpi: 2.5,
        historicalIr: 80,
        averageLoi: 12,
        qualityScore: 98,
        active: true,
      });
    } catch (err: any) {
      console.warn("[Internal Supplier] Supply creation notice:", err?.message);
      supplyRecord = await Supply.findOne({ supplierCode: INTERNAL_SUPPLIER_CODE });
    }
  }

  // 4. Create Supplier User if missing
  if (!supplierUser) {
    try {
      const defaultPassword = await bcrypt.hash("InternalSupplierSecure123!", 10);
      supplierUser = await User.create({
        name: INTERNAL_SUPPLIER_NAME,
        email: INTERNAL_SUPPLIER_EMAIL,
        password: defaultPassword,
        role: "supplier",
        supplierCode: INTERNAL_SUPPLIER_CODE,
        supplierId: supplyRecord?._id || undefined,
        emailVerified: true,
        isBlocked: false,
      });
    } catch (err: any) {
      console.warn("[Internal Supplier] User creation notice:", err?.message);
      supplierUser = await User.findOne({ email: INTERNAL_SUPPLIER_EMAIL });
    }
  } else {
    // Ensure supplierCode and supplierId are properly bound
    let updated = false;
    if (supplierUser.supplierCode !== INTERNAL_SUPPLIER_CODE) {
      supplierUser.supplierCode = INTERNAL_SUPPLIER_CODE;
      updated = true;
    }
    if (supplyRecord && (!supplierUser.supplierId || supplierUser.supplierId.toString() !== supplyRecord._id.toString())) {
      supplierUser.supplierId = supplyRecord._id;
      updated = true;
    }
    if (updated) {
      await supplierUser.save().catch(() => {});
    }
  }

  return {
    supplierUser,
    supplierId: supplierUser?._id,
    supplierCode: INTERNAL_SUPPLIER_CODE,
    supplierName: INTERNAL_SUPPLIER_NAME,
    supply: supplyRecord,
  };
}
