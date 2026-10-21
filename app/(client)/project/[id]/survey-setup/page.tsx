"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type SurveyType = "external" | "internal";

type SurveySetup = {
  surveyUrl: string;
  surveyType: SurveyType;
  estimatedLoi: number;
  redirectUrl: string;
  terminationUrl: string;
  qualificationUrl: string;
  status: "not_configured" | "ready";
};

type Project = {
  _id: string;
  name: string;
  country: string;
  audienceType: string;
  sampleSize: number;
  loi: number;
  ir: number;
  status: "draft" | "live" | "paused" | "stopped";
  surveySetup?: SurveySetup;
};

const defaultSurveySetup: SurveySetup = {
  surveyUrl: "",
  surveyType: "external",
  estimatedLoi: 0,
  redirectUrl: "",
  terminationUrl: "",
  qualificationUrl: "",
  status: "not_configured",
};

function SurveySetupContent() {
  const params = useParams();
  const router = useRouter();

  const projectId = String(params.id);

  const [project, setProject] = useState<Project | null>(null);

  const [form, setForm] = useState<SurveySetup>(
    defaultSurveySetup
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // Load project
  // --------------------------------------------------

  useEffect(() => {
    if (!projectId || projectId === "undefined") {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/projects/${projectId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load project"
        );
      }

      const loadedProject: Project = data.project;

      setProject(loadedProject);

      const existingSetup =
        loadedProject.surveySetup;

      if (existingSetup) {
        setForm({
          surveyUrl:
            existingSetup.surveyUrl || "",

          surveyType:
            existingSetup.surveyType || "external",

          estimatedLoi:
            existingSetup.estimatedLoi ||
            loadedProject.loi,

          redirectUrl:
            existingSetup.redirectUrl || "",

          terminationUrl:
            existingSetup.terminationUrl || "",

          qualificationUrl:
            existingSetup.qualificationUrl || "",

          status:
            existingSetup.status ||
            "not_configured",
        });
      } else {
        setForm({
          ...defaultSurveySetup,
          estimatedLoi: loadedProject.loi,
        });
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load project"
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Form change
  // --------------------------------------------------

  function updateField<K extends keyof SurveySetup>(
    field: K,
    value: SurveySetup[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError("");
    setMessage("");
  }

  // --------------------------------------------------
  // URL validation
  // --------------------------------------------------

  function isValidUrl(value: string) {
    try {
      const url = new URL(value);

      return (
        url.protocol === "http:" ||
        url.protocol === "https:"
      );
    } catch {
      return false;
    }
  }

  // --------------------------------------------------
  // Form validation
  // --------------------------------------------------

  const validationError = useMemo(() => {
    if (!project) {
      return "";
    }

    if (!form.surveyUrl.trim()) {
      return "Survey URL is required.";
    }

    if (!isValidUrl(form.surveyUrl.trim())) {
      return "Please enter a valid survey URL.";
    }

    if (
      form.surveyType !== "external" &&
      form.surveyType !== "internal"
    ) {
      return "Please select a valid survey type.";
    }

    if (
      !Number.isFinite(form.estimatedLoi) ||
      form.estimatedLoi <= 0
    ) {
      return "Estimated LOI must be greater than 0.";
    }

    if (form.estimatedLoi !== project.loi) {
      return `Survey LOI must match the project LOI of ${project.loi} minutes.`;
    }

    return "";
  }, [form, project]);

  // --------------------------------------------------
  // Save
  // --------------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!project) {
      setError("Project not loaded.");
      return;
    }

    // if (project.status !== "draft") {
    //   setError(
    //     "Survey setup can only be changed while the project is in draft status."
    //   );

    //   return;
    // }

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/projects/${projectId}/survey-setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            surveyUrl: form.surveyUrl.trim(),

            surveyType: form.surveyType,

            estimatedLoi: project.loi,

            redirectUrl:
              form.redirectUrl.trim(),

            terminationUrl:
              form.terminationUrl.trim(),

            qualificationUrl:
              form.qualificationUrl.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to save survey setup"
        );
      }

      setForm((prev) => ({
        ...prev,

        estimatedLoi: project.loi,

        status: "ready",
      }));

      setMessage(
        "Survey setup saved successfully."
      );

      // Continue to Sample Routing
      setTimeout(() => {
        router.push(
          `/project/${projectId}/sample-routing`
        );
      }, 500);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save survey setup"
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-gray-100" />

            <div className="h-24 rounded-xl border border-gray-200 bg-gray-50" />

            <div className="h-96 rounded-xl border border-gray-200 bg-gray-50" />
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Error without project
  // --------------------------------------------------

  if (!project) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-900">
              Unable to load project
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || "Project not found."}
            </p>

            <button
              type="button"
              onClick={() => router.back()}
              className="mt-5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isDraft = project.status === "draft";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/projects/${projectId}`
                )
              }
              className="hover:text-black"
            >
              Projects
            </button>

            <span>/</span>

            <span>{project.name}</span>

            <span>/</span>

            <span className="text-gray-900">
              Survey Setup
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
                Survey Setup
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Configure the survey URL, survey type,
                redirects and qualification flow before
                routing sample.
              </p>
            </div>

            <StatusBadge
              status={form.status}
              projectStatus={project.status}
            />
          </div>
        </div>

        {/* =====================================================
            STEPS
        ====================================================== */}

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            number="1"
            title="Audience"
            completed
            onClick={() =>
              router.push(
                `/projects/${projectId}`
              )
            }
          />

          <Step
            number="2"
            title="Feasibility"
            completed
            onClick={() =>
              router.push(
                `/projects/${projectId}`
              )
            }
          />

          <Step
            number="3"
            title="Pricing"
            completed
            onClick={() =>
              router.push(
                `/projects/${projectId}/price`
              )
            }
          />

          <Step
            number="4"
            title="Survey setup"
            active
          />

          <Step
            number="5"
            title="Sample routing"
            onClick={() =>
              router.push(
                `/project/${projectId}/sample-routing`
              )
            }
          />

          <Step
            number="6"
            title="Live fieldwork"
          />

          <Step
            number="7"
            title="Quality"
          />

          <Step
            number="8"
            title="Data & reports"
          />
        </div>

        {/* =====================================================
            PROJECT SUMMARY
        ====================================================== */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-base font-semibold text-gray-950">
              Project Summary
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Survey configuration for this research
              project.
            </p>
          </div>

          <div className="grid grid-cols-2 divide-x divide-gray-200 md:grid-cols-5">
            <SummaryItem
              label="Country"
              value={project.country}
            />

            <SummaryItem
              label="Audience"
              value={formatAudience(
                project.audienceType
              )}
            />

            <SummaryItem
              label="Sample"
              value={project.sampleSize.toLocaleString()}
            />

            <SummaryItem
              label="Project LOI"
              value={`${project.loi} min`}
            />

            <SummaryItem
              label="IR"
              value={`${project.ir}%`}
            />
          </div>
        </section>

        {/* =====================================================
            ALERTS
        ====================================================== */}

        {!isDraft && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-900">
              This project is no longer in draft status.
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Survey setup cannot be modified after the
              project has been launched.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-medium text-red-900">
              {error}
            </p>
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-sm font-medium text-green-900">
              {message}
            </p>
          </div>
        )}

        {/* =====================================================
            FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Survey Configuration */}

          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-base font-semibold text-gray-950">
                Survey Configuration
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Define where respondents will be sent
                and how the survey is hosted.
              </p>
            </div>

            <div className="space-y-6 p-6">
              {/* Survey Type */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Survey Type
                </label>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <SurveyTypeCard
                    type="external"
                    selected={
                      form.surveyType ===
                      "external"
                    }
                    title="External Survey"
                    description="Respondents are redirected to a third-party survey URL."
                    onClick={() =>
                      updateField(
                        "surveyType",
                        "external"
                      )
                    }
                    disabled={!isDraft}
                  />

                  <SurveyTypeCard
                    type="internal"
                    selected={
                      form.surveyType ===
                      "internal"
                    }
                    title="Internal Survey"
                    description="Survey is hosted inside the GMS platform."
                    onClick={() =>
                      updateField(
                        "surveyType",
                        "internal"
                      )
                    }
                    disabled={!isDraft}
                  />
                </div>
              </div>

              {/* Survey URL */}

              <Field
                label="Survey URL"
                required
                description="The URL where qualified respondents will enter the survey."
              >
                <input
                  type="url"
                  value={form.surveyUrl}
                  onChange={(event) =>
                    updateField(
                      "surveyUrl",
                      event.target.value
                    )
                  }
                  placeholder="https://example.com/survey"
                  disabled={!isDraft}
                  className="input"
                />
              </Field>

              {/* LOI */}

              <Field
                label="Estimated LOI"
                required
                description="This must match the LOI defined for the project."
              >
                <div className="relative">
                  <input
                    type="number"
                    value={
                      form.estimatedLoi ||
                      project.loi
                    }
                    readOnly
                    disabled
                    className="input bg-gray-50 pr-16 text-gray-600"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    minutes
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Project LOI:{" "}
                  <strong>
                    {project.loi} minutes
                  </strong>
                </p>
              </Field>
            </div>
          </section>

          {/* Redirect Configuration */}

          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-base font-semibold text-gray-950">
                Respondent Redirects
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Configure what happens after qualification,
                termination or completion.
              </p>
            </div>

            <div className="space-y-6 p-6">
              <Field
                label="Qualification URL"
                description="Optional URL used when a respondent qualifies for the survey."
              >
                <input
                  type="url"
                  value={
                    form.qualificationUrl
                  }
                  onChange={(event) =>
                    updateField(
                      "qualificationUrl",
                      event.target.value
                    )
                  }
                  placeholder="https://example.com/qualified"
                  disabled={!isDraft}
                  className="input"
                />
              </Field>

              <Field
                label="Termination URL"
                description="Optional URL used when a respondent is screened out."
              >
                <input
                  type="url"
                  value={
                    form.terminationUrl
                  }
                  onChange={(event) =>
                    updateField(
                      "terminationUrl",
                      event.target.value
                    )
                  }
                  placeholder="https://example.com/terminated"
                  disabled={!isDraft}
                  className="input"
                />
              </Field>

              <Field
                label="Redirect URL"
                description="Optional final redirect after survey completion."
              >
                <input
                  type="url"
                  value={form.redirectUrl}
                  onChange={(event) =>
                    updateField(
                      "redirectUrl",
                      event.target.value
                    )
                  }
                  placeholder="https://example.com/complete"
                  disabled={!isDraft}
                  className="input"
                />
              </Field>
            </div>
          </section>

          {/* Validation */}

          {validationError && isDraft && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">
                  Before continuing:
                </span>{" "}
                {validationError}
              </p>
            </div>
          )}

          {/* Actions */}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/projects/${projectId}/price`
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Back to Pricing
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/project/${projectId}/sample-routing`
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              >
                Skip for now
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  !isDraft ||
                  Boolean(validationError)
                }
                className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save & Continue"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          background: white;
          padding: 0.65rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .input:focus {
          border-color: rgb(17 24 39);
          box-shadow: 0 0 0 1px rgb(17 24 39);
        }

        .input:disabled {
          cursor: not-allowed;
          background: rgb(249 250 251);
        }
      `}</style>
    </main>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function Field({
  label,
  required,
  description,
  children,
}: {
  label: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-900">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {description && (
        <p className="mb-2 text-xs text-gray-500">
          {description}
        </p>
      )}

      {children}
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
    <div className="px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-950">
        {value}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  active = false,
  completed = false,
  onClick,
}: {
  number: string;
  title: string;
  active?: boolean;
  completed?: boolean;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition ${
        active
          ? "border-black bg-black text-white"
          : completed
            ? "border-gray-300 bg-white hover:border-gray-500"
            : "border-gray-200 bg-white text-gray-500"
      } ${
        clickable
          ? "cursor-pointer"
          : "cursor-default"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          active
            ? "bg-white text-black"
            : completed
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-500"
        }`}
      >
        {completed ? "✓" : number}
      </span>

      <span className="text-sm font-medium">
        {title}
      </span>
    </button>
  );
}

function SurveyTypeCard({
  selected,
  title,
  description,
  onClick,
  disabled,
}: {
  type: SurveyType;
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border p-5 text-left transition ${
        selected
          ? "border-black bg-gray-50 ring-1 ring-black"
          : "border-gray-200 hover:border-gray-400"
      } ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
            selected
              ? "border-black"
              : "border-gray-300"
          }`}
        >
          {selected && (
            <div className="h-2.5 w-2.5 rounded-full bg-black" />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-950">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

function StatusBadge({
  status,
  projectStatus,
}: {
  status: SurveySetup["status"];
  projectStatus: Project["status"];
}) {
  if (projectStatus !== "draft") {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
        Project {projectStatus}
      </span>
    );
  }

  if (status === "ready") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
        Ready
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
      Not configured
    </span>
  );
}

function formatAudience(value: string) {
  switch (value) {
    case "b2b":
      return "B2B";

    case "healthcare":
      return "Healthcare";

    case "consumer":
      return "Consumer";

    default:
      return value;
  }
}

export default function SurveySetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      }
    >
      <SurveySetupContent />
    </Suspense>
  );
}