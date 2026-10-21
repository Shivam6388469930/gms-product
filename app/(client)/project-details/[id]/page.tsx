"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { apiJSON } from "@/lib/auth-client";
import {
  AUDIENCES,
  COUNTRIES,
  type ProjectDTO,
} from "@/lib/project-config";

import { StatusBadge } from "@/components/Statusbadge";
import { EstimateCard, usd } from "@/components/Estimatecard";
import {
  ErrorAlert,
  Spinner,
  primaryButtonClass,
} from "@/components/Ui";

const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-zinc-100 focus-visible:ring-4 focus-visible:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900";

const dangerBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 outline-none transition hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30";

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        {label}
      </div>

      <div className="mt-1 text-xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-100 py-3 last:border-b-0 dark:border-zinc-800">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </div>

      <div className="text-sm text-zinc-700 dark:text-zinc-200">
        {value || "—"}
      </div>
    </div>
  );
}

function ValueList({
  values,
  emptyText = "All / Not specified",
}: {
  values?: string[];
  emptyText?: string;
}) {
  if (!values?.length) {
    return <span className="text-zinc-400">{emptyText}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="rounded-md bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

/* =========================================================
   FORMAT HELPERS
========================================================= */

/**
 * Multi-select values are saved as "All" or "Male, Female".
 * Show "All" as plain text and anything else as chips.
 */
function MultiValue({ value }: { value: unknown }) {
  const list = toList(value);

  if (list.length === 0) {
    return <span>All</span>;
  }

  if (list.length === 1 && list[0].toLowerCase() === "all") {
    return <span>All</span>;
  }

  return <ValueList values={list} />;
}

function toList(value: unknown): string[] {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Ranges are saved as "All", "25-45", "25-max" or "0-45".
 */
function formatRange(value: unknown, prefix = ""): string {
  if (value === null || value === undefined || value === "") {
    return "All";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "All";
  }

  if (typeof value === "object") {
    const obj = value as { min?: unknown; max?: unknown };

    if (obj.min !== undefined || obj.max !== undefined) {
      return formatRange(
        `${obj.min ?? ""}-${obj.max ?? "max"}`,
        prefix
      );
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "Configured";
    }
  }

  const text = String(value).trim();

  if (text.toLowerCase() === "all") {
    return "All";
  }

  const match = text.match(/^(\d*)\s*-\s*(\d*|max)$/i);

  if (!match) {
    return text;
  }

  const from = match[1];
  const to = match[2].toLowerCase() === "max" ? "" : match[2];

  const fmt = (n: string) =>
    `${prefix}${Number(n).toLocaleString()}`;

  if (from && to) return `${fmt(from)} to ${fmt(to)}`;
  if (from && Number(from) > 0) return `${fmt(from)} and above`;
  if (to) return `Up to ${fmt(to)}`;

  return "All";
}

function formatRuleValue(rule: {
  value?: unknown;
  values?: unknown;
}): string {
  if (Array.isArray(rule.values) && rule.values.length > 0) {
    return rule.values.map(String).join(", ");
  }

  if (
    rule.value !== undefined &&
    rule.value !== null &&
    rule.value !== ""
  ) {
    return String(rule.value);
  }

  return "—";
}

/* =========================================================
   PAGE
========================================================= */

function ProjectDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;

    setError("");

    try {
      const { ok, status, data } = await apiJSON<{
        project: ProjectDTO;
        message?: string;
      }>(`/api/projects/${id}`);

      if (status === 401) {
        router.replace("/login");
        return;
      }

      if (!ok) {
        setError(data?.message || "Couldn't load the project.");
        return;
      }

      setProject(data.project);
    } catch (err) {
      console.error("Load project error:", err);
      setError("Couldn't load the project.");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh live-project progress every 10 seconds.
  useEffect(() => {
    if (project?.status !== "live") return;

    const timer = setInterval(() => {
      load();
    }, 10000);

    return () => clearInterval(timer);
  }, [project?.status, load]);

  async function act(
    action: "launch" | "pause" | "resume" | "stop"
  ) {
    if (
      action === "stop" &&
      !window.confirm("Stop this project? This can't be undone.")
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { ok, status, data } = await apiJSON<{
        project: ProjectDTO;
        message?: string;
      }>(`/api/projects/${id}/status`, "POST", { action });

      if (status === 401) {
        router.replace("/login");
        return;
      }

      if (ok) {
        setProject(data.project);
      } else {
        setError(data?.message || "Action failed.");
      }
    } catch (err) {
      console.error("Status action error:", err);
      setError("Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this draft?")) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { ok, status, data } = await apiJSON<{
        message?: string;
      }>(`/api/projects/${id}`, "DELETE");

      if (status === 401) {
        router.replace("/login");
        return;
      }

      if (ok) {
        router.replace("/project");
        return;
      }

      setError(data?.message || "Couldn't delete the project.");
    } catch (err) {
      console.error("Delete project error:", err);
      setError("Couldn't delete the project.");
    } finally {
      setBusy(false);
    }
  }

  const audience = useMemo(() => {
    if (!project) return "";

    return (
      AUDIENCES.find((item) => item.value === project.audienceType)
        ?.label || project.audienceType
    );
  }, [project]);

  const countryName = useMemo(() => {
    if (!project) return "";

    return (
      COUNTRIES.find((country) => country.code === project.country)
        ?.name || project.country
    );
  }, [project]);

  if (!project) {
    return error ? (
      <ErrorAlert message={error} />
    ) : (
      <Spinner className="h-5 w-5 text-zinc-500" />
    );
  }

  const p = project;

  const starts = Number(p.progress?.starts ?? 0);
  const completes = Number(p.progress?.completes ?? 0);
  const screenouts = Number(p.progress?.screenouts ?? 0);
  const quotaFull = Number(p.progress?.quotaFull ?? 0);
  const qualityRejects = Number(p.progress?.qualityRejects ?? 0);
  const spend = Number(p.progress?.spend ?? 0);
  const sampleSize = Number(p.sampleSize ?? 0);

  const pct =
    sampleSize > 0
      ? Math.min(100, Math.round((completes / sampleSize) * 100))
      : 0;

  /*
   * The create form saves demographics as flat keys on `targeting`
   * (targeting.gender, targeting.age, ...). Older projects may have
   * them nested under `targeting.demographics`, so read both.
   */
  const targeting = (p.targeting ?? {}) as Record<string, any>;
  const demographics = (targeting.demographics ?? {}) as Record<
    string,
    unknown
  >;

  const demo = (key: string): unknown =>
    targeting[key] ?? demographics[key];

  const location = (targeting.location ?? {}) as Record<
    string,
    string[] | undefined
  >;

  const advancedTargeting = (targeting.advancedTargeting ??
    []) as Array<{
    field?: unknown;
    operator?: unknown;
    value?: unknown;
    values?: unknown;
  }>;

  const quotaNesting = (targeting.quotaNesting ?? []) as unknown[];

  return (
    <>
      {/* Breadcrumb */}
      <Link
        href="/project"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Projects
      </Link>

      {/* Header */}
      <div className="mb-8 mt-3 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {p.surveyTitle}
            </h1>

            <StatusBadge status={p.status} />
          </div>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {countryName} · {audience} · N=
            {sampleSize.toLocaleString()} · {p.loi} min · IR {p.ir}%
          </p>

          {p.audienceDescription && (
            <p className="mt-2 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
              {p.audienceDescription}
            </p>
          )}

          <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Project ID: {p._id}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {p.status === "draft" && (
            <>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className={dangerBtn}
              >
                Delete
              </button>

              <a
               href={`/project/${p._id}/price`}
                
                // disabled={busy}
                className={`${primaryButtonClass} !w-auto`}
              >
                {busy && <Spinner className="h-4 w-4" />}
               {"->" } Price Engine
              </a>
            </>
          )}

          {p.status === "live" && (
            <>
              <button
                type="button"
                onClick={() => act("pause")}
                disabled={busy}
                className={secondaryBtn}
              >
                Pause
              </button>

              <button
                type="button"
                onClick={() => act("stop")}
                disabled={busy}
                className={dangerBtn}
              >
                Stop
              </button>
            </>
          )}

          {p.status === "paused" && (
            <>
              <button
                type="button"
                onClick={() => act("stop")}
                disabled={busy}
                className={dangerBtn}
              >
                Stop
              </button>

              <button
                type="button"
                onClick={() => act("resume")}
                disabled={busy}
                className={`${primaryButtonClass} !w-auto`}
              >
                Resume
              </button>
            </>
          )}

          {p.status === "stopped" && (
            <span className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Project stopped
            </span>
          )}
        </div>
      </div>

      <ErrorAlert message={error} />

      {/* Main content */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="min-w-0">
          {/* Progress */}
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">
              Completes vs target
            </span>

            <span className="font-medium tabular-nums">
              {completes.toLocaleString()} /{" "}
              {sampleSize.toLocaleString()}
            </span>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-50"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Starts" value={starts.toLocaleString()} />
            <Stat label="Completes" value={completes.toLocaleString()} />
            <Stat label="Screenouts" value={screenouts.toLocaleString()} />
            <Stat label="Quota full" value={quotaFull.toLocaleString()} />
            <Stat
              label="Quality rejects"
              value={qualityRejects.toLocaleString()}
            />
            <Stat label="Spend" value={usd(spend)} />
          </div>

          {/* Draft notice */}
          {p.status === "draft" && (
            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="text-sm font-medium">
                This project is a draft.
              </p>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Review the targeting, survey setup and feasibility
                before launching the project.
              </p>
            </div>
          )}

          {/* Targeting */}
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Targeting</h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Audience and respondent targeting configuration.
              </p>
            </div>

            <div className="px-5">
              <DetailRow
                label="Country"
                value={(targeting.country as string) || countryName}
              />

              <DetailRow
                label="Language"
                value={(targeting.language as string) || "English"}
              />

              <DetailRow
                label="Category"
                value={(targeting.category as string) || "All"}
              />

              <DetailRow
                label="Gender"
                value={<MultiValue value={demo("gender")} />}
              />

              <DetailRow
                label="Age"
                value={formatRange(demo("age"))}
              />

              <DetailRow
                label="Income"
                value={formatRange(demo("income"), "$")}
              />

              <DetailRow
                label="Hispanic Origin"
                value={<MultiValue value={demo("hispanicOrigin")} />}
              />

              <DetailRow
                label="Relationship"
                value={<MultiValue value={demo("relationship")} />}
              />

              <DetailRow
                label="Children"
                value={<MultiValue value={demo("children")} />}
              />

              <DetailRow
                label="Employment"
                value={<MultiValue value={demo("employment")} />}
              />

              <DetailRow
                label="Education"
                value={<MultiValue value={demo("education")} />}
              />

              <DetailRow
                label="Device"
                value={<MultiValue value={demo("device")} />}
              />
            </div>
          </div>

          {/* Geographic targeting */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Geographic Targeting</h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Geographic filters configured for this project.
              </p>
            </div>

            <div className="px-5">
              <DetailRow
                label="Region"
                value={<ValueList values={location.region} />}
              />

              <DetailRow
                label="Division"
                value={<ValueList values={location.division} />}
              />

              <DetailRow
                label="State"
                value={<ValueList values={location.state} />}
              />

              <DetailRow
                label="CSA"
                value={<ValueList values={location.csa} />}
              />

              <DetailRow
                label="CBSA"
                value={<ValueList values={location.cbsa} />}
              />

              <DetailRow
                label="County"
                value={<ValueList values={location.county} />}
              />

              <DetailRow
                label="DMA"
                value={<ValueList values={location.dma} />}
              />

              <DetailRow
                label="ZIP Code"
                value={<ValueList values={location.zipcode} />}
              />
            </div>
          </div>

          {/* Advanced targeting */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Advanced Targeting</h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Additional targeting rules applied to respondents.
              </p>
            </div>

            <div className="p-5">
              {advancedTargeting.length ? (
                <div className="space-y-3">
                  {advancedTargeting.map((rule, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <div className="text-xs text-zinc-400">
                            Field
                          </div>

                          <div className="mt-1 text-sm font-medium">
                            {String(rule.field || "—")}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-zinc-400">
                            Operator
                          </div>

                          <div className="mt-1 text-sm font-medium">
                            {String(rule.operator || "—")}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-zinc-400">
                            Value
                          </div>

                          <div className="mt-1 text-sm font-medium">
                            {formatRuleValue(rule)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No advanced targeting rules configured.
                </p>
              )}
            </div>
          </div>

          {/* Quota nesting */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Quota Nesting</h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Nested quota configuration for this project.
              </p>
            </div>

            <div className="p-5">
              {quotaNesting.length ? (
                <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-200">
                  {JSON.stringify(quotaNesting, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No quota nesting configured.
                </p>
              )}
            </div>
          </div>

          {/* Survey setup */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <div>
                <h2 className="font-semibold">Survey Setup</h2>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Survey URL and respondent routing configuration.
                </p>
              </div>

              {p.surveySetup?.status === "ready" ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Ready
                </span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Not configured
                </span>
              )}
            </div>

            <div className="px-5">
              <DetailRow
                label="Survey Type"
                value={
                  p.surveySetup?.surveyType === "internal"
                    ? "Internal"
                    : "External"
                }
              />

              <DetailRow
                label="Survey URL"
                value={
                  p.surveySetup?.surveyUrl ? (
                    <a
                      href={p.surveySetup.surveyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
                    >
                      {p.surveySetup.surveyUrl}
                    </a>
                  ) : (
                    "Not configured"
                  )
                }
              />

              <DetailRow
                label="Estimated LOI"
                value={
                  p.surveySetup?.estimatedLoi
                    ? `${p.surveySetup.estimatedLoi} min`
                    : "Not configured"
                }
              />

              <DetailRow
                label="Qualification URL"
                value={p.surveySetup?.qualificationUrl || "Not configured"}
              />

              <DetailRow
                label="Termination URL"
                value={p.surveySetup?.terminationUrl || "Not configured"}
              />

              <DetailRow
                label="Redirect URL"
                value={p.surveySetup?.redirectUrl || "Not configured"}
              />
            </div>
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="space-y-6">
          <EstimateCard estimate={p.estimate} />

          {/* Project summary */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Project Summary</h2>
            </div>

            <div className="px-5">
              <DetailRow label="Country" value={countryName} />
              <DetailRow label="Audience" value={audience} />
              <DetailRow
                label="Sample Size"
                value={sampleSize.toLocaleString()}
              />
              <DetailRow label="LOI" value={`${p.loi} minutes`} />
              <DetailRow label="IR" value={`${p.ir}%`} />
              <DetailRow
                label="Status"
                value={<StatusBadge status={p.status} />}
              />
            </div>
          </div>

          {/* Fieldwork metrics */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Fieldwork Metrics</h2>
            </div>

            <div className="px-5">
              <DetailRow label="Starts" value={starts.toLocaleString()} />
              <DetailRow
                label="Completes"
                value={completes.toLocaleString()}
              />
              <DetailRow
                label="Screenouts"
                value={screenouts.toLocaleString()}
              />
              <DetailRow
                label="Quota Full"
                value={quotaFull.toLocaleString()}
              />
              <DetailRow
                label="Quality Rejects"
                value={qualityRejects.toLocaleString()}
              />
              <DetailRow label="Spend" value={usd(spend)} />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-white" />
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}