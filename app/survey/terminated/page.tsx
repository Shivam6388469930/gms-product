"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function TerminatedContent() {
  const searchParams = useSearchParams();
  const reason =
    searchParams.get("reason") ||
    "You do not meet the demographic or quota requirements for this survey.";
  const ip = searchParams.get("ip");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-slate-800/80 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 ring-8 ring-red-500/5">
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
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/60 px-3 py-1 text-xs font-semibold text-red-400 ring-1 ring-red-500/30">
          ● Survey Terminated / Screened Out
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Thank you for your interest
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Unfortunately, based on your responses to the initial screening
          questions, you do not qualify for this research study.
        </p>

        <div className="mt-6 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Screening Outcome
          </p>
          <p className="mt-1 text-sm font-medium text-red-300">{reason}</p>

          {ip && (
            <p className="mt-2 text-xs text-slate-400">
              Recorded IP: <span className="font-mono text-slate-200">{ip}</span>
            </p>
          )}

          <div className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-400">
            <span className="font-semibold text-amber-400">Notice:</span> In
            accordance with ESOMAR/GRBN research integrity guidelines, your IP
            address has been logged and you cannot re-attempt this survey.
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Return to GMS Platform
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SurveyTerminatedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <TerminatedContent />
    </Suspense>
  );
}
