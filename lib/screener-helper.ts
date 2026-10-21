import { NextRequest } from "next/server";

export type ScreenerOption = {
  id: string;
  label: string;
  isQualifying: boolean;
};

export type ScreenerQuestion = {
  id: string;
  questionText: string;
  category?: string;
  type?: "single_choice" | "multi_choice" | "boolean";
  options: ScreenerOption[];
  terminationReason?: string;
};

/**
 * Extracts client IP from incoming NextRequest
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Generates intuitive, professional screener questions from project configuration
 * if custom screener questions were not yet provided.
 */
export function generateDefaultScreenerQuestions(project: {
  country?: string;
  audienceType?: string;
  targeting?: {
    country?: string;
    gender?: string;
    age?: any;
    employment?: string;
    device?: string;
  };
}): ScreenerQuestion[] {
  const questions: ScreenerQuestion[] = [];
  const targetCountry = project.country || project.targeting?.country || "US";
  const targetGender = project.targeting?.gender || "All";
  const targetEmployment = project.targeting?.employment || "All";

  // 1. Country confirmation screener
  const countryNameMap: Record<string, string> = {
    US: "United States",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    IN: "India",
    JP: "Japan",
    BR: "Brazil",
  };
  const targetCountryName = countryNameMap[targetCountry] || targetCountry;

  questions.push({
    id: "scr_country",
    questionText: "In which country do you currently reside permanently?",
    category: "demographic",
    type: "single_choice",
    terminationReason: `Respondent is not residing in the required market (${targetCountryName}).`,
    options: [
      { id: "c_match", label: targetCountryName, isQualifying: true },
      { id: "c_other_1", label: targetCountry === "US" ? "United Kingdom" : "United States", isQualifying: false },
      { id: "c_other_2", label: targetCountry === "CA" ? "Australia" : "Canada", isQualifying: false },
      { id: "c_other_3", label: "Other Country", isQualifying: false },
    ],
  });

  // 2. Age Screener
  questions.push({
    id: "scr_age",
    questionText: "Please indicate your current age range:",
    category: "demographic",
    type: "single_choice",
    terminationReason: "Respondent does not fall within the authorized age quotas for this study.",
    options: [
      { id: "age_under18", label: "Under 18 years old", isQualifying: false },
      { id: "age_18_24", label: "18 – 24 years old", isQualifying: true },
      { id: "age_25_34", label: "25 – 34 years old", isQualifying: true },
      { id: "age_35_44", label: "35 – 44 years old", isQualifying: true },
      { id: "age_45_54", label: "45 – 54 years old", isQualifying: true },
      { id: "age_55_plus", label: "55 years and older", isQualifying: true },
    ],
  });

  // 3. Gender Screener (if specific gender required)
  if (targetGender && targetGender !== "All") {
    questions.push({
      id: "scr_gender",
      questionText: "What is your gender identity?",
      category: "demographic",
      type: "single_choice",
      terminationReason: `Study is targeted specifically to ${targetGender} respondents.`,
      options: [
        {
          id: "g_male",
          label: "Male",
          isQualifying: targetGender.toLowerCase() === "male",
        },
        {
          id: "g_female",
          label: "Female",
          isQualifying: targetGender.toLowerCase() === "female",
        },
        {
          id: "g_nonbinary",
          label: "Non-binary / Other",
          isQualifying: false,
        },
      ],
    });
  }

  // 4. Employment / B2B Screener if audience is B2B
  if (project.audienceType === "b2b" || (targetEmployment && targetEmployment !== "All")) {
    questions.push({
      id: "scr_employment",
      questionText: "What is your current employment status?",
      category: "b2b",
      type: "single_choice",
      terminationReason: "Study requires active employed decision-makers.",
      options: [
        { id: "emp_full", label: "Employed Full-Time (30+ hours/week)", isQualifying: true },
        { id: "emp_part", label: "Employed Part-Time", isQualifying: project.audienceType !== "b2b" },
        { id: "emp_self", label: "Self-Employed / Business Owner", isQualifying: true },
        { id: "emp_retired", label: "Retired / Not in labor force", isQualifying: false },
        { id: "emp_student", label: "Student / Unemployed", isQualifying: false },
      ],
    });
  }

  // 5. ESOMAR Standard Attention & Quality Check (Anti-Bot / Anti-Speeding)
  questions.push({
    id: "scr_attention",
    questionText: "Sample Quality Verification: To ensure high data integrity, please select 'I Agree' below to confirm you are providing thoughtful, honest answers.",
    category: "quality_control",
    type: "single_choice",
    terminationReason: "Failed ESOMAR sample attention & quality verification check.",
    options: [
      { id: "att_agree", label: "I Agree (Confirm honest participation)", isQualifying: true },
      { id: "att_disagree", label: "I Disagree", isQualifying: false },
      { id: "att_skip", label: "Prefer not to say", isQualifying: false },
    ],
  });

  return questions;
}

/**
 * Evaluates respondent answers against qualifying conditions
 */
export function evaluateScreener(
  questions: ScreenerQuestion[],
  submittedAnswers: Record<string, string> // questionId -> selectedOptionId
): {
  passed: boolean;
  failedQuestion?: ScreenerQuestion;
  reason?: string;
  detailedAnswers: Array<{
    questionId: string;
    questionText: string;
    selectedOptionId: string;
    selectedOptionLabel: string;
    isQualifying: boolean;
  }>;
} {
  const detailedAnswers: Array<{
    questionId: string;
    questionText: string;
    selectedOptionId: string;
    selectedOptionLabel: string;
    isQualifying: boolean;
  }> = [];

  let passed = true;
  let failedQuestion: ScreenerQuestion | undefined;
  let reason = "";

  for (const q of questions) {
    const selectedOptionId = submittedAnswers[q.id];
    if (!selectedOptionId) {
      passed = false;
      failedQuestion = q;
      reason = `Incomplete answer for required question: "${q.questionText}"`;
      break;
    }

    const matchedOption = q.options.find((opt) => opt.id === selectedOptionId);
    if (!matchedOption) {
      passed = false;
      failedQuestion = q;
      reason = "Invalid option chosen.";
      break;
    }

    detailedAnswers.push({
      questionId: q.id,
      questionText: q.questionText,
      selectedOptionId: matchedOption.id,
      selectedOptionLabel: matchedOption.label,
      isQualifying: Boolean(matchedOption.isQualifying),
    });

    if (!matchedOption.isQualifying) {
      passed = false;
      failedQuestion = q;
      reason = q.terminationReason || `Screened out on question: "${q.questionText}"`;
      break;
    }
  }

  return {
    passed,
    failedQuestion,
    reason,
    detailedAnswers,
  };
}
