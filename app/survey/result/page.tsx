"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";

function SurveyResultContent() {
  const searchParams = useSearchParams();
  const rawStatus = (searchParams.get("status") || "complete").toLowerCase().trim();

  const isComplete = rawStatus === "complete" || rawStatus === "completed";
  const isQuota = rawStatus === "quota" || rawStatus === "quotafull" || rawStatus === "quota_full";
  const isTerminate = !isComplete && !isQuota; // default to terminate if not complete or quota

  if (isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-2xl border border-emerald-500/20 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/5">
            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            ● Survey Completed
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Survey Completed!
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Thank you for participating in our research study. Your responses have been securely verified and recorded.
          </p>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Participation Status
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Status Outcome:</span>
              <span className="font-semibold text-emerald-400">Complete / Verified</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Reward Processing:</span>
              <span className="text-slate-300">Credited to wallet / panelist account</span>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              Finish & Return to Platform
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isQuota) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-2xl border border-amber-500/20 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 ring-8 ring-amber-500/5">
            <AlertTriangle className="h-9 w-9 text-amber-400" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/60 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
            ● Quota Full
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Quota Full
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Thank you for your interest! The required number of responses for your demographic profile has already been reached for this study.
          </p>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Session Outcome
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Status Outcome:</span>
              <span className="font-semibold text-amber-400">Quota Target Reached</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              New studies are launched daily. Keep an eye on your dashboard for more opportunities.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Explore Other Opportunities
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Terminate / Screenout
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-2xl border border-rose-500/20 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 ring-8 ring-rose-500/5">
          <XCircle className="h-9 w-9 text-rose-400" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/60 px-3 py-1 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/30">
          ● Survey Terminated
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Survey Terminated
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Thank you for your time. Unfortunately, you did not meet the demographic or qualification criteria for this particular research study.
        </p>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Session Outcome
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Status Outcome:</span>
            <span className="font-semibold text-rose-400">Screened Out / Terminated</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            This outcome is standard in market research studies to ensure representative sample balances.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Return to Dashboard
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SurveyResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
            <p className="text-xs text-slate-400">Loading survey outcome...</p>
          </div>
        </div>
      }
    >
      <SurveyResultContent />
    </Suspense>
  );
}

