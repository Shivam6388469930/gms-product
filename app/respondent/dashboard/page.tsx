"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Compass,
  Gift,
  Clock,
  TrendingUp,
  CheckCircle2,
  Award,
  ArrowRight,
  ShieldCheck,
  Play,
  Laptop,
  Smartphone,
  Tablet,
  ChevronRight,
  Check,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function RespondentDashboardPage() {
  const {
    pointsBalance,
    usdBalance,
    lifetimeEarnings,
    tierName,
    qualityScore,
    opportunities,
    history,
    completeSurveySimulation,
  } = useRespondent();

  const [activeSurveyModal, setActiveSurveyModal] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const completedSurveys = history.filter((h) => h.status === "approved");

  const handleSimulateSurvey = (surveyId: string, result: "completed" | "screened_out" | "quota_full") => {
    setAnswering(true);
    setTimeout(() => {
      completeSurveySimulation(surveyId, result);
      setAnswering(false);
      setActiveSurveyModal(null);
      setSuccessBanner(
        result === "completed"
          ? "🎉 Survey Completed! Reward has been credited to your balance."
          : "Demographic quota reached. Added +10 participation points to your balance."
      );
      setTimeout(() => setSuccessBanner(null), 4000);
    }, 900);
  };

  const getDeviceIcon = (devices: string[]) => {
    return (
      <div className="flex items-center gap-1 text-zinc-400">
        {devices.includes("Desktop") && <span aria-label="Desktop"><Laptop size={13} /></span>}
        {devices.includes("Mobile") && <span aria-label="Mobile"><Smartphone size={13} /></span>}
        {devices.includes("Tablet") && <span aria-label="Tablet"><Tablet size={13} /></span>}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 p-6 lg:p-8">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
              <Sparkles size={13} />
              <span>{tierName} • Active Respondent Member</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, Alex!
            </h1>
            <p className="mt-1 text-sm text-zinc-400 max-w-xl">
              You have <span className="text-emerald-400 font-semibold">{opportunities.length} surveys matched</span> to your profile today. Complete them to earn instant points and cash rewards.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/respondent/opportunities"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-600/25 transition"
            >
              <Compass size={15} />
              Browse Surveys ({opportunities.length})
            </Link>
            <Link
              href="/respondent/rewards"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              <Gift size={15} />
              Redeem Rewards
            </Link>
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium">Available Balance</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Gift size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            ${usdBalance.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-emerald-400 font-mono font-medium">
            {pointsBalance.toLocaleString()} points ready to cash out
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium">Lifetime Total Earnings</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            ${lifetimeEarnings.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Across {completedSurveys.length + 64} total survey participations
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium">Quality & Trust Score</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-cyan-300">
            {qualityScore}%
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Top 5% respondent: <strong className="text-zinc-200">+10% point multiplier</strong>
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium">Profile Completeness</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">88%</div>
          <div className="mt-2 text-xs text-amber-400">
            <Link href="/respondent/profile" className="hover:underline">
              Add Work & Tech specs (+12%)
            </Link>
          </div>
        </div>
      </div>

      {/* Main Section: Top Survey Matches & Recent History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Matched Surveys */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass size={18} className="text-emerald-400" />
                  Top Survey Opportunities Today
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Hand-picked based on your verified demographics
                </p>
              </div>
              <Link
                href="/respondent/opportunities"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                View all ({opportunities.length})
                <ArrowRight size={13} />
              </Link>
            </div>

            {opportunities.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-400">
                You've completed all active matches! Check back shortly for new invitations.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {opportunities.slice(0, 3).map((opp) => (
                  <div
                    key={opp.id}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {opp.category}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {opp.matchScore}% Match
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-100 mt-1">
                          {opp.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                          {opp.qualificationHint}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-emerald-400 font-mono">
                          +${opp.rewardAmount.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {opp.points} pts
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/70 text-xs">
                      <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {opp.estimatedLoi} mins
                        </span>
                        {getDeviceIcon(opp.deviceAllowed)}
                        <span>Expires in {opp.expiresInHours}h</span>
                      </div>

                      <button
                        onClick={() => setActiveSurveyModal(opp.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Play size={12} className="fill-zinc-950" />
                        Take Survey
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Rewards Fast Redeem & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Cashout Box */}
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Gift size={16} className="text-amber-400" />
              Instant Reward Cashout
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              You have <strong className="text-white">${usdBalance.toFixed(2)}</strong> ready. Redeem instantly for gift cards or cash payout.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="flex items-center gap-2 font-medium text-zinc-200">
                  <span>🛒</span> Amazon $10 Card
                </span>
                <span className="font-mono text-zinc-400">1,000 pts</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="flex items-center gap-2 font-medium text-zinc-200">
                  <span>💵</span> PayPal Cash $20
                </span>
                <span className="font-mono text-zinc-400">2,000 pts</span>
              </div>
            </div>

            <Link
              href="/respondent/rewards"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold transition"
            >
              Browse All Rewards Catalog
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Recent Survey Ledger */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Recent Completions</h2>
              <Link
                href="/respondent/history"
                className="text-[11px] text-emerald-400 hover:underline"
              >
                View History
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {history.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/70 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-200 truncate pr-2">
                      {item.title}
                    </span>
                    <span className="font-mono font-bold text-emerald-400 shrink-0">
                      +${item.rewardEarned.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span>{item.completedAt}</span>
                    <span className="capitalize">{item.status.replace("_", " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Survey Simulator Modal */}
      {activeSurveyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Play size={14} className="text-emerald-400 fill-emerald-400" />
                  Live Survey Session Simulator
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  GMS Research Panel Environment
                </p>
              </div>
              <button
                onClick={() => setActiveSurveyModal(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-medium">Session Security:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                  <ShieldCheck size={13} />
                  Fingerprint Verified
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                This is a real-time research session test. You can simulate completing the study or test screening outcomes to see reward allocation and log tracking.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSimulateSurvey(activeSurveyModal, "completed")}
                disabled={answering}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {answering ? "Submitting Answers..." : "Simulate 100% Survey Complete (Earn Full Reward)"}
              </button>
              <button
                onClick={() => handleSimulateSurvey(activeSurveyModal, "screened_out")}
                disabled={answering}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 border border-zinc-800 text-amber-300 text-xs font-semibold transition"
              >
                Simulate Screener Mismatch (Screened Out +10 pts)
              </button>
              <button
                onClick={() => handleSimulateSurvey(activeSurveyModal, "quota_full")}
                disabled={answering}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 border border-zinc-800 text-zinc-400 text-xs font-medium transition"
              >
                Simulate Target Quota Full (+10 pts)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
