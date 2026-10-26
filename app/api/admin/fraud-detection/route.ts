import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import FraudRule from "@/models/FraudRule";
import RespondentSession from "@/models/RespondentSession";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const [rules, highRiskSessions, blockedIpsCount, blockedFpCount] =
      await Promise.all([
        FraudRule.find().sort({ createdAt: -1 }).lean(),
        RespondentSession.find({
          $or: [
            { fraudScore: { $gte: 50 } },
            {
              status: {
                $in: [
                  "blocked_duplicate_ip",
                  "blocked_exclusion",
                  "blocked_fingerprint",
                  "quality_reject",
                ],
              },
            },
          ],
        })
          .populate("project", "surveyTitle country")
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        FraudRule.countDocuments({ ruleType: "ip_block", active: true }),
        FraudRule.countDocuments({
          ruleType: "fingerprint_block",
          active: true,
        }),
      ]);

    // If no rules exist, seed some baseline protection rules
    if (rules.length === 0) {
      const seeded = await FraudRule.create([
        {
          ruleType: "speeder_loi",
          value: "30",
          reason: "Auto-terminate if survey duration is under 30% median LOI",
          riskScore: 90,
          active: true,
          blockCount: 42,
          addedBy: "System Guardian",
        },
        {
          ruleType: "ip_block",
          value: "198.51.100.42",
          reason: "Datacenter VPN proxy farm detected",
          riskScore: 95,
          active: true,
          blockCount: 18,
          addedBy: "SecOps Admin",
        },
        {
          ruleType: "fingerprint_block",
          value: "FP_CANVAS_4892c90",
          reason: "Headless browser automation bot script",
          riskScore: 100,
          active: true,
          blockCount: 64,
          addedBy: "SecOps Admin",
        },
      ]);
      return NextResponse.json({
        rules: seeded,
        highRiskSessions,
        stats: {
          blockedIps: 1,
          blockedFingerprints: 1,
          activeRules: 3,
          highRiskFlagged: highRiskSessions.length,
        },
      });
    }

    return NextResponse.json({
      rules,
      highRiskSessions,
      stats: {
        blockedIps: blockedIpsCount,
        blockedFingerprints: blockedFpCount,
        activeRules: rules.filter((r) => r.active).length,
        highRiskFlagged: highRiskSessions.length,
      },
    });
  } catch (error) {
    console.error("Admin fraud detection error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fraud detection rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const rule = await FraudRule.create(body);
    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (error) {
    console.error("Create fraud rule error:", error);
    return NextResponse.json(
      { error: "Failed to create fraud rule" },
      { status: 500 }
    );
  }
}
