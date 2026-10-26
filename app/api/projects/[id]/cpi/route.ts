import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import AuditLog from "@/models/AuditLog";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";
import { dispatchWebhooks } from "@/lib/webhooks";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/projects/[id]/cpi
 * Live CPI Override: In PureSpectrum & Cint, buyers can adjust CPI dynamically
 * while a project is live to accelerate sample delivery or control spend.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Invalid project ID", 400);

    const body = await req.json();
    const newCpi = Number(body.targetCpi);

    if (isNaN(newCpi) || newCpi <= 0) {
      return fail("Target CPI must be a positive number", 400);
    }

    await connectDB();

    const project = await Project.findOne({
      _id: id,
      $or: [{ owner: userId }, { user: userId }],
    });
    if (!project) return fail("Project not found", 404);

    const oldCpi = Number(project.estimate?.estimatedCpi || 0);

    // Update estimated CPI
    project.estimate = project.estimate || {};
    project.estimate.estimatedCpi = newCpi;

    // Recalculate estimated total cost based on remaining completes
    const sampleSize = Number(project.sampleSize || 0);
    project.estimate.estimatedTotalCost = Math.round(sampleSize * newCpi * 100) / 100;

    await project.save();

    // Audit log
    await AuditLog.create({
      actorId: userId,
      resource: "project",
      resourceId: String(project._id),
      action: "CPI_OVERRIDE",
      metadata: {
        oldCpi,
        newCpi,
        updatedAt: new Date(),
        reason: body.reason || "Live CPI adjustment",
      },
    }).catch(() => {});

    // Dispatch webhook
    try {
      dispatchWebhooks((project.webhooks || []) as any[], "project.cpi_updated", {
        projectId: String(project._id),
        oldCpi,
        newCpi,
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `CPI updated from $${oldCpi.toFixed(2)} to $${newCpi.toFixed(2)}`,
      estimatedCpi: newCpi,
      estimatedTotalCost: project.estimate.estimatedTotalCost,
    });
  } catch (error) {
    console.error("CPI override error:", error);
    return fail("Failed to update CPI", 500);
  }
}
