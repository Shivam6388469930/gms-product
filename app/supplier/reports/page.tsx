"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";

export default function SupplierReportsPage() {
  const { projects, respondentLogs } = useSupplier();
  const [timeRange, setTimeRange] = useState("last_30");

  const funnelStats = {
    totalStarts: 7420,
    qualified: 5120,
    completed: 4210,
    screenouts: 1980,
    overquota: 320,
    qualityRejects: 91,
  };

  const conversionRate = ((funnelStats.completed / funnelStats.totalStarts) * 100).toFixed(1);

  const countryPerformance = [
    { country: "United States (US)", completes: 2840, avgCpi: 6.85, conversion: "58.4%" },
    { country: "United Kingdom (UK)", completes: 610, avgCpi: 5.40, conversion: "54.2%" },
    { country: "France (FR)", completes: 450, avgCpi: 4.80, conversion: "51.0%" },
    { country: "Germany (DE)", completes: 310, avgCpi: 8.20, conversion: "62.1%" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
            <BarChart3 size={13} />
            <span>Fieldwork Intelligence & Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Performance Reports & Conversion Metrics
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            In-depth reporting on audience conversion rates, quality screening drop-offs, and geographic sample yield.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="last_7">Last 7 Days</option>
            <option value="last_30">Last 30 Days (MTD)</option>
            <option value="last_90">Quarter to Date</option>
            <option value="year">Full Year 2026</option>
          </select>

          <button
            onClick={() => alert("Exporting comprehensive CSV report...")}
            className="text-xs font-semibold text-white px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition shrink-0"
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Funnel Overview */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Traffic Funnel & Yield Efficiency
          </h3>
          <span className="text-xs font-semibold text-emerald-400">
            Conversion Rate: {conversionRate}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Total Starts</span>
            <span className="text-lg font-black text-white font-mono mt-1 block">
              {funnelStats.totalStarts.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500">100% of traffic</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Qualified</span>
            <span className="text-lg font-black text-indigo-400 font-mono mt-1 block">
              {funnelStats.qualified.toLocaleString()}
            </span>
            <span className="text-[10px] text-indigo-400/80">69.0% passed screener</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Completes</span>
            <span className="text-lg font-black text-emerald-400 font-mono mt-1 block">
              {funnelStats.completed.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400/80">Billable completes</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Screenouts</span>
            <span className="text-lg font-black text-amber-400 font-mono mt-1 block">
              {funnelStats.screenouts.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-400/80">Demographic mismatch</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Overquota</span>
            <span className="text-lg font-black text-blue-400 font-mono mt-1 block">
              {funnelStats.overquota.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-400/80">Target cells filled</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Quality Block</span>
            <span className="text-lg font-black text-red-400 font-mono mt-1 block">
              {funnelStats.qualityRejects.toLocaleString()}
            </span>
            <span className="text-[10px] text-red-400/80">1.2% fraud/speeding</span>
          </div>
        </div>
      </div>

      {/* Country Breakdown Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Geographic Yield Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Country / Market</th>
                <th className="px-5 py-3.5 font-semibold">Completes Fulfilled</th>
                <th className="px-5 py-3.5 font-semibold">Average Realized CPI</th>
                <th className="px-5 py-3.5 font-semibold">Funnel Conversion</th>
                <th className="px-5 py-3.5 font-semibold text-right">Yield Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
              {countryPerformance.map((c) => (
                <tr key={c.country} className="hover:bg-zinc-800/30 transition">
                  <td className="px-5 py-4 font-semibold text-white">{c.country}</td>
                  <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                    {c.completes.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 font-mono">${c.avgCpi.toFixed(2)}</td>
                  <td className="px-5 py-4 font-mono">{c.conversion}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 size={13} />
                      Optimal Supply
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
