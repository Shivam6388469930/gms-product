"use client";

import React, { useState, useEffect } from "react";
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
  RefreshCw,
  Search,
} from "lucide-react";

interface ProjectReportItem {
  id: string;
  projectId: string;
  title: string;
  country: string;
  audience: string;
  cpi: number;
  quota: number;
  completes: number;
  disqualifications: number;
  quotaFull: number;
  remaining: number;
  starts: number;
  conversionRate: number;
  status: string;
}

interface FunnelStats {
  totalStarts: number;
  qualified: number;
  completed: number;
  screenouts: number;
  overquota: number;
  qualityRejects: number;
}

interface CountryPerformance {
  country: string;
  completes: number;
  avgCpi: number;
  conversion: string;
}

export default function SupplierReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [funnelStats, setFunnelStats] = useState<FunnelStats>({
    totalStarts: 0,
    qualified: 0,
    completed: 0,
    screenouts: 0,
    overquota: 0,
    qualityRejects: 0,
  });
  const [conversionRate, setConversionRate] = useState<string>("0.0");
  const [countryPerformance, setCountryPerformance] = useState<CountryPerformance[]>([]);
  const [projects, setProjects] = useState<ProjectReportItem[]>([]);
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/supplier/reports", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load supplier reports");
      }
      setFunnelStats(data.funnelStats || {
        totalStarts: 0,
        qualified: 0,
        completed: 0,
        screenouts: 0,
        overquota: 0,
        qualityRejects: 0,
      });
      setConversionRate(data.conversionRate || "0.0");
      setCountryPerformance(data.countryPerformance || []);
      setProjects(data.projects || []);
    } catch (err: any) {
      console.error("fetchReports error:", err);
      setError(err?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.projectId.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    if (!projects.length) {
      alert("No project data available to export.");
      return;
    }

    const headers = [
      "Project ID",
      "Survey Title",
      "Country",
      "Audience",
      "CPI ($)",
      "Allocated Quota",
      "Completes",
      "Disqualifications",
      "Quota Full",
      "Remaining",
      "Starts",
      "Conversion Rate (%)",
      "Status",
    ];

    const rows = projects.map((p) => [
      `"${p.projectId}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.country}"`,
      `"${p.audience}"`,
      p.cpi.toFixed(2),
      p.quota,
      p.completes,
      p.disqualifications,
      p.quotaFull,
      p.remaining,
      p.starts,
      `${p.conversionRate}%`,
      `"${p.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `supplier_fieldwork_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            Real-time reporting on audience conversion rates, project quotas, quality drop-offs, and remaining inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition disabled:opacity-50"
            title="Refresh Report Data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading || !projects.length}
            className="text-xs font-semibold text-white px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition shrink-0 disabled:opacity-50"
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Funnel Overview */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Traffic Funnel & Yield Efficiency
          </h3>
          <span className="text-xs font-semibold text-emerald-400">
            Overall Conversion: {conversionRate}%
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
            <span className="text-[10px] text-indigo-400/80">
              {funnelStats.totalStarts > 0
                ? Math.round((funnelStats.qualified / funnelStats.totalStarts) * 100)
                : 0}
              % qualified
            </span>
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
            <span className="text-[10px] text-amber-400/80">Disqualified</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Overquota</span>
            <span className="text-lg font-black text-blue-400 font-mono mt-1 block">
              {funnelStats.overquota.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-400/80">Quota full</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Quality Block</span>
            <span className="text-lg font-black text-red-400 font-mono mt-1 block">
              {funnelStats.qualityRejects.toLocaleString()}
            </span>
            <span className="text-[10px] text-red-400/80">Speeding / fraud</span>
          </div>
        </div>
      </div>

      {/* Project-Wise Quota & Conversion Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Project-Wise Quotas & Performance</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live quota fulfillment, completes, screenouts, and remaining quota per project
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search study, ID, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Study / ID</th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold text-right">Quota</th>
                <th className="px-4 py-3 font-semibold text-right text-emerald-400">Completes</th>
                <th className="px-4 py-3 font-semibold text-right text-amber-400">Disqualified</th>
                <th className="px-4 py-3 font-semibold text-right text-blue-400">Quota Full</th>
                <th className="px-4 py-3 font-semibold text-right text-indigo-300">Remaining</th>
                <th className="px-4 py-3 font-semibold text-right">Yield</th>
                <th className="px-4 py-3 font-semibold text-right">CPI</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-500">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading live project reports...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-500">
                    No allocated projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const pctAchieved =
                    p.quota > 0 ? Math.min(100, Math.round((p.completes / p.quota) * 100)) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white max-w-xs truncate">{p.title}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{p.projectId}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">{p.country}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {p.quota.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {p.completes.toLocaleString()}
                        <div className="text-[10px] text-zinc-500 font-normal">{pctAchieved}%</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400">
                        {p.disqualifications.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-blue-400">
                        {p.quotaFull.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-300">
                        {p.remaining.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">
                        {p.conversionRate}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                        ${p.cpi.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            p.status === "active" || p.status === "live"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : p.status === "completed"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : p.status === "paused"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Country Breakdown Table */}
      {countryPerformance.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Geographic Yield Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Country / Market</th>
                  <th className="px-5 py-3.5 font-semibold">Completes Fulfilled</th>
                  <th className="px-5 py-3.5 font-semibold">Average Realized CPI</th>
                  <th className="px-5 py-3.5 font-semibold">Traffic Share</th>
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
                        Active Supply
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
