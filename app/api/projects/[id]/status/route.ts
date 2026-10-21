import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const TRANSITIONS: Record<string, { from: string[]; to: string }> = {
  launch: { from: ["draft"], to: "live" },
  pause: { from: ["live"], to: "paused" },
  resume: { from: ["paused"], to: "live" },
  stop: { from: ["live", "paused"], to: "stopped" },
};

export async function POST(req: Request, { params }: Ctx) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    const { action } = (await req.json().catch(() => ({}))) as { action?: string };
    const rule = action ? TRANSITIONS[action] : undefined;

    if (!rule) return fail("Action must be launch, pause, resume or stop");
    if (!isValidObjectId(id)) return fail("Project not found", 404);

    await connectDB();
    const project = await Project.findOne({ _id: id, owner: userId });
    if (!project) return fail("Project not found", 404);

    if (!rule.from.includes(project.status)) {
      return fail(`Can't ${action} a project that is ${project.status}`, 409);
    }

    project.status = rule.to;
    if (action === "launch") project.launchedAt = new Date();
    if (action === "stop") project.stoppedAt = new Date();
    // TODO: hand off to your sample routing engine here (start / pause / stop traffic).
    await project.save();

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Project status error:", error);
    return fail("Something went wrong", 500);
  }
}