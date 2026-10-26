import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import { getUserId } from "@/lib/auth";
import { generateDefaultScreenerQuestions } from "@/lib/screener-helper";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]/screener
 * Fetches screener config and questions.
 * If no custom questions exist yet, generates default demographic screener questions.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid project ID" }, { status: 400 });
    }

    await connectDB();
    const project = await Project.findOne({
      _id: id,
      owner: userId,
    }).lean();

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    let screener = project.screener;
    const defaults = generateDefaultScreenerQuestions(project as any);

    if (!screener || !screener.questions || screener.questions.length === 0) {
      screener = {
        enabled: screener?.enabled ?? true,
        blockDuplicateIp: screener?.blockDuplicateIp ?? true,
        strictIpTermination: screener?.strictIpTermination ?? true,
        questions: defaults,
      };
    }

    return NextResponse.json({
      success: true,
      screener,
      suggestedTemplates: defaults,
    });
  } catch (error) {
    console.error("Screener GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load screener" }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/screener
 * Adds a new question to the screener.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid project ID" }, { status: 400 });
    }

    const body = await req.json();
    const { question } = body;

    if (!question || !question.questionText || !Array.isArray(question.options) || question.options.length < 2) {
      return NextResponse.json(
        { success: false, message: "Question must have text and at least 2 options" },
        { status: 400 }
      );
    }

    // Ensure at least one option qualifies
    const hasQualifying = question.options.some((o: any) => o.isQualifying === true);
    if (!hasQualifying) {
      return NextResponse.json(
        { success: false, message: "At least one option must be marked as qualifying" },
        { status: 400 }
      );
    }

    await connectDB();
    const project = await Project.findOne({
      _id: id,
      owner: userId,
    });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (!project.screener) {
      project.screener = {
        enabled: true,
        blockDuplicateIp: true,
        strictIpTermination: true,
        questions: [],
      };
    }

    const questionId = question.id || `scr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const formattedQuestion = {
      id: questionId,
      questionText: String(question.questionText).trim(),
      category: question.category || "custom",
      type: question.type || "single_choice",
      terminationReason: question.terminationReason || "Does not meet study screening criteria.",
      options: question.options.map((opt: any, idx: number) => ({
        id: opt.id || `opt_${idx + 1}`,
        label: String(opt.label || "").trim(),
        isQualifying: Boolean(opt.isQualifying),
      })),
    };

    project.screener.questions.push(formattedQuestion as any);
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Question added to screener successfully.",
      question: formattedQuestion,
      screener: project.screener,
    });
  } catch (error) {
    console.error("Screener POST error:", error);
    return NextResponse.json({ success: false, message: "Failed to add question" }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]/screener
 * Updates screener configuration and full questions list.
 */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid project ID" }, { status: 400 });
    }

    const body = await req.json();
    const { enabled, blockDuplicateIp, strictIpTermination, questions } = body;

    await connectDB();
    const project = await Project.findOne({
      _id: id,
      owner: userId,
    });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (!project.screener) {
      project.screener = {
        enabled: true,
        blockDuplicateIp: true,
        strictIpTermination: true,
        questions: [],
      };
    }

    if (typeof enabled === "boolean") project.screener.enabled = enabled;
    if (typeof blockDuplicateIp === "boolean") project.screener.blockDuplicateIp = blockDuplicateIp;
    if (typeof strictIpTermination === "boolean") project.screener.strictIpTermination = strictIpTermination;

    if (Array.isArray(questions)) {
      project.screener.questions = questions.map((q: any) => ({
        id: q.id || `scr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        questionText: String(q.questionText || "").trim(),
        category: q.category || "custom",
        type: q.type || "single_choice",
        terminationReason: q.terminationReason || "Does not meet study screening criteria.",
        options: (q.options || []).map((opt: any, idx: number) => ({
          id: opt.id || `opt_${idx + 1}`,
          label: String(opt.label || "").trim(),
          isQualifying: Boolean(opt.isQualifying),
        })),
      })) as any;
    }

    await project.save();

    return NextResponse.json({
      success: true,
      message: "Screener configuration saved successfully.",
      screener: project.screener,
    });
  } catch (error) {
    console.error("Screener update error:", error);
    return NextResponse.json({ success: false, message: "Failed to update screener" }, { status: 500 });
  }
}

export const PATCH = PUT;

/**
 * DELETE /api/projects/[id]/screener
 * Removes a question by questionId from the screener.
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const questionId = req.nextUrl.searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ success: false, message: "Missing questionId parameter" }, { status: 400 });
    }

    await connectDB();
    const project = await Project.findOne({
      _id: id,
      owner: userId,
    });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.screener && Array.isArray(project.screener.questions)) {
      project.screener.questions = project.screener.questions.filter(
        (q: any) => q.id !== questionId
      ) as any;
      await project.save();
    }

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully.",
      screener: project.screener,
    });
  } catch (error) {
    console.error("Screener DELETE error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete question" }, { status: 500 });
  }
}
