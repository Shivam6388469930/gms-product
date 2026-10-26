import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/Project";
import Supply from "@/models/Supply";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const [projects, supplies] = await Promise.all([
      Project.find({ status: { $in: ["live", "paused", "draft"] } })
        .select("surveyTitle country sampleSize status")
        .lean(),
      Supply.find({ active: true })
        .select("supplierName supplierCode country baseCpi")
        .lean(),
    ]);

    const baseUrl = process.env.APP_URL || "https://gms-product.vercel.app";

    // Generate link combinations
    const links = [];
    for (const p of projects.slice(0, 8)) {
      for (const s of supplies.slice(0, 4)) {
        const entryUrl = `${baseUrl}/survey/start?pid=${p._id}&sup=${s.supplierCode}&rid=[RID]`;
        const testUrl = `${baseUrl}/survey/start?pid=${p._id}&sup=${s.supplierCode}&rid=TEST_RESP_${Date.now().toString().slice(-4)}&test=1`;

        links.push({
          id: `${p._id}_${s.supplierCode}`,
          projectId: p._id,
          projectTitle: p.surveyTitle,
          supplierCode: s.supplierCode,
          supplierName: s.supplierName,
          country: p.country,
          entryUrl,
          testUrl,
          returnUrls: {
            complete: `${baseUrl}/survey/redirect?status=complete&sup=${s.supplierCode}&rid=[RID]`,
            screenout: `${baseUrl}/survey/redirect?status=screenout&sup=${s.supplierCode}&rid=[RID]`,
            quotaFull: `${baseUrl}/survey/redirect?status=quotafull&sup=${s.supplierCode}&rid=[RID]`,
            security: `${baseUrl}/survey/redirect?status=security&sup=${s.supplierCode}&rid=[RID]`,
          },
          status: p.status === "live" ? "active" : "standby",
        });
      }
    }

    return NextResponse.json({
      links,
      projects,
      suppliers: supplies,
      baseUrl,
    });
  } catch (error) {
    console.error("Admin supplier links error:", error);
    return NextResponse.json(
      { error: "Failed to generate supplier links" },
      { status: 500 }
    );
  }
}
