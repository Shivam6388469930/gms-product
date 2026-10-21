"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

type Option = {
  id: string;
  label: string;
  isQualifying: boolean;
};

type ScreenerQuestion = {
  id: string;
  questionText: string;
  category?: string;
  type?: string;
  options: Option[];
  terminationReason?: string;
};

type SurveyProject = {
  _id: string;
  surveyTitle: string;
  country: string;
  audienceType: string;
  loi: number;
  estimatedLoi: number;
};

function SurveyEntryContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = params.id as string;
  const mode = searchParams.get("mode") || "live";
  const urlTestIp = searchParams.get("test_ip") || "";
  const initialRid =
    searchParams.get("rid") ||
    `RESP_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;
  const supplierCode = searchParams.get("source") || "GMS-DIRECT";

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<SurveyProject | null>(null);
  const [questions, setQuestions] = useState<ScreenerQuestion[]>([]);
  const [clientIp, setClientIp] = useState<string>("");
  const [simulatedIp, setSimulatedIp] = useState<string>(urlTestIp);
  const [respondentId, setRespondentId] = useState<string>(initialRid);

  // Access control state
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [terminationUrl, setTerminationUrl] = useState("");

  // Screener form state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Result state
  const [outcome, setOutcome] = useState<"pending" | "passed" | "failed">(
    "pending"
  );
  const [outcomeMessage, setOutcomeMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  useEffect(() => {
    if (!projectId) return;
    loadSurveyEntry();
  }, [projectId, simulatedIp]);

  async function loadSurveyEntry() {
    try {
      setLoading(true);
      setError("");
      setAccessBlocked(false);
      setOutcome("pending");

      const queryParams = new URLSearchParams();
      if (mode) queryParams.set("mode", mode);
      if (simulatedIp) queryParams.set("test_ip", simulatedIp);
      if (respondentId) queryParams.set("rid", respondentId);
      if (supplierCode) queryParams.set("source", supplierCode);

      const res = await fetch(
        `/api/survey/${projectId}?${queryParams.toString()}`,
        {
          cache: "no-store",
        }
      );
      const data = await res.json();

      if (!res.ok || !data.allowed) {
        setAccessBlocked(true);
        setBlockReason(data.reason || "duplicate_ip");
        setBlockMessage(
          data.message ||
            "Access to this survey is restricted. Duplicate IP detected."
        );
        if (data.ip) setClientIp(data.ip);
        if (data.terminationUrl) setTerminationUrl(data.terminationUrl);
        return;
      }

      setProject(data.project);
      setQuestions(data.screener?.questions || []);
      setClientIp(data.ip || "");
      if (data.respondentId) setRespondentId(data.respondentId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load survey entry"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
    setError("");
  }

  async function handleSubmitScreener(e: React.FormEvent) {
    e.preventDefault();

    // Check all questions answered
    for (const q of questions) {
      if (!answers[q.id]) {
        setError(`Please answer question: "${q.questionText}"`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/survey/${projectId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          respondentId,
          supplierCode,
          testIp: simulatedIp || undefined,
        }),
      });

      const data = await res.json();

      if (data.passed) {
        setOutcome("passed");
        setOutcomeMessage(
          "Screener passed! You qualify for the study. Redirecting to main survey..."
        );
        setRedirectUrl(data.redirectUrl);

        // Auto forward to main survey after brief moment
        setTimeout(() => {
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
        }, 1500);
      } else {
        // Failed screener -> Terminated & IP locked
        setOutcome("failed");
        setOutcomeMessage(
          data.message ||
            "Screener not passed. Your IP address has been recorded and you cannot re-attempt this survey."
        );
        setRedirectUrl(data.redirectUrl || "/survey/terminated");

        // Auto forward to termination URL after brief delay
        setTimeout(() => {
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
        }, 3200);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit screener answers."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Developer / Researcher IP switcher for testing
  function randomizeTestIp() {
    const randomIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
    setSimulatedIp(randomIp);
    setAnswers({});
    setOutcome("pending");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="font-mono text-sm tracking-wide text-slate-400">
            Checking IP eligibility & verifying sample credentials...
          </p>
        </div>
      </div>
    );
  }

  // IP Blocked / Duplicate Screen
  if (accessBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-2xl border border-red-500/30 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-8 ring-red-500/5">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-red-950/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-400 ring-1 ring-red-500/30">
            <span>●</span> Access Denied · Duplicate IP
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Survey Access Restriced
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {blockMessage}
          </p>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Security Rule:</span>
              <span className="font-semibold text-red-400">
                Never Allow Duplicate IP Re-run
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Your Detected IP:</span>
              <span className="font-mono font-medium text-slate-200">
                {clientIp || "Detected IP logged"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Compliance Standard:</span>
              <span className="font-medium text-slate-300">
                ESOMAR / GRBN Sample Quality
              </span>
            </div>
          </div>

          {/* Test Sandbox helper for researcher */}
          <div className="mt-6 rounded-xl border border-indigo-900/40 bg-indigo-950/30 p-3 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-300">
                  Testing & Verification Mode
                </p>
                <p className="text-xs text-slate-400">
                  Simulate a new clean IP to test the qualifying flow
                </p>
              </div>
              <button
                type="button"
                onClick={randomizeTestIp}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Simulate New IP
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {terminationUrl && (
              <a
                href={terminationUrl}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              >
                Go to Supplier Redirect →
              </a>
            )}
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-600"
            >
              Exit
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Outcome: Passed
  if (outcome === "passed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/5">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
            <span>✓</span> Screener Passed · Qualified
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            You Qualify for this Study!
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {outcomeMessage}
          </p>

          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Redirecting to main survey now...
            </div>
          </div>

          {redirectUrl && (
            <div className="mt-6">
              <a
                href={redirectUrl}
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500"
              >
                Proceed to Main Survey Immediately →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Outcome: Failed
  if (outcome === "failed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-8 ring-red-500/5">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-red-950/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-400 ring-1 ring-red-500/30">
            <span>✕</span> Disqualified · IP Permanently Barred
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Survey Terminated
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {outcomeMessage}
          </p>

          <div className="mt-5 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-left">
            <p className="text-xs font-medium text-red-300">
              <span className="font-bold">Permanent IP Block Enforced:</span>{" "}
              In accordance with project rules, IP{" "}
              <span className="font-mono font-bold text-white">
                {clientIp || simulatedIp}
              </span>{" "}
              has been recorded in the survey termination index and can never
              re-run or re-attempt this survey.
            </p>
          </div>

          {redirectUrl && (
            <div className="mt-6">
              <a
                href={redirectUrl}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                Proceed to Termination Page →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Screener Questionnaire
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white shadow-md">
              G
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                GMS Research Platform
              </span>
              <h2 className="text-sm font-semibold text-white">
                Respondent Verification Gateway
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300">
              EST. LOI: {project?.estimatedLoi || project?.loi || 5} min
            </span>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
              Active Screener
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Project Context */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Research Study
              </span>
              <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                {project?.surveyTitle || "Target Market Survey"}
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Market:{" "}
                <span className="font-semibold text-slate-200">
                  {project?.country}
                </span>{" "}
                · Target Audience:{" "}
                <span className="font-semibold capitalize text-slate-200">
                  {project?.audienceType}
                </span>
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:items-end">
              <span className="text-[11px] font-medium text-slate-400">
                Your Security Token
              </span>
              <span className="font-mono text-xs font-semibold text-emerald-400">
                {respondentId}
              </span>
              <span className="text-[10px] text-slate-500">
                IP: {clientIp || "Verified"}
              </span>
            </div>
          </div>
        </div>

        {/* Screener Instructions */}
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-blue-200">
          <strong className="text-blue-300">Pre-Survey Screening:</strong> Please
          answer the following demographic and verification questions honestly.
          Qualified respondents will immediately enter the main survey.
          Respondents who do not meet quota criteria will be screened out and
          their IP will be recorded.
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
            ⚠️ {error}
          </div>
        )}

        {/* Screener Form */}
        <form onSubmit={handleSubmitScreener} className="space-y-6">
          {questions.map((question, index) => {
            const selected = answers[question.id];

            return (
              <div
                key={question.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Question {index + 1} of {questions.length}
                    </span>
                  </div>
                  {selected && (
                    <span className="text-xs font-semibold text-emerald-400">
                      ✓ Answered
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-base font-semibold text-white">
                  {question.questionText}
                </h3>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {question.options.map((opt) => {
                    const isChecked = selected === opt.id;

                    return (
                      <label
                        key={opt.id}
                        onClick={() =>
                          handleSelectOption(question.id, opt.id)
                        }
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 text-sm font-medium transition ${
                          isChecked
                            ? "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500"
                            : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isChecked
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-700 bg-slate-900"
                          }`}
                        >
                          {isChecked && (
                            <span className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Test mode toolbar */}
          {mode === "test" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold text-amber-300">
                    TEST & VERIFICATION TOOLBAR
                  </p>
                  <p className="text-xs text-slate-400">
                    Active IP:{" "}
                    <span className="font-mono text-slate-200">
                      {simulatedIp || clientIp}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={randomizeTestIp}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                  >
                    🎲 Change Test IP
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-xl transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying screener criteria with Quality Engine...
                </>
              ) : (
                "Submit Answers & Verify Eligibility →"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function SurveyEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <SurveyEntryContent />
    </Suspense>
  );
}
