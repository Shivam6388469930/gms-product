"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  FilterX,
  Clock,
  DollarSign,
  Download,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function SurveyHistoryPage() {
  const { history } = useRespondent();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = history.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.surveyCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
            <CheckCircle2 size={11} />
            Approved
          </span>
        );
      case "screened_out":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
            Screened Out
          </span>
        );
      case "quota_full":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
            Quota Full
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
            <History size={13} />
            <span>Lifetime Activity Ledger</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Survey History & Past Participations
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Complete historical log of all survey attempts, screening compensations, and approved points.
          </p>
        </div>

        <button
          onClick={() => alert("Exporting survey participation history CSV...")}
          className="text-xs font-medium text-zinc-200 hover:text-white px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 transition shrink-0"
        >
          <Download size={14} />
          Export History CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by survey title or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Outcomes</option>
          <option value="approved">Approved & Credited</option>
          <option value="screened_out">Screened Out</option>
          <option value="quota_full">Quota Full</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Survey Topic</th>
              <th className="px-5 py-3.5 font-semibold">Date Completed</th>
              <th className="px-5 py-3.5 font-semibold">Interview Duration</th>
              <th className="px-5 py-3.5 font-semibold">Outcome</th>
              <th className="px-5 py-3.5 font-semibold text-right">Points Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                <td className="px-5 py-4">
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {item.surveyCode}
                  </div>
                </td>
                <td className="px-5 py-4 text-zinc-400 font-mono">{item.completedAt}</td>
                <td className="px-5 py-4 text-zinc-300 font-mono">{item.loiMinutes} mins</td>
                <td className="px-5 py-4">{getStatusBadge(item.status)}</td>
                <td className="px-5 py-4 text-right">
                  <div className="font-bold text-emerald-400 font-mono text-sm">
                    +${item.rewardEarned.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {item.pointsEarned} pts
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
