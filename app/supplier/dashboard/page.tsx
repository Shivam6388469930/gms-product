"use client";

import React from "react";
import Link from "next/link";
import {
  Inbox,
  Activity,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Sparkles,
  ArrowRight,
  Check,
  ExternalLink,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";

export default function SupplierDashboardPage() {
  const { projects, respondentLogs, revenue, acceptIncomingProject } = useSupplier();

  const incomingProjects = projects.filter((p) => p.status === "incoming");
  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");

  const totalDelivered = projects.reduce((acc, p) => acc + p.sampleDelivered, 0);
  const currentMtdRevenue = revenue[0]?.grossRevenue || 28450;
  const recentCompletes = respondentLogs.filter((l) => l.status === "completed").length;
  const flaggedAttempts = respondentLogs.filter((l) => l.fraudScore > 80).length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-zinc-900 to-zinc-900 p-6 lg:p-8">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
              <Sparkles size={13} />
              <span>Real-Time Supply Node Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Supplier Partner Command Center
            </h1>
            <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
              Monitor project invitations, live quota delivery, respondent fraud scoring, and revenue reconciliation across all active study feeds.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/supplier/incoming-projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
            >
              <Inbox size={15} />
              Review Incoming ({incomingProjects.length})
            </Link>
            <Link
              href="/supplier/api-integration"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              Postback Settings
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium">MTD Gross Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            ${currentMtdRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp size={13} />
            <span>+14.8% vs previous month</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium">Total Completes Delivered</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            {totalDelivered.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Across {activeProjects.length + completedProjects.length} active & historic projects
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium">Pending Project Requests</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Inbox size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-300">
            {incomingProjects.length} Studies
          </div>
          <div className="mt-2 text-xs text-amber-400/80">
            ${incomingProjects.reduce((sum, p) => sum + p.totalValue, 0).toLocaleString()} pipeline value
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium">Panel Quality Health</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">97.8%</div>
          <div className="mt-2 text-xs text-zinc-400">
            Fraud block rate: <span className="text-emerald-400 font-semibold">{flaggedAttempts} blocked</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Incoming Projects & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active & Incoming */}
        <div className="lg:col-span-2 space-y-8">
          {/* Incoming Projects Section */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Inbox size={18} className="text-amber-400" />
                  Incoming Project Invitations
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Available projects matching your panel supply capacity
                </p>
              </div>
              <Link
                href="/supplier/incoming-projects"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                View all ({incomingProjects.length})
                <ArrowRight size={13} />
              </Link>
            </div>

            {incomingProjects.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-xl">
                No incoming projects currently waiting. All invites accepted!
              </div>
            ) : (
              <div className="space-y-3">
                {incomingProjects.slice(0, 2).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-indigo-400">
                            {project.projectId}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {project.audience}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {project.country}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-100 mt-1">
                          {project.title}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                          {project.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-emerald-400">
                          ${project.cpi.toFixed(2)} CPI
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Total: ${project.totalValue.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/70 text-xs">
                      <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
                        <span>LOI: <strong className="text-zinc-200">{project.loi}m</strong></span>
                        <span>IR: <strong className="text-zinc-200">{project.ir}%</strong></span>
                        <span>Quota: <strong className="text-zinc-200">{project.sampleRequired}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => acceptIncomingProject(project.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Check size={13} />
                          Accept Project
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Projects Live Fieldwork */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Activity size={18} className="text-emerald-400" />
                  Live Fieldwork & Quota Progress
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Currently routing live respondent sample
                </p>
              </div>
              <Link
                href="/supplier/active-projects"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                View all ({activeProjects.length})
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="space-y-4">
              {activeProjects.map((project) => {
                const percent = Math.min(
                  100,
                  Math.round((project.sampleDelivered / project.sampleRequired) * 100)
                );
                return (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-zinc-300">
                            {project.projectId}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active Routing
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-zinc-100 mt-1">
                          {project.title}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-zinc-100">
                          {project.sampleDelivered} / {project.sampleRequired}
                        </div>
                        <div className="text-[11px] text-zinc-400">{percent}% Completed</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                      <span>CPI: ${project.cpi.toFixed(2)}</span>
                      <span>Target: {project.country} ({project.audience})</span>
                      <Link
                        href="/supplier/active-projects"
                        className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        Details & Links
                        <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Respondent Activity Stream & Panels Snapshot */}
        <div className="space-y-8">
          {/* Live Activity Stream */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users size={16} className="text-indigo-400" />
                Live Respondent Stream
              </h2>
              <Link
                href="/supplier/respondent-activity"
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Full Log
              </Link>
            </div>

            <div className="space-y-3">
              {respondentLogs.slice(0, 5).map((log) => {
                const isComplete = log.status === "completed";
                const isFraud = log.fraudScore > 80;
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-zinc-800/70 bg-zinc-950/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-zinc-300 font-medium">
                        {log.respondentId}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isComplete
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : isFraud
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {log.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="text-zinc-400 truncate">{log.projectTitle}</div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>{log.country} • {log.device}</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick API / Postback Status */}
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 to-zinc-950 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              S2S Integration Health
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400">Postback Server</span>
                <span className="text-emerald-400 font-medium">Operational (99.98%)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400">Avg Postback Latency</span>
                <span className="text-zinc-200 font-mono">42ms</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">Hashing Protocol</span>
                <span className="text-zinc-200 font-mono">HMAC-SHA256</span>
              </div>
            </div>

            <Link
              href="/supplier/api-integration"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              Test Endpoints & Webhooks
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
