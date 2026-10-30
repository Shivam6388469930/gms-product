import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/config/db";
import "@/models/User";
import Project from "@/models/Project";
import Supply from "@/models/Supply";
import ProjectSupply from "@/models/ProjectSupply";
import SupplierAllocation from "@/models/SupplierAllocation";
import { getCurrentUser } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resolve the supplier's Supply document strictly from the logged-in user. */
async function resolveSupply(currentUser: any) {
  const supplierCode = currentUser.supplierCode || "";

  const or: Record<string, any>[] = [];
  if (supplierCode) or.push({ supplierCode });
  if (currentUser.supplierId) or.push({ _id: currentUser.supplierId });
  if (currentUser.name) {
    or.push({
      supplierName: {
        $regex: new RegExp(`^${escapeRegex(String(currentUser.name))}$`, "i"),
      },
    });
  }

  const supplyDoc: any = or.length
    ? await Supply.findOne({ $or: or }).lean()
    : null;

  return {
    supplyDoc,
    supplierCode: supplierCode || supplyDoc?.supplierCode || "",
  };
}

/** Allocation filter that identifies "this supplier's" allocations. */
function buildOwnerOr(currentUser: any, supplierCode: string, supplyDoc: any) {
  return [
    { supplierId: currentUser._id },
    ...(supplierCode ? [{ supplierCode }] : []),
    ...(supplyDoc ? [{ supply: supplyDoc._id }] : []),
  ];
}

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const currentUser: any = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const isSupplier = currentUser.role === "supplier";
    const isAdmin =
      currentUser.role === "admin" || currentUser.role === "manager";

    if (!isSupplier && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Supplier access required",
          message: "Forbidden: Supplier access required",
        },
        { status: 403 }
      );
    }

    const { supplyDoc, supplierCode } = await resolveSupply(currentUser);

    const baseUrl = process.env.APP_URL || "http://localhost:3000";

    const allocQuery: Record<string, any> = {};
    if (!isAdmin) {
      allocQuery.$or = buildOwnerOr(currentUser, supplierCode, supplyDoc);
    }

    let allocations: any[] = await SupplierAllocation.find(allocQuery)
      .populate({
        path: "project",
        populate: { path: "owner", select: "name email" },
      })
      .sort({ allocatedAt: -1 })
      .lean();

    // Fallback: backfill from ProjectSupply when no allocation exists yet
    if (allocations.length === 0 && supplyDoc) {
      const psList: any[] = await ProjectSupply.find({ supply: supplyDoc._id })
        .populate({
          path: "project",
          populate: { path: "owner", select: "name email" },
        })
        .sort({ allocatedAt: -1 })
        .lean();

      for (const ps of psList) {
        if (ps.project) {
          await SupplierAllocation.findOneAndUpdate(
            { project: ps.project._id, supplierId: currentUser._id },
            {
              $setOnInsert: {
                project: ps.project._id,
                supplierId: currentUser._id,
                supplierCode: supplierCode || "SUP-001",
                supply: supplyDoc._id,
                allocatedSample: ps.allocatedSample || 100,
                allocatedCpi: ps.allocatedCpi || 2.5,
                routingPercent: ps.routingPercent || 100,
                priority: ps.priority || 1,
                status: ps.status || "active",
                allocatedAt: ps.allocatedAt || new Date(),
              },
            },
            { upsert: true, new: true }
          );
        }
      }

      allocations = await SupplierAllocation.find(allocQuery)
        .populate({
          path: "project",
          populate: { path: "owner", select: "name email" },
        })
        .sort({ allocatedAt: -1 })
        .lean();
    }

    // Every project this supplier already has a decision on (incl. declined)
    const handledProjectIds = new Set<string>();
    const allocatedProjects: any[] = [];

    for (const alloc of allocations) {
      const p = alloc.project;
      if (!p) continue;

      const pidStr = p._id.toString();
      handledProjectIds.add(pidStr);

      // Declined projects are hidden everywhere and never come back as incoming
      if (alloc.status === "declined") continue;

      const status =
        alloc.status === "paused" || p.status === "paused"
          ? "paused"
          : alloc.status === "completed" || p.status === "completed"
          ? "completed"
          : "active";

      const sampleReq = alloc.allocatedSample || p.sampleSize || 100;
      const sampleDel = alloc.actualCompletes || p.progress?.completes || 0;
      const cpiVal = alloc.allocatedCpi || p.cpi || supplyDoc?.baseCpi || 2.5;

      allocatedProjects.push({
        id: pidStr,
        projectId: `PRJ-${pidStr.slice(-4).toUpperCase()}`,
        title: p.surveyTitle || "Live Research Study",
        clientName: p.owner?.name || "Client Research Team",
        audience: (p.audienceType || "consumer").toLowerCase(),
        country: p.country || "US",
        sampleRequired: sampleReq,
        sampleDelivered: sampleDel,
        cpi: cpiVal,
        totalValue: Math.round(sampleReq * cpiVal * 100) / 100,
        loi: p.loi || 10,
        ir: p.ir || 30,
        status,
        receivedDate: new Date(alloc.allocatedAt || p.createdAt)
          .toISOString()
          .split("T")[0],
        deadlineDate: new Date(
          new Date(p.createdAt || Date.now()).getTime() + 14 * 86400000
        )
          .toISOString()
          .split("T")[0],
        surveyUrlTemplate: `${baseUrl}/survey/start?pid=${pidStr}&sup=${
          supplierCode || "SUP"
        }&rid=[RID]`,
        qualityScoreRequired: 80,
        description:
          p.audienceDescription ||
          `Targeting respondents in ${p.country || "US"} for ${
            p.surveyTitle || "research study"
          }.`,
      });
    }

    // Projects with no decision yet are incoming opportunities
    const unallocatedProjects: any[] = await Project.find({
      _id: { $nin: Array.from(handledProjectIds) },
      status: { $in: ["live", "draft", "paused"] },
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const incomingProjects = unallocatedProjects.map((p: any) => {
      const pidStr = p._id.toString();
      const sampleReq = p.sampleSize || 250;
      const cpiVal = Number(p.estimate?.estimatedCpi || 2.5);

      return {
        id: pidStr,
        projectId: `PRJ-${pidStr.slice(-4).toUpperCase()}`,
        title: p.surveyTitle || "Targeted Consumer Survey",
        clientName: p.owner?.name || "Corporate Client",
        audience: (p.audienceType || "consumer").toLowerCase(),
        country: p.country || "US",
        sampleRequired: sampleReq,
        sampleDelivered: 0,
        cpi: cpiVal,
        totalValue: Math.round(sampleReq * cpiVal * 100) / 100,
        loi: p.loi || 10,
        ir: p.ir || 30,
        status: "incoming",
        receivedDate: new Date(p.createdAt || Date.now())
          .toISOString()
          .split("T")[0],
        deadlineDate: new Date(
          new Date(p.createdAt || Date.now()).getTime() + 14 * 86400000
        )
          .toISOString()
          .split("T")[0],
        surveyUrlTemplate: `${baseUrl}/survey/start?pid=${pidStr}&sup=${
          supplierCode || "SUP"
        }&rid=[RID]`,
        qualityScoreRequired: 80,
        description:
          p.audienceDescription ||
          `Targeting audience in ${p.country || "US"} (${
            p.audienceType || "consumer"
          }).`,
      };
    });

    let result = [...allocatedProjects, ...incomingProjects];
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    return NextResponse.json({
      success: true,
      supplierCode,
      supplierId: currentUser._id,
      projects: result,
      counts: {
        total: result.length,
        incoming: result.filter((p) => p.status === "incoming").length,
        active: result.filter((p) => p.status === "active").length,
        paused: result.filter((p) => p.status === "paused").length,
        completed: result.filter((p) => p.status === "completed").length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/supplier/projects error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* PATCH  { projectId, action: accept | decline | togglePause | complete }     */
/* -------------------------------------------------------------------------- */

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error, message: error }, { status });

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const currentUser: any = await getCurrentUser();
    if (!currentUser) return fail("Unauthorized", 401);

    if (currentUser.role !== "supplier") {
      return fail("Forbidden: Supplier access required", 403);
    }

    if (currentUser.isBlocked) {
      return fail("Your supplier account is blocked.", 403);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail("Invalid JSON payload", 400);
    }

    const projectId = String(body.projectId || "").trim();
    const action = String(body.action || "").trim();

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return fail("A valid projectId is required", 400);
    }

    if (!["accept", "decline", "togglePause", "complete"].includes(action)) {
      return fail("Invalid action", 400);
    }

    // supplier identity comes ONLY from the session, never from the body
    const { supplyDoc, supplierCode } = await resolveSupply(currentUser);

    const project: any = await Project.findById(projectId).lean();
    if (!project) return fail("Project not found", 404);

    const ownerOr = buildOwnerOr(currentUser, supplierCode, supplyDoc);

    const existing: any = await SupplierAllocation.findOne({
      project: project._id,
      $or: ownerOr,
    });

    /* ------------------------------ ACCEPT -------------------------------- */
    if (action === "accept") {
      if (existing && existing.status !== "declined") {
        // Already accepted: make sure it is running unless it was completed
        if (existing.status === "paused") {
          existing.status = "active";
          await existing.save();
        }
        return NextResponse.json({
          success: true,
          message: "Project already accepted",
          status: existing.status,
        });
      }

      if (!["live", "draft", "paused"].includes(String(project.status))) {
        return fail("This project is no longer open for supply", 409);
      }

      const sampleReq = Number(project.sampleSize) || 250;
      const cpiVal = Number(project.estimate?.estimatedCpi || 2.5);

      if (existing) {
        // Previously declined: reactivate
        existing.status = "active";
        existing.allocatedAt = new Date();
        await existing.save();
      } else {
        await SupplierAllocation.findOneAndUpdate(
          { project: project._id, supplierId: currentUser._id },
          {
            $set: { status: "active" },
            $setOnInsert: {
              project: project._id,
              supplierId: currentUser._id,
              supplierCode: supplierCode || "SUP-001",
              ...(supplyDoc ? { supply: supplyDoc._id } : {}),
              allocatedSample: sampleReq,
              allocatedCpi: cpiVal,
              routingPercent: 100,
              priority: 1,
              allocatedAt: new Date(),
            },
          },
          { upsert: true, new: true }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Project accepted and activated",
        status: "active",
      });
    }

    /* ------------------------------ DECLINE ------------------------------- */
    if (action === "decline") {
      if (existing && existing.status !== "declined") {
        if (["active", "paused", "completed"].includes(existing.status)) {
          return fail(
            "An accepted project cannot be declined. Pause or complete it instead.",
            409
          );
        }
      }

      // Record the decision so the project does not come back as incoming
      await SupplierAllocation.findOneAndUpdate(
        { project: project._id, supplierId: currentUser._id },
        {
          $set: { status: "declined" },
          $setOnInsert: {
            project: project._id,
            supplierId: currentUser._id,
            supplierCode: supplierCode || "SUP-001",
            ...(supplyDoc ? { supply: supplyDoc._id } : {}),
            allocatedSample: 0,
            allocatedCpi: Number(project.estimate?.estimatedCpi || 2.5),
            routingPercent: 0,
            priority: 1,
            allocatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Project declined",
        status: "declined",
      });
    }

    /* ---------------------- TOGGLE PAUSE / COMPLETE ------------------------ */
    if (!existing || existing.status === "declined") {
      return fail("Project is not accepted by your supplier account", 404);
    }

    if (action === "togglePause") {
      if (existing.status === "completed") {
        return fail("A completed project cannot be paused or resumed", 409);
      }

      existing.status = existing.status === "paused" ? "active" : "paused";
      await existing.save();

      return NextResponse.json({
        success: true,
        message:
          existing.status === "paused" ? "Project paused" : "Project resumed",
        status: existing.status,
      });
    }

    if (action === "complete") {
      existing.status = "completed";
      await existing.save();

      return NextResponse.json({
        success: true,
        message: "Project marked as completed",
        status: "completed",
      });
    }

    return fail("Unsupported action", 400);
  } catch (error: any) {
    console.error("PATCH /api/supplier/projects error:", error);
    return fail(error?.message || "Failed to update project", 500);
  }
}