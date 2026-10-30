import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/config/db";
import SurveySession from "@/models/SurveySession";
import Project from "@/models/Project";
import Respondent from "@/models/Respondent";
import SupplierAllocation from "@/models/SupplierAllocation";
import SupplierPanel from "@/models/SupplierPanel";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/survey/session
 * Generates a secure SurveySession connecting:
 * Respondent + Supplier + Panel + Project + Survey
 * Generates opaque random sessionToken; public URLs do not expose MongoDB IDs.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    let {
      projectId,
      respondentId,
      panelId,
      supplierId,
      supplierCode,
    } = body;

    // Optional authentication check: if respondent is logged in, attach their record
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.role === "respondent" && !respondentId) {
      const resp = await Respondent.findOne({
        $or: [
          { userId: currentUser._id },
          { email: currentUser.email.toLowerCase() },
          ...(currentUser.respondentId ? [{ respondentId: currentUser.respondentId }] : []),
        ],
      });
      if (resp) {
        respondentId = resp.respondentId;
        if (!panelId && resp.panelId) panelId = resp.panelId.toString();
        if (!supplierId && resp.supplierId) supplierId = resp.supplierId.toString();
      }
    }

    // Validate project
    let project: any = null;
    if (projectId) {
      project = await Project.findById(projectId);
    }
    if (!project) {
      project = await Project.findOne({ status: { $in: ["live", "draft"] } }).sort({ createdAt: -1 });
    }
    if (!project) {
      return NextResponse.json(
        { success: false, message: "No active survey project found" },
        { status: 404 }
      );
    }

    // Resolve Respondent (either registered with userId or survey-only with userId=null)
    let respondentDoc: any = null;
    if (respondentId) {
      respondentDoc = await Respondent.findOne({
        $or: [
          { respondentId },
          { email: respondentId.toLowerCase() },
        ],
      });
    }

    if (!respondentDoc) {
      // Find or provision a valid respondent under the supplier/panel
      respondentDoc = await Respondent.findOne({ status: "Active" }).sort({ createdAt: -1 });
    }

    if (!respondentDoc) {
      // Create survey-only respondent (userId = null)
      const supplierUser = await User.findOne({ role: "supplier" });
      const tempId = `R${Math.floor(10000 + Math.random() * 90000)}`;
      respondentDoc = await Respondent.create({
        respondentId: tempId,
        userId: undefined, // survey-only respondent, no login required
        supplierId: supplierUser?._id,
        supplierCode: supplierUser?.supplierCode || "SUP-001",
        firstName: "Survey",
        lastName: "Guest",
        name: "Survey Guest",
        email: `guest-${tempId}@survey.gms`,
        country: project.country || "US",
        status: "Active",
      });
    }

    // Resolve Supplier
    let supplierUser = await User.findById(respondentDoc.supplierId);
    if (!supplierUser) {
      supplierUser = await User.findOne({ role: "supplier" });
    }

    // Resolve Panel
    let panelDoc: any = null;
    const pId = panelId || respondentDoc.panelId || (respondentDoc.panels?.[0]);
    if (pId) {
      panelDoc = await SupplierPanel.findById(pId);
    }
    if (!panelDoc && supplierUser) {
      panelDoc = await SupplierPanel.findOne({ supplierId: supplierUser._id });
    }

    // Calculate CPI and Reward
    const cpi = Number(project.estimate?.estimatedCpi || project.cpi || 2.5);
    const rewardAmount = Math.round(cpi * 0.7 * 100) / 100;

    // Secure opaque random session token
    const sessionToken = crypto.randomBytes(24).toString("hex");

    const session = await SurveySession.create({
      sessionToken,
      respondent: respondentDoc._id,
      respondentId: respondentDoc.respondentId,
      supplier: supplierUser?._id,
      supplierCode: respondentDoc.supplierCode || supplierUser?.supplierCode || "SUP-001",
      panel: panelDoc?._id,
      project: project._id,
      surveyId: project.surveySetup?.surveyUrl || `SRV-${project._id.toString().slice(-4).toUpperCase()}`,
      status: "invited",
      cpi,
      rewardAmount,
      targetSurveyUrl: project.surveySetup?.surveyUrl || "",
      startedAt: new Date(),
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const publicUrl = `${appUrl}/survey/session/${sessionToken}`;

    return NextResponse.json(
      {
        success: true,
        sessionToken,
        publicUrl,
        session: {
          token: sessionToken,
          status: session.status,
          surveyTitle: project.surveyTitle,
          estimatedLoi: project.loi || 10,
          rewardAmount,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/survey/session error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create survey session" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/survey/session?token=...
 * Validates sessionToken and loads session details for respondent survey taking.
 * Never exposes MongoDB IDs to the client.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Missing session token" },
        { status: 400 }
      );
    }

    const session = await SurveySession.findOne({ sessionToken: token })
      .populate("project", "surveyTitle country audienceType loi ir screener surveySetup status")
      .populate("panel", "name category")
      .lean();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired survey session" },
        { status: 404 }
      );
    }

    const project = (session as any).project;
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Survey project no longer exists" },
        { status: 404 }
      );
    }

    // If session is invited, mark as started and update start counters
    if (session.status === "invited") {
      const now = new Date();
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      const userAgent = req.headers.get("user-agent") || "";

      await SurveySession.updateOne(
        { _id: (session as any)._id },
        {
          $set: {
            status: "started",
            startedAt: now,
            ip,
            userAgent,
          },
        }
      );

      // Increment starts in Project
      await Project.updateOne(
        { _id: project._id },
        { $inc: { "progress.starts": 1 } }
      ).catch(() => {});

      // Increment starts in SupplierAllocation
      if (session.supplier) {
        await SupplierAllocation.updateOne(
          { project: project._id, supplierId: session.supplier },
          { $inc: { actualStarts: 1 } }
        ).catch(() => {});
      }

      // Increment starts in SupplierPanel
      if (session.panel) {
        await SupplierPanel.updateOne(
          { _id: (session.panel as any)._id || session.panel },
          { $inc: { totalStarts: 1 } }
        ).catch(() => {});
      }
    }

    // Return sanitized public survey data (NO sensitive MongoDB IDs)
    return NextResponse.json({
      success: true,
      session: {
        sessionToken: session.sessionToken,
        status: session.status,
        surveyTitle: project.surveyTitle,
        category: project.audienceType || "General",
        estimatedLoi: project.loi || 10,
        rewardAmount: session.rewardAmount || 1.5,
        panelName: (session as any).panel?.name || "GMS Panel",
        hasScreener: Boolean(project.screener?.enabled && project.screener?.questions?.length > 0),
        screenerQuestions: project.screener?.enabled ? project.screener.questions : [],
        targetSurveyUrl: project.surveySetup?.surveyUrl || "",
        callbackBase: `/api/survey/callback?token=${encodeURIComponent(session.sessionToken)}`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/survey/session error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve survey session" },
      { status: 500 }
    );
  }
}
