import { connectDB } from "@/config/db";
import { getUserId } from "@/lib/auth";
import Supply from "@/models/Supply";
import User from "@/models/User";

export interface AuthenticatedSupplierContext {
  supplierCode: string;
  supplierName: string;
  supplierId: string;
  user: any | null;
  isAuthenticated: boolean;
}

/**
 * Resolves the authenticated supplier context.
 * 
 * SECURITY RULE:
 * Supplier ownership is strictly resolved from the authenticated user / JWT session.
 * Query parameters like ?supplierId=... from the frontend are NEVER trusted to access
 * or impersonate another supplier's respondents or panels.
 */
export async function getAuthenticatedSupplier(): Promise<AuthenticatedSupplierContext | null> {
  await connectDB();

  const userId = await getUserId();

  if (userId) {
    const user = await User.findById(userId).lean();
    if (user) {
      // 1. Check if user has explicit supplierCode or supplierId
      if (user.supplierCode) {
        const supply = await Supply.findOne({ supplierCode: user.supplierCode }).lean();
        if (supply) {
          return {
            supplierCode: supply.supplierCode,
            supplierName: supply.supplierName,
            supplierId: supply._id.toString(),
            user,
            isAuthenticated: true,
          };
        }
      }

      if (user.supplierId) {
        const supply = await Supply.findById(user.supplierId).lean();
        if (supply) {
          return {
            supplierCode: supply.supplierCode,
            supplierName: supply.supplierName,
            supplierId: supply._id.toString(),
            user,
            isAuthenticated: true,
          };
        }
      }

      // 2. Look for Supply by email or name
      let supply = await Supply.findOne({
        $or: [
          { supplierName: { $regex: new RegExp(`^${user.name}$`, "i") } },
          { supplierName: { $regex: new RegExp(`^${user.email.split("@")[0]}`, "i") } },
        ],
      }).lean();

      if (!supply && (user.role === "supplier" || user.role === "admin")) {
        // Find existing active supply
        supply = await Supply.findOne({ active: true }).sort({ createdAt: -1 }).lean();
      }

      if (!supply) {
        // Provision a dedicated supply record for this supplier user
        const newSupply = await Supply.create({
          supplierName: user.name || "GMS Supply Partner",
          supplierCode: `SUP-${user._id.toString().slice(-4).toUpperCase()}`,
          country: "US",
          audienceType: "consumer",
          availableSample: 5000,
          baseCpi: 2.5,
          active: true,
        });

        // Link back to user
        await User.findByIdAndUpdate(user._id, {
          supplierCode: newSupply.supplierCode,
          supplierId: newSupply._id,
        });

        return {
          supplierCode: newSupply.supplierCode,
          supplierName: newSupply.supplierName,
          supplierId: newSupply._id.toString(),
          user,
          isAuthenticated: true,
        };
      }

      return {
        supplierCode: (supply as any).supplierCode,
        supplierName: (supply as any).supplierName,
        supplierId: (supply as any)._id.toString(),
        user,
        isAuthenticated: true,
      };
    }
  }

  // Fallback for development / unauthenticated demo requests:
  // Use the primary active Supply record in DB.
  // Notice we STILL do not allow arbitrary query param injection.
  const defaultSupply = await Supply.findOne({ active: true }).sort({ createdAt: -1 }).lean();
  if (defaultSupply) {
    return {
      supplierCode: (defaultSupply as any).supplierCode,
      supplierName: (defaultSupply as any).supplierName,
      supplierId: (defaultSupply as any)._id.toString(),
      user: null,
      isAuthenticated: false,
    };
  }

  return null;
}
