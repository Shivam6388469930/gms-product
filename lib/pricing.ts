import type { Estimate, ProjectInput } from "./project-config";

export type PricingInput = {
  project: ProjectInput;
  estimate: Estimate;

  urgency?: "normal" | "urgent" | "very_urgent";
  qualityTier?: "standard" | "premium" | "healthcare_b2b";

  programmingFee?: number;
  projectManagementFee?: number;
  analyticsFee?: number;

  marginPercent?: number;

  currency?: "USD" | "EUR" | "GBP" | "INR";
};

export type PriceBreakdown = {
  baseCpi: number;

  difficultyPremiumPercent: number;
  difficultyPremiumAmount: number;

  urgencyPremiumPercent: number;
  urgencyPremiumAmount: number;

  qualityPremiumPercent: number;
  qualityPremiumAmount: number;

  finalCpi: number;

  sampleCost: number;

  programmingFee: number;
  projectManagementFee: number;
  analyticsFee: number;

  subtotal: number;

  marginPercent: number;
  marginAmount: number;

  total: number;

  currency: string;

  assumptions: string[];
};

const round2 = (value: number) =>
  Math.round(value * 100) / 100;

function getDifficultyPremium(
  project: ProjectInput
) {
  let premium = 0;

  // Low IR = difficult audience
  if (project.ir < 10) {
    premium += 20;
  } else if (project.ir < 20) {
    premium += 10;
  }

  // B2B
  if (project.audienceType === "b2b") {
    premium += 15;
  }

  // Healthcare
  if (project.audienceType === "healthcare") {
    premium += 30;
  }

  return premium;
}

function getUrgencyPremium(
  urgency: PricingInput["urgency"]
) {
  switch (urgency) {
    case "urgent":
      return 15;

    case "very_urgent":
      return 25;

    default:
      return 0;
  }
}

function getQualityPremium(
  qualityTier: PricingInput["qualityTier"]
) {
  switch (qualityTier) {
    case "premium":
      return 15;

    case "healthcare_b2b":
      return 25;

    default:
      return 0;
  }
}

export function calculatePrice(
  input: PricingInput
): PriceBreakdown {
  const {
    project,
    estimate,
  } = input;

  /*
   * IMPORTANT:
   *
   * Feasibility has already calculated
   * IR + LOI + quota + historical CPI.
   *
   * Therefore we use the midpoint of the
   * feasibility CPI range as our starting CPI.
   */

  const baseCpi = round2(
    (estimate.cpiMin + estimate.cpiMax) / 2
  );

  const difficultyPremiumPercent =
    getDifficultyPremium(project);

  const urgencyPremiumPercent =
    getUrgencyPremium(input.urgency);

  const qualityPremiumPercent =
    getQualityPremium(input.qualityTier);

  const difficultyPremiumAmount =
    round2(
      baseCpi *
        (difficultyPremiumPercent / 100)
    );

  const urgencyPremiumAmount =
    round2(
      baseCpi *
        (urgencyPremiumPercent / 100)
    );

  const qualityPremiumAmount =
    round2(
      baseCpi *
        (qualityPremiumPercent / 100)
    );

  const finalCpi = round2(
    baseCpi +
      difficultyPremiumAmount +
      urgencyPremiumAmount +
      qualityPremiumAmount
  );

  const sampleCost = round2(
    project.sampleSize * finalCpi
  );

  const programmingFee =
    input.programmingFee ?? 0;

  const projectManagementFee =
    input.projectManagementFee ?? 0;

  const analyticsFee =
    input.analyticsFee ?? 0;

  const subtotal = round2(
    sampleCost +
      programmingFee +
      projectManagementFee +
      analyticsFee
  );

  const marginPercent =
    input.marginPercent ?? 0;

  const marginAmount = round2(
    subtotal * (marginPercent / 100)
  );

  const total = round2(
    subtotal + marginAmount
  );

  return {
    baseCpi,

    difficultyPremiumPercent,
    difficultyPremiumAmount,

    urgencyPremiumPercent,
    urgencyPremiumAmount,

    qualityPremiumPercent,
    qualityPremiumAmount,

    finalCpi,

    sampleCost,

    programmingFee,
    projectManagementFee,
    analyticsFee,

    subtotal,

    marginPercent,
    marginAmount,

    total,

    currency: input.currency ?? "USD",

    assumptions: [
      `Base CPI taken from feasibility estimate: $${baseCpi.toFixed(2)}`,

      `Difficulty premium: ${difficultyPremiumPercent}%`,

      `Urgency premium: ${urgencyPremiumPercent}%`,

      `Quality premium: ${qualityPremiumPercent}%`,

      `Sample size: ${project.sampleSize}`,

      `Final CPI: $${finalCpi.toFixed(2)}`,

      `Pricing generated at ${new Date().toISOString()}`,
    ],
  };
}