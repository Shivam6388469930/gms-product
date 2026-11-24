"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlayCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Sparkles,
  Search,
} from "lucide-react";

interface SurveyItem {
  id: string;
  projectId: string;
  surveyCode: string;
  title: string;
  country: string;
  estimatedLoi: number;
  rewardAmount: number;
  points: number;
  status: string;
  startedAt?: string;
  resumeUrl?: string;
  startUrl?: string;
  remainingQuota?: number;
}

export default function ActiveSurveysPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inProgress, setInProgress] = useState<SurveyItem[]>([]);
  const [available, setAvailable] = useState<SurveyItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"in_progress" | "available">("in_progress");

  const loadSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/respondent/surveys", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load surveys");
      }
      setInProgress(data.inProgress || []);
      setAvailable(data.available || []);
      // If no in-progress, default tab to available
      if ((data.inProgress || []).length === 0 && (data.available || []).length > 0) {
        setTab("available");
      }
    } catch (err: any) {
      console.error("loadSurveys error:", err);
      setError(err?.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const currentList = tab === "in_progress" ? inProgress : available;
  const filteredList = currentList.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.surveyCode.toLowerCase().includes(search.toLowerCase()) ||
      s.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <PlayCircle size={13} />
            <span>My Fieldwork Opportunities</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            My Surveys & Active Sessions
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Pick up surveys where you left off or begin fresh research studies to earn cash rewards.
          </p>
        </div>

        <button
          onClick={loadSurveys}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("in_progress")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === "in_progress"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            In-Progress ({inProgress.length})
          </button>
          <button
            onClick={() => setTab("available")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === "available"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Available Live Studies ({available.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search surveys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={24} className="text-emerald-400 animate-spin" />
          <span className="text-xs text-zinc-400">Loading your survey queue...</span>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-3">
          <PlayCircle size={32} className="mx-auto text-zinc-600 mb-2" />
          <h3 className="text-sm font-semibold text-zinc-300">
            {tab === "in_progress"
              ? "No in-progress surveys right now"
              : "No available live surveys matching your search"}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {tab === "in_progress"
              ? "Check out available live surveys to begin earning credits."
              : "New research studies are added regularly. Refresh or check back shortly."}
          </p>
          {tab === "in_progress" && available.length > 0 && (
            <button
              onClick={() => setTab("available")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition"
            >
              Browse Available Studies ({available.length})
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((survey) => (
            <div
              key={survey.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 hover:border-zinc-700 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {survey.surveyCode}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{survey.country}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{survey.title}</h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-emerald-400">
                    ${survey.rewardAmount.toFixed(2)}
                  </span>
                  <div className="text-[10px] text-zinc-400 font-mono">+{survey.points} pts</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/80">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-zinc-500" />
                  ~{survey.estimatedLoi} mins
                </span>

                <a
                  href={survey.resumeUrl || survey.startUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-950/40"
                >
                  {tab === "in_progress" ? "Resume Survey" : "Start Survey"}
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
