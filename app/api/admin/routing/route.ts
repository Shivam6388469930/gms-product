import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import RoutingRule from "@/models/RoutingRule";
import Project from "@/models/Project";
import Supply from "@/models/Supply";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const [rules, projects, supplies] = await Promise.all([
      RoutingRule.find().populate("project", "surveyTitle country").lean(),
      Project.find({ status: { $in: ["live", "paused"] } })
        .select("surveyTitle country sampleSize")
        .lean(),
      Supply.find({ active: true })
        .select("supplierName supplierCode country qualityScore baseCpi")
        .lean(),
    ]);

    // If no rules exist yet, create default seed rules from projects
    if (rules.length === 0 && projects.length > 0) {
      const defaultRule = await RoutingRule.create({
        name: "Standard Waterfall Allocation",
        project: projects[0]._id,
        strategy: "weighted_allocation",
        suppliers: supplies.slice(0, 3).map((s, idx) => ({
          supplierCode: s.supplierCode,
          supplierName: s.supplierName,
          priority: idx + 1,
          allocationPercent: idx === 0 ? 50 : idx === 1 ? 30 : 20,
          maxCompletes: 150,
          currentCompletes: Math.round(Math.random() * 80),
          active: true,
        })),
        fallbackAction: "screenout_redirect",
        active: true,
      });
      return NextResponse.json({
        rules: [defaultRule],
        projects,
        availableSuppliers: supplies,
      });
    }

    return NextResponse.json({
      rules,
      projects,
      availableSuppliers: supplies,
    });
  } catch (error) {
    console.error("Admin routing error:", error);
    return NextResponse.json(
      { error: "Failed to fetch routing rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const rule = await RoutingRule.create(body);
    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (error) {
    console.error("Create routing rule error:", error);
    return NextResponse.json(
      { error: "Failed to create routing rule" },
      { status: 500 }
    );
  }
}
