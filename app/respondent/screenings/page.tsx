"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FilterX,
  Search,
  Info,
  Gift,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function ScreeningsPage() {
  const { history } = useRespondent();
  const [search, setSearch] = useState("");

  const screenings = history.filter(
    (h) => h.status === "screened_out" || h.status === "quota_full"
  );

  const filtered = screenings.filter((h) =>
    h.title.toLowerCase().includes(search.toLowerCase()) ||
    h.surveyCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-2">
            <FilterX size={13} />
            <span>Screener Participation Records</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Screening & Quota Outcomes
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Surveys where your initial responses did not match client quotas. You are still credited participation bonus points!
          </p>
        </div>

        <Link
          href="/respondent/profile"
          className="text-xs font-semibold text-zinc-200 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shrink-0"
        >
          <Lightbulb size={14} className="text-amber-400" />
          Update Profile for Better Matches
        </Link>
      </div>

      {/* Info Tip Banner */}
      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-950/20 text-xs text-amber-200/90 space-y-1">
        <div className="font-semibold text-amber-300 flex items-center gap-1.5">
          <Info size={14} />
          Why do screenings happen?
        </div>
        <p className="text-zinc-400 leading-relaxed">
          Market researchers often seek specific niche audiences (e.g. users of a specific software tool or brand). If you screen out or quota closes early, GMS automatically credits 10 points to compensate for your time.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search screenings..."
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
              <th className="px-5 py-3.5 font-semibold">Survey</th>
              <th className="px-5 py-3.5 font-semibold">Date</th>
              <th className="px-5 py-3.5 font-semibold">Reason</th>
              <th className="px-5 py-3.5 font-semibold">Outcome</th>
              <th className="px-5 py-3.5 font-semibold text-right">Compensation</th>
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
                <td className="px-5 py-4 text-zinc-400 max-w-xs">
                  {item.rejectionReason || "Demographic target quota closed"}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                    {item.status === "screened_out" ? "Screened Out" : "Quota Fulfilled"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-emerald-400">
                  +${item.rewardEarned.toFixed(2)} ({item.pointsEarned} pts)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
