import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]/settings
 * Returns soft launch, exclusion list, and webhook settings.
 */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Project not found", 404);

    await connectDB();

    const project = await Project.findOne({ _id: id, owner: userId })
      .select("softLaunch exclusionList webhooks")
      .lean();
    if (!project) return fail("Project not found", 404);

    return NextResponse.json({ success: true, settings: project });
  } catch (error) {
    console.error("Settings GET error:", error);
    return fail("Something went wrong", 500);
  }
}

/**
 * PATCH /api/projects/[id]/settings
 * Updates soft launch, exclusion list, and/or webhook settings.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Project not found", 404);

    await connectDB();

    const project = await Project.findOne({ _id: id, owner: userId });
    if (!project) return fail("Project not found", 404);

    const body = await req.json().catch(() => ({}));

    // Soft launch settings
    if (body.softLaunch !== undefined) {
      const sl = body.softLaunch;
      if (typeof sl.enabled === "boolean") project.softLaunch.enabled = sl.enabled;
      if (typeof sl.threshold === "number" && sl.threshold >= 1 && sl.threshold <= 10000) {
        project.softLaunch.threshold = sl.threshold;
      }
    }

    // Exclusion list
    if (Array.isArray(body.exclusionList)) {
      // Deduplicate and trim
      const cleaned = [...new Set(
        body.exclusionList
          .map((id: unknown) => String(id).trim())
          .filter((id: string) => id.length > 0)
      )];
      project.exclusionList = cleaned;
    }

    // Webhooks
    if (Array.isArray(body.webhooks)) {
      const validEvents = [
        "respondent.complete",
        "respondent.screenout",
        "respondent.quota_full",
        "project.complete",
        "project.soft_launch_paused",
      ];

      const validWebhooks = body.webhooks
        .filter((wh: any) =>
          wh.event &&
          validEvents.includes(wh.event) &&
          wh.url &&
          typeof wh.url === "string" &&
          wh.url.startsWith("http")
        )
        .map((wh: any) => ({
          event: wh.event,
          url: wh.url.trim(),
          secret: wh.secret || "",
          active: wh.active !== false,
        }));

      project.webhooks = validWebhooks;
    }

    await project.save();

    return NextResponse.json({
      success: true,
      message: "Settings updated",
      settings: {
        softLaunch: project.softLaunch,
        exclusionList: project.exclusionList,
        webhooks: project.webhooks,
      },
    });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return fail("Something went wrong", 500);
  }
}
