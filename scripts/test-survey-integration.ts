import { NextRequest } from "next/server";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectDB } from "../config/db";
import Project from "../models/Project";
import RespondentSession from "../models/RespondentSession";
import {
  generateRedirectUrls,
  buildClientSurveyUrl,
  isRespondentPlaceholder,
  replaceRespondentPlaceholder,
} from "../lib/survey-urls";
import { GET as startSurvey } from "../app/api/survey/start/route";
import { handleSurveyRedirect } from "../lib/survey-redirect-handler";

async function runTests() {
  console.log("=================================================");
  console.log("STARTING SURVEY INTEGRATION AUTOMATED TEST SUITE");
  console.log("=================================================\n");

  await connectDB();
  console.log("Connected to MongoDB successfully.");

  // 1. TEST URL UTILITY
  console.log("\n--- TEST 1: URL GENERATOR & PLACEHOLDER VALIDATION ---");
  const testPid = "GMS82473";
  const urls = generateRedirectUrls(testPid, "https://gms-product.vercel.app");
  console.log("Generated Entry URL:", urls.entryUrl);
  console.log("Generated Complete URL:", urls.completeUrl);
  console.log("Generated Terminate URL:", urls.terminateUrl);
  console.log("Generated Quota URL:", urls.quotaUrl);

  if (
    !urls.entryUrl.includes("pid=GMS82473") ||
    !urls.completeUrl.includes("/api/survey/redirect/complete?rid={respondentId}") ||
    !urls.terminateUrl.includes("/api/survey/redirect/terminate?rid={respondentId}") ||
    !urls.quotaUrl.includes("/api/survey/redirect/quota?rid={respondentId}")
  ) {
    throw new Error("URL generator failed to construct correct URLs");
  }
  console.log("✓ URL generator verified");

  // 2. TEST PLACEHOLDER REJECTION
  console.log("\n--- TEST 2: PLACEHOLDER DETECTION ---");
  const invalidCases = [
    "{respondentId}",
    "{{respondentId}}",
    "{rid}",
    "[RID]",
    "undefined",
    "null",
    "%7BrespondentId%7D",
  ];
  for (const ph of invalidCases) {
    if (!isRespondentPlaceholder(ph)) {
      throw new Error(`Failed to reject placeholder: ${ph}`);
    }
  }
  if (isRespondentPlaceholder("TEST001")) {
    throw new Error("Incorrectly rejected valid respondent ID TEST001");
  }
  console.log("✓ Placeholder detection verified");

  // 3. TEST CLIENT SURVEY URL BUILDER
  console.log("\n--- TEST 3: CLIENT SURVEY URL BUILDER ---");
  const built1 = buildClientSurveyUrl("https://client.com/survey?pid=GMS82473", "TEST001", "rid");
  if (!built1.includes("rid=TEST001")) {
    throw new Error(`buildClientSurveyUrl failed: ${built1}`);
  }
  const built2 = buildClientSurveyUrl(
    "https://therewardsnation.com/initial-process?gid=XXX&pid=GMS82473&rid={respondentId}&source=GMS-DIRECT",
    "TEST001"
  );
  if (!built2.includes("rid=TEST001") || built2.includes("{respondentId}")) {
    throw new Error(`Placeholder replacement in client survey URL failed: ${built2}`);
  }
  console.log("✓ Client survey URL builder verified");

  // 4. DATABASE INTEGRATION TESTS
  console.log("\n--- TEST 4: FULL LIFECYCLE DATABASE TESTS ---");
  const testProjectId = "GMS_INT_" + Math.floor(10000 + Math.random() * 90000);
  const testRid1 = "TEST_RESP_A_" + Date.now();
  const testRid2 = "TEST_RESP_B_" + Date.now();
  const testRid3 = "TEST_RESP_C_" + Date.now();

  try {
    const project = await Project.create({
      projectId: testProjectId,
      surveyTitle: "Automated Integration Test Survey",
      country: "US",
      audienceType: "consumer",
      sampleSize: 100,
      loi: 10,
      ir: 80,
      estimate: { cpi: 2.5, total: 250 },
      status: "live",
      owner: new (require("mongoose").Types.ObjectId)(),
      surveyUrl: `https://client.com/survey?pid=${testProjectId}&rid={respondentId}`,
      surveySetup: {
        surveyUrl: `https://client.com/survey?pid=${testProjectId}&rid={respondentId}`,
        surveyType: "external",
        status: "ready",
        redirectUrl: "https://supplier.com/complete?rid={respondentId}",
        terminationUrl: "https://supplier.com/terminate?rid={respondentId}",
        quotaUrl: "https://supplier.com/quota?rid={respondentId}",
      },
      progress: {
        starts: 0,
        completes: 0,
        screenouts: 0,
        quotaFull: 0,
        qualityRejects: 0,
        spend: 0,
      },
    });

    // Start Survey for Respondent 1
    const startReq = new NextRequest(
      `http://localhost:3000/api/survey/start?pid=${testProjectId}&rid=${testRid1}`
    );
    const startRes = await startSurvey(startReq);
    if (![302, 307, 308].includes(startRes.status)) {
      throw new Error(`Start endpoint returned unexpected status: ${startRes.status}`);
    }
    const targetUrl = startRes.headers.get("location");
    if (!targetUrl?.includes(`rid=${testRid1}`) || targetUrl?.includes("{respondentId}")) {
      throw new Error(`Start redirect URL malformed: ${targetUrl}`);
    }
    console.log("✓ Start survey correctly redirected to client with real RID");

    // Complete Callback
    const compReq = new NextRequest(
      `http://localhost:3000/api/survey/redirect/complete?pid=${testProjectId}&rid=${testRid1}`
    );
    const compRes = await handleSurveyRedirect(compReq, { outcome: "complete" });
    const compRedirect = compRes.headers.get("location");
    if (!compRedirect?.includes(`rid=${testRid1}`) || compRedirect?.includes("{respondentId}")) {
      throw new Error(`Complete redirect malformed: ${compRedirect}`);
    }
    const sess1 = await RespondentSession.findOne({ respondentId: testRid1 });
    if (sess1?.status !== "completed") {
      throw new Error(`Session 1 status is not completed: ${sess1?.status}`);
    }
    console.log("✓ Complete callback recorded completed status and passed real RID");

    // Idempotency: Complete Callback Called Twice
    await handleSurveyRedirect(compReq, { outcome: "complete" });
    const pCheck = await Project.findById(project._id);
    if (pCheck?.progress?.completes !== 1) {
      throw new Error(`Idempotency check failed: completes=${pCheck?.progress?.completes}`);
    }
    console.log("✓ Idempotent complete callback verified (completes count remained 1)");

    // Start & Terminate for Respondent 2 (Using only ?rid= without pid)
    await startSurvey(
      new NextRequest(`http://localhost:3000/api/survey/start?pid=${testProjectId}&rid=${testRid2}`)
    );
    const termRes = await handleSurveyRedirect(
      new NextRequest(`http://localhost:3000/api/survey/redirect/terminate?rid=${testRid2}`),
      { outcome: "terminate" }
    );
    const termRedirect = termRes.headers.get("location");
    if (!termRedirect?.includes(`rid=${testRid2}`)) {
      throw new Error(`Terminate redirect did not pass RID: ${termRedirect}`);
    }
    const sess2 = await RespondentSession.findOne({ respondentId: testRid2 });
    if (sess2?.status !== "terminated") {
      throw new Error(`Session 2 status is not terminated: ${sess2?.status}`);
    }
    console.log("✓ Terminate callback (without pid) resolved session and passed real RID");

    // Start & Quota for Respondent 3 (Using ?respondentId=)
    await startSurvey(
      new NextRequest(`http://localhost:3000/api/survey/start?pid=${testProjectId}&rid=${testRid3}`)
    );
    const quotaRes = await handleSurveyRedirect(
      new NextRequest(`http://localhost:3000/api/survey/redirect/quota?respondentId=${testRid3}`),
      { outcome: "quota" }
    );
    const quotaRedirect = quotaRes.headers.get("location");
    if (!quotaRedirect?.includes(`rid=${testRid3}`)) {
      throw new Error(`Quota redirect did not pass RID: ${quotaRedirect}`);
    }
    const sess3 = await RespondentSession.findOne({ respondentId: testRid3 });
    if (sess3?.status !== "quota_full") {
      throw new Error(`Session 3 status is not quota_full: ${sess3?.status}`);
    }
    console.log("✓ Quota callback (using respondentId param) resolved session and passed real RID");

    // Template Rejection Test: /api/survey/redirect/terminate?rid={respondentId}
    const templateReq = new NextRequest(
      "http://localhost:3000/api/survey/redirect/terminate?rid={respondentId}"
    );
    const templateRes = await handleSurveyRedirect(templateReq, { outcome: "terminate" });
    if (templateRes.status !== 400) {
      throw new Error(`Template callback was not rejected with 400! Got ${templateRes.status}`);
    }
    console.log("✓ Template callback rejected with 400");
  } finally {
    await Project.deleteMany({ projectId: testProjectId });
    await RespondentSession.deleteMany({
      respondentId: { $in: [testRid1, testRid2, testRid3] },
    });
    console.log("Cleaned up test data.");
  }

  console.log("\n=================================================");
  console.log("ALL SURVEY INTEGRATION TESTS PASSED SUCCESSFULLY!");
  console.log("=================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
