import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";
import { parseProjectInput } from "@/lib/project-validation";
import { estimateProject } from "@/lib/feasibility";

// Live quote for the create form. Nothing is saved.
export async function POST(req: Request) {
  try {
    if (!(await getUserId())) return unauthorized();

    const parsed = parseProjectInput(await req.json().catch(() => null), false);
    if (!parsed.ok) return fail(parsed.message);

    await connectDB();
    return NextResponse.json({ success: true, estimate: await estimateProject(parsed.value) });
  } catch (error) {
    console.error("Estimate error:", error);
    return fail("Something went wrong", 500);
  }
}