

// import Project from "@/models/Project";
// import SupplySource from "@/models/Supplysource";
// import type { Estimate, FeasibilityStatus, ProjectInput } from "./project-config";

// /* ------------------------------ tunable model ------------------------------ */

// const INVITES_PER_MEMBER_PER_MONTH = 3; // how often a member is invited
// const DEFAULT_START_RATE = 0.12; // starts per invite
// const WINDOW_DAYS = 14; // fieldwork window used for "expected completes"
// const MAX_PARTICIPATION = 0.35; // max share of qualified members who realistically respond
// const REF_IR = 30; // baseCpi is quoted at IR 30% ...
// const REF_LOI = 10; // ... and LOI 10 minutes
// const SHRINKAGE_K = 5; // history needs ~5 projects to count for half
// const MIN_COMPLETES = 30; // ignore tiny past projects when learning

// /**
//  * Fallback planning figures, used ONLY when no SupplySource rows exist for the
//  * market + audience. The estimate says so and its confidence is lowered.
//  */
// const DEFAULT_COUNTRY: Record<string, { supply: number; cpi: number }> = {
//   US: { supply: 400000, cpi: 1.0 },
//   GB: { supply: 150000, cpi: 1.0 },
//   CA: { supply: 80000, cpi: 1.0 },
//   AU: { supply: 60000, cpi: 1.05 },
//   DE: { supply: 120000, cpi: 1.0 },
//   FR: { supply: 100000, cpi: 1.0 },
//   IN: { supply: 300000, cpi: 0.45 },
//   AE: { supply: 25000, cpi: 1.4 },
//   SG: { supply: 20000, cpi: 1.3 },
//   BR: { supply: 120000, cpi: 0.6 },
// };
// const DEFAULT_AUDIENCE: Record<string, { share: number; cpi: number }> = {
//   consumer: { share: 1, cpi: 1 },
//   b2b: { share: 0.08, cpi: 4 },
//   healthcare: { share: 0.03, cpi: 6 },
// };
// const DEFAULT_BASE_CPI = 1.2;

// const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
// const round2 = (n: number) => Math.round(n * 100) / 100;
// const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// /* ------------------------------ 1. supply ------------------------------ */

// type Supply = { members: number; startRate: number; baseCpi: number; sources: number; usingDefaults: boolean };

// async function resolveSupply(country: string, audienceType: string): Promise<Supply> {
//   const rows: any[] = await SupplySource.find({
//     country,
//     audienceType,
//     active: true,
//     activeMembers: { $gt: 0 },
//   }).lean();

//   if (rows.length) {
//     const members = rows.reduce((s, r) => s + r.activeMembers, 0);
//     const weighted = (k: "startRate" | "baseCpi") =>
//       rows.reduce((s, r) => s + r[k] * r.activeMembers, 0) / members;
//     return { members, startRate: weighted("startRate"), baseCpi: weighted("baseCpi"), sources: rows.length, usingDefaults: false };
//   }

//   const c = DEFAULT_COUNTRY[country];
//   const a = DEFAULT_AUDIENCE[audienceType];
//   return {
//     members: Math.round(c.supply * a.share),
//     startRate: DEFAULT_START_RATE,
//     baseCpi: DEFAULT_BASE_CPI * c.cpi * a.cpi,
//     sources: 0,
//     usingDefaults: true,
//   };
// }

// /* ------------------------------ 2. history ------------------------------ */

// type History = { n: number; irReliability: number; cpiFactor: number; timeFactor: number };

// // Pull the average toward 1 (no correction) until there is enough evidence.
// const shrink = (xs: number[]) =>
//   xs.length ? 1 + (xs.length / (xs.length + SHRINKAGE_K)) * (xs.reduce((a, b) => a + b, 0) / xs.length - 1) : 1;

// async function loadHistory(country: string, audienceType: string): Promise<History> {
//   const rows: any[] = await Project.find({
//     country,
//     audienceType,
//     status: "stopped",
//     launchedAt: { $exists: true },
//     stoppedAt: { $exists: true },
//     "estimate.raw": { $exists: true },
//   })
//     .sort({ stoppedAt: -1 })
//     .limit(200)
//     .select("ir sampleSize progress estimate launchedAt stoppedAt")
//     .lean();

