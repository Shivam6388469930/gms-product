import {
  AUDIENCES,
  COUNTRIES,
  type AudienceType,
} from "@/lib/project-config";

export type SupplierInput = {
  supplierName: string;
  supplierCode: string;
  country: string;
  audienceType: AudienceType;
  audienceDescription: string;
  availableSample: number;
  baseCpi: number;
  historicalIr: number;
  averageLoi: number;
  qualityScore: number;
  active: boolean;
};

type SupplierField = keyof SupplierInput;

type ParseResult =
  | { ok: true; value: Partial<SupplierInput> }
  | { ok: false; message: string };

const numericFields = [
  "availableSample",
  "baseCpi",
  "historicalIr",
  "averageLoi",
  "qualityScore",
] as const satisfies readonly SupplierField[];

const stringFields = [
  "supplierName",
  "supplierCode",
  "country",
  "audienceDescription",
] as const satisfies readonly SupplierField[];

export function parseSupplierInput(
  input: unknown,
  partial = false
): ParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "Invalid request body" };
  }

  const body = input as Record<string, unknown>;
  const value: Partial<SupplierInput> = {};

  for (const field of stringFields) {
    const raw = body[field];
    if (raw === undefined && partial) continue;
    if (typeof raw !== "string") {
      return { ok: false, message: `${field} must be a string` };
    }

    const normalized = raw.trim();
    if (field !== "audienceDescription" && !normalized) {
      return { ok: false, message: `${field} is required` };
    }
    if (
      (field === "supplierName" && normalized.length > 120) ||
      (field === "supplierCode" && normalized.length > 80) ||
      (field === "audienceDescription" && normalized.length > 500)
    ) {
      return { ok: false, message: `${field} is too long` };
    }
    value[field] = normalized;
  }

  if (
    value.country !== undefined &&
    !COUNTRIES.some((country) => country.code === value.country)
  ) {
    return { ok: false, message: "Select a supported country" };
  }

  if (body.audienceType !== undefined || !partial) {
    const audience = AUDIENCES.find(
      (option) => option.value === body.audienceType
    );
    if (!audience) {
      return { ok: false, message: "Select a supported audience type" };
    }
    value.audienceType = audience.value;
  }

  for (const field of numericFields) {
    const raw = body[field];
    if (raw === undefined && partial) continue;
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      return { ok: false, message: `${field} must be a number` };
    }
    if (raw < 0) {
      return { ok: false, message: `${field} cannot be negative` };
    }
    if (field === "availableSample" && !Number.isInteger(raw)) {
      return { ok: false, message: "availableSample must be a whole number" };
    }
    if ((field === "historicalIr" || field === "qualityScore") && raw > 100) {
      return { ok: false, message: `${field} cannot be greater than 100` };
    }
    value[field] = raw;
  }

  if (body.active !== undefined || !partial) {
    if (typeof body.active !== "boolean") {
      return { ok: false, message: "active must be a boolean" };
    }
    value.active = body.active;
  }

  if (partial && Object.keys(value).length === 0) {
    return { ok: false, message: "Provide at least one supplier field to update" };
  }

  return { ok: true, value };
}
