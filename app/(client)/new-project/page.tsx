"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiJSON } from "@/lib/auth-client";

import {
  AUDIENCES,
  COUNTRIES,
  type AdvancedTargeting,
  type AudienceType,
  type Estimate,
  type ProjectDTO,
  type SurveyTargeting,
} from "@/lib/project-config";

import {
  ErrorAlert,
  Field,
  SubmitButton,
  inputClass,
  labelClass,
} from "@/components/Ui";

import { SelectField } from "@/components/Selectfield";
import { EstimateCard } from "@/components/Estimatecard";

/* =========================================================
   TYPES
========================================================= */

type LocationKey =
  | "region"
  | "division"
  | "state"
  | "csa"
  | "cbsa"
  | "county"
  | "dma"
  | "zipcode";

type AdvancedRule = AdvancedTargeting & {
  id: string;
};

/* =========================================================
   OPTIONS
========================================================= */

// Add any categories that appear above "Fashion and Accessories"
// in the PureSpectrum list (they were scrolled out of view).
const CATEGORIES = [
  "Fashion and Accessories",
  "Financial Services",
  "Food",
  "Healthcare",
  "Home and Garden",
  "Home Care",
  "Lifestyles and Hobbies",
  "Media and Entertainment",
  "Office Supplies",
  "Personal Care and Beauty",
  "Pet Care",
  "Shopping and Retail",
  "Technology and Computing",
  "Toys and Games",
  "Travel",
  "Exciting New",
  "Augment Survey",
];

const GENDER_OPTIONS = ["Male", "Female"];

const HISPANIC_OPTIONS = ["Hispanic", "Non-Hispanic"];

const RELATIONSHIP_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Living with partner",
];

const CHILDREN_OPTIONS = ["Yes", "No"];

const EMPLOYMENT_OPTIONS = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Unemployed",
  "Student",
  "Retired",
];

const EDUCATION_OPTIONS = [
  "Less than high school",
  "High school",
  "Some college",
  "Associate degree",
  "Bachelor's degree",
  "Graduate degree",
];

const DEVICE_OPTIONS = ["Desktop", "Mobile", "Tablet"];

/* =========================================================
   HELPERS
========================================================= */

function createDefaultLocation() {
  return {
    region: [],
    division: [],
    state: [],
    csa: [],
    cbsa: [],
    county: [],
    dma: [],
    zipcode: [],
  };
}

function splitValues(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createRule(): AdvancedRule {
  return {
    id: `${Date.now()}-${Math.random()}`,
    field: "",
    operator: "",
    value: "",
    values: [],
  };
}

function buildRange(from: string, to: string): string {
  if (!from && !to) return "All";
  return `${from || "0"}-${to || "max"}`;
}

function buildMulti(selected: string[], all: string[]): string {
  if (selected.length === all.length) return "All";
  return selected.join(", ");
}

/* =========================================================
   RANGE FIELD (Age / Income)
========================================================= */

function RangeField({
  label,
  from,
  to,
  onFromChange,
  onToChange,
  min,
  max,
  prefix,
  disabled,
}: {
  label: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  min?: number;
  max?: number;
  prefix?: string;
  disabled?: boolean;
}) {
  const box = `${inputClass} ${prefix ? "pl-7" : ""}`;

  return (
    <div>
      <span className={`${labelClass} mb-1.5 block`}>{label}</span>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              {prefix}
            </span>
          )}
          <input
            type="number"
            min={min}
            max={max}
            placeholder="From"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            disabled={disabled}
            className={box}
          />
        </div>

        <span className="text-sm text-zinc-500">to</span>

        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              {prefix}
            </span>
          )}
          <input
            type="number"
            min={min}
            max={max}
            placeholder="To"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            disabled={disabled}
            className={box}
          />
        </div>
      </div>

      <p className="mt-1 text-xs text-zinc-500">
        Leave both empty for &quot;All&quot;.
      </p>
    </div>
  );
}

