


// Project detail page — copy-ready version
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { apiJSON } from "@/lib/auth-client";
import { AUDIENCES, COUNTRIES, type ProjectDTO } from "@/lib/project-config";
import { StatusBadge } from "@/components/Statusbadge";
import { EstimateCard, usd } from "@/components/Estimatecard";
import { ErrorAlert, Spinner, primaryButtonClass } from "@/components/Ui";

type Section = "basic" | "sample" | "targeting" | "quotas";

const editableTabs: Array<{ id: Section; label: string }> = [
  { id: "basic", label: "Basic Information" },
  { id: "sample", label: "Sample & Feasibility" },
  { id: "targeting", label: "Targeting" },
  { id: "quotas", label: "Quotas" },
];

const navigationTabs = [
    { label: "Screener", path: "screener" },
  { label: "Survey Setup", path: "survey-setup" },

  { label: "Routing / Allocation", path: "sample-routing" },
  { label: "Review & Launch", path: "review" },
];

const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-zinc-100 focus-visible:ring-4 focus-visible:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-black";


// EXACT option lists used by the Create Project page.
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-100 py-3 last:border-b-0 dark:border-zinc-800">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="text-sm text-zinc-700 dark:text-black">{value || "—"}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
}) {
  const selected = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === options.length;

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
    );
  }

  return (
    <div className="relative">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>

      <button
        type="button"
        disabled={false}
        onClick={() => setOpen((current) => !current)}
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
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
            <label className="flex cursor-pointer items-center gap-2 border-b border-zinc-200 px-2 py-2 text-sm font-medium dark:border-zinc-800">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onChange(allSelected ? [] : [...options])}
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

function CheckboxGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const selected = Array.isArray(value) ? value : [];

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
    );
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} resize-y`}
      />
    </label>
  );
}

function ValueList({ values, emptyText = "All / Not specified" }: { values?: string[]; emptyText?: string }) {
  if (!values?.length) return <span className="text-zinc-400">{emptyText}</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="rounded-md bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
          {value}
        </span>
      ))}
    </div>
  );
}

function editMultiValue(value: unknown, options: string[]): string[] {
  const list = toList(value);

  if (list.length === 1 && list[0].toLowerCase() === "all") {
    return [...options];
  }

  return list.filter((item) => options.includes(item));
}

function toList(value: unknown): string[] {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function MultiValue({ value }: { value: unknown }) {
  const list = toList(value);

  if (!list.length || (list.length === 1 && list[0].toLowerCase() === "all")) {
    return <span>All</span>;
  }

  return <ValueList values={list} />;
}

function formatRange(value: unknown, prefix = ""): string {
  if (value === null || value === undefined || value === "") return "All";

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "All";
  }

  if (typeof value === "object") {
    const obj = value as { min?: unknown; max?: unknown };

    if (obj.min !== undefined || obj.max !== undefined) {
      return formatRange(`${obj.min ?? ""}-${obj.max ?? "max"}`, prefix);
    }

    return formatObjectValue(value);
  }

  const text = String(value).trim();

  if (text.toLowerCase() === "all") return "All";

  const match = text.match(/^(\d*)\s*-\s*(\d*|max)$/i);
  if (!match) return text;

  const from = match[1];
  const to = match[2].toLowerCase() === "max" ? "" : match[2];

  const fmt = (n: string) => `${prefix}${Number(n).toLocaleString()}`;

  if (from && to) return `${fmt(from)} to ${fmt(to)}`;
  if (from && Number(from) > 0) return `${fmt(from)} and above`;
  if (to) return `Up to ${fmt(to)}`;

  return "All";
}

function getRangeParts(value: unknown): { from: string; to: string } {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    String(value).toLowerCase() === "all"
  ) {
    return { from: "", to: "" };
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as { min?: unknown; max?: unknown };

    return {
      from: obj.min !== undefined && obj.min !== null ? String(obj.min) : "",
      to:
        obj.max !== undefined &&
        obj.max !== null &&
        String(obj.max).toLowerCase() !== "max"
          ? String(obj.max)
          : "",
    };
  }

  const text = String(value).trim();
  const match = text.match(/^(\d*)\s*-\s*(\d*|max)$/i);

  if (!match) return { from: text, to: "" };

  return {
    from: match[1] || "",
    to: !match[2] || match[2].toLowerCase() === "max" ? "" : match[2],
  };
}

function getMultiValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatObjectValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value !== "object") return String(value);

  if (Array.isArray(value)) {
    return value.map(formatObjectValue).join(", ");
  }

  const obj = value as Record<string, unknown>;

  return Object.entries(obj)
    .filter(([, item]) => item !== null && item !== undefined && item !== "")
    .map(([key, item]) => {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (char) => char.toUpperCase());

      return `${label}: ${formatObjectValue(item)}`;
    })
    .join(" · ");
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition",
        active
          ? "border-zinc-950 text-zinc-950 dark:border-white dark:text-black"
          : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-black",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h2 className="font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
      </div>
      <div className="p-5 text-black">{children}</div>
    </div>
  );
}

function ObjectFields({
  value,
  onChange,
  title,
}: {
  value: unknown;
  onChange: (value: Record<string, unknown>) => void;
  title: string;
}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const obj = value as Record<string, unknown>;

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(obj).map(([key, item]) => (
          <Field
            key={key}
            label={formatLabel(key)}
            value={formatObjectValue(item)}
            onChange={(next) => {
              onChange({
                ...obj,
                [key]: next,
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<Section>("basic");
  const [editing, setEditing] = useState(false);

  const [draft, setDraft] = useState<Record<string, any>>({});

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

  useEffect(() => {
    if (!project) return;

    setDraft(getSectionData(project, activeTab));
    setEditing(false);
  }, [project, activeTab]);

  function changeTab(section: Section) {
    setActiveTab(section);
    setEditing(false);
  }

  function updateDraft(key: string, value: any) {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function saveSection() {
    if (!project || project.status !== "draft") return;

    setBusy(true);
    setError("");

    try {
      const { ok, status, data } = await apiJSON<{
        project: ProjectDTO;
        message?: string;
      }>(`/api/projects/${id}`, "PATCH", {
        section: activeTab,
        data: draft,
      });

      if (status === 401) {
        router.replace("/login");
        return;
      }

      if (!ok) {
        setError(data?.message || "Couldn't save this section.");
        return;
      }

      setProject(data.project);
      setEditing(false);
    } catch (err) {
      console.error("Save project section error:", err);
      setError("Couldn't save this section.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this draft?")) return;

    setBusy(true);
    setError("");

    try {
      const { ok, status, data } = await apiJSON<{ message?: string }>(
        `/api/projects/${id}`,
        "DELETE"
      );

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
      AUDIENCES.find((item) => item.value === project.audienceType)?.label ||
      project.audienceType
    );
  }, [project]);

  const countryName = useMemo(() => {
    if (!project) return "";

    return (
      COUNTRIES.find((country) => country.code === project.country)?.name ||
      project.country
    );
  }, [project]);

  if (!project) {
    return error ? (
      <ErrorAlert message={error} />
    ) : (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner className="h-5 w-5 text-zinc-500" />
      </div>
    );
  }

  const p = project as any;

  const targeting = (p.targeting ?? {}) as Record<string, any>;
  const demographics = (targeting.demographics ?? {}) as Record<string, any>;

  const demo = (key: string) => targeting[key] ?? demographics[key];

  const location = (targeting.location ?? {}) as Record<string, string[] | undefined>;

  const quotaNesting = (targeting.quotaNesting ?? []) as any[];

  const starts = Number(p.progress?.starts ?? 0);
  const completes = Number(p.progress?.completes ?? 0);
  const sampleSize = Number(p.sampleSize ?? 0);

  const pct =
    sampleSize > 0
      ? Math.min(100, Math.round((completes / sampleSize) * 100))
      : 0;

  const canEdit = p.status === "draft";

  return (
    <>
      <Link
        href="/project"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Projects
      </Link>

      <div className="mb-6 mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{p.surveyTitle}</h1>
            <StatusBadge status={p.status} />
          </div>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {countryName} · {audience} · N={sampleSize.toLocaleString()} · {p.loi} min · IR{" "}
            {p.ir}%
          </p>

          <div className="mt-2 text-xs text-zinc-400">Project ID: {p._id}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-400"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                className={`${primaryButtonClass} !w-auto`}
              >
                {editing ? "Cancel Edit" : "Edit Section"}
              </button>
            </>
          )}
        </div>
      </div>

      <ErrorAlert message={error} />

      <div className="sticky top-0 z-20 -mx-2 mb-6 overflow-x-auto border-b border-zinc-200 bg-white/95 px-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex min-w-max">
          {editableTabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => changeTab(tab.id)}
            />
          ))}

          {navigationTabs.map((tab) => (
            <Link
              key={tab.path}
              href={`/project/${p._id}/${tab.path}`}
              className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-black"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <main className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Section {editableTabs.findIndex((tab) => tab.id === activeTab) + 1} of 4
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {editableTabs.find((tab) => tab.id === activeTab)?.label}
              </h2>
            </div>

            {canEdit && (
              <button type="button" onClick={() => setEditing(true)} className={secondaryBtn}>
                Edit
              </button>
            )}
          </div>

          {activeTab === "basic" && (
            <SectionCard title="Basic Information" description="Core project information.">
              {editing && canEdit ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Survey Title"
                    value={draft.surveyTitle ?? ""}
                    onChange={(v) => updateDraft("surveyTitle", v)}
                  />

                  <SelectField
                    label="Country"
                    value={draft.country ?? ""}
                    onChange={(v) => updateDraft("country", v)}
                    options={COUNTRIES.map((country: any) => ({
                      value: country.code,
                      label: country.name,
                    }))}
                  />

                  <SelectField
                    label="Audience Type"
                    value={draft.audienceType ?? ""}
                    onChange={(v) => updateDraft("audienceType", v)}
                    options={AUDIENCES.map((item: any) => ({
                      value: item.value,
                      label: item.label,
                    }))}
                  />

                  <Field
                    label="LOI"
                    type="number"
                    value={draft.loi ?? ""}
                    onChange={(v) => updateDraft("loi", Number(v))}
                  />

                  <Field
                    label="IR %"
                    type="number"
                    value={draft.ir ?? ""}
                    onChange={(v) => updateDraft("ir", Number(v))}
                  />

                  <div className="md:col-span-2">
                    <TextArea
                      label="Audience Description"
                      value={String(draft.audienceDescription ?? "")}
                      onChange={(v) => updateDraft("audienceDescription", v)}
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <DetailRow label="Survey Title" value={p.surveyTitle} />
                  <DetailRow label="Country" value={countryName} />
                  <DetailRow label="Audience" value={audience} />
                  <DetailRow label="Audience Description" value={p.audienceDescription} />
                  <DetailRow label="LOI" value={`${p.loi} minutes`} />
                  <DetailRow label="IR" value={`${p.ir}%`} />
                </div>
              )}
            </SectionCard>
          )}

          {activeTab === "sample" && (
            <SectionCard
              title="Sample & Feasibility"
              description="Sample size and feasibility information."
            >
              {editing && canEdit ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field
                      label="Sample Size"
                      type="number"
                      value={draft.sampleSize ?? ""}
                      onChange={(v) => updateDraft("sampleSize", Number(v))}
                    />

                    <Field
                      label="LOI"
                      type="number"
                      value={draft.loi ?? p.loi ?? ""}
                      onChange={(v) => updateDraft("loi", Number(v))}
                    />

                    <Field
                      label="IR %"
                      type="number"
                      value={draft.ir ?? p.ir ?? ""}
                      onChange={(v) => updateDraft("ir", Number(v))}
                    />
                  </div>

                  <ObjectFields
                    title="Estimate"
                    value={draft.estimate}
                    onChange={(value) => updateDraft("estimate", value)}
                  />

                  <ObjectFields
                    title="Feasibility"
                    value={draft.feasibility}
                    onChange={(value) => updateDraft("feasibility", value)}
                  />
                </div>
              ) : (
                <div>
                  <DetailRow label="Sample Size" value={sampleSize.toLocaleString()} />

                  <DetailRow
                    label="Estimate"
                    value={
                      p.estimate &&
                      typeof p.estimate === "object" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Object.entries(p.estimate).map(([key, value]) => (
                            <div
                              key={key}
                              className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
                            >
                              <div className="text-xs text-zinc-500">{formatLabel(key)}</div>
                              <div className="mt-1 text-sm font-medium">
                                {formatObjectValue(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        "Not configured"
                      )
                    }
                  />

                  <DetailRow
                    label="Feasibility"
                    value={
                      p.feasibility &&
                      typeof p.feasibility === "object" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Object.entries(p.feasibility).map(([key, value]) => (
                            <div
                              key={key}
                              className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
                            >
                              <div className="text-xs text-zinc-500">{formatLabel(key)}</div>
                              <div className="mt-1 text-sm font-medium">
                                {formatObjectValue(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        "Not configured"
                      )
                    }
                  />
                </div>
              )}
            </SectionCard>
          )}

          {activeTab === "targeting" && (
            <div className="space-y-6">
              <SectionCard
                title="Targeting"
                description="Audience and respondent targeting configuration."
              >
                {editing && canEdit ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Basic Targeting</h3>

                      <div className="grid gap-4 md:grid-cols-3">
                        <SelectField
                          label="Country"
                          value={draft.country ?? ""}
                          onChange={(v) => updateDraft("country", v)}
                          options={COUNTRIES.map((country: any) => ({
                            value: country.code,
                            label: country.name,
                          }))}
                        />

                        {/* Create page uses a normal text field for Language. */}
                        <Field
                          label="Language"
                          value={draft.language ?? "English"}
                          onChange={(v) => updateDraft("language", v)}
                        />

                        {/* Exact Create page category dropdown/options. */}
                        <SelectField
                          label="Category"
                          value={draft.category ?? ""}
                          onChange={(v) => updateDraft("category", v)}
                          options={[
                            { value: "", label: "Select Category" },
                            ...CATEGORIES.map((category) => ({
                              value: category,
                              label: category,
                            })),
                          ]}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Demographic Targeting</h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Exact Create-page checkbox dropdown MultiSelect. */}
                        <MultiSelectField
                          label="Gender"
                          options={GENDER_OPTIONS}
                          value={editMultiValue(draft.gender, GENDER_OPTIONS)}
                          onChange={(v) => updateDraft("gender", v)}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Age From"
                            type="number"
                            value={getRangeParts(draft.age).from}
                            onChange={(v) => {
                              const current = getRangeParts(draft.age);
                              updateDraft("age", `${v}-${current.to || "max"}`);
                            }}
                          />

                          <Field
                            label="Age To"
                            type="number"
                            value={getRangeParts(draft.age).to}
                            onChange={(v) => {
                              const current = getRangeParts(draft.age);
                              updateDraft("age", `${current.from || 0}-${v || "max"}`);
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Income From"
                            type="number"
                            value={getRangeParts(draft.income).from}
                            onChange={(v) => {
                              const current = getRangeParts(draft.income);
                              updateDraft("income", `${v}-${current.to || "max"}`);
                            }}
                          />

                          <Field
                            label="Income To"
                            type="number"
                            value={getRangeParts(draft.income).to}
                            onChange={(v) => {
                              const current = getRangeParts(draft.income);
                              updateDraft("income", `${current.from || 0}-${v || "max"}`);
                            }}
                          />
                        </div>

                        <MultiSelectField
                          label="Hispanic Origin"
                          options={HISPANIC_OPTIONS}
                          value={editMultiValue(draft.hispanicOrigin, HISPANIC_OPTIONS)}
                          onChange={(v) => updateDraft("hispanicOrigin", v)}
                        />

                        <MultiSelectField
                          label="Relationship"
                          options={RELATIONSHIP_OPTIONS}
                          value={editMultiValue(draft.relationship, RELATIONSHIP_OPTIONS)}
                          onChange={(v) => updateDraft("relationship", v)}
                        />

                        <MultiSelectField
                          label="Children"
                          options={CHILDREN_OPTIONS}
                          value={editMultiValue(draft.children, CHILDREN_OPTIONS)}
                          onChange={(v) => updateDraft("children", v)}
                        />

                        <MultiSelectField
                          label="Employment"
                          options={EMPLOYMENT_OPTIONS}
                          value={editMultiValue(draft.employment, EMPLOYMENT_OPTIONS)}
                          onChange={(v) => updateDraft("employment", v)}
                        />

                        <MultiSelectField
                          label="Education"
                          options={EDUCATION_OPTIONS}
                          value={editMultiValue(draft.education, EDUCATION_OPTIONS)}
                          onChange={(v) => updateDraft("education", v)}
                        />

                        <MultiSelectField
                          label="Device"
                          options={DEVICE_OPTIONS}
                          value={editMultiValue(draft.device, DEVICE_OPTIONS)}
                          onChange={(v) => updateDraft("device", v)}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-semibold">
                        Geographic Targeting
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        {(
                          [
                            ["region", "Region", "Northeast, Midwest..."],
                            ["division", "Division", "East South Central..."],
                            ["state", "State", "California, Texas, New York..."],
                            ["csa", "CSA", "CSA codes..."],
                            ["cbsa", "CBSA", "CBSA codes..."],
                            ["county", "County", "Los Angeles, Cook..."],
                            ["dma", "DMA", "DMA codes..."],
                            ["zipcode", "ZIP Code", "10001, 90210, 60601..."],
                          ] as const
                        ).map(([key, label, placeholder]) => (
                          <label key={key} className="block">
                            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                              {label}
                            </span>
                            <input
                              type="text"
                              value={toList(draft.location?.[key]).join(", ")}
                              placeholder={placeholder}
                              onChange={(e) =>
                                updateDraft("location", {
                                  ...(draft.location ?? {}),
                                  [key]: e.target.value
                                    .split(",")
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                                })
                              }
                              className={inputClass}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <DetailRow
                      label="Country"
                      value={targeting.country || countryName}
                    />

                    <DetailRow
                      label="Language"
                      value={targeting.language || "English"}
                    />

                    <DetailRow
                      label="Category"
                      value={targeting.category || "All"}
                    />

                    <DetailRow label="Gender" value={<MultiValue value={demo("gender")} />} />

                    <DetailRow label="Age" value={formatRange(demo("age"))} />

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

                    <DetailRow label="Device" value={<MultiValue value={demo("device")} />} />
                  </div>
                )}
              </SectionCard>

              {!editing && (
                <SectionCard
                  title="Geographic Targeting"
                  description="Geographic filters configured for this project."
                >
                  <DetailRow label="Region" value={<ValueList values={location.region} />} />
                  <DetailRow label="Division" value={<ValueList values={location.division} />} />
                  <DetailRow label="State" value={<ValueList values={location.state} />} />
                  <DetailRow label="CSA" value={<ValueList values={location.csa} />} />
                  <DetailRow label="CBSA" value={<ValueList values={location.cbsa} />} />
                  <DetailRow label="County" value={<ValueList values={location.county} />} />
                  <DetailRow label="DMA" value={<ValueList values={location.dma} />} />
                  <DetailRow label="ZIP Code" value={<ValueList values={location.zipcode} />} />
                </SectionCard>
              )}
            </div>
          )}

          {activeTab === "quotas" && (
            <SectionCard
              title="Quotas"
              description="Quota dimensions and cells configured for this project."
            >
              {editing && canEdit ? (
                <div className="space-y-6 text-black">
                  {Array.isArray(draft.quotaNesting) &&
                  draft.quotaNesting.length > 0 ? (
                    draft.quotaNesting.map((dimension: any, index: number) => (
                      <div
                        key={dimension.id ?? index}
                        className="rounded-xl border text-black border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        <div className="grid gap-4 md:grid-cols-3">
                          <Field
                            label="Dimension Name"
                            value={dimension.name ?? ""}
                            onChange={(v) => {
                              const next = [...draft.quotaNesting];
                              next[index] = { ...dimension, name: v };
                              updateDraft("quotaNesting", next);
                            }}
                          />

                          <Field
                            label="Category"
                            value={dimension.category ?? ""}
                            onChange={(v) => {
                              const next = [...draft.quotaNesting];
                              next[index] = { ...dimension, category: v };
                              updateDraft("quotaNesting", next);
                            }}
                          />

                          <Field
                            label="Interlocked"
                            value={dimension.isInterlocked ? "Yes" : "No"}
                            onChange={(v) => {
                              const next = [...draft.quotaNesting];
                              next[index] = {
                                ...dimension,
                                isInterlocked: v.toLowerCase() === "yes",
                              };
                              updateDraft("quotaNesting", next);
                            }}
                          />
                        </div>

                        <div className="mt-5">
                          <h4 className="mb-3 text-sm font-semibold">Quota Cells</h4>

                          <div className="space-y-3">
                            {(dimension.cells ?? []).map(
                              (cell: any, cellIndex: number) => (
                                <div
                                  key={cell.id ?? cellIndex}
                                  className="grid gap-3 rounded-lg bg-zinc-50 p-3 md:grid-cols-4 dark:bg-zinc-800/50"
                                >
                                  <Field
                                    label="Cell Name"
                                    value={cell.name ?? ""}
                                    onChange={(v) => {
                                      const next = [...draft.quotaNesting];
                                      const cells = [...(dimension.cells ?? [])];
                                      cells[cellIndex] = { ...cell, name: v };
                                      next[index] = { ...dimension, cells };
                                      updateDraft("quotaNesting", next);
                                    }}
                                  />

                                  <Field
                                    label="Target %"
                                    type="number"
                                    value={cell.targetPct ?? ""}
                                    onChange={(v) => {
                                      const next = [...draft.quotaNesting];
                                      const cells = [...(dimension.cells ?? [])];
                                      cells[cellIndex] = {
                                        ...cell,
                                        targetPct: Number(v),
                                      };
                                      next[index] = { ...dimension, cells };
                                      updateDraft("quotaNesting", next);
                                    }}
                                  />

                                  <Field
                                    label="Target Count"
                                    type="number"
                                    value={cell.targetCount ?? ""}
                                    onChange={(v) => {
                                      const next = [...draft.quotaNesting];
                                      const cells = [...(dimension.cells ?? [])];
                                      cells[cellIndex] = {
                                        ...cell,
                                        targetCount: Number(v),
                                      };
                                      next[index] = { ...dimension, cells };
                                      updateDraft("quotaNesting", next);
                                    }}
                                  />

                                  <Field
                                    label="Status"
                                    value={cell.status ?? ""}
                                    onChange={(v) => {
                                      const next = [...draft.quotaNesting];
                                      const cells = [...(dimension.cells ?? [])];
                                      cells[cellIndex] = { ...cell, status: v };
                                      next[index] = { ...dimension, cells };
                                      updateDraft("quotaNesting", next);
                                    }}
                                  />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">
                      No quota nesting configured.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {quotaNesting.length > 0 ? (
                    <div className="space-y-5">
                      {quotaNesting.map((dimension: any, index: number) => (
                        <div
                          key={dimension.id ?? index}
                          className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="font-semibold">
                                {dimension.name || `Dimension ${index + 1}`}
                              </h3>

                              <p className="mt-1 text-xs text-zinc-500">
                                {formatLabel(String(dimension.category || "Custom"))}
                                {dimension.isInterlocked ? " · Interlocked" : ""}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[600px] text-left text-sm">
                              <thead>
                                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                                  <th className="px-3 py-2">Cell</th>
                                  <th className="px-3 py-2">Target %</th>
                                  <th className="px-3 py-2">Target Count</th>
                                  <th className="px-3 py-2">Completes</th>
                                  <th className="px-3 py-2">Status</th>
                                </tr>
                              </thead>

                              <tbody>
                                {(dimension.cells ?? []).map(
                                  (cell: any, cellIndex: number) => (
                                    <tr
                                      key={cell.id ?? cellIndex}
                                      className="border-b text-black border-zinc-100 last:border-0 dark:border-zinc-800"
                                    >
                                      <td className="px-3 py-3 font-medium">
                                        {cell.name || `Cell ${cellIndex + 1}`}
                                      </td>

                                      <td className="px-3 py-3">
                                        {Number(cell.targetPct ?? 0)}%
                                      </td>

                                      <td className="px-3 py-3">
                                        {Number(cell.targetCount ?? 0).toLocaleString()}
                                      </td>

                                      <td className="px-3 py-3">
                                        {Number(cell.currentCompletes ?? 0).toLocaleString()}
                                      </td>

                                      <td className="px-3 py-3">
                                        {formatLabel(String(cell.status || "Open"))}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      No quota nesting configured.
                    </p>
                  )}
                </>
              )}
            </SectionCard>
          )}

          {editing && canEdit && (
            <div className="sticky bottom-4 mt-5 flex items-center justify-end gap-2 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setDraft(getSectionData(p, activeTab));
                  setEditing(false);
                }}
                className={secondaryBtn}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={saveSection}
                className={`${primaryButtonClass} !w-auto`}
              >
                {busy && <Spinner className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          )}
        </main>

        <aside className="space-y-6">
          <EstimateCard estimate={p.estimate} />

          <SectionCard title="Project Summary">
            <DetailRow label="Country" value={countryName} />
            <DetailRow label="Audience" value={audience} />
            <DetailRow label="Sample Size" value={sampleSize.toLocaleString()} />
            <DetailRow label="LOI" value={`${p.loi} minutes`} />
            <DetailRow label="IR" value={`${p.ir}%`} />
            <DetailRow label="Status" value={<StatusBadge status={p.status} />} />
          </SectionCard>

          <SectionCard title="Fieldwork Metrics">
            <DetailRow label="Starts" value={starts.toLocaleString()} />
            <DetailRow label="Completes" value={completes.toLocaleString()} />
            <DetailRow
              label="Screenouts"
              value={Number(p.progress?.screenouts ?? 0).toLocaleString()}
            />
            <DetailRow
              label="Quota Full"
              value={Number(p.progress?.quotaFull ?? 0).toLocaleString()}
            />
            <DetailRow
              label="Quality Rejects"
              value={Number(p.progress?.qualityRejects ?? 0).toLocaleString()}
            />
            <DetailRow
              label="Spend"
              value={usd(Number(p.progress?.spend ?? 0))}
            />
          </SectionCard>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="mb-2 flex justify-between text-xs text-zinc-500">
              <span>Completes</span>
              <span>
                {completes.toLocaleString()} / {sampleSize.toLocaleString()}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function getSectionData(
  project: ProjectDTO,
  section: Section
): Record<string, any> {
  const p = project as any;

  switch (section) {
    case "basic":
      return {
        surveyTitle: p.surveyTitle ?? "",
        country: p.country ?? "",
        audienceType: p.audienceType ?? "",
        audienceDescription: p.audienceDescription ?? "",
        loi: p.loi ?? "",
        ir: p.ir ?? "",
      };

    case "sample":
      return {
        sampleSize: p.sampleSize ?? 0,
        loi: p.loi ?? "",
        ir: p.ir ?? "",
        estimate: p.estimate ?? {},
        feasibility: p.feasibility ?? {},
      };

    case "targeting":
      return {
        ...(p.targeting ?? {}),
      };

    case "quotas":
      return {
        quotaNesting: p.targeting?.quotaNesting ?? [],
      };

    default:
      return {};
  }
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
