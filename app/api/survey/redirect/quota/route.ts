import { NextRequest } from "next/server";
import { handleSurveyRedirect } from "@/lib/survey-redirect-handler";

export async function GET(req: NextRequest) {
  return handleSurveyRedirect(req, {
    outcome: "quota",
  });
}

export async function POST(req: NextRequest) {
  return handleSurveyRedirect(req, {
    outcome: "quota",
  });
}