//   const ir: number[] = [], cpi: number[] = [], time: number[] = [];
//   let n = 0;

//   for (const p of rows) {
//     const pr = p.progress;
//     if (pr.completes < Math.max(MIN_COMPLETES, 0.9 * p.sampleSize)) continue; // only fully filled projects
//     n++;

//     if (pr.starts > 0) {
//       const observedIr = (pr.starts - pr.screenouts) / pr.starts; // qualified / starts
//       ir.push(clamp(observedIr / (p.ir / 100), 0.3, 1.2));
//     }
//     if (pr.spend > 0 && p.estimate?.raw?.cpiMid) {
//       cpi.push(clamp(pr.spend / pr.completes / p.estimate.raw.cpiMid, 0.5, 3));
//     }
//     if (p.estimate?.raw?.fieldDays) {
//       const days = Math.max(1, (+new Date(p.stoppedAt) - +new Date(p.launchedAt)) / 86400000);
//       time.push(clamp(days / p.estimate.raw.fieldDays, 0.5, 3));
//     }
//   }

//   return { n, irReliability: shrink(ir), cpiFactor: shrink(cpi), timeFactor: shrink(time) };
// }

// /* ------------------------------ 3. quotas ------------------------------ */

// function analyseQuotas(quotas: ProjectInput["quotas"] = []) {
//   let worstRatio = 1;
//   const notes: string[] = [];

//   for (const dim of quotas) {
//     const equalShare = 100 / dim.cells.length;
//     let dimWorst = 1;
//     let label = "";
//     for (const cell of dim.cells) {
//       const ratio = cell.targetPct / (cell.marketPct ?? equalShare);
//       if (ratio > dimWorst) {
//         dimWorst = ratio;
//         label = cell.label;
//       }
//     }
//     worstRatio *= dimWorst; // dimensions assumed independent
//     if (dimWorst > 1) notes.push(`${dim.name}: "${label}" needs ${dimWorst.toFixed(1)}× its natural share`);
//   }
//   return { worstRatio, notes };
// }

// /* ------------------------------ 4. the engine ------------------------------ */

// export async function estimateProject(input: ProjectInput | Omit<ProjectInput, "name" | "audienceDescription">): Promise<Estimate> {
//   const { country, audienceType, sampleSize: N, loi, ir, quotas } = input;

//   const [supply, hist] = await Promise.all([
//     resolveSupply(country, audienceType),
//     loadHistory(country, audienceType),
//   ]);
//   const q = analyseQuotas(quotas);

//   // Supply: how many members qualify
//   const irEff = clamp(ir * hist.irReliability, 0.5, 100);
//   const available = Math.round((supply.members * irEff) / 100);
//   const completionRate = clamp(0.9 - Math.max(0, loi - 10) * 0.01, 0.5, 0.9);

//   // Speed: invites → starts → qualified → completes, slowed by quota pressure
//   const completesPerDay =
//     (((supply.members * INVITES_PER_MEMBER_PER_MONTH) / 30) * supply.startRate * (ir / 100) * completionRate) /
//     q.worstRatio;
//   const rawFieldDays = Math.max(1, N / completesPerDay);
//   const fieldTimeDays = Math.max(1, Math.ceil(rawFieldDays * hist.timeFactor));

//   // Fill: what can realistically be completed in the window
//   const capWindow = (completesPerDay / hist.timeFactor) * WINDOW_DAYS;
//   const capSupply = (available * MAX_PARTICIPATION * completionRate) / q.worstRatio;
//   const expectedCompletes = Math.floor(Math.min(N, capWindow, capSupply));
//   const fillRate = expectedCompletes / N;
//   const status: FeasibilityStatus = fillRate >= 0.98 ? "feasible" : fillRate >= 0.7 ? "at_risk" : "not_feasible";

//   // Price
//   const irFactor = clamp(Math.pow(REF_IR / ir, 0.8), 0.7, 6);
//   const loiFactor = clamp(1 + (loi - REF_LOI) * 0.05, 0.6, 3);
//   const quotaFactor = Math.min(3, 1 + 0.25 * (q.worstRatio - 1));
//   const rawCpi = supply.baseCpi * irFactor * loiFactor * quotaFactor;
//   const cpiMid = rawCpi * hist.cpiFactor;

