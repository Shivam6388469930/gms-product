"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Award,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";


interface ScreenerOption {
  id: string;
  label: string;
  isQualifying: boolean;
}

interface ScreenerQuestion {
  id: string;
  question: string;
  options: ScreenerOption[];
}

interface SessionData {
  sessionToken: string;
  status: string;
  surveyTitle: string;
  category: string;
  estimatedLoi: number;
  rewardAmount: number;
  panelName: string;
  hasScreener: boolean;
  screenerQuestions: ScreenerQuestion[];
  targetSurveyUrl: string;
  callbackBase: string;
}

export default function SurveySessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-lg font-semibold text-zinc-200">Loading Research Session...</h2>
        </div>
      }
    >
      <SurveySessionContent />
    </Suspense>
  );
}

function SurveySessionContent() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Screener state
  const [screenerAnswers, setScreenerAnswers] = useState<Record<string, string>>({});
  const [screenerError, setScreenerError] = useState<string | null>(null);
  const [screenerPassed, setScreenerPassed] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/survey/session?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message || "Invalid survey session link.");
        } else {
          setSession(data.session);
          if (!data.session.hasScreener) {
            setScreenerPassed(true);
          }
        }
      })
      .catch(() => {
        setError("Unable to connect to research platform. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleScreenerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    // Validate all questions answered
    const unanswered = session.screenerQuestions.filter((q) => !screenerAnswers[q.id]);
    if (unanswered.length > 0) {
      setScreenerError("Please answer all pre-qualification questions to proceed.");
      return;
    }

    setProcessing(true);
    setScreenerError(null);

    // Check qualification
    let disqualified = false;
    let disqualifyReason = "";

    for (const q of session.screenerQuestions) {
      const selectedOptId = screenerAnswers[q.id];
      const opt = q.options.find((o) => o.id === selectedOptId);
      if (opt && opt.isQualifying === false) {
        disqualified = true;
        disqualifyReason = `Disqualified on '${q.question}'`;
        break;
      }
    }

    if (disqualified) {
      // Route to callback terminate
      window.location.href = `/api/survey/callback?token=${encodeURIComponent(session.sessionToken)}&status=terminate&reason=${encodeURIComponent(disqualifyReason)}`;
      return;
    }

    setScreenerPassed(true);
    setProcessing(false);
  };

  const handleOutcomeSimulate = (outcome: "complete" | "terminate" | "quota_full" | "quality_fail") => {
    if (!session) return;
    setProcessing(true);
    window.location.href = `/api/survey/callback?token=${encodeURIComponent(session.sessionToken)}&status=${outcome}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-semibold text-zinc-200">Initializing Secure Survey Session...</h2>
        <p className="text-xs text-zinc-400 mt-1">Connecting to authenticated supply panel...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111218] border border-red-500/30 rounded-2xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Session Unavailable</h2>
          <p className="text-sm text-zinc-400 mb-6">{error || "This survey link is invalid or has already expired."}</p>
          <button
            onClick={() => router.push("/respondent/dashboard")}
            className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition text-sm"
          >
            Return to Respondent Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-[#0d0e14]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">GMS Survey Platform</span>
              <span className="text-xs text-zinc-400">Panel: {session.panelName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Session
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Study Overview Card */}
        <div className="bg-[#111218] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {session.category} Study
            </span>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-zinc-400" />
                ~{session.estimatedLoi} Minutes
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Award className="w-4 h-4" />
                ${session.rewardAmount.toFixed(2)} USD Reward
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            {session.surveyTitle}
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            Thank you for participating! Please complete the questionnaire accurately. Your responses help top
            brands make better decisions, and rewards are automatically credited to your wallet upon successful
            completion.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-800/60 text-xs">
            <div className="bg-[#161822] rounded-xl p-3 border border-zinc-800">
              <span className="text-zinc-500 block mb-0.5">Session Status</span>
              <span className="text-white font-medium capitalize">{session.status}</span>
            </div>
            <div className="bg-[#161822] rounded-xl p-3 border border-zinc-800">
              <span className="text-zinc-500 block mb-0.5">Security Token</span>
              <span className="text-zinc-300 font-mono text-[11px] truncate block">
                {session.sessionToken.slice(0, 14)}...
              </span>
            </div>
            <div className="bg-[#161822] rounded-xl p-3 border border-zinc-800">
              <span className="text-zinc-500 block mb-0.5">Prequalification</span>
              <span className="text-zinc-300 font-medium">
                {session.hasScreener ? `${session.screenerQuestions.length} Questions` : "Direct Entry"}
              </span>
            </div>
          </div>
        </div>

        {/* Screener Section */}
        {session.hasScreener && !screenerPassed && (
          <form
            onSubmit={handleScreenerSubmit}
            className="bg-[#111218] border border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Pre-Qualification Screener
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Please answer the questions below:</h2>
            <p className="text-xs text-zinc-400 mb-6">
              To verify if you fit the study&apos;s target demographic criteria, please answer honestly.
            </p>

            {screenerError && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {screenerError}
              </div>
            )}

            <div className="space-y-6 mb-8">
              {session.screenerQuestions.map((q, idx) => (
                <div key={q.id} className="bg-[#161822] p-4 rounded-xl border border-zinc-800">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    {idx + 1}. {q.question}
                  </h3>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                          screenerAnswers[q.id] === opt.id
                            ? "bg-indigo-600/10 border-indigo-500 text-white"
                            : "bg-[#1a1c28] border-zinc-800 hover:border-zinc-700 text-zinc-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.id}
                          checked={screenerAnswers[q.id] === opt.id}
                          onChange={() =>
                            setScreenerAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.id,
                            }))
                          }
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? "Verifying..." : "Submit Screener & Proceed"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Survey Active / Simulator Section */}
        {screenerPassed && (
          <div className="bg-[#111218] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              Screener Qualified
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You are qualified for this research study!</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Your profile matches the target criteria. You can now launch the study. When you finish, the survey
              router will return you to the confirmation page.
            </p>

            {session.targetSurveyUrl && (
              <div className="mb-6">
                <a
                  href={`${session.targetSurveyUrl}?token=${encodeURIComponent(session.sessionToken)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-indigo-600/20"
                >
                  Open External Survey in New Tab
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Test Simulation Buttons */}
            <div className="pt-6 border-t border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-3">
                Live Outcome Simulator (Updates Buyer + Supplier + Panel + Respondent + Finance + Admin)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => handleOutcomeSimulate("complete")}
                  disabled={processing}
                  className="py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex flex-col items-center gap-1 transition text-center"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Simulate Complete</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Credit reward & charge buyer</span>
                </button>

                <button
                  onClick={() => handleOutcomeSimulate("terminate")}
                  disabled={processing}
                  className="py-3 px-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-semibold text-xs flex flex-col items-center gap-1 transition text-center"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Simulate Terminate</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Screenout routing update</span>
                </button>

                <button
                  onClick={() => handleOutcomeSimulate("quota_full")}
                  disabled={processing}
                  className="py-3 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-xs flex flex-col items-center gap-1 transition text-center"
                >
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Simulate Quota Full</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Target quota reached</span>
                </button>

                <button
                  onClick={() => handleOutcomeSimulate("quality_fail")}
                  disabled={processing}
                  className="py-3 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-semibold text-xs flex flex-col items-center gap-1 transition text-center"
                >
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <span>Simulate Quality Reject</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Speeding or fraud rejection</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
