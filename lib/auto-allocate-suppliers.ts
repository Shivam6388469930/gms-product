import "server-only";

import { Types } from "mongoose";
import ProjectSupply from "@/models/ProjectSupply";
import SupplierAllocation from "@/models/SupplierAllocation";
import SupplierProject from "@/models/SupplierProject";
import Supply from "@/models/Supply";
import User from "@/models/User";

type SupplierPlanItem = {
  supplyId: string;
  supplierName: string;
  supplierCode: string;
  supplierEmail: string;
  availableSample: number;
  baseCpi: number;
  allocatedSample: number;
  priority: number;
};

export type SupplierAllocationPlan = {
  sampleSize: number;
  suppliers: SupplierPlanItem[];
};

export class SupplierAllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupplierAllocationError";
  }
}

export async function buildSupplierAllocationPlan(
  country: string,
  audienceType: "consumer" | "b2b" | "healthcare",
  sampleSize: number
): Promise<SupplierAllocationPlan> {
  // Find all active supplies
  let supplies = await Supply.find({
    country,
    audienceType,
    active: true,
  })
    .sort({ qualityScore: -1 })
    .lean();

  // If no supply strictly matches country and audience, find any active supplies
  if (!supplies.length) {
    supplies = await Supply.find({ active: true })
      .sort({ qualityScore: -1 })
      .lean();
  }

  // Also query all active supplier users so no registered supplier is missed
  const supplierUsers = await User.find({
    role: "supplier",
    active: { $ne: false },
  }).lean();

  // If supplies still empty, synthesize plan items from registered supplier users
  if (!supplies.length && supplierUsers.length) {
    const perSupplier = Math.ceil(sampleSize / supplierUsers.length);
    return {
      sampleSize,
      suppliers: supplierUsers.map((u, i) => ({
        supplyId: u._id.toString(),
        supplierName: u.name || "Partner Supplier",
        supplierCode: u.supplierCode || `SUP-${String(i + 1).padStart(3, "0")}`,
        supplierEmail: u.email,
        availableSample: perSupplier * 10,
        baseCpi: 2.5,
        allocatedSample: perSupplier,
        priority: i + 1,
      })),
    };
  }

  // If absolutely no supplies and no supplier users exist, return empty plan without erroring
  if (!supplies.length && !supplierUsers.length) {
    return {
      sampleSize,
      suppliers: [],
    };
  }

  // Distribute sampleSize among all eligible suppliers
  const count = supplies.length;
  const evenShare = count > 0 ? Math.ceil(sampleSize / count) : sampleSize;

  return {
    sampleSize,
    suppliers: supplies.map((supply, index) => ({
      supplyId: supply._id.toString(),
      supplierName: supply.supplierName,
      supplierCode: supply.supplierCode,
      supplierEmail: supply.supplierEmail,
      availableSample: Number(supply.availableSample || 1000),
      baseCpi: Number(supply.baseCpi || 2.5),
      allocatedSample: evenShare,
      priority: index + 1,
    })),
  };
}

