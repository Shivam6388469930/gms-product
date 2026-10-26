"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlayCircle,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Check,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function ActiveSurveysPage() {
  const { opportunities, completeSurveySimulation } = useRespondent();
  const [finishingId, setFinishingId] = useState<string | null>(null);

  // In our store, any opportunities with status "in_progress" or first couple items can be resumed
  const activeList = opportunities.slice(0, 2);

  const handleResumeAndComplete = (id: string) => {
    setFinishingId(id);
    setTimeout(() => {
      completeSurveySimulation(id, "completed");
      setFinishingId(null);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
          <PlayCircle size={13} />
          <span>In-Flight Fieldwork Sessions</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Active Surveys in Progress
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Continue surveys you've initiated or claim rewards from active interview sessions.
        </p>
      </div>

      {activeList.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-3">
          <PlayCircle size={32} className="mx-auto text-zinc-600 mb-2" />
          <h3 className="text-sm font-semibold text-zinc-300">No active survey sessions right now</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You don't have any surveys currently paused. Pick a study from the Opportunities catalog to start earning.
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
          {activeList.map((survey, index) => {
            const simulatedProgress = index === 0 ? 65 : 40;
            return (
              <div
                key={survey.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {survey.surveyCode}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Session Active
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-white mt-1.5">{survey.title}</h2>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      +${survey.rewardAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">{survey.points} points</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Estimated Completion Progress</span>
                    <span className="font-mono text-zinc-200">{simulatedProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${simulatedProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 text-[11px]">
                    <Clock size={13} />
                    <span>Session lock expires in ~45 minutes</span>
                  </div>

                  <button
                    onClick={() => handleResumeAndComplete(survey.id)}
                    disabled={finishingId === survey.id}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Check size={14} />
                    {finishingId === survey.id ? "Finalizing Answers..." : "Resume & Complete Survey"}
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