//   // Confidence: how much evidence is behind this estimate
//   const utilisation = N / Math.max(1, available);
//   const reasons: string[] = [];
//   let score = 0;
//   if (!supply.usingDefaults) { score += 2; reasons.push("real supply data"); } else reasons.push("default supply figures");
//   if (hist.n >= 10) { score += 2; reasons.push(`${hist.n} similar past projects`); }
//   else if (hist.n >= 3) { score += 1; reasons.push(`${hist.n} similar past projects`); }
//   else reasons.push("little or no project history");
//   if (utilisation < 0.02) { score += 2; reasons.push("small ask vs supply"); }
//   else if (utilisation < 0.1) { score += 1; reasons.push("moderate ask vs supply"); }
//   else reasons.push("large ask vs supply");
//   if (q.worstRatio <= 1) score += 1; else reasons.push("tight quotas");
//   const confidence = score >= 6 ? "high" : score >= 3 ? "medium" : "low";

//   const spread = confidence === "high" ? 0.1 : confidence === "medium" ? 0.15 : 0.25;
//   const cpiMin = round2(cpiMid * (1 - spread));
//   const cpiMax = round2(cpiMid * (1 + spread));

//   const steps = [
//     `Supply: ${fmt(supply.members)} active members in ${country}` +
//       (supply.usingDefaults ? " (default planning figure, no supply sources configured)" : ` across ${supply.sources} source(s)`),
//     `Qualifying members: ${fmt(supply.members)} × ${irEff.toFixed(1)}% IR = ${fmt(available)}` +
//       (hist.irReliability !== 1 ? ` (IR adjusted ×${hist.irReliability.toFixed(2)} from past projects)` : ""),
//     `Speed: ${fmt(completesPerDay)} completes/day = invites × ${(supply.startRate * 100).toFixed(0)}% start rate × ${ir}% IR × ${(completionRate * 100).toFixed(0)}% completion` +
//       (q.worstRatio > 1 ? ` ÷ ${q.worstRatio.toFixed(1)} quota pressure` : ""),
//     `Field time: ${N.toLocaleString()} ÷ ${fmt(completesPerDay)} per day` + (hist.timeFactor !== 1 ? ` × ${hist.timeFactor.toFixed(2)} (history)` : "") + ` ≈ ${fieldTimeDays} day(s)`,
//     `Fill: about ${fmt(expectedCompletes)} of ${N.toLocaleString()} completes (${Math.round(fillRate * 100)}%) within ${WINDOW_DAYS} days`,
//     `CPI: $${supply.baseCpi.toFixed(2)} base × ${irFactor.toFixed(2)} (IR) × ${loiFactor.toFixed(2)} (LOI)` +
//       (quotaFactor > 1 ? ` × ${quotaFactor.toFixed(2)} (quotas)` : "") +
//       (hist.cpiFactor !== 1 ? ` × ${hist.cpiFactor.toFixed(2)} (history)` : "") +
//       ` = $${cpiMid.toFixed(2)}, shown as ±${Math.round(spread * 100)}%`,
//     ...q.notes.map((n) => `Quota: ${n}`),
//     `Confidence ${confidence}: ${reasons.join(", ")}`,
//   ];

//   const assumptions = [
//     supply.usingDefaults
//       ? "No supply sources configured for this market and audience; default planning figures used"
//       : `Supply taken from ${supply.sources} configured source(s)`,
//     `Incidence rate of ${ir}% as supplied by the client`,
//     hist.n > 0
//       ? `Calibrated on ${hist.n} completed GMS project(s) in this market and audience`
//       : "No completed GMS projects yet for this market and audience; no calibration applied",
//     `Members invited ${INVITES_PER_MEMBER_PER_MONTH}× a month; at most ${MAX_PARTICIPATION * 100}% of qualified members respond`,
//     ...(quotas?.length ? ["Quota dimensions assumed independent of each other"] : []),
//     "Prices in USD; programming and premium targeting not included",
//   ];