export async function assignSuppliersToProject(
  project: {
    _id: Types.ObjectId;
    owner: Types.ObjectId;
    surveyTitle?: string;
    audienceType: string;
    country: string;
    loi: number;
    ir: number;
    audienceDescription?: string;
  },
  plan: SupplierAllocationPlan
) {
  const projectId = project._id;
  const supplyIds = plan.suppliers.map(
    (supplier) => new Types.ObjectId(supplier.supplyId)
  );

  const supplierCodes = plan.suppliers.map(
    (supplier) => supplier.supplierCode
  );
  const supplierEmails = plan.suppliers.map(
    (supplier) => supplier.supplierEmail
  );

  // Fetch all suppliers, project owner, and already-removed suppliers
  const [allSupplierUsers, owner, removedAllocations] = await Promise.all([
    User.find({
      role: "supplier",
    })
      .select("_id name supplierCode supplierId email")
      .lean(),
    User.findById(project.owner).select("name").lean(),
    SupplierAllocation.find({
      project: projectId,
      status: "removed",
    })
      .select("supplierId")
      .lean(),
  ]);

  const removedSupplierIds = new Set(
    removedAllocations.map((allocation) => allocation.supplierId.toString())
  );

  await ProjectSupply.deleteMany({ project: projectId });

  // Only insert ProjectSupply if supplies are valid ObjectId
  const validSupplies = plan.suppliers.filter((s) => Types.ObjectId.isValid(s.supplyId));
  if (validSupplies.length) {
    await ProjectSupply.insertMany(
      validSupplies.map((supplier) => ({
        project: projectId,
        supply: new Types.ObjectId(supplier.supplyId),
        allocatedSample: supplier.allocatedSample,
        allocatedCpi: supplier.baseCpi,
        routingPercent:
          plan.sampleSize > 0
            ? (supplier.allocatedSample / plan.sampleSize) * 100
            : 0,
        priority: supplier.priority,
        status: "active",
        allocatedAt: new Date(),
      }))
    );
  }

  await SupplierAllocation.deleteMany({
    project: projectId,
    status: { $ne: "removed" },
  });

  const allocatedSupplierIds = new Set<string>();
  const totalSuppliers = allSupplierUsers.filter(
    (u) => !removedSupplierIds.has(u._id.toString())
  ).length;

  const defaultShare = totalSuppliers > 0 ? Math.ceil(plan.sampleSize / totalSuppliers) : plan.sampleSize;

  for (const supplierUser of allSupplierUsers) {
    const sId = supplierUser._id.toString();
    if (removedSupplierIds.has(sId) || allocatedSupplierIds.has(sId)) {
      continue;
    }

    allocatedSupplierIds.add(sId);

    // Check if plan had custom item for this supplier
    const planItem = plan.suppliers.find(
      (s) =>
        s.supplyId === sId ||
        s.supplierCode === supplierUser.supplierCode ||
        s.supplierEmail === supplierUser.email
    );

    const allocSample = planItem?.allocatedSample || defaultShare;
    const allocCpi = planItem?.baseCpi || 2.5;
    const supCode = supplierUser.supplierCode || planItem?.supplierCode || `SUP-${sId.slice(-4).toUpperCase()}`;

    const supplyObjectId =
      planItem?.supplyId && Types.ObjectId.isValid(planItem.supplyId)
        ? new Types.ObjectId(planItem.supplyId)
        : supplierUser.supplierId && Types.ObjectId.isValid(String(supplierUser.supplierId))
        ? new Types.ObjectId(String(supplierUser.supplierId))
        : undefined;

    await SupplierAllocation.create({
      project: projectId,
      supplierId: supplierUser._id,
      supplierCode: supCode,
      ...(supplyObjectId ? { supply: supplyObjectId } : {}),
      allocatedSample: allocSample,
      allocatedCpi: allocCpi,
      routingPercent:
        plan.sampleSize > 0 ? (allocSample / plan.sampleSize) * 100 : 0,
      priority: 1,
      status: "active",
      allocatedAt: new Date(),
    });

    await SupplierProject.findOneAndUpdate(
      {
        supplierCode: supCode,
        projectId: projectId.toString(),
      },
      {
        $set: {
          title: project.surveyTitle || "Survey Study",
          clientName: owner?.name || "Buyer",
          audience: project.audienceType,
          country: project.country,
          sampleRequired: allocSample,
          cpi: allocCpi,
          totalValue: allocSample * allocCpi,
          loi: project.loi || 10,
          ir: project.ir || 30,
          status: "active",
          deadlineDate: new Date(Date.now() + 14 * 86400000)
            .toISOString()
            .split("T")[0],
          description: project.audienceDescription || "",
        },
      },
      { upsert: true, new: true }
    );
  }
}
