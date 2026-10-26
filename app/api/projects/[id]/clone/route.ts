import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";
import { estimateProject } from "@/lib/feasibility";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/clone
 * Clones an existing project with all settings, creating a new draft.
 */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Project not found", 404);

    await connectDB();

    const source = await Project.findOne({ _id: id, owner: userId }).lean();
    if (!source) return fail("Project not found", 404);

    const src = source as any;

    // Re-run feasibility for current supply data
    let estimate;
    try {
      estimate = await estimateProject({
        surveyTitle: src.surveyTitle,
        country: src.country,
        audienceType: src.audienceType,
        audienceDescription: src.audienceDescription || "",
        sampleSize: src.sampleSize,
        loi: src.loi,
        ir: src.ir,
        targeting: src.targeting || {},
      });
    } catch {
      estimate = src.estimate;
    }

    const clone = await Project.create({
      owner: userId,
      surveyTitle: `${src.surveyTitle} (Copy)`,
      country: src.country,
      audienceType: src.audienceType,
      audienceDescription: src.audienceDescription || "",
      sampleSize: src.sampleSize,
      loi: src.loi,
      ir: src.ir,
      estimate,
      targeting: src.targeting || {},
      screener: src.screener || { enabled: true, blockDuplicateIp: true, strictIpTermination: true, questions: [] },
      softLaunch: src.softLaunch || { enabled: false, threshold: 10, autopaused: false },
      exclusionList: src.exclusionList || [],
      webhooks: src.webhooks || [],
      surveySetup: {
        surveyUrl: "",
        surveyType: src.surveySetup?.surveyType || "external",
        estimatedLoi: src.loi,
        redirectUrl: "",
        terminationUrl: "",
        qualificationUrl: "",
        status: "not_configured",
      },
      status: "draft",
      progress: {
        starts: 0,
        completes: 0,
        screenouts: 0,
        quotaFull: 0,
        qualityRejects: 0,
        spend: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project cloned successfully",
      project: clone,
    }, { status: 201 });
  } catch (error) {
    console.error("Clone project error:", error);
    return fail("Something went wrong", 500);
  }
}