//   return {
//     availableSample: available,
//     expectedCompletes,
//     fillRate: Math.round(fillRate * 1000) / 1000,
//     status,
//     cpiMin,
//     cpiMax,
//     totalMin: round2(cpiMin * N),
//     totalMax: round2(cpiMax * N),
//     fieldTimeDays,
//     confidence,
//     assumptions,
//     steps,
//     calibration: { projectsUsed: hist.n, irReliability: round2(hist.irReliability), cpiFactor: round2(hist.cpiFactor), timeFactor: round2(hist.timeFactor) },
//     raw: { cpiMid: round2(rawCpi), fieldDays: Math.round(rawFieldDays * 10) / 10 },
//     supply: { members: supply.members, sources: supply.sources, usingDefaults: supply.usingDefaults },
//     generatedAt: new Date().toISOString(),
//   };
// }




import Project from "@/models/Project";
import SupplySource from "@/models/Supplysource";
import {
  COUNTRIES,
  type Estimate,
  type FeasibilityStatus,
  type ProjectInput,
} from "./project-config";

/* ------------------------------ tunable model ------------------------------ */

const INVITES_PER_MEMBER_PER_MONTH = 3; // how often a member is invited
const DEFAULT_START_RATE = 0.12; // starts per invite
const WINDOW_DAYS = 14; // fieldwork window used for "expected completes"
const MAX_PARTICIPATION = 0.35; // max share of qualified members who realistically respond
const REF_IR = 30; // baseCpi is quoted at IR 30% ...
const REF_LOI = 10; // ... and LOI 10 minutes
const SHRINKAGE_K = 5; // history needs ~5 projects to count for half
const MIN_COMPLETES = 30; // ignore tiny past projects when learning

/**
 * Fallback planning figures, used ONLY when no SupplySource rows exist for the
 * market + audience. The estimate says so and its confidence is lowered.
 */
type CountryDefault = {
  supply: number;
  cpi: number;
};

/*
 * Country planning tiers used only when no SupplySource exists.
 * These are model defaults, not live panel-provider data.
 */
const TIER_1_COUNTRIES = new Set([
  "US", "GB", "CA", "AU", "DE", "FR", "IT", "ES", "NL", "BE",
  "CH", "AT", "SE", "NO", "DK", "FI", "IE", "NZ", "JP", "KR",
]);

const TIER_2_COUNTRIES = new Set([
  "BR", "MX", "IN", "ID", "MY", "SG", "TH", "PH", "PL", "CZ",
  "PT", "GR", "RO", "HU", "TR", "IL", "AE", "SA", "QA", "KW",
  "ZA", "CL", "CO", "AR",
]);

const TIER_3_COUNTRIES = new Set([
  "CN", "RU", "UA", "EG", "MA", "TN", "DZ", "NG", "KE", "GH",
  "PK", "BD", "LK", "VN", "PE", "EC", "CR", "PA", "DO", "GT",
  "KZ", "AZ", "RS", "BG", "HR", "SK", "SI", "LT", "LV", "EE",
  "IS", "LU", "MT", "CY",
]);

const TIER_4_COUNTRIES = new Set([
  "AF", "AL", "AD", "AM", "AG", "AZ", "BS", "BH", "BB", "BY",
  "BZ", "BJ", "BT", "BO", "BA", "BW", "BN", "BF", "BI", "CV",
  "KH", "CM", "CF", "TD", "KM", "CG", "CD", "CI", "CU", "CY",
  "DJ", "DM", "DO", "SV", "GQ", "ER", "SZ", "ET", "FJ", "GA",
  "GM", "GE", "GH", "GD", "GN", "GW", "GY", "HT", "HN", "JM",
  "JO", "KZ", "KG", "LA", "LB", "LS", "LR", "LY", "LI", "MG",
  "MW", "MV", "ML", "MT", "MH", "MR", "MU", "FM", "MD", "MC",
  "MN", "ME", "MA", "MZ", "MM", "NA", "NR", "NP", "NI", "NE",
  "MK", "OM", "PW", "PS", "PG", "PY", "RW", "KN", "LC", "VC",
  "WS", "SM", "ST", "SN", "SC", "SL", "SG", "SB", "SO", "SS",
  "LK", "SD", "SR", "SY", "TJ", "TZ", "TL", "TG", "TO", "TT",
  "TN", "TM", "TV", "UG", "UY", "UZ", "VU", "VA", "VE", "YE",
  "ZM", "ZW",
]);

