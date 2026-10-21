"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function CompleteContent() {
  const searchParams = useSearchParams();
  const rid = searchParams.get("rid") || "TEST_RESPONDENT";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-2xl border border-emerald-500/20 bg-slate-800/80 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/5">
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

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
          ● Survey Completed
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Thank you for completing the survey!
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Your answers have been securely recorded. Your participation is
          invaluable to our research.
        </p>

        <div className="mt-6 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Session Details
          </p>
          <p className="mt-1 font-mono text-xs text-slate-300">
            Respondent ID: <span className="text-emerald-400">{rid}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Status: <span className="text-emerald-400 font-semibold">Verified Complete</span>
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            Finish & Close Window
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SurveyCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}
