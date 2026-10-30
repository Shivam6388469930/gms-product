"use client";

import React from "react";
import Link from "next/link";
import {
  PlayCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function ActiveSurveysPage() {
  const { activeSurveys, isLoading, error, refreshProfile } = useRespondent();

  const handleResume = (survey: any) => {
    const url =
      survey.surveyUrl || survey.publicUrl || survey.url || survey.link || "";

    if (!url) {
      alert("This survey has no link yet. Please refresh or contact support.");
      return;
    }

    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <PlayCircle size={13} />
            <span>In-Flight Fieldwork Sessions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Active Surveys in Progress
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Surveys you have started but not finished. Resume them to earn your reward.
          </p>
        </div>

        <button
          onClick={refreshProfile}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && activeSurveys.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={24} className="text-emerald-400 animate-spin" />
          <span className="text-xs text-zinc-400">Loading your active surveys...</span>
        </div>
      ) : activeSurveys.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-3">
          <PlayCircle size={32} className="mx-auto text-zinc-600 mb-2" />
          <h3 className="text-sm font-semibold text-zinc-300">
            No active survey sessions right now
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You don't have any surveys in progress. Pick a study from the
            Opportunities catalog to start earning.
          </p>
          <Link
            href="/respondent/opportunities"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition"
          >
            Explore Opportunities
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSurveys.map((survey: any) => {
            // Only show progress / expiry when the backend actually provides them
            const progress =
              typeof survey.progress === "number"
                ? Math.max(0, Math.min(100, survey.progress))
                : null;

            const expiresAt = survey.expiresAt ? new Date(survey.expiresAt) : null;
            const hasExpiry = expiresAt && !isNaN(expiresAt.getTime());

            return (
              <div
                key={survey.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {survey.surveyCode && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {survey.surveyCode}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        In Progress
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1.5">
                      {survey.title}
                    </h3>
                    {survey.estimatedLoi ? (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        About {survey.estimatedLoi} minutes
                      </p>
                    ) : null}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      +${Number(survey.rewardAmount || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      {survey.points ?? 0} points
                    </div>
                  </div>
                </div>

                {progress !== null && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Progress</span>
                      <span className="font-mono text-zinc-200">{progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 text-[11px]">
                    {hasExpiry && (
                      <>
                        <Clock size={13} />
                        <span>Session expires {expiresAt!.toLocaleString()}</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleResume(survey)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <ExternalLink size={14} />
                    Resume Survey
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}