/*
 * Build a default entry for every country in project-config.ts.
 * This prevents undefined-country crashes when the UI contains a new country.
 */
const DEFAULT_COUNTRY: Record<string, CountryDefault> = Object.fromEntries(
  COUNTRIES.map(({ code }) => {
    if (TIER_1_COUNTRIES.has(code)) {
      return [code, { supply: 100000, cpi: 1.00 }];
    }

    if (TIER_2_COUNTRIES.has(code)) {
      return [code, { supply: 60000, cpi: 0.85 }];
    }

    if (TIER_3_COUNTRIES.has(code)) {
      return [code, { supply: 40000, cpi: 1.00 }];
    }

    if (TIER_4_COUNTRIES.has(code)) {
      return [code, { supply: 15000, cpi: 1.15 }];
    }

    return [code, { supply: 10000, cpi: 1.25 }];
  })
);

const DEFAULT_AUDIENCE: Record<string, { share: number; cpi: number }> = {
  consumer: { share: 1, cpi: 1 },
  b2b: { share: 0.08, cpi: 4 },
  healthcare: { share: 0.03, cpi: 6 },
};
const DEFAULT_BASE_CPI = 1.2;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/* ------------------------------ 1. supply ------------------------------ */

type Supply = { members: number; startRate: number; baseCpi: number; sources: number; usingDefaults: boolean };

async function resolveSupply(
  country: string,
  audienceType: string
): Promise<Supply> {
  const rows: any[] = await SupplySource.find({
    country,
    audienceType,
    active: true,
    activeMembers: { $gt: 0 },
  }).lean();

  if (rows.length) {
    const members = rows.reduce((s, r) => s + r.activeMembers, 0);

    const weighted = (k: "startRate" | "baseCpi") =>
      rows.reduce((s, r) => s + r[k] * r.activeMembers, 0) / members;

    return {
      members,
      startRate: weighted("startRate"),
      baseCpi: weighted("baseCpi"),
      sources: rows.length,
      usingDefaults: false,
    };
  }

  const c =
    DEFAULT_COUNTRY[country] ?? {
      supply: 10000,
      cpi: 1.25,
    };

  const a =
    DEFAULT_AUDIENCE[audienceType] ?? {
      share: 1,
      cpi: 1,
    };

  return {
    members: Math.round(c.supply * a.share),
    startRate: DEFAULT_START_RATE,
    baseCpi: DEFAULT_BASE_CPI * c.cpi * a.cpi,
    sources: 0,
    usingDefaults: true,
  };
}

/* ------------------------------ 2. history ------------------------------ */

type History = { n: number; irReliability: number; cpiFactor: number; timeFactor: number };

// Pull the average toward 1 (no correction) until there is enough evidence.
const shrink = (xs: number[]) =>
  xs.length ? 1 + (xs.length / (xs.length + SHRINKAGE_K)) * (xs.reduce((a, b) => a + b, 0) / xs.length - 1) : 1;

async function loadHistory(country: string, audienceType: string): Promise<History> {
  const rows: any[] = await Project.find({
    country,
    audienceType,
    status: "stopped",
    launchedAt: { $exists: true },
    stoppedAt: { $exists: true },
    "estimate.raw": { $exists: true },
  })
    .sort({ stoppedAt: -1 })
    .limit(200)
    .select("ir sampleSize progress estimate launchedAt stoppedAt")
    .lean();

  const ir: number[] = [], cpi: number[] = [], time: number[] = [];
  let n = 0;

  for (const p of rows) {
    const pr = p.progress;
    if (pr.completes < Math.max(MIN_COMPLETES, 0.9 * p.sampleSize)) continue; // only fully filled projects
    n++;

    if (pr.starts > 0) {
      const observedIr = (pr.starts - pr.screenouts) / pr.starts; // qualified / starts
      ir.push(clamp(observedIr / (p.ir / 100), 0.3, 1.2));
    }
    if (pr.spend > 0 && p.estimate?.raw?.cpiMid) {
      cpi.push(clamp(pr.spend / pr.completes / p.estimate.raw.cpiMid, 0.5, 3));
    }
    if (p.estimate?.raw?.fieldDays) {
      const days = Math.max(1, (+new Date(p.stoppedAt) - +new Date(p.launchedAt)) / 86400000);
      time.push(clamp(days / p.estimate.raw.fieldDays, 0.5, 3));
    }
  }

  return { n, irReliability: shrink(ir), cpiFactor: shrink(cpi), timeFactor: shrink(time) };
}

