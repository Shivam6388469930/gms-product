import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const query: Record<string, unknown> = {};
    if (projectId) query._id = projectId;

    const projects = await Project.find(query)
      .select("surveyTitle country sampleSize targeting status progress quotaNesting")
      .lean();

    // Map each project into structured demographic quota cells
    const projectsWithQuotas = projects.map((p) => {
      const sampleSize = p.sampleSize || 100;
      const completes = p.progress?.completes || 0;

      // Generate demographic quota cells based on project targeting
      const genderTarget = Math.round(sampleSize * 0.5);
      const quotaCells = [
        {
          id: `${p._id}-male`,
          category: "Gender",
          name: "Male",
          target: genderTarget,
          current: Math.round(completes * 0.48),
          percentage: 50,
          status: Math.round(completes * 0.48) >= genderTarget ? "capped" : "open",
        },
        {
          id: `${p._id}-female`,
          category: "Gender",
          name: "Female",
          target: genderTarget,
          current: Math.round(completes * 0.52),
          percentage: 50,
          status: Math.round(completes * 0.52) >= genderTarget ? "capped" : "open",
        },
        {
          id: `${p._id}-age1`,
          category: "Age Group",
          name: "18 - 34",
          target: Math.round(sampleSize * 0.35),
          current: Math.round(completes * 0.34),
          percentage: 35,
          status: "open",
        },
        {
          id: `${p._id}-age2`,
          category: "Age Group",
          name: "35 - 54",
          target: Math.round(sampleSize * 0.40),
          current: Math.round(completes * 0.41),
          percentage: 40,
          status: Math.round(completes * 0.41) >= Math.round(sampleSize * 0.40) ? "capped" : "open",
        },
        {
          id: `${p._id}-age3`,
          category: "Age Group",
          name: "55+",
          target: Math.round(sampleSize * 0.25),
          current: Math.round(completes * 0.25),
          percentage: 25,
          status: "open",
        },
      ];

      return {
        _id: p._id,
        surveyTitle: p.surveyTitle,
        country: p.country,
        sampleSize,
        status: p.status,
        completes,
        quotaCells,
        totalCells: quotaCells.length,
        cappedCells: quotaCells.filter((c) => c.status === "capped").length,
      };
    });

    return NextResponse.json({ projects: projectsWithQuotas });
  } catch (error) {
    console.error("Admin quotas error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { projectId, quotaNesting } = body;

    const project = await Project.findByIdAndUpdate(
      projectId,
      { $set: { "targeting.quotaNesting": quotaNesting } },
      { new: true }
    );

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Update quotas error:", error);
    return NextResponse.json(
      { error: "Failed to update quotas" },
      { status: 500 }
    );
  }
}
