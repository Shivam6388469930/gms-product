"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Pause,
  Play,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Search,
  Filter,
  DollarSign,
  Users,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";

export default function ActiveProjectsPage() {
  const { projects, toggleProjectPause, markProjectComplete } = useSupplier();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeProjects = projects.filter(
    (p) => p.status === "active" || p.status === "paused"
  );

  const filtered = activeProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.projectId.toLowerCase().includes(search.toLowerCase())
  );

  const copySurveyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <Activity size={13} />
            <span>Fieldwork Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Active Projects & Sample Routing
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time tracking of live quota delivery, respondent routing links, and traffic throttling.
          </p>
        </div>

        <Link
          href="/supplier/respondent-activity"
          className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 transition shrink-0"
        >
          View Live Respondents
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Search Toolbar */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search active studies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Projects List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20">
          <Activity size={32} className="mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No active projects</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Accept pending studies from the Incoming Projects queue to start routing sample.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((project) => {
            const isPaused = project.status === "paused";
            const percent = Math.min(
              100,
              Math.round((project.sampleDelivered / project.sampleRequired) * 100)
            );
            const earnedSoFar = project.sampleDelivered * project.cpi;

            return (
              <div
                key={project.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700/80 p-5 sm:p-6 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800 px-2.5 py-0.5 rounded border border-zinc-700">
                        {project.projectId}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isPaused
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {isPaused ? "Traffic Throttled / Paused" : "Live Routing Active"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Target: <strong className="text-zinc-200">{project.country}</strong> ({project.audience})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {project.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        ${project.cpi.toFixed(2)} CPI
                      </div>
                      <div className="text-xs text-zinc-400">
                        Earned: <strong className="text-zinc-200">${earnedSoFar.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quota Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      Delivered Completes:{" "}
                      <strong className="text-white">
                        {project.sampleDelivered} / {project.sampleRequired}
                      </strong>
                    </span>
                    <span className="font-mono text-zinc-300 font-semibold">{percent}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPaused
                          ? "bg-amber-500"
                          : "bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Survey Entry URL Box */}
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-medium text-zinc-300">
                      Supplier Live Entry URL Template:
                    </span>
                    <span>Replace <code className="text-indigo-400">[RID]</code> with your internal panelist ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={project.surveyUrlTemplate}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-300 select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copySurveyLink(project.id, project.surveyUrlTemplate)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                    >
                      {copiedId === project.id ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
                    <span>LOI: <strong className="text-zinc-200">{project.loi}m</strong></span>
                    <span>Expected IR: <strong className="text-zinc-200">{project.ir}%</strong></span>
                    <span>Closing: <strong className="text-zinc-200">{project.deadlineDate}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleProjectPause(project.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                        isPaused
                          ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30"
                          : "bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30"
                      }`}
                    >
                      {isPaused ? <Play size={13} /> : <Pause size={13} />}
                      {isPaused ? "Resume Traffic" : "Pause Traffic"}
                    </button>

                    <button
                      onClick={() => markProjectComplete(project.id)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
                    >
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      Mark Completed
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