/* ------------------------------ 3. quotas ------------------------------ */

function analyseQuotas(quotas: ProjectInput["quotas"] = []) {
  let worstRatio = 1;
  const notes: string[] = [];

  for (const dim of quotas) {
    const equalShare = 100 / dim.cells.length;
    let dimWorst = 1;
    let label = "";
    for (const cell of dim.cells) {
      const ratio = cell.targetPct / (cell.marketPct ?? equalShare);
      if (ratio > dimWorst) {
        dimWorst = ratio;
        label = cell.label;
      }
    }
    worstRatio *= dimWorst; // dimensions assumed independent
    if (dimWorst > 1) notes.push(`${dim.name}: "${label}" needs ${dimWorst.toFixed(1)}× its natural share`);
  }
  return { worstRatio, notes };
}

/* ------------------------------ 4. the engine ------------------------------ */

export async function estimateProject(input: ProjectInput | Omit<ProjectInput, "name" | "audienceDescription">): Promise<Estimate> {
  const { country, audienceType, sampleSize: N, loi, ir, quotas } = input;

  const [supply, hist] = await Promise.all([
    resolveSupply(country, audienceType),
    loadHistory(country, audienceType),
  ]);
  const q = analyseQuotas(quotas);

  // Supply: how many members qualify
  const irEff = clamp(ir * hist.irReliability, 0.5, 100);
  const available = Math.round((supply.members * irEff) / 100);
  const completionRate = clamp(0.9 - Math.max(0, loi - 10) * 0.01, 0.5, 0.9);

  // Speed: invites → starts → qualified → completes, slowed by quota pressure
  const completesPerDay =
    (((supply.members * INVITES_PER_MEMBER_PER_MONTH) / 30) * supply.startRate * (ir / 100) * completionRate) /
    q.worstRatio;
  const rawFieldDays = Math.max(1, N / completesPerDay);
  const fieldTimeDays = Math.max(1, Math.ceil(rawFieldDays * hist.timeFactor));

  // Fill: what can realistically be completed in the window
  const capWindow = (completesPerDay / hist.timeFactor) * WINDOW_DAYS;
  const capSupply = (available * MAX_PARTICIPATION * completionRate) / q.worstRatio;
  const expectedCompletes = Math.floor(Math.min(N, capWindow, capSupply));
  const fillRate = expectedCompletes / N;
  const status: FeasibilityStatus = fillRate >= 0.98 ? "feasible" : fillRate >= 0.7 ? "at_risk" : "not_feasible";

  // Price
  const irFactor = clamp(Math.pow(REF_IR / ir, 0.8), 0.7, 6);
  const loiFactor = clamp(1 + (loi - REF_LOI) * 0.05, 0.6, 3);
  const quotaFactor = Math.min(3, 1 + 0.25 * (q.worstRatio - 1));
  const rawCpi = supply.baseCpi * irFactor * loiFactor * quotaFactor;
  const cpiMid = rawCpi * hist.cpiFactor;

  // Confidence: how much evidence is behind this estimate
  const utilisation = N / Math.max(1, available);
  const reasons: string[] = [];
  let score = 0;
  if (!supply.usingDefaults) { score += 2; reasons.push("real supply data"); } else reasons.push("default supply figures");
  if (hist.n >= 10) { score += 2; reasons.push(`${hist.n} similar past projects`); }
  else if (hist.n >= 3) { score += 1; reasons.push(`${hist.n} similar past projects`); }
  else reasons.push("little or no project history");
  if (utilisation < 0.02) { score += 2; reasons.push("small ask vs supply"); }
  else if (utilisation < 0.1) { score += 1; reasons.push("moderate ask vs supply"); }
  else reasons.push("large ask vs supply");
  if (q.worstRatio <= 1) score += 1; else reasons.push("tight quotas");
  const confidence = score >= 6 ? "high" : score >= 3 ? "medium" : "low";

  const spread = confidence === "high" ? 0.1 : confidence === "medium" ? 0.15 : 0.25;
  const cpiMin = round2(cpiMid * (1 - spread));
  const cpiMax = round2(cpiMid * (1 + spread));

  const steps = [
    `Supply: ${fmt(supply.members)} active members in ${country}` +
      (supply.usingDefaults ? " (default planning figure, no supply sources configured)" : ` across ${supply.sources} source(s)`),
    `Qualifying members: ${fmt(supply.members)} × ${irEff.toFixed(1)}% IR = ${fmt(available)}` +
      (hist.irReliability !== 1 ? ` (IR adjusted ×${hist.irReliability.toFixed(2)} from past projects)` : ""),
    `Speed: ${fmt(completesPerDay)} completes/day = invites × ${(supply.startRate * 100).toFixed(0)}% start rate × ${ir}% IR × ${(completionRate * 100).toFixed(0)}% completion` +
      (q.worstRatio > 1 ? ` ÷ ${q.worstRatio.toFixed(1)} quota pressure` : ""),
    `Field time: ${N.toLocaleString()} ÷ ${fmt(completesPerDay)} per day` + (hist.timeFactor !== 1 ? ` × ${hist.timeFactor.toFixed(2)} (history)` : "") + ` ≈ ${fieldTimeDays} day(s)`,
    `Fill: about ${fmt(expectedCompletes)} of ${N.toLocaleString()} completes (${Math.round(fillRate * 100)}%) within ${WINDOW_DAYS} days`,
    `CPI: $${supply.baseCpi.toFixed(2)} base × ${irFactor.toFixed(2)} (IR) × ${loiFactor.toFixed(2)} (LOI)` +
      (quotaFactor > 1 ? ` × ${quotaFactor.toFixed(2)} (quotas)` : "") +
      (hist.cpiFactor !== 1 ? ` × ${hist.cpiFactor.toFixed(2)} (history)` : "") +
      ` = $${cpiMid.toFixed(2)}, shown as ±${Math.round(spread * 100)}%`,
    ...q.notes.map((n) => `Quota: ${n}`),
    `Confidence ${confidence}: ${reasons.join(", ")}`,
  ];

  const assumptions = [
    supply.usingDefaults
      ? "No supply sources configured for this market and audience; default planning figures used"
      : `Supply taken from ${supply.sources} configured source(s)`,
    `Incidence rate of ${ir}% as supplied by the client`,
    hist.n > 0
      ? `Calibrated on ${hist.n} completed GMS project(s) in this market and audience`
      : "No completed GMS projects yet for this market and audience; no calibration applied",
    `Members invited ${INVITES_PER_MEMBER_PER_MONTH}× a month; at most ${MAX_PARTICIPATION * 100}% of qualified members respond`,
    ...(quotas?.length ? ["Quota dimensions assumed independent of each other"] : []),
    "Prices in USD; programming and premium targeting not included",
  ];

  return {
    availableSample: available,
    expectedCompletes,
    fillRate: Math.round(fillRate * 1000) / 1000,
    status,
    cpiMin,
    cpiMax,
    totalMin: round2(cpiMin * N),
    totalMax: round2(cpiMax * N),
    fieldTimeDays,
    confidence,
    assumptions,
    steps,
    calibration: { projectsUsed: hist.n, irReliability: round2(hist.irReliability), cpiFactor: round2(hist.cpiFactor), timeFactor: round2(hist.timeFactor) },
    raw: { cpiMid: round2(rawCpi), fieldDays: Math.round(rawFieldDays * 10) / 10 },
    supply: { members: supply.members, sources: supply.sources, usingDefaults: supply.usingDefaults },
    generatedAt: new Date().toISOString(),
  };
}