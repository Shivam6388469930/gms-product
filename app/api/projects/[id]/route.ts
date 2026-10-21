import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   GET PROJECT
========================================================= */

export async function GET(
  _req: Request,
  { params }: Ctx
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return unauthorized();
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("Project not found", 404);
    }

    await connectDB();

    const project = await Project.findOne({
      _id: id,
      owner: userId,
    }).lean();

    if (!project) {
      return fail("Project not found", 404);
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return fail("Something went wrong", 500);
  }
}

/* =========================================================
   DELETE PROJECT
   Only draft projects can be deleted.
========================================================= */

export async function DELETE(
  _req: Request,
  { params }: Ctx
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return unauthorized();
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("Project not found", 404);
    }

    await connectDB();

    /*
     * Delete only if:
     * 1. Project exists
     * 2. Current user owns the project
     * 3. Project is still a draft
     */
    const deleted =
      await Project.findOneAndDelete({
        _id: id,
        owner: userId,
        status: "draft",
      });

    if (!deleted) {
      return fail(
        "Only draft projects can be deleted",
        409
      );
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    return fail("Something went wrong", 500);
  }
}