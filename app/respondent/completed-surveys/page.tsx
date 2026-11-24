"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Gift,
  Search,
  Download,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

interface CompletedItem {
  id: string;
  surveyCode: string;
  title: string;
  country: string;
  completedAt: string;
  timeTaken: string;
  rewardEarned: number;
  pointsEarned: number;
  status: string;
  receiptId: string;
}

export default function CompletedSurveysPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedList, setCompletedList] = useState<CompletedItem[]>([]);
  const [search, setSearch] = useState("");

  const loadCompletedSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/respondent/surveys", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load completed surveys");
      }
      setCompletedList(data.completed || []);
    } catch (err: any) {
      console.error("loadCompletedSurveys error:", err);
      setError(err?.message || "Failed to load completed surveys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompletedSurveys();
  }, []);

  const filtered = completedList.filter(
    (h) =>
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.surveyCode.toLowerCase().includes(search.toLowerCase()) ||
      h.receiptId.toLowerCase().includes(search.toLowerCase())
  );

  const totalEarned = completedList.reduce((sum, h) => sum + Number(h.rewardEarned || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <CheckCircle2 size={13} />
            <span>Approved Fieldwork Credits</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Completed Surveys
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Research studies successfully completed with rewards approved and deposited to your account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCompletedSurveys}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition disabled:opacity-50"
            title="Refresh Completed Surveys"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          <Link
            href="/respondent/rewards"
            className="text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shrink-0"
          >
            <Gift size={15} />
            Cashout Earnings
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">Total Approved Completes</span>
          <div className="text-2xl font-black text-white mt-1">
            {completedList.length} Studies
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">Total Earned Value</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ${totalEarned.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by survey title, study code, or receipt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Survey Topic</th>
              <th className="px-5 py-3.5 font-semibold">Completed Date</th>
              <th className="px-5 py-3.5 font-semibold">Time Taken</th>
              <th className="px-5 py-3.5 font-semibold">Reward Credited</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-emerald-400" />
                  Loading completed surveys...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500">
                  {completedList.length === 0
                    ? "No completed surveys yet. Start a study to earn rewards!"
                    : "No completed surveys match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{item.surveyCode}</div>
                  </td>
                  <td className="px-5 py-4 text-zinc-400">
                    {new Date(item.completedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-zinc-400">{item.timeTaken}</td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-emerald-400 font-mono">
                      +${Number(item.rewardEarned).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-400 ml-1">({item.pointsEarned} pts)</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 size={12} />
                      Approved
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[11px] text-zinc-400">
                    {item.receiptId}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
