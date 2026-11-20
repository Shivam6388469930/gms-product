"use client";

import React, { useState } from "react";
import {
  Compass,
  Search,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  Play,
  CheckCircle2,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function SurveyOpportunitiesPage() {
  const { opportunities, startSurvey } = useRespondent();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [launchingSurveyId, setLaunchingSurveyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = opportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(search.toLowerCase()) ||
      opp.qualificationHint.toLowerCase().includes(search.toLowerCase()) ||
      opp.surveyCode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || opp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleStartSurvey = async (surveyId: string) => {
    setLaunchingSurveyId(surveyId);
    try {
      const result = await startSurvey(surveyId);
      if (!result.success) {
        throw new Error("Unable to start this survey. Please sign in again and retry.");
      }
      setToast("The original survey opened in a new tab.");
      setTimeout(() => setToast(null), 4000);
    } catch (error) {
      console.error("Failed to start survey:", error);
      setToast(error instanceof Error ? error.message : "Unable to start this survey.");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLaunchingSurveyId(null);
    }
  };

  const getDeviceIcon = (devices?: string[]) => {
    const list = Array.isArray(devices) ? devices : ["Desktop", "Mobile", "Tablet"];
    return (
      <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
        {list.includes("Desktop") && <span className="flex items-center gap-1"><Laptop size={12} /> Desktop</span>}
        {list.includes("Mobile") && <span className="flex items-center gap-1"><Smartphone size={12} /> Mobile</span>}
        {list.includes("Tablet") && <span className="flex items-center gap-1"><Tablet size={12} /> Tablet</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <Compass size={13} />
            <span>Profile-Matched Studies</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Available Survey Opportunities
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Surveys selected specifically for your demographics. Rewards are credited immediately upon completion.
          </p>
        </div>
      </div>

      {toast && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search surveys by topic, qualification hint, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Categories</option>
          <option value="Technology">Technology & Software</option>
          <option value="Lifestyle & Consumer">Lifestyle & Consumer</option>
          <option value="Finance & Investments">Finance & Investments</option>
          <option value="Workplace & Career">Workplace & Career</option>
          <option value="Healthcare">Healthcare & Health</option>
        </select>
      </div>

      {/* Grid of Opportunities */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-2">
          <Compass size={32} className="mx-auto text-zinc-600 mb-2" />
          <h3 className="text-sm font-semibold text-zinc-300">No matching surveys right now</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search filters or check back in a few hours as new research studies launch constantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((opp) => (
            <div
              key={opp.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700/80 p-5 transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {opp.category}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {opp.matchScore}% Match
                  </span>
                </div>

                <h3 className="text-base text-white font-bold text-white tracking-tight leading-snug">
                  {opp.title}
                </h3>

                <p className="text-xs text-zinc-400 line-clamp-2">
                  <strong className="text-zinc-300">Looking for:</strong> {opp.qualificationHint}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 block text-[11px]">Payout Reward</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      ${opp.rewardAmount.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        ({opp.points} pts)
                      </span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block text-[11px]">Est. Time</span>
                    <span className="text-sm font-bold text-zinc-200 flex items-center gap-1 justify-end">
                      <Clock size={13} />
                      {opp.estimatedLoi} mins
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {getDeviceIcon(opp.deviceAllowed)}
                  <button
                    onClick={() => handleStartSurvey(opp.id)}
                    disabled={launchingSurveyId === opp.id || opp.status !== "available"}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Play size={13} className="fill-zinc-950" />
                    {launchingSurveyId === opp.id ? "Opening..." : "Start Original Survey"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
