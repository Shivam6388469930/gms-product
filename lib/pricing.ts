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

export type PricingTier = {
  name: string;
  badge: string;
  cpi: number;
  total: number;
  deliveryDays: number;
  description: string;
  recommended?: boolean;
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

  tiers: PricingTier[];

  assumptions: string[];
};

const round2 = (value: number) => Math.round(value * 100) / 100;

function getDifficultyPremium(project: ProjectInput): number {
  let premium = 0;

  // Extremely low IR
  if (project.ir < 5) {
    premium += 35;
  } else if (project.ir < 10) {
    premium += 20;
  } else if (project.ir < 20) {
    premium += 10;
  }

  // Long LOI (> 15 min)
  if (project.loi > 20) {
    premium += 25;
  } else if (project.loi > 15) {
    premium += 12;
  }

  // B2B Audience
  if (project.audienceType === "b2b") {
    premium += 18;
  }

  // Healthcare Audience
  if (project.audienceType === "healthcare") {
    premium += 35;
  }

  return premium;
}

function getUrgencyPremium(urgency: PricingInput["urgency"]): number {
  switch (urgency) {
    case "urgent":
      return 15;
    case "very_urgent":
      return 30;
    default:
      return 0;
  }
}

function getQualityPremium(qualityTier: PricingInput["qualityTier"]): number {
  switch (qualityTier) {
    case "premium":
      return 15;
    case "healthcare_b2b":
      return 25;
    default:
      return 0;
  }
}

export function calculatePrice(input: PricingInput): PriceBreakdown {
  const { project, estimate } = input;

  // Base CPI from feasibility
  const baseCpi = round2(
    estimate.estimatedCpi || (estimate.cpiMin + estimate.cpiMax) / 2
  );

  const difficultyPremiumPercent = getDifficultyPremium(project);
  const urgencyPremiumPercent = getUrgencyPremium(input.urgency);
  const qualityPremiumPercent = getQualityPremium(input.qualityTier);

  const difficultyPremiumAmount = round2(baseCpi * (difficultyPremiumPercent / 100));
  const urgencyPremiumAmount = round2(baseCpi * (urgencyPremiumPercent / 100));
  const qualityPremiumAmount = round2(baseCpi * (qualityPremiumPercent / 100));

  const finalCpi = round2(
    baseCpi + difficultyPremiumAmount + urgencyPremiumAmount + qualityPremiumAmount
  );

  const sampleCost = round2(project.sampleSize * finalCpi);

  const programmingFee = input.programmingFee ?? 0;
  const projectManagementFee = input.projectManagementFee ?? 0;
  const analyticsFee = input.analyticsFee ?? 0;

  const subtotal = round2(
    sampleCost + programmingFee + projectManagementFee + analyticsFee
  );

  const marginPercent = input.marginPercent ?? 15;
  const marginAmount = round2(subtotal * (marginPercent / 100));
  const total = round2(subtotal + marginAmount);

  const currency = input.currency ?? "USD";
  const fieldDays = estimate.fieldTimeDays || 7;

  // Real Multi-Tier Packages (PureSpectrum / Cint style)
  const economyCpi = round2(baseCpi * (1 + difficultyPremiumPercent / 100));
  const economyTotal = round2(
    project.sampleSize * economyCpi + programmingFee + projectManagementFee
  );

  const recommendedCpi = finalCpi;
  const recommendedTotal = total;

  const surgeCpi = round2(finalCpi * 1.25);
  const surgeTotal = round2(
    project.sampleSize * surgeCpi + programmingFee + projectManagementFee * 1.5 + analyticsFee
  );

  const tiers: PricingTier[] = [
    {
      name: "Economy Tier",
      badge: "Standard Delivery",
      cpi: economyCpi,
      total: economyTotal,
      deliveryDays: Math.ceil(fieldDays * 1.3),
      description: "Standard panel routing with standard turnaround time.",
    },
    {
      name: "Balanced (Recommended)",
      badge: "PureScore™ Verified",
      cpi: recommendedCpi,
      total: recommendedTotal,
      deliveryDays: fieldDays,
      description: "Optimized blend of quality score, anti-fraud checks, and speed.",
      recommended: true,
    },
    {
      name: "Express Surge",
      badge: "24-48h Priority",
      cpi: surgeCpi,
      total: surgeTotal,
      deliveryDays: Math.max(1, Math.ceil(fieldDays * 0.5)),
      description: "Top-priority traffic routing across all premium suppliers.",
    },
  ];

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
    currency,
    tiers,
    assumptions: [
      `Feasibility base CPI: $${baseCpi.toFixed(2)} based on ${estimate.supply?.sources || "marketplace"} supplier networks`,
      `Audience difficulty loading: +${difficultyPremiumPercent}% (IR ${project.ir}%, LOI ${project.loi}m, ${project.audienceType})`,
      `Turnaround urgency loading: +${urgencyPremiumPercent}%`,
      `PureScore™ / Quality loading: +${qualityPremiumPercent}%`,
      `Sample fulfillment budget: ${project.sampleSize.toLocaleString()} completes @ $${finalCpi.toFixed(2)}/complete`,
      `Calculated at ${new Date().toISOString()}`,
    ],
  };
}