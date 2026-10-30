"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiJSON } from "@/lib/auth-client";
import { ErrorAlert, Spinner, primaryButtonClass } from "@/components/Ui";

type ScreenerOption = {
  id: string;
  label: string;
  isQualifying: boolean;
};

type ScreenerQuestion = {
  id: string;
  questionText: string;
  category?: string;
  type?: "single_choice" | "multi_choice" | "boolean";
  options: ScreenerOption[];
  terminationReason?: string;
};

type ScreenerConfig = {
  enabled: boolean;
  blockDuplicateIp: boolean;
  strictIpTermination: boolean;
  questions: ScreenerQuestion[];
};

type Project = {
  _id: string;
  surveyTitle: string;
  country: string;
  audienceType: string;
  sampleSize: number;
  loi: number;
  ir: number;
};

// Pre-built PureSpectrum & Cint template questions
const TEMPLATE_QUESTIONS: ScreenerQuestion[] = [
  {
    id: "tpl_industry_conflict",
    questionText: "Do you or anyone in your household work in any of the following industries?",
    category: "conflict_of_interest",
    type: "single_choice",
    terminationReason: "Conflict of interest with market research / advertising industries.",
    options: [
      { id: "opt_ind_mr", label: "Market Research or Public Opinion Polling", isQualifying: false },
      { id: "opt_ind_adv", label: "Advertising, Marketing, or PR Agency", isQualifying: false },
      { id: "opt_ind_jour", label: "Journalism, Media, or Publishing", isQualifying: false },
      { id: "opt_ind_none", label: "None of the above", isQualifying: true },
    ],
  },
  {
    id: "tpl_b2b_dm",
    questionText: "Which of the following best describes your role in technology and vendor purchasing decisions for your organization?",
    category: "b2b_decision_maker",
    type: "single_choice",
    terminationReason: "Respondent does not hold purchasing or decision authority.",
    options: [
      { id: "opt_dm_primary", label: "I am the primary decision maker (sole authority)", isQualifying: true },
      { id: "opt_dm_shared", label: "I am part of the decision-making committee / team", isQualifying: true },
      { id: "opt_dm_recommend", label: "I make recommendations but do not approve", isQualifying: false },
      { id: "opt_dm_none", label: "I have no involvement in purchasing decisions", isQualifying: false },
    ],
  },
  {
    id: "tpl_attention_check",
    questionText: "Quality verification: Research studies require high attention. To verify you are reading each question carefully, please select 'Slightly Disagree' below.",
    category: "attention_check",
    type: "single_choice",
    terminationReason: "Failed attention check validation (PureScore quality trap).",
    options: [
      { id: "opt_att_str_agree", label: "Strongly Agree", isQualifying: false },
      { id: "opt_att_agree", label: "Agree", isQualifying: false },
      { id: "opt_att_sli_disagree", label: "Slightly Disagree", isQualifying: true },
      { id: "opt_att_str_disagree", label: "Strongly Disagree", isQualifying: false },
    ],
  },
  {
    id: "tpl_company_size",
    questionText: "Approximately how many full-time employees work across your entire company globally?",
    category: "company_size",
    type: "single_choice",
    terminationReason: "Company size does not match study target quota.",
    options: [
      { id: "opt_size_1_9", label: "1 – 9 employees", isQualifying: false },
      { id: "opt_size_10_49", label: "10 – 49 employees", isQualifying: true },
      { id: "opt_size_50_249", label: "50 – 249 employees", isQualifying: true },
      { id: "opt_size_250_999", label: "250 – 999 employees", isQualifying: true },
      { id: "opt_size_1000plus", label: "1,000+ employees (Enterprise)", isQualifying: true },
    ],
  },
];

const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium outline-none transition hover:bg-zinc-100 focus-visible:ring-4 focus-visible:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900";

const dangerBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 outline-none transition hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30";

function ScreenerBuilderContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [screener, setScreener] = useState<ScreenerConfig>({
    enabled: true,
    blockDuplicateIp: true,
    strictIpTermination: true,
    questions: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add Question Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [qText, setQText] = useState("");
  const [qCategory, setQCategory] = useState("general");
  const [qType, setQType] = useState<"single_choice" | "multi_choice" | "boolean">("single_choice");
  const [qTerminationReason, setQTerminationReason] = useState("");
  const [qOptions, setQOptions] = useState<Array<{ id: string; label: string; isQualifying: boolean }>>([
    { id: "opt_1", label: "Option 1", isQualifying: true },
    { id: "opt_2", label: "Option 2", isQualifying: false },
  ]);

  // Simulator State
  const [simAnswers, setSimAnswers] = useState<Record<string, string>>({});
  const [simResult, setSimResult] = useState<{ evaluated: boolean; passed: boolean; message: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");

      const [projRes, scrRes] = await Promise.all([
        apiJSON<{ project: Project }>(`/api/projects/${id}`),
        apiJSON<{ screener: ScreenerConfig }>(`/api/projects/${id}/screener`),
      ]);

      if (projRes.status === 401 || scrRes.status === 401) {
        router.replace("/login");
        return;
      }

      if (projRes.ok && projRes.data.project) {
        setProject(projRes.data.project);
      }

      if (scrRes.ok && scrRes.data.screener) {
        setScreener(scrRes.data.screener);
      }
    } catch (err) {
      console.error("Load error:", err);
      setError("Failed to load screener data.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save whole screener
  async function handleSaveScreener(updatedQuestions?: ScreenerQuestion[], andNavigate = false) {
    setSaving(true);
    setError("");
    try {
      const payload = {
        enabled: screener.enabled,
        blockDuplicateIp: screener.blockDuplicateIp,
        strictIpTermination: screener.strictIpTermination,
        questions: updatedQuestions || screener.questions,
      };

      const { ok, data } = await apiJSON<{ message?: string; screener?: ScreenerConfig }>(
        `/api/projects/${id}/screener`,
        "PUT",
        payload
      );

      if (ok) {
        setSuccessMsg("Screener configuration saved successfully.");
        if (data.screener) setScreener(data.screener);
        setTimeout(() => setSuccessMsg(""), 3500);

        if (andNavigate) {
          router.push(`/project/${id}/survey-setup`);
        }
      } else {
        setError(data?.message || "Failed to save screener.");
      }
    } catch {
      setError("Failed to save screener configuration.");
    } finally {
      setSaving(false);
    }
  }

  // Handle Option Builder
  function addOption() {
    const nextIdx = qOptions.length + 1;
    setQOptions([...qOptions, { id: `opt_${Date.now()}_${nextIdx}`, label: `Option ${nextIdx}`, isQualifying: false }]);
  }

  function removeOption(index: number) {
    if (qOptions.length <= 2) {
      alert("A screener question must have at least 2 options.");
      return;
    }
    setQOptions(qOptions.filter((_, i) => i !== index));
  }

  function updateOption(index: number, updates: Partial<{ label: string; isQualifying: boolean }>) {
    setQOptions(
      qOptions.map((opt, i) => (i === index ? { ...opt, ...updates } : opt))
    );
  }

  // Save new or edited question
  function saveQuestion() {
    if (!qText.trim()) {
      setError("Question text is required.");
      return;
    }

    const hasQualifying = qOptions.some((o) => o.isQualifying);
    if (!hasQualifying) {
      setError("At least one option must be marked as qualifying (✓).");
      return;
    }

    const questionObj: ScreenerQuestion = {
      id:
        editingIndex !== null && screener.questions[editingIndex]
          ? screener.questions[editingIndex].id
          : `scr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      questionText: qText.trim(),
      category: qCategory,
      type: qType,
      terminationReason: qTerminationReason.trim() || "Respondent does not meet screening criteria.",
      options: qOptions.map((opt, i) => ({
        id: opt.id || `opt_${i + 1}`,
        label: opt.label.trim() || `Option ${i + 1}`,
        isQualifying: opt.isQualifying,
      })),
    };

    let updated: ScreenerQuestion[];
    if (editingIndex !== null) {
      updated = screener.questions.map((q, idx) => (idx === editingIndex ? questionObj : q));
    } else {
      updated = [...screener.questions, questionObj];
    }

    setScreener({ ...screener, questions: updated });
    handleSaveScreener(updated);
    resetForm();
  }

  function startEdit(index: number) {
    const q = screener.questions[index];
    setQText(q.questionText);
    setQCategory(q.category || "general");
    setQType(q.type || "single_choice");
    setQTerminationReason(q.terminationReason || "");
    setQOptions([...q.options]);
    setEditingIndex(index);
    setIsAdding(true);
  }

  function resetForm() {
    setQText("");
    setQCategory("general");
    setQType("single_choice");
    setQTerminationReason("");
    setQOptions([
      { id: "opt_1", label: "Option 1", isQualifying: true },
      { id: "opt_2", label: "Option 2", isQualifying: false },
    ]);
    setEditingIndex(null);
    setIsAdding(false);
  }

  function deleteQuestion(index: number) {
    if (!window.confirm("Delete this screener question?")) return;
    const updated = screener.questions.filter((_, i) => i !== index);
    setScreener({ ...screener, questions: updated });
    handleSaveScreener(updated);
  }

  function moveQuestion(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= screener.questions.length) return;
    const items = [...screener.questions];
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    setScreener({ ...screener, questions: items });
    handleSaveScreener(items);
  }

  function addTemplateQuestion(tpl: ScreenerQuestion) {
    const newQ: ScreenerQuestion = {
      ...tpl,
      id: `scr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...screener.questions, newQ];
    setScreener({ ...screener, questions: updated });
    handleSaveScreener(updated);
  }

  // Interactive Simulator
  function runSimulation() {
    for (const q of screener.questions) {
      const selectedOptId = simAnswers[q.id];
      if (!selectedOptId) {
        setSimResult({
          evaluated: true,
          passed: false,
          message: `Incomplete: Question "${q.questionText.slice(0, 40)}..." was not answered.`,
        });
        return;
      }
      const opt = q.options.find((o) => o.id === selectedOptId);
      if (!opt || !opt.isQualifying) {
        setSimResult({
          evaluated: true,
          passed: false,
          message: `TERMINATED: Selected "${opt?.label || "Unknown"}" — Reason: ${q.terminationReason || "Failed screener"}`,
        });
        return;
      }
    }
    setSimResult({
      evaluated: true,
      passed: true,
      message: "QUALIFIED! All answers matched qualifying criteria. Respondent routed to Main Survey URL.",
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-6 w-6 text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Workflow Navigation Stepper */}
      {/* <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <Link href="/project" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            ← Projects
          </Link>
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <Link href={`/project/${id}/price`} className="rounded px-2.5 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              1. Feasibility & Price
            </Link>
            <span className="text-zinc-300">→</span>
            <span className="rounded bg-zinc-900 px-2.5 py-1 text-white dark:bg-zinc-100 dark:text-zinc-900">
              2. Screener Builder
            </span>
            <span className="text-zinc-300">→</span>
            <Link href={`/project/${id}/survey-setup`} className="rounded px-2.5 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              3. Survey Setup
            </Link>
            <span className="text-zinc-300">→</span>
            <Link href={`/project/${id}/review`} className="rounded px-2.5 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              4. Review & Launch
            </Link>
          </div>
        </div>
      </div> */}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Screener Question Builder</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Configure pre-survey qualification criteria, attention checks, and anti-fraud screenout rules for{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{project?.surveyTitle}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSaveScreener()}
            disabled={saving}
            className={secondaryBtn}
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSaveScreener(undefined, true)}
            disabled={saving}
            className={primaryButtonClass}
          >
            Continue to Survey Setup →
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ {successMsg}
        </div>
      )}

      {/* Security & Gatekeeper Settings */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold text-black">PureScore™ Anti-Fraud & Gatekeeper Rules</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enforce strict quality gates to eliminate fraudulent sample and repeat entries before respondents enter your study.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
            <input
              type="checkbox"
              checked={screener.enabled}
              onChange={(e) => setScreener({ ...screener, enabled: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded text-zinc-900"
            />
            <div>
              <span className="text-sm text-black font-medium">Enable Screener Gateway</span>
              <p className="text-xs text-zinc-500">Route all incoming clicks through screening questions first.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
            <input
              type="checkbox"
              checked={screener.strictIpTermination}
              onChange={(e) => setScreener({ ...screener, strictIpTermination: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded text-zinc-900"
            />
            <div>
              <span className="text-sm text-black font-medium">Permanent IP Blacklist</span>
              <p className="text-xs text-zinc-500">Bar IPs immediately if they screen out or fail attention checks.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
            <input
              type="checkbox"
              checked={screener.blockDuplicateIp}
              onChange={(e) => setScreener({ ...screener, blockDuplicateIp: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded text-zinc-900"
            />
            <div>
              <span className="text-sm text-black font-medium">Duplicate IP Barring</span>
              <p className="text-xs text-zinc-500">Prevent respondents from attempting the survey more than once.</p>
            </div>
          </label>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Questions List + Add Question Form */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg text-white font-semibold">
              Active Screener Questions ({screener.questions.length})
            </h3>
            {!isAdding && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className={`${primaryButtonClass} !py-2 text-xs`}
              >
                + Add Custom Question
              </button>
            )}
          </div>

          {/* Add / Edit Question Form Module */}
          {isAdding && (
            <div className="rounded-2xl border-2 border-zinc-900/10 bg-white p-6 shadow-sm dark:border-zinc-100/10 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <h3 className="font-semibold  text-white">
                  {editingIndex !== null ? "Edit Screener Question" : "Create New Screener Question"}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Question Text */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Question Text *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Which of the following best describes your current employment status?"
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-100"
                  />
                </div>

                {/* Category & Type */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Category
                    </label>
                    <select
                      value={qCategory}
                      onChange={(e) => setQCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <option value="demographic">Demographic (Age, Country, Gender)</option>
                      <option value="b2b_role">B2B & Job Function</option>
                      <option value="industry">Industry & Sector</option>
                      <option value="behavioral">Product / Brand Usage</option>
                      <option value="attention_check">Attention Check (Bot Trap)</option>
                      <option value="custom">Custom Screener</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Response Type
                    </label>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <option value="single_choice">Single Choice (Radio)</option>
                      <option value="multi_choice">Multi-Select (Checkbox)</option>
                      <option value="boolean">Yes / No (Boolean)</option>
                    </select>
                  </div>
                </div>

                {/* Options List Builder */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Answer Choices & Qualifying Rules *
                    </label>
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-500"
                    >
                      + Add Choice
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    Mark options as <span className="font-semibold text-emerald-600">Qualify (✓)</span> to advance or <span className="font-semibold text-red-600">Terminate (✕)</span> to screen out.
                  </p>

                  <div className="mt-3 space-y-2">
                    {qOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => updateOption(idx, { label: e.target.value })}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
                        />

                        {/* Toggle Qualify vs Terminate */}
                        <button
                          type="button"
                          onClick={() => updateOption(idx, { isQualifying: !opt.isQualifying })}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            opt.isQualifying
                              ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-800"
                              : "bg-red-100 text-red-800 ring-1 ring-red-300 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-800"
                          }`}
                        >
                          {opt.isQualifying ? "✓ Qualifies" : "✕ Screenout"}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="px-2 text-zinc-400 hover:text-red-500"
                          title="Remove option"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Termination Reason */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Screenout Termination Reason (Shown in Audit Log)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Respondent does not meet target criteria"
                    value={qTerminationReason}
                    onChange={(e) => setQTerminationReason(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>

                {/* Submit Question */}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={resetForm} className={secondaryBtn}>
                    Cancel
                  </button>
                  <button type="button" onClick={saveQuestion} className={primaryButtonClass}>
                    {editingIndex !== null ? "Update Question" : "Add Question to Screener"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Screener Questions Cards */}
          {screener.questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
              <p className="text-sm text-zinc-500">No screener questions configured.</p>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className={`${primaryButtonClass} mt-4 !w-auto`}
              >
                Create First Screener Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {screener.questions.map((q, idx) => {
                const qualifyingCount = q.options.filter((o) => o.isQualifying).length;
                const terminateCount = q.options.length - qualifyingCount;

                return (
                  <div
                    key={q.id || idx}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-mono text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded text-black bg-zinc-100 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {q.category || "General"}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {q.type === "multi_choice" ? "Multi-select" : q.type === "boolean" ? "Yes/No" : "Single choice"}
                            </span>
                            <span className="text-xs text-emerald-600">
                              {qualifyingCount} qualifying · {terminateCount} terminate
                            </span>
                          </div>
                          <h4 className="mt-2 text-base text-black font-semibold">{q.questionText}</h4>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveQuestion(idx, "up")}
                          disabled={idx === 0}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(idx, "down")}
                          disabled={idx === screener.questions.length - 1}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800"
                          title="Move Down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(idx)}
                          className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuestion(idx)}
                          className={dangerBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Options Pills */}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium ${
                            opt.isQualifying
                              ? "bg-emerald-50/80 text-emerald-900 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40"
                              : "bg-red-50/80 text-red-900 border border-red-200/60 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/40"
                          }`}
                        >
                          <span className="truncate pr-2">{opt.label}</span>
                          <span className={`shrink-0 font-semibold ${opt.isQualifying ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {opt.isQualifying ? "✓ Qualifies" : "✕ Terminate"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {q.terminationReason && (
                      <p className="mt-3 text-[11px] text-zinc-400 italic">
                        Screenout Reason: {q.terminationReason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Template Library & Interactive Simulator */}
        <div className="space-y-6">
          {/* Quick-Add Templates */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-black">PureSpectrum Standard Screener Templates</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Quickly insert industry-standard screening & bot trap questions with 1 click.
            </p>

            <div className="mt-4 space-y-3">
              {TEMPLATE_QUESTIONS.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{tpl.questionText}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">{tpl.options.length} options</span>
                    <button
                      type="button"
                      onClick={() => addTemplateQuestion(tpl)}
                      className="rounded bg-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      + Insert Question
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Screener Test Simulator */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-black">Interactive Screener Sandbox</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Simulate an incoming respondent to verify your qualification logic before going live.
            </p>

            <div className="mt-4 space-y-4">
              {screener.questions.map((q) => (
                <div key={q.id} className="text-xs">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{q.questionText}</p>
                  <div className="mt-1.5 space-y-1">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg p-2 transition ${
                          simAnswers[q.id] === opt.id
                            ? "bg-zinc-200 font-semibold dark:bg-zinc-800"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`sim_${q.id}`}
                          value={opt.id}
                          checked={simAnswers[q.id] === opt.id}
                          onChange={() => setSimAnswers({ ...simAnswers, [q.id]: opt.id })}
                          className="h-3 w-3 text-black"
                        />
                        <span className="text-black">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={runSimulation}
                disabled={screener.questions.length === 0}
                className={`${primaryButtonClass} !py-2 text-xs`}
              >
                Test Evaluation Logic
              </button>

              {simResult && (
                <div
                  className={`rounded-xl p-3 text-xs font-medium ${
                    simResult.passed
                      ? "border border-emerald-500/20 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border border-red-500/20 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                  }`}
                >
                  {simResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScreenerBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner className="h-6 w-6 text-zinc-500" />
        </div>
      }
    >
      <ScreenerBuilderContent />
    </Suspense>
  );
}
