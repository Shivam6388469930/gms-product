"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJSON } from "@/lib/auth-client";
import { COUNTRIES } from "@/lib/project-config";
import { StatusBadge } from "@/components/Statusbadge";
import { ErrorAlert, Spinner } from "@/components/Ui";
import {
  Sparkles,
  Activity,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FolderKanban,
  PlusCircle,
  ArrowRight,
  Filter,
  BarChart3,
  Layers,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  Users,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type DashboardData = {
  projects: {
    total: number;
    live: number;
    draft: number;
    paused: number;
    stopped: number;
  };
  fieldwork: {
    starts: number;
    completes: number;
    screenouts: number;
    quotaFull: number;
    qualityRejects: number;
    spend: number;
    sampleNeeded: number;
    conversionRate: number;
    fillRate: number;
  };
  trend: { date: string; completes: number; screenouts: number; starts: number }[];
  invoiceSummary: { total: number; paid: number; outstanding: number; disputed: number };
  recentProjects: {
    _id: string;
    surveyTitle: string;
    country: string;
    audienceType: string;
    status: string;
    sampleSize: number;
    completes: number;
    spend: number;
    createdAt: string;
  }[];
  alerts: { projectId: string; title: string; type: string; message: string }[];
};

/* =========================================================
   HELPERS
========================================================= */

function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function num(n: number) {
  return (n || 0).toLocaleString("en-US");
}

/* =========================================================
   MINI BAR CHART
========================================================= */

function MiniBarChart({
  data,
  dataKey,
  color,
  maxBars = 18,
}: {
  data: { date: string; [key: string]: unknown }[];
  dataKey: string;
  color: string;
  maxBars?: number;
}) {
  const sliced = data.slice(-maxBars);
  const maxVal = Math.max(1, ...sliced.map((d) => Number(d[dataKey] || 0)));

  return (
    <div className="flex items-end gap-1.5 h-24 pt-3 pb-1">
      {sliced.map((d, i) => {
        const val = Number(d[dataKey] || 0);
        const pct = Math.max(4, (val / maxVal) * 100);
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full group relative"
          >
            <div
              className="w-full rounded-t-sm transition-all duration-300 hover:brightness-125"
              style={{ height: `${pct}%`, backgroundColor: color }}
            />
            {/* Tooltip */}
            <div className="absolute -top-7 hidden group-hover:flex z-20 items-center justify-center px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-white whitespace-nowrap shadow-md pointer-events-none border border-zinc-700">
              {d.date}: {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    apiJSON<{ dashboard: DashboardData }>("/api/dashboard").then(
      ({ ok, status, data: res }) => {
        if (!mounted) return;
        if (status === 401) {
          router.replace("/login");
          return;
        }
        if (!ok) {
          setError(res.message || "Couldn't load dashboard.");
          return;
        }
        setData(res.dashboard);
      }
    );

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!data && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center space-y-3">
        <Spinner className="h-7 w-7 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400 font-medium">Synchronizing live fieldwork telemetry...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!data) return null;

  const d = data;

  const paidRatio =
    d.invoiceSummary.total > 0
      ? Math.round((d.invoiceSummary.paid / d.invoiceSummary.total) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Hero Operations Command Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/70 via-zinc-900/90 to-zinc-900 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 -mb-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles size={13} />
              <span>Real-Time Research Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Fieldwork Operations Center
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Track global panel sample delivery, live quota fill rates, quality screening metrics, and financial spend across all active surveys.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/new-project"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <PlusCircle size={16} />
              <span>Launch New Project</span>
            </Link>
            <Link
              href="/project"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/70 text-zinc-200 text-xs font-semibold transition"
            >
              <FolderKanban size={15} />
              <span>Manage Studies ({d.projects.total})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner (if any) */}
      {d.alerts && d.alerts.length > 0 && (
        <div className="space-y-2">
          {d.alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur-md"
            >
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={17} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/project-details/${alert.projectId}`}
                  className="text-xs font-bold text-amber-300 hover:underline flex items-center gap-1.5"
                >
                  {alert.title}
                  <ArrowRight size={12} />
                </Link>
                <p className="mt-0.5 text-xs text-amber-200/80 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Live Fieldwork */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3 text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Studies</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Activity size={17} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {num(d.projects.live)}
            <span className="text-xs text-zinc-500 font-normal ml-2">/ {num(d.projects.total)} total</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{num(d.projects.paused)} paused · {num(d.projects.draft)} draft</span>
          </div>
        </div>

        {/* Card 2: Completes Delivered */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur hover:border-indigo-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3 text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Completes Delivered</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {num(d.fieldwork.completes)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Quota Target: <strong className="text-zinc-200">{num(d.fieldwork.sampleNeeded)}</strong></span>
          </div>
        </div>

        {/* Card 3: Total Spend */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur hover:border-cyan-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3 text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Sample Spend</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <DollarSign size={17} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {usd(d.fieldwork.spend)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-cyan-400">
            <TrendingUp size={13} />
            <span>Avg CPI: ${(d.fieldwork.completes > 0 ? (d.fieldwork.spend / d.fieldwork.completes).toFixed(2) : "2.40")}</span>
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur hover:border-violet-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3 text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Conversion Rate</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:scale-110 transition-transform">
              <BarChart3 size={17} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {d.fieldwork.conversionRate}%
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-violet-300">
            <span>Overall Fill Rate: <strong className="text-white">{d.fieldwork.fillRate}%</strong></span>
          </div>
        </div>
      </div>

      {/* Fieldwork Conversion Funnel */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1">
              <Layers size={13} />
              Sample Routing Pipeline
            </div>
            <h2 className="text-base font-bold text-white">
              Live Fieldwork Funnel Breakdown
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Total Starts: {num(d.fieldwork.starts)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Stage 1: Starts */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400">1. Starts</span>
            <div className="text-xl font-bold text-white">{num(d.fieldwork.starts)}</div>
            <div className="text-[10px] text-zinc-500">100% Entry Traffic</div>
          </div>

          {/* Stage 2: Screenouts */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-rose-400">2. Screenouts</span>
            <div className="text-xl font-bold text-white">{num(d.fieldwork.screenouts)}</div>
            <div className="text-[10px] text-rose-300">
              {d.fieldwork.starts > 0 ? Math.round((d.fieldwork.screenouts / d.fieldwork.starts) * 100) : 0}% Drop-off
            </div>
          </div>

          {/* Stage 3: Quota Full */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-amber-400">3. Quota Full</span>
            <div className="text-xl font-bold text-white">{num(d.fieldwork.quotaFull)}</div>
            <div className="text-[10px] text-amber-300">
              {d.fieldwork.starts > 0 ? Math.round((d.fieldwork.quotaFull / d.fieldwork.starts) * 100) : 0}% Filled Cell
            </div>
          </div>

          {/* Stage 4: Quality Rejects */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-purple-400">4. Quality Rejects</span>
            <div className="text-xl font-bold text-white">{num(d.fieldwork.qualityRejects)}</div>
            <div className="text-[10px] text-purple-300">
              {d.fieldwork.starts > 0 ? Math.round((d.fieldwork.qualityRejects / d.fieldwork.starts) * 100) : 0}% Fraud Filter
            </div>
          </div>

          {/* Stage 5: Completes */}
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-emerald-400">5. Valid Completes</span>
            <div className="text-xl font-bold text-emerald-300">{num(d.fieldwork.completes)}</div>
            <div className="text-[10px] text-emerald-400 font-semibold">{d.fieldwork.conversionRate}% Yield</div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Trend Chart & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Fieldwork Throughput</h3>
              <p className="text-xs text-zinc-400 mt-0.5">30-day completes vs screenouts telemetry</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completes
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Screenouts
              </span>
            </div>
          </div>

          {d.trend.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <div className="text-[11px] font-medium text-zinc-400 mb-1 flex justify-between">
                  <span>Verified Completes Volume</span>
                  <span className="text-emerald-400 font-mono">Live</span>
                </div>
                <MiniBarChart data={d.trend} dataKey="completes" color="#10b981" />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <div className="text-[11px] font-medium text-zinc-400 mb-1 flex justify-between">
                  <span>Screenout Frequency</span>
                  <span className="text-rose-400 font-mono">Ir Filter</span>
                </div>
                <MiniBarChart data={d.trend} dataKey="screenouts" color="#f43f5e" />
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              No fieldwork activity recorded in this period.
            </div>
          )}
        </div>

        {/* Financial & Invoices Summary */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Financial & Invoice Reconciliation</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Automated billing ledger and payment statuses</p>
              </div>
              <Link
                href="/invoices"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Invoices <ArrowRight size={13} />
              </Link>
            </div>

            {/* Total Invoiced Meter */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 mb-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-zinc-400">Total Billed Volume</span>
                <span className="text-lg font-bold text-white font-mono">{usd(d.invoiceSummary.total)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${paidRatio}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
                <span>Paid: {usd(d.invoiceSummary.paid)} ({paidRatio}%)</span>
                <span>Outstanding: {usd(d.invoiceSummary.outstanding)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="text-[11px] text-emerald-400 font-medium">Settled / Paid</div>
                <div className="text-xl font-extrabold text-white mt-1 font-mono">{usd(d.invoiceSummary.paid)}</div>
              </div>
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="text-[11px] text-amber-400 font-medium">Outstanding Due</div>
                <div className="text-xl font-extrabold text-white mt-1 font-mono">{usd(d.invoiceSummary.outstanding)}</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span>Disputed Amount: <strong className="text-rose-400">{usd(d.invoiceSummary.disputed)}</strong></span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Auto-reconciled
            </span>
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      {d.recentProjects && d.recentProjects.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Research Fieldwork</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Recently active survey studies</p>
            </div>
            <Link
              href="/project"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View All ({d.projects.total}) <ArrowRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {d.recentProjects.map((p) => {
              const pct =
                p.sampleSize > 0
                  ? Math.min(100, Math.round((p.completes / p.sampleSize) * 100))
                  : 0;
              const countryName =
                COUNTRIES.find((c) => c.code === p.country)?.name || p.country;

              return (
                <Link
                  key={p._id}
                  href={`/project-details/${p._id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-zinc-800/40 transition group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {p.surveyTitle}
                      </span>
                      <StatusBadge status={p.status as any} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                        {countryName}
                      </span>
                      <span>·</span>
                      <span className="capitalize text-zinc-300">{p.audienceType}</span>
                      <span>·</span>
                      <span>Target: <strong className="text-zinc-200">{num(p.sampleSize)} completes</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Progress */}
                    <div className="w-32 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-mono">{num(p.completes)} / {num(p.sampleSize)}</span>
                        <span className="font-bold text-white">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Spend */}
                    <div className="text-right min-w-[70px]">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Spend</div>
                      <div className="text-xs font-bold text-white font-mono">{usd(p.spend)}</div>
                    </div>

                    <div className="text-zinc-500 group-hover:text-white transition-colors">
                      <ArrowUpRight size={17} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
