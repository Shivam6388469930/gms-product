"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";


type Project = {
  _id: string;
  name: string;
  country: string;
  audienceType: string;
  audienceDescription?: string;
  sampleSize: number;
  loi: number;
  ir: number;
  estimate?: {
    availableSample: number;
    expectedCompletes: number;
    cpiMin: number;
    cpiMax: number;
    totalMin: number;
    totalMax: number;
    fieldTimeDays: number;
    confidence: "high" | "medium" | "low";
  };
};

type PricingTier = {
  name: string;
  badge: string;
  cpi: number;
  total: number;
  deliveryDays: number;
  description: string;
  recommended?: boolean;
};

type Quote = {
  id?: string;
  baseCpi: number;
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
  urgency: string;
  qualityTier: string;
  tiers?: PricingTier[];
  expiresAt?: string;
};

const money = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

function PriceEngineContent() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  const [urgency, setUrgency] =
    useState<"normal" | "urgent" | "very_urgent">("normal");

  const [qualityTier, setQualityTier] = useState<
    "standard" | "premium" | "healthcare_b2b"
  >("standard");

  const [programmingFee, setProgrammingFee] = useState(150);
  const [projectManagementFee, setProjectManagementFee] = useState(100);
  const [analyticsFee, setAnalyticsFee] = useState(50);
  const [marginPercent, setMarginPercent] = useState(10);

  const [currency, setCurrency] = useState<
    "USD" | "EUR" | "GBP" | "INR"
  >("USD");

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/projects/${projectId}`);

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load project");
        }

        setProject(data.project);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load project"
        );
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const baseCpi = useMemo(() => {
    if (!project?.estimate) return 0;

    return (
      (project.estimate.cpiMin +
        project.estimate.cpiMax) /
      2
    );
  }, [project]);

  async function generateQuote() {
    try {
      setCalculating(true);
      setError("");

      const res = await fetch(
        `/api/projects/${projectId}/quote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            urgency,
            qualityTier,
            programmingFee,
            projectManagementFee,
            analyticsFee,
            marginPercent,
            currency,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Unable to generate quote"
        );
      }

      setQuote(data.quote);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate quote"
      );
    } finally {
      setCalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading pricing engine...
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const estimate = project.estimate;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Survey Creation Stepper */}


        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pricing Engine
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Generate a client-facing price quote from the
              feasibility estimate.
            </p>
          </div>

          <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500">
              Project
            </div>

            <div className="font-semibold text-slate-900">
              {project.name}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">

          {/* LEFT */}
          <div className="space-y-6">

            {/* Project summary */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Project Summary
                </h2>

                <p className="text-sm text-slate-500">
                  Inputs received from the feasibility engine.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <SummaryItem
                  label="Country"
                  value={project.country}
                />

                <SummaryItem
                  label="Audience"
                  value={project.audienceType}
                />

                <SummaryItem
                  label="Sample"
                  value={project.sampleSize.toLocaleString()}
                />

                <SummaryItem
                  label="LOI"
                  value={`${project.loi} min`}
                />

                <SummaryItem
                  label="Incidence Rate"
                  value={`${project.ir}%`}
                />

                <SummaryItem
                  label="Available Supply"
                  value={
                    estimate
                      ? estimate.availableSample.toLocaleString()
                      : "-"
                  }
                />

                <SummaryItem
                  label="Expected Completes"
                  value={
                    estimate
                      ? estimate.expectedCompletes.toLocaleString()
                      : "-"
                  }
                />

                <SummaryItem
                  label="Field Time"
                  value={
                    estimate
                      ? `${estimate.fieldTimeDays} days`
                      : "-"
                  }
                />
              </div>
            </section>

            {/* Feasibility */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Feasibility Estimate
                  </h2>

                  <p className="text-sm text-slate-500">
                    Pricing starts from this CPI range.
                  </p>
                </div>

                {estimate && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      estimate.confidence === "high"
                        ? "bg-emerald-100 text-emerald-700"
                        : estimate.confidence === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {estimate.confidence} confidence
                  </span>
                )}
              </div>

              {estimate ? (
                <div className="grid gap-4 sm:grid-cols-3">

                  <MetricCard
                    label="CPI Min"
                    value={money(
                      estimate.cpiMin,
                      currency
                    )}
                  />

                  <MetricCard
                    label="CPI Mid"
                    value={money(
                      baseCpi,
                      currency
                    )}
                    highlighted
                  />

                  <MetricCard
                    label="CPI Max"
                    value={money(
                      estimate.cpiMax,
                      currency
                    )}
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                  No feasibility estimate is available.
                </div>
              )}
            </section>

            {/* Pricing configuration */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Pricing Configuration
                </h2>

                <p className="text-sm text-slate-500">
                  Configure the commercial pricing factors.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                {/* Urgency */}
                <Field label="Fieldwork Urgency">
                  <select
                    value={urgency}
                    onChange={(e) =>
                      setUrgency(
                        e.target.value as
                          | "normal"
                          | "urgent"
                          | "very_urgent"
                      )
                    }
                    className={inputClass}
                  >
                    <option value="normal">
                      Normal — 0%
                    </option>

                    <option value="urgent">
                      Urgent — 15%
                    </option>

                    <option value="very_urgent">
                      Very Urgent — 25%
                    </option>
                  </select>
                </Field>

                {/* Quality */}
                <Field label="Quality Tier">
                  <select
                    value={qualityTier}
                    onChange={(e) =>
                      setQualityTier(
                        e.target.value as
                          | "standard"
                          | "premium"
                          | "healthcare_b2b"
                      )
                    }
                    className={inputClass}
                  >
                    <option value="standard">
                      Standard — 0%
                    </option>

                    <option value="premium">
                      Premium — 15%
                    </option>

                    <option value="healthcare_b2b">
                      Healthcare / B2B — 25%
                    </option>
                  </select>
                </Field>

                {/* Programming */}
                <Field label="Programming Fee">
                  <MoneyInput
                    value={programmingFee}
                    onChange={setProgrammingFee}
                  />
                </Field>

                {/* PM */}
                <Field label="Project Management Fee">
                  <MoneyInput
                    value={projectManagementFee}
                    onChange={setProjectManagementFee}
                  />
                </Field>

                {/* Analytics */}
                <Field label="Analytics Fee">
                  <MoneyInput
                    value={analyticsFee}
                    onChange={setAnalyticsFee}
                  />
                </Field>

                {/* Margin */}
                <Field label="Margin">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={marginPercent}
                      onChange={(e) =>
                        setMarginPercent(
                          Number(e.target.value)
                        )
                      }
                      className={`${inputClass} pr-10`}
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      %
                    </span>
                  </div>
                </Field>

                {/* Currency */}
                <Field label="Currency">
                  <select
                    value={currency}
                    onChange={(e) =>
                      setCurrency(
                        e.target.value as
                          | "USD"
                          | "EUR"
                          | "GBP"
                          | "INR"
                      )
                    }
                    className={inputClass}
                  >
                    <option value="USD">
                      USD — US Dollar
                    </option>

                    <option value="EUR">
                      EUR — Euro
                    </option>

                    <option value="GBP">
                      GBP — British Pound
                    </option>

                    <option value="INR">
                      INR — Indian Rupee
                    </option>
                  </select>
                </Field>
              </div>

              <button
                onClick={generateQuote}
                disabled={
                  calculating || !estimate
                }
                className="mt-7 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {calculating
                  ? "Calculating Price..."
                  : "Generate Price Quote"}
              </button>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="lg:sticky lg:top-6 lg:h-fit">

            <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

              <div className="bg-slate-900 p-6 text-white">
                <div className="text-sm text-slate-300">
                  Client Quote
                </div>

                <div className="mt-2 text-4xl font-bold">
                  {quote
                    ? money(
                        quote.total,
                        quote.currency
                      )
                    : money(0, currency)}
                </div>

                <div className="mt-2 text-xs text-slate-400">
                  {quote
                    ? `Final price • ${quote.currency}`
                    : "Generate a quote to see final price"}
                </div>
              </div>

              <div className="p-6">

                {quote ? (
                  <>
                    <div className="space-y-3">

                      <PriceRow
                        label="Base CPI"
                        value={money(
                          quote.baseCpi,
                          quote.currency
                        )}
                      />

                      <PriceRow
                        label="Final CPI"
                        value={money(
                          quote.finalCpi,
                          quote.currency
                        )}
                        strong
                      />

                      <div className="my-4 border-t" />

                      <PriceRow
                        label={`Sample (${project.sampleSize.toLocaleString()})`}
                        value={money(
                          quote.sampleCost,
                          quote.currency
                        )}
                      />

                      <PriceRow
                        label="Programming"
                        value={money(
                          quote.programmingFee,
                          quote.currency
                        )}
                      />

                      <PriceRow
                        label="Project Management"
                        value={money(
                          quote.projectManagementFee,
                          quote.currency
                        )}
                      />

                      <PriceRow
                        label="Analytics"
                        value={money(
                          quote.analyticsFee,
                          quote.currency
                        )}
                      />

                      <div className="my-4 border-t" />

                      <PriceRow
                        label="Subtotal"
                        value={money(
                          quote.subtotal,
                          quote.currency
                        )}
                        strong
                      />

                      <PriceRow
                        label={`Margin (${quote.marginPercent}%)`}
                        value={money(
                          quote.marginAmount,
                          quote.currency
                        )}
                      />

                      <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            Total
                          </span>

                          <span className="text-xl font-bold text-slate-900">
                            {money(
                              quote.total,
                              quote.currency
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing factors */}
                    <div className="mt-6">
                      <h3 className="mb-3 text-sm font-semibold text-slate-900">
                        Pricing Factors
                      </h3>

                      <div className="space-y-2 text-xs">

                        <Factor
                          label="Urgency"
                          value={formatLabel(
                            quote.urgency
                          )}
                        />

                        <Factor
                          label="Quality"
                          value={formatLabel(
                            quote.qualityTier
                          )}
                        />

                        <Factor
                          label="Currency"
                          value={quote.currency}
                        />
                      </div>
                    </div>

                    {/* Multi-Tier Packages */}
                    {quote.tiers && quote.tiers.length > 0 && (
                      <div className="mt-6 border-t pt-5">
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                          PureSpectrum™ Marketplace Packages
                        </h3>
                        <div className="space-y-2">
                          {quote.tiers.map((tier, idx) => (
                            <div
                              key={idx}
                              className={`rounded-xl border p-3 text-xs transition ${
                                tier.recommended
                                  ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                                  : "border-slate-200 bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">
                                  {tier.name}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    tier.recommended
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {tier.badge}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">{tier.description}</p>
                              <div className="mt-2 flex items-baseline justify-between border-t border-slate-200/60 pt-2 font-medium">
                                <span className="text-slate-600">
                                  CPI: {money(tier.cpi, quote.currency)}
                                </span>
                                <span className="font-bold text-slate-900">
                                  {money(tier.total, quote.currency)} (~{tier.deliveryDays}d)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {quote.expiresAt && (
                      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                        Quote valid until{" "}
                        {new Date(
                          quote.expiresAt
                        ).toLocaleDateString()}
                      </div>
                    )}

                    <button
                      onClick={() =>
                        router.push(
                          `/project/${projectId}/screener`
                        )
                      }
                      className="mt-5 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Continue to Screener Questions →
                    </button>
                  </>
                ) : (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                      $
                    </div>

                    <h3 className="font-semibold text-slate-900">
                      No quote generated
                    </h3>

                    <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
                      Configure the pricing options and
                      click Generate Price Quote.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        $
      </span>

      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
        className={`${inputClass} pl-8`}
      />
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 font-semibold capitalize text-slate-900">
        {value}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlighted
          ? "border-slate-300 bg-slate-900 text-white"
          : "bg-slate-50"
      }`}
    >
      <div
        className={`text-xs ${
          highlighted
            ? "text-slate-300"
            : "text-slate-500"
        }`}
      >
        {label}
      </div>

      <div className="mt-2 text-xl font-bold">
        {value}
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span
        className={
          strong
            ? "font-semibold text-slate-900"
            : "text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "font-semibold text-slate-900"
            : "text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Factor({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-medium text-slate-800">
        {value}
      </span>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) =>
      c.toUpperCase()
    );
}

export default function PriceEnginePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-slate-200" />
          </div>
        </div>
      }
    >
      <PriceEngineContent />
    </Suspense>
  );
}