/* =========================================================
   MULTI SELECT (checkbox dropdown)
========================================================= */

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === options.length;

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  }

  return (
    <div className="relative">
      <span className={`${labelClass} mb-1.5 block`}>{label}</span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span className="truncate">
          {allSelected
            ? "All"
            : selected.length === 0
            ? "None selected"
            : selected.join(", ")}
        </span>
        <span className="ml-2 text-xs">▾</span>
      </button>

      {open && (
        <>
          {/* click-away layer */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
            <label className="flex cursor-pointer items-center gap-2 border-b border-zinc-200 px-2 py-2 text-sm font-medium dark:border-zinc-800">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  onChange(allSelected ? [] : [...options])
                }
              />
              {allSelected ? "Deselect All" : "Select All"}
            </label>

            {options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function NewProjectPage() {
  const router = useRouter();

  /* =======================================================
     BASIC PROJECT
  ======================================================= */

  const [surveyTitle, setSurveyTitle] = useState("");

  const [country, setCountry] = useState("US");

  const [audienceType, setAudienceType] =
    useState<AudienceType>("consumer");

  const [audienceDescription, setAudienceDescription] =
    useState("");

  /* =======================================================
     FEASIBILITY
  ======================================================= */

  const [sampleSize, setSampleSize] = useState("500");

  const [loi, setLoi] = useState("10");

  const [ir, setIr] = useState("30");


  /* =======================================================
     TARGETING
  ======================================================= */

  const [language, setLanguage] = useState("English");

  const [category, setCategory] = useState("");

  const [gender, setGender] = useState<string[]>(GENDER_OPTIONS);

  const [hispanicOrigin, setHispanicOrigin] =
    useState<string[]>(HISPANIC_OPTIONS);

  const [relationship, setRelationship] =
    useState<string[]>(RELATIONSHIP_OPTIONS);

  const [children, setChildren] =
    useState<string[]>(CHILDREN_OPTIONS);

  const [employment, setEmployment] =
    useState<string[]>(EMPLOYMENT_OPTIONS);

  const [education, setEducation] =
    useState<string[]>(EDUCATION_OPTIONS);

  const [device, setDevice] = useState<string[]>(DEVICE_OPTIONS);

  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");

  const [incomeFrom, setIncomeFrom] = useState("");
  const [incomeTo, setIncomeTo] = useState("");

  /* =======================================================
     LOCATION TARGETING
  ======================================================= */

  const [location, setLocation] = useState(
    createDefaultLocation()
  );

  /* =======================================================
     ADVANCED TARGETING
  ======================================================= */

  const [advancedRules, setAdvancedRules] =
    useState<AdvancedRule[]>([]);

  /* =======================================================
     QUOTA NESTING
  ======================================================= */

  const [quotaNestingJson, setQuotaNestingJson] =
    useState("");

  /* =======================================================
     UI
  ======================================================= */

  const [estimate, setEstimate] =
    useState<Estimate | null>(null);

  const [estimating, setEstimating] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOCATION HANDLER
  ======================================================= */

  function updateLocation(
    field: LocationKey,
    value: string
  ) {
    setLocation((previous) => ({
      ...previous,
      [field]: splitValues(value),
    }));
  }

  function locationValue(field: LocationKey) {
    return location[field].join(", ");
  }

  /* =======================================================
     ADVANCED TARGETING
  ======================================================= */

  function addAdvancedRule() {
    setAdvancedRules((previous) => [
      ...previous,
      createRule(),
    ]);
  }

  function removeAdvancedRule(id: string) {
    setAdvancedRules((previous) =>
      previous.filter((rule) => rule.id !== id)
    );
  }

  function updateAdvancedRule(
    id: string,
    field: keyof AdvancedRule,
    value: string
  ) {
    setAdvancedRules((previous) =>
      previous.map((rule) => {
        if (rule.id !== id) return rule;

        if (field === "values") {
          return {
            ...rule,
            values: splitValues(value),
          };
        }

        return {
          ...rule,
          [field]: value,
        };
      })
    );
  }

  /* =======================================================
     LIVE FEASIBILITY ESTIMATE
  ======================================================= */

  useEffect(() => {
    const n = Number(sampleSize);
    const l = Number(loi);
    const r = Number(ir);

    if (
      !Number.isInteger(n) ||
      n < 1||
      n > 100000 ||
      !Number.isInteger(l) ||
      l < 1 ||
      l > 60 ||
      !Number.isFinite(r) ||
      r < 1 ||
      r > 100
    ) {
      setEstimate(null);
      setEstimating(false);

      return;
    }

    setEstimating(true);

    const timer = setTimeout(async () => {
      try {
        const { ok, status, data } =
          await apiJSON<{
            estimate: Estimate;
            message?: string;
          }>("/api/projects/estimate", "POST", {
            country,
            audienceType,
            sampleSize: n,
            loi: l,
            ir: r,
          });

        if (status === 401) {
          router.replace("/login");
          return;
        }

        if (!ok) {
          setEstimate(null);
          return;
        }

        setEstimate(data.estimate ?? null);
      } catch (error) {
        console.error(
          "Estimate request failed:",
          error
        );

        setEstimate(null);
      } finally {
        setEstimating(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    country,
    audienceType,
    sampleSize,
    loi,
    ir,
    router,
  ]);

  /* =======================================================
     CREATE PROJECT
  ======================================================= */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    const trimmedTitle = surveyTitle.trim();

    const trimmedDescription =
      audienceDescription.trim();

    const n = Number(sampleSize);
    const l = Number(loi);
    const r = Number(ir);

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (trimmedTitle.length < 2) {
      setError(
        "Survey title must be at least 2 characters."
      );
      return;
    }

    if (trimmedTitle.length > 120) {
      setError(
        "Survey title cannot exceed 120 characters."
      );
      return;
    }

    if (!country) {
      setError("Please select a country.");
      return;
    }

    if (!audienceType) {
      setError("Please select an audience.");
      return;
    }

    if (trimmedDescription.length > 500) {
      setError(
        "Audience description cannot exceed 500 characters."
      );
      return;
    }

    if (
      !Number.isInteger(n) ||
      n < 10 ||
      n > 100000
    ) {
      setError(
        "Sample size must be between 10 and 100,000."
      );
      return;
    }

    if (
      !Number.isInteger(l) ||
      l < 1 ||
      l > 60
    ) {
      setError(
        "LOI must be between 1 and 60 minutes."
      );
      return;
    }

    if (
      !Number.isFinite(r) ||
      r < 1 ||
      r > 100
    ) {
      setError(
        "Expected IR must be between 1% and 100%."
      );
      return;
    }

    /* =====================================================
       DEMOGRAPHIC VALIDATION
    ===================================================== */

    if (ageFrom && ageTo && Number(ageFrom) > Number(ageTo)) {
      setError("Age 'From' cannot be greater than 'To'.");
      return;
    }

    if (
      incomeFrom &&
      incomeTo &&
      Number(incomeFrom) > Number(incomeTo)
    ) {
      setError("Income 'From' cannot be greater than 'To'.");
      return;
    }

    if (
      [
        gender,
        hispanicOrigin,
        relationship,
        children,
        employment,
        education,
        device,
      ].some((list) => list.length === 0)
    ) {
      setError(
        "Select at least one option in every demographic filter."
      );
      return;
    }

    /* =====================================================
       PARSE QUOTA NESTING
    ===================================================== */

    let quotaNesting: unknown[] = [];

    if (quotaNestingJson.trim()) {
      try {
        const parsed = JSON.parse(
          quotaNestingJson
        );

        if (!Array.isArray(parsed)) {
          setError(
            "Quota nesting must be a JSON array."
          );
          return;
        }

        quotaNesting = parsed;
      } catch {
        setError(
          "Quota nesting contains invalid JSON."
        );
        return;
      }
    }

    /* =====================================================
       BUILD ADVANCED TARGETING
    ===================================================== */

    const advancedTargeting =
      advancedRules
        .map((rule) => {
          const result: AdvancedTargeting = {};

          if (rule.field?.trim()) {
            result.field = rule.field.trim();
          }

          if (rule.operator?.trim()) {
            result.operator =
              rule.operator.trim();
          }

          if (
            typeof rule.value === "string" &&
            rule.value.trim()
          ) {
            result.value = rule.value.trim();
          }

          if (
            Array.isArray(rule.values) &&
            rule.values.length > 0
          ) {
            result.values = rule.values;
          }

          return result;
        })
        .filter(
          (rule) =>
            Object.keys(rule).length > 0
        );

    /* =====================================================
       BUILD TARGETING
    ===================================================== */

    const targeting: SurveyTargeting = {
      country: country as any,

      language: language.trim() || "English",

      category: category.trim(),

      gender: buildMulti(gender, GENDER_OPTIONS),

      age: buildRange(ageFrom, ageTo),

      income: buildRange(incomeFrom, incomeTo),

      hispanicOrigin: buildMulti(
        hispanicOrigin,
        HISPANIC_OPTIONS
      ),

      relationship: buildMulti(
        relationship,
        RELATIONSHIP_OPTIONS
      ),

      children: buildMulti(children, CHILDREN_OPTIONS),

      employment: buildMulti(
        employment,
        EMPLOYMENT_OPTIONS
      ),

      education: buildMulti(
        education,
        EDUCATION_OPTIONS
      ),

      device: buildMulti(device, DEVICE_OPTIONS),

      advancedTargeting,

      location,

      quotaNesting,
    };

    /* =====================================================
       SAVE
    ===================================================== */

    setSaving(true);

    try {
      const { ok, status, data } =
        await apiJSON<{
          project: ProjectDTO;
          message?: string;
        }>("/api/projects", "POST", {
          surveyTitle: trimmedTitle,

          country,

          audienceType,

          audienceDescription:
            trimmedDescription,

          sampleSize: n,

          loi: l,

          ir: r,

          targeting,
        });

      /* ===================================================
         AUTH
      =================================================== */

      if (status === 401) {
        router.replace("/login");
        return;
      }

      /* ===================================================
         API ERROR
      =================================================== */

      if (!ok) {
        setError(
          data?.message ||
            "Couldn't create the survey."
        );

        return;
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      if (!data?.project?._id) {
        setError(
          "Survey was created, but the project ID was not returned."
        );

        return;
      }

      router.push(
        `/project-details/${data.project._id}`
      );
    } catch (error) {
      console.error(
        "Create survey error:",
        error
      );

      setError(
        "Something went wrong while creating the survey."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      {/* =====================================================
          BACK
      ===================================================== */}

      <Link
        href="/project"
        className="
          text-sm
          text-zinc-500
          hover:text-zinc-900
          dark:text-zinc-400
          dark:hover:text-zinc-50
        "
      >
        ← Surveys
      </Link>

      {/* =====================================================
          TITLE
      ===================================================== */}

      <h1 className="mb-8 mt-3 text-2xl font-semibold tracking-tight">
        New survey
      </h1>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

        {/* ===================================================
            FORM
        =================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
          noValidate
        >

          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Configure the basic details of your survey.
              </p>
            </div>

            <div className="space-y-5">

              <Field
                label="Survey title"
                placeholder="Q4 brand tracker"
                maxLength={120}
                value={surveyTitle}
                onChange={(e) =>
                  setSurveyTitle(e.target.value)
                }
                disabled={saving}
              />

              <div className="grid gap-5 sm:grid-cols-2">

                <SelectField
                  label="Country"
                  value={country}
                  onChange={(e) =>
                    setCountry(e.target.value)
                  }
                  options={COUNTRIES.map((c) => ({
                    value: c.code,
                    label: c.name,
                  }))}
                  disabled={saving}
                />

                <SelectField
                  label="Audience"
                  value={audienceType}
                  onChange={(e) =>
                    setAudienceType(
                      e.target.value as AudienceType
                    )
                  }
                  options={AUDIENCES}
                  disabled={saving}
                />

              </div>

              <div>
                <label
                  htmlFor="audience-description"
                  className={`${labelClass} mb-1.5`}
                >
                  Audience details
                </label>

                <textarea
                  id="audience-description"
                  rows={4}
                  maxLength={500}
                  disabled={saving}
                  placeholder="Describe the target audience..."
                  value={audienceDescription}
                  onChange={(e) =>
                    setAudienceDescription(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />

                <div className="mt-1 text-right text-xs text-zinc-400">
                  {audienceDescription.length}/500
                </div>
              </div>

            </div>
          </section>

          {/* =================================================
              SAMPLE / FEASIBILITY
          ================================================= */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Sample & Feasibility
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Define the required sample and survey expectations.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">

              <Field
                label="Sample size (N)"
                type="number"
                min={1}
                max={100000}
                value={sampleSize}
                onChange={(e) =>
                  setSampleSize(e.target.value)
                }
                disabled={saving}
              />

              <Field
                label="LOI (minutes)"
                type="number"
                min={1}
                max={60}
                value={loi}
                onChange={(e) =>
                  setLoi(e.target.value)
                }
                disabled={saving}
              />

              <Field
                label="Expected IR (%)"
                type="number"
                min={1}
                max={100}
                value={ir}
                onChange={(e) =>
                  setIr(e.target.value)
                }
                disabled={saving}
              />

            </div>
          </section>

          {/* =================================================
              DEMOGRAPHIC TARGETING
          ================================================= */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Demographic Targeting
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Define who should qualify for this survey.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <Field
                label="Language"
                placeholder="English"
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
                disabled={saving}
              />

              <SelectField
                label="Category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                options={[
                  { value: "", label: "Select Category" },
                  ...CATEGORIES.map((c) => ({
                    value: c,
                    label: c,
                  })),
                ]}
                disabled={saving}
              />

              <MultiSelect
                label="Gender"
                options={GENDER_OPTIONS}
                selected={gender}
                onChange={setGender}
                disabled={saving}
              />

              <RangeField
                label="Age"
                from={ageFrom}
                to={ageTo}
                onFromChange={setAgeFrom}
                onToChange={setAgeTo}
                min={13}
                max={99}
                disabled={saving}
              />

              <RangeField
                label="Income"
                from={incomeFrom}
                to={incomeTo}
                onFromChange={setIncomeFrom}
                onToChange={setIncomeTo}
                min={0}
                prefix="$"
                disabled={saving}
              />

              <MultiSelect
                label="Hispanic Origin"
                options={HISPANIC_OPTIONS}
                selected={hispanicOrigin}
                onChange={setHispanicOrigin}
                disabled={saving}
              />

              <MultiSelect
                label="Relationship"
                options={RELATIONSHIP_OPTIONS}
                selected={relationship}
                onChange={setRelationship}
                disabled={saving}
              />

              <MultiSelect
                label="Children"
                options={CHILDREN_OPTIONS}
                selected={children}
                onChange={setChildren}
                disabled={saving}
              />

              <MultiSelect
                label="Employment"
                options={EMPLOYMENT_OPTIONS}
                selected={employment}
                onChange={setEmployment}
                disabled={saving}
              />

              <MultiSelect
                label="Education"
                options={EDUCATION_OPTIONS}
                selected={education}
                onChange={setEducation}
                disabled={saving}
              />

              <MultiSelect
                label="Device"
                options={DEVICE_OPTIONS}
                selected={device}
                onChange={setDevice}
                disabled={saving}
              />

            </div>
          </section>

          {/* =================================================
              LOCATION TARGETING
          ================================================= */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Geographic Targeting
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Enter multiple values separated by commas.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <Field
                label="Region"
                placeholder="Northeast, Midwest..."
                value={locationValue("region")}
                onChange={(e) =>
                  updateLocation(
                    "region",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="Division"
                placeholder="East South Central..."
                value={locationValue("division")}
                onChange={(e) =>
                  updateLocation(
                    "division",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="State"
                placeholder="California, Texas, New York..."
                value={locationValue("state")}
                onChange={(e) =>
                  updateLocation(
                    "state",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="CSA"
                placeholder="CSA codes..."
                value={locationValue("csa")}
                onChange={(e) =>
                  updateLocation(
                    "csa",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="CBSA"
                placeholder="CBSA codes..."
                value={locationValue("cbsa")}
                onChange={(e) =>
                  updateLocation(
                    "cbsa",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="County"
                placeholder="Los Angeles, Cook..."
                value={locationValue("county")}
                onChange={(e) =>
                  updateLocation(
                    "county",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="DMA"
                placeholder="DMA codes..."
                value={locationValue("dma")}
                onChange={(e) =>
                  updateLocation(
                    "dma",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="ZIP Code"
                placeholder="10001, 90210, 60601..."
                value={locationValue("zipcode")}
                onChange={(e) =>
                  updateLocation(
                    "zipcode",
                    e.target.value
                  )
                }
                disabled={saving}
              />

            </div>
          </section>

          {/* =================================================
              ADVANCED TARGETING
          ================================================= */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5 flex items-start justify-between gap-4">

              <div>
                <h2 className="text-lg font-semibold">
                  Advanced Targeting
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Add custom targeting conditions.
                </p>
              </div>

              <button
                type="button"
                onClick={addAdvancedRule}
                disabled={saving}
                className="
                  rounded-lg
                  border
                  border-zinc-300
                  px-3
                  py-2
                  text-sm
                  font-medium
                  hover:bg-zinc-50
                  dark:border-zinc-700
                  dark:hover:bg-zinc-900
                "
              >
                + Add rule
              </button>

            </div>

            {advancedRules.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                No advanced targeting rules added.
              </div>
            ) : (
              <div className="space-y-4">

                {advancedRules.map(
                  (rule, index) => (
                    <div
                      key={rule.id}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >

                      <div className="mb-4 flex items-center justify-between">

                        <span className="text-sm font-medium">
                          Rule {index + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeAdvancedRule(
                              rule.id
                            )
                          }
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>

                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">

                        <Field
                          label="Field"
                          placeholder="age, gender, income..."
                          value={
                            rule.field ?? ""
                          }
                          onChange={(e) =>
                            updateAdvancedRule(
                              rule.id,
                              "field",
                              e.target.value
                            )
                          }
                          disabled={saving}
                        />

                        <Field
                          label="Operator"
                          placeholder="equals, contains, in..."
                          value={
                            rule.operator ?? ""
                          }
                          onChange={(e) =>
                            updateAdvancedRule(
                              rule.id,
                              "operator",
                              e.target.value
                            )
                          }
                          disabled={saving}
                        />

                        <Field
                          label="Value"
                          placeholder="25-34"
                          value={
                            typeof rule.value ===
                            "string"
                              ? rule.value
                              : ""
                          }
                          onChange={(e) =>
                            updateAdvancedRule(
                              rule.id,
                              "value",
                              e.target.value
                            )
                          }
                          disabled={saving}
                        />

                        <Field
                          label="Values"
                          placeholder="25-34, 35-44, 45-54"
                          value={
                            rule.values?.join(
                              ", "
                            ) ?? ""
                          }
                          onChange={(e) =>
                            updateAdvancedRule(
                              rule.id,
                              "values",
                              e.target.value
                            )
                          }
                          disabled={saving}
                        />

                      </div>

                    </div>
                  )
                )}

              </div>
            )}
          </section>

          {/* =================================================
              QUOTA NESTING
          ================================================= */}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Quota Nesting
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Optional JSON configuration for nested quota structures.
              </p>
            </div>

            <textarea
              rows={8}
              disabled={saving}
              value={quotaNestingJson}
              onChange={(e) =>
                setQuotaNestingJson(
                  e.target.value
                )
              }
              placeholder={`[
  {
    "field": "gender",
    "children": [
      {
        "field": "age"
      }
    ]
  }
]`}
              className={`${inputClass} font-mono text-sm`}
            />

            <p className="mt-2 text-xs text-zinc-500">
              Leave empty if quota nesting is not required.
            </p>
          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          <ErrorAlert message={error} />

          {/* =================================================
              SUBMIT
          ================================================= */}

          <div className="max-w-[220px]">
            <SubmitButton
              loading={saving}
              loadingText="Creating"
            >
              Create survey
            </SubmitButton>
          </div>

          {/* =================================================
              INFO
          ================================================= */}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Surveys are saved as drafts. You can configure
            additional survey setup and routing after creation.
            Nothing is charged or launched until you press
            Launch.
          </p>
        </form>

        {/* ===================================================
            LIVE ESTIMATE
        =================================================== */}

        <div className="lg:sticky lg:top-8 lg:self-start">
          <EstimateCard
            estimate={estimate}
            loading={estimating}
          />
        </div>

      </div>
    </>
  );
}