"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Project = {
  _id: string;
  name?: string;
  surveyTitle?: string;
  country: string;
  audienceType: string;
  audienceDescription?: string;
  sampleSize: number;
  loi: number;
  ir: number;
  status: string;
  progress?: {
    starts?: number;
    completes?: number;
    screenouts?: number;
    quotaFull?: number;
    qualityRejects?: number;
    spend?: number;
  };
};

type Estimate = {
  expectedCompletes?: number;
  availableSample?: number;
  fillRate?: number;
  cpiMin?: number;
  cpiMax?: number;
  totalMin?: number;
  totalMax?: number;
  fieldTimeDays?: number;
  confidence?: string;
};

type SurveySetup = {
  status: string;
  surveyUrl?: string;
  surveyType?: string;
  estimatedLoi?: number;
  qualificationUrl?: string;
  terminationUrl?: string;
  redirectUrl?: string;
};

type Supply = {
  _id: string;
  supplierName: string;
  supplierCode: string;
  availableSample: number;
  baseCpi: number;
  qualityScore: number;
};

type Routing = {
  _id: string;
  allocatedSample: number;
  allocatedCpi: number;
  routingPercent: number;
  priority: number;
  status: string;
  supply: Supply;
};

type ScreenerOption = {
  id: string;
  label: string;
  isQualifying: boolean;
};

type ScreenerQuestion = {
  id: string;
  questionText: string;
  category?: string;
  type?: string;
  options: ScreenerOption[];
  terminationReason?: string;
};

type ScreenerConfig = {
  enabled: boolean;
  blockDuplicateIp: boolean;
  strictIpTermination: boolean;
  questions: ScreenerQuestion[];
};

type RespondentSessionItem = {
  _id: string;
  respondentId: string;
  ip: string;
  status: "screened_out" | "qualified" | "completed" | "blocked_duplicate_ip";
  passedScreener: boolean;
  terminatedReason?: string;
  createdAt: string;
};

type RespondentStats = {
  totalStarts: number;
  qualifiedCount: number;
  screenedOutCount: number;
  blockedDuplicateIpCount: number;
  blockedIpsCount: number;
  blockedIps: string[];
  recentSessions: RespondentSessionItem[];
};

type Checks = {
  feasibility: boolean;
  pricing: boolean;
  surveySetup: boolean;
  sampleRouting: boolean;
  screenerReady: boolean;
  projectDraft: boolean;
};

function ReviewPageContent() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [surveySetup, setSurveySetup] = useState<SurveySetup | null>(null);
  const [screener, setScreener] = useState<ScreenerConfig | null>(null);
  const [routing, setRouting] = useState<Routing[]>([]);
  const [checks, setChecks] = useState<Checks | null>(null);
  const [canLaunch, setCanLaunch] = useState(false);
  const [liveSurveyUrl, setLiveSurveyUrl] = useState("");
  const [respondentStats, setRespondentStats] =
    useState<RespondentStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Screener simulator modal
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simAnswers, setSimAnswers] = useState<Record<string, string>>({});
  const [simIp, setSimIp] = useState("192.168.1.105");
  const [simResult, setSimResult] = useState<{
    outcome: "passed" | "failed" | "duplicate" | null;
    message: string;
    redirectUrl?: string;
  }>({ outcome: null, message: "" });
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadReview();
  }, [projectId]);

  async function loadReview() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/projects/${projectId}/review`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load project review");
      }

      setProject(data.project);
      setEstimate(data.estimate || null);
      setSurveySetup(data.surveySetup || null);
      setScreener(data.screener || null);
      setRouting(data.routing || []);
      setChecks(data.checks || null);
      setCanLaunch(Boolean(data.canLaunch));
      setLiveSurveyUrl(data.liveSurveyUrl || `/survey/${projectId}`);
      setRespondentStats(data.respondentStats || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project review"
      );
    } finally {
      setLoading(false);
    }
  }

  const totalAllocated = useMemo(() => {
    return routing.reduce(
      (sum, item) => sum + Number(item.allocatedSample || 0),
      0
    );
  }, [routing]);

  const totalSpend = useMemo(() => {
    return routing.reduce(
      (sum, item) =>
        sum +
        Number(item.allocatedSample || 0) * Number(item.allocatedCpi || 0),
      0
    );
  }, [routing]);

  async function launchProject() {
    if (!canLaunch && project?.status === "draft") {
      setError("Please complete all required setup steps before launching.");
      return;
    }

    try {
      setLaunching(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/projects/${projectId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to launch project");
      }

      setSuccess("Project successfully launched! Fieldwork is now LIVE.");
      loadReview();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to launch project"
      );
    } finally {
      setLaunching(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      const fullUrl = text.startsWith("http")
        ? text
        : `${window.location.origin}${text}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  }

  async function handleResetTestIps() {
    try {
      setResetting(true);
      const res = await fetch(`/api/projects/${projectId}/reset-test-ips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Test IP sessions and blocklist cleared for sandbox testing.");
        loadReview();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  }

  // Interactive In-Page Simulator
  async function runSimulatedTest() {
    try {
      setSimLoading(true);
      setSimResult({ outcome: null, message: "" });

      // Check all questions
      const questionsList = screener?.questions || [];
      for (const q of questionsList) {
        if (!simAnswers[q.id]) {
          setSimResult({
            outcome: null,
            message: `Please choose an option for: "${q.questionText}"`,
          });
          setSimLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/survey/${projectId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: simAnswers,
          respondentId: `SIM_${Date.now()}`,
          supplierCode: "SIMULATOR",
          testIp: simIp,
        }),
      });

      const data = await res.json();

      if (data.passed) {
        setSimResult({
          outcome: "passed",
          message:
            "QUALIFIED: Screener passed! Respondent would be routed directly to Main Survey URL.",
          redirectUrl: data.redirectUrl,
        });
      } else {
        setSimResult({
          outcome: data.reason === "duplicate_ip" ? "duplicate" : "failed",
          message:
            data.message ||
            "TERMINATED: Failed screener criteria. IP has been added to the permanent blocklist.",
          redirectUrl: data.redirectUrl,
        });
      }

      // Refresh background stats
      loadReview();
    } catch (err) {
      setSimResult({
        outcome: "failed",
        message: err instanceof Error ? err.message : "Simulation failed",
      });
    } finally {
      setSimLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-8 w-72 rounded bg-slate-200" />
          <div className="h-32 rounded-xl bg-white" />
          <div className="h-64 rounded-xl bg-white" />
          <div className="h-64 rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error || "Project not found"}
          </div>
        </div>
      </div>
    );
  }

  const isLive = project.status === "live";

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumbs */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link
              href={`/project-details/${projectId}`}
              className="hover:text-slate-900"
            >
              Project Details
            </Link>
            <span>/</span>
            <Link
              href={`/project/${projectId}/sample-routing`}
              className="hover:text-slate-900"
            >
              Sample Routing
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900">
              Review & Launch
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Review & Launch
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Pre-flight validation, Screener configuration, IP Fraud
                Protection, and Live Fieldwork deployment.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                  isLive
                    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500/30"
                    : "bg-amber-100 text-amber-800 ring-1 ring-amber-500/30"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLive ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                  }`}
                />
                Status: {project.status}
              </span>

              {isLive && (
                <Link
                  href={`/project-details/${projectId}`}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Live Fieldwork Dashboard ↗
                </Link>
              )}
            </div>
          </div>
        </div>

     

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong className="font-semibold">Launch Blocked: </strong>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <strong className="font-semibold">Success: </strong>
            {success}
          </div>
        )}

        {/* LIVE SURVEY LINK & ANTI-FRAUD BANNER (Available once live or in test mode) */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-950 to-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                <span>🛡️</span> ESOMAR / GRBN Quality Engine Active
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Live Screener & Survey Gateway
              </h2>
              <p className="text-xs text-slate-300">
                Incoming traffic is screened in real-time. If screener passes,
                respondent is routed to the main survey. If failed, the IP is
                permanently barred from running the survey again.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSimulatorOpen(true)}
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2.5 text-xs font-semibold text-emerald-200 backdrop-blur transition hover:bg-emerald-500/30"
              >
                🔬 Test Screener Simulator
              </button>

              <a
                href={`/survey/${projectId}?mode=test`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow transition hover:bg-slate-100"
              >
                Open Respondent Link ↗
              </a>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-700/60 bg-slate-950/60 p-3.5">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400">Entry URL:</span>
                <span className="font-mono text-emerald-300">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/survey/${projectId}`
                    : `/survey/${projectId}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `${window.location.origin}/survey/${projectId}`
                    )
                  }
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  {copiedLink ? "✓ Copied!" : "Copy Survey URL"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SCREENER & IP ANTI-FRAUD SECTION */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Screener & IP Quality Control
                </h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  Strict IP Blocking Enabled
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Gatekeeper criteria that respondents must satisfy before
                reaching the main survey.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/project/${projectId}/screener`}
                className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                + Edit / Add Questions
              </Link>
              <button
                type="button"
                onClick={() => setSimulatorOpen(true)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Launch Screener Sandbox
              </button>
            </div>
          </div>

          {/* Rules Summary Grid */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <span className="text-xs font-semibold uppercase text-emerald-800">
                Screener Pass Rule
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                Routes to Main Survey
              </p>
              <p className="mt-1 truncate text-xs font-mono text-slate-600">
                {surveySetup?.surveyUrl || "Internal GMS Survey Engine"}
              </p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
              <span className="text-xs font-semibold uppercase text-red-800">
                Screener Fail Rule
              </span>
              <p className="mt-1 text-sm font-bold text-red-950">
                Immediate Termination
              </p>
              <p className="mt-1 text-xs text-red-700">
                Logged to Screenouts counter & redirect triggered
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-semibold uppercase text-slate-600">
                IP Anti-Fraud Lock
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                Permanent 1-Attempt Lock
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Failed/screened IPs can never run survey again
              </p>
            </div>
          </div>

          {/* Active Screener Questions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Screener Questions ({screener?.questions?.length || 0})
            </h3>

            {screener?.questions?.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">
                      Q{idx + 1}
                    </span>
                    <h4 className="mt-0.5 text-sm font-semibold text-slate-900">
                      {q.questionText}
                    </h4>
                  </div>
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {q.category || "Verification"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <span
                      key={opt.id}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                        opt.isQualifying
                          ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      <span>{opt.isQualifying ? "✓ Qualifies:" : "✕ Terminates:"}</span>
                      {opt.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RESPONDENT TRAFFIC & FRAUD METRICS */}
        {respondentStats && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Live Quality & Respondent Traffic
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time audit log of respondent entries, screener results, and
                  blocked duplicate IPs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetTestIps}
                  disabled={resetting}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {resetting ? "Resetting..." : "🧹 Clear Test IP Logs"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Total Starts"
                value={respondentStats.totalStarts.toString()}
              />
              <Metric
                label="Qualified & Passed"
                value={respondentStats.qualifiedCount.toString()}
                accent="emerald"
              />
              <Metric
                label="Screenouts (Terminated)"
                value={respondentStats.screenedOutCount.toString()}
                accent="red"
              />
              <Metric
                label="Duplicate IPs Blocked"
                value={respondentStats.blockedDuplicateIpCount.toString()}
                accent="amber"
              />
            </div>

            {/* Blocked IP Table / Log */}
            {respondentStats.recentSessions?.length > 0 && (
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Respondent ID</th>
                      <th className="px-4 py-3">Client IP</th>
                      <th className="px-4 py-3">Screener Status</th>
                      <th className="px-4 py-3">Outcome</th>
                      <th className="px-4 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {respondentStats.recentSessions.slice(0, 8).map((sess) => (
                      <tr key={sess._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono font-medium text-slate-900">
                          {sess.respondentId}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">
                          {sess.ip}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              sess.status === "qualified"
                                ? "bg-emerald-100 text-emerald-800"
                                : sess.status === "screened_out"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {sess.status === "qualified"
                              ? "PASSED (Qualified)"
                              : sess.status === "screened_out"
                              ? "SCREENED OUT (Terminated)"
                              : "BLOCKED (Duplicate IP)"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {sess.passedScreener
                            ? "Forwarded to Survey URL"
                            : "IP Permanently Barred"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">
                          {new Date(sess.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Project Overview */}
        <Section
          title="Project Overview"
          description="Audience & specifications snapshot"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label="Project Title"
              value={project.name || project.surveyTitle || "Untitled"}
            />
            <Info label="Country" value={project.country} />
            <Info label="Audience" value={project.audienceType} />
            <Info
              label="Sample Size"
              value={project.sampleSize.toLocaleString()}
            />
            <Info label="LOI" value={`${project.loi} minutes`} />
            <Info label="IR" value={`${project.ir}%`} />
            <Info label="Status" value={project.status} />
            <Info
              label="Audience Scope"
              value={project.audienceDescription || "Standard population"}
            />
          </div>
        </Section>

        {/* Feasibility & Pricing */}
        <div className="grid gap-6 md:grid-cols-2">
          <Section
            title="Feasibility Snapshot"
            description="Confidence and completes estimate"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Metric
                label="Expected Completes"
                value={
                  estimate?.expectedCompletes
                    ? estimate.expectedCompletes.toLocaleString()
                    : "—"
                }
              />
              <Metric
                label="Available Sample"
                value={
                  estimate?.availableSample
                    ? estimate.availableSample.toLocaleString()
                    : "—"
                }
              />
              <Metric
                label="Field Time"
                value={
                  estimate?.fieldTimeDays
                    ? `${estimate.fieldTimeDays} days`
                    : "—"
                }
              />
              <Metric
                label="Confidence"
                value={estimate?.confidence || "High"}
              />
            </div>
          </Section>

          <Section
            title="Pricing Snapshot"
            description="Estimated spend & CPI range"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Metric
                label="CPI Range"
                value={
                  estimate?.cpiMin && estimate?.cpiMax
                    ? `$${estimate.cpiMin.toFixed(2)} - $${estimate.cpiMax.toFixed(2)}`
                    : "—"
                }
              />
              <Metric
                label="Est. Budget Range"
                value={
                  estimate?.totalMin && estimate?.totalMax
                    ? `$${estimate.totalMin.toLocaleString()} - $${estimate.totalMax.toLocaleString()}`
                    : "—"
                }
              />
              <Metric
                label="Allocated Suppliers"
                value={routing.length.toString()}
              />
              <Metric
                label="Allocated Sample"
                value={totalAllocated.toLocaleString()}
              />
            </div>
          </Section>
        </div>

        {/* Survey Setup */}
        <Section
          title="Survey Setup & Redirects"
          description="Destination endpoints for qualified, terminated, and completed respondents"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Info
              label="Survey Setup Status"
              value={surveySetup?.status === "ready" ? "Ready" : "Not Configured"}
              success={surveySetup?.status === "ready"}
            />
            <Info
              label="Survey Type"
              value={surveySetup?.surveyType || "external"}
            />
            <Info
              label="Main Survey URL (Screener Pass)"
              value={surveySetup?.surveyUrl || "Not Configured"}
              truncate
            />
            <Info
              label="Termination URL (Screener Fail)"
              value={surveySetup?.terminationUrl || "/survey/terminated"}
              truncate
            />
          </div>
        </Section>

        {/* Sample Routing Allocations */}
        <Section
          title="Sample Routing & Supply"
          description="Partner supply allocation and routing distribution"
        >
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">Allocation</th>
                  <th className="px-4 py-3 text-right">Routing %</th>
                  <th className="px-4 py-3 text-right">CPI</th>
                  <th className="px-4 py-3 text-right">Est. Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routing.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No sample routing configured.
                    </td>
                  </tr>
                ) : (
                  routing.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {item.supply?.supplierName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.supply?.supplierCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-900">
                        {item.allocatedSample.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600">
                        {item.routingPercent}%
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600">
                        ${item.allocatedCpi.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                        $
                        {(
                          item.allocatedSample * item.allocatedCpi
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {routing.length > 0 && (
                <tfoot className="border-t bg-slate-50 font-bold text-slate-900">
                  <tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">
                      {totalAllocated.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">100%</td>
                    <td className="px-4 py-3 text-right" />
                    <td className="px-4 py-3 text-right">
                      $
                      {totalSpend.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Section>

        {/* Launch Readiness Validation */}
        <Section
          title="Launch Readiness Checks"
          description="All core modules must pass verification before fieldwork activation"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Check
              label="Feasibility & Capacity verified"
              valid={checks?.feasibility ?? false}
            />
            <Check
              label="Pricing & Cost calculation ready"
              valid={checks?.pricing ?? false}
            />
            <Check
              label="Survey Setup & Target URL configured"
              valid={checks?.surveySetup ?? false}
            />
            <Check
              label="Sample Routing & 100% Allocation set"
              valid={checks?.sampleRouting ?? false}
            />
            <Check
              label="Screener & IP Anti-Fraud gatekeeper active"
              valid={checks?.screenerReady ?? true}
            />
            <Check
              label={
                isLive
                  ? "Project is currently LIVE"
                  : "Draft ready for immediate Launch"
              }
              valid={isLive || (checks?.projectDraft ?? false)}
            />
          </div>
        </Section>

        {/* Action Controls */}
        <div className="mt-8 flex flex-col-reverse justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <Link
            href={`/project/${projectId}/sample-routing`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back to Sample Routing
          </Link>

          <div className="flex items-center gap-3">
            {isLive ? (
              <Link
                href={`/project-details/${projectId}`}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500"
              >
                Go to Live Fieldwork Dashboard →
              </Link>
            ) : (
              <button
                type="button"
                onClick={launchProject}
                disabled={launching || !canLaunch}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-base font-bold text-white shadow-lg transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {launching ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Launching Project...
                  </>
                ) : (
                  "🚀 Launch Project to Fieldwork"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SCREENER SIMULATOR MODAL */}
      {simulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Interactive Sandbox
                </span>
                <h3 className="text-lg font-bold text-white">
                  Test Screener & IP Re-run Prevention
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSimulatorOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-300">
              Verify how respondents are routed: passing answers route to the
              Main Survey, failing answers terminate and blacklist the simulated IP!
            </p>

            {/* Test IP Control */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Simulated IP:</span>
                <input
                  type="text"
                  value={simIp}
                  onChange={(e) => setSimIp(e.target.value)}
                  className="rounded bg-slate-800 px-2 py-1 font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setSimIp(`192.168.1.${Math.floor(Math.random() * 200) + 10}`)
                }
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                🎲 Randomize IP
              </button>
            </div>

            {/* Questions to Answer */}
            <div className="mt-5 space-y-4">
              {screener?.questions?.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <p className="text-xs font-semibold text-slate-400">
                    Q{idx + 1}: {q.questionText}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-xs transition ${
                          simAnswers[q.id] === opt.id
                            ? "border-emerald-500 bg-emerald-500/10 text-white"
                            : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`sim_${q.id}`}
                            checked={simAnswers[q.id] === opt.id}
                            onChange={() =>
                              setSimAnswers((prev) => ({
                                ...prev,
                                [q.id]: opt.id,
                              }))
                            }
                            className="text-emerald-500"
                          />
                          <span>{opt.label}</span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold ${
                            opt.isQualifying
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {opt.isQualifying ? "Qualifies" : "Terminates"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Fill Buttons */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const passMap: Record<string, string> = {};
                  screener?.questions?.forEach((q) => {
                    const passOpt = q.options.find((o) => o.isQualifying);
                    if (passOpt) passMap[q.id] = passOpt.id;
                  });
                  setSimAnswers(passMap);
                }}
                className="rounded-lg bg-emerald-600/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/40"
              >
                Auto-Select Passing Answers
              </button>

              <button
                type="button"
                onClick={() => {
                  const failMap: Record<string, string> = {};
                  screener?.questions?.forEach((q, i) => {
                    if (i === 0) {
                      const failOpt = q.options.find((o) => !o.isQualifying);
                      if (failOpt) failMap[q.id] = failOpt.id;
                    } else {
                      failMap[q.id] = q.options[0]?.id || "";
                    }
                  });
                  setSimAnswers(failMap);
                }}
                className="rounded-lg bg-red-600/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-600/40"
              >
                Auto-Select Failing Answer
              </button>
            </div>

            {/* Result display */}
            {simResult.outcome && (
              <div
                className={`mt-4 rounded-xl p-4 text-xs font-medium ${
                  simResult.outcome === "passed"
                    ? "border border-emerald-500/30 bg-emerald-950/40 text-emerald-200"
                    : "border border-red-500/30 bg-red-950/40 text-red-200"
                }`}
              >
                <p className="font-bold">
                  {simResult.outcome === "passed"
                    ? "✓ SCREENER PASSED"
                    : simResult.outcome === "duplicate"
                    ? "🛡️ DUPLICATE IP BLOCKED"
                    : "✕ SCREENER TERMINATED & IP BLACKLISTED"}
                </p>
                <p className="mt-1">{simResult.message}</p>
                {simResult.redirectUrl && (
                  <p className="mt-1 font-mono text-[11px] text-slate-300">
                    Redirect URL: {simResult.redirectUrl}
                  </p>
                )}
              </div>
            )}

            {/* Modal actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setSimulatorOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>

              <button
                type="button"
                onClick={runSimulatedTest}
                disabled={simLoading}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {simLoading ? "Evaluating..." : "Run Test & Verify Routing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Info({
  label,
  value,
  success = false,
  truncate = false,
}: {
  label: string;
  value: string;
  success?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          success ? "text-emerald-700" : "text-slate-900"
        } ${truncate ? "truncate" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "red" | "amber";
}) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "red"
      ? "text-red-600"
      : accent === "amber"
      ? "text-amber-600"
      : "text-slate-900";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}

function Check({ label, valid }: { label: string; valid: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 transition ${
        valid
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-red-200 bg-red-50/60"
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          valid ? "bg-emerald-600 text-white shadow-sm" : "bg-red-500 text-white"
        }`}
      >
        {valid ? "✓" : "!"}
      </div>
      <span
        className={`text-xs font-semibold ${
          valid ? "text-emerald-900" : "text-red-900"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl animate-pulse space-y-6">
            <div className="h-8 w-72 rounded bg-slate-200" />
            <div className="h-32 rounded-xl bg-white" />
            <div className="h-64 rounded-xl bg-white" />
          </div>
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}