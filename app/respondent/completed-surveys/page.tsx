"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function CompletedSurveysPage() {
  const { history } = useRespondent();
  const [search, setSearch] = useState("");

  const approvedList = history.filter((h) => h.status === "approved");
  const filtered = approvedList.filter((h) =>
    h.title.toLowerCase().includes(search.toLowerCase()) ||
    h.surveyCode.toLowerCase().includes(search.toLowerCase())
  );

  const totalEarned = approvedList.reduce((sum, h) => sum + h.rewardEarned, 0);

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
            Research studies successfully completed with rewards approved and deposited to your wallet.
          </p>
        </div>

        <Link
          href="/respondent/rewards"
          className="text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shrink-0"
        >
          <Gift size={15} />
          Cashout Earnings
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">Total Approved Completes</span>
          <div className="text-2xl font-black text-white mt-1">
            {approvedList.length} Studies
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
          placeholder="Search by survey title or code..."
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
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                <td className="px-5 py-4">
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                    {item.surveyCode}
                  </div>
                </td>
                <td className="px-5 py-4 text-zinc-400 font-mono">{item.completedAt}</td>
                <td className="px-5 py-4 text-zinc-300 font-mono">{item.loiMinutes} mins</td>
                <td className="px-5 py-4">
                  <div className="font-bold text-emerald-400 font-mono">
                    +${item.rewardEarned.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {item.pointsEarned} pts
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    <CheckCircle2 size={11} />
                    Approved & Credited
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => alert(`Downloaded receipt for ${item.surveyCode}`)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                    title="Download Confirmation"
                  >
                    <Download size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
