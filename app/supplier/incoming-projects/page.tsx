"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Check,
  X,
  Search,
  Clock,
  Globe,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";

export default function IncomingProjectsPage() {
  const {
    projects,
    acceptIncomingProject,
    declineIncomingProject,
    refreshData,
  } = useSupplier() as any;

  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4500);
  };

  const incomingProjects = projects.filter((p: any) => p.status === "incoming");

  const filtered = incomingProjects.filter((p: any) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(q) ||
      p.projectId.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    const matchesAudience =
      audienceFilter === "all" || p.audience === audienceFilter;
    return matchesSearch && matchesAudience;
  });

  const handleAccept = async (id: string, title: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const result = await acceptIncomingProject(id);

      // Store may return false / { success:false } on failure
      if (result === false || result?.success === false) {
        throw new Error(result?.error || "Server rejected the request");
      }

      // Re-sync with the backend so the status is the saved one
      if (typeof refreshData === "function") {
        await refreshData();
      }

      showToast("success", `Accepted "${title}". Moved to Active Projects.`);
    } catch (err: any) {
      console.error("Accept project failed:", err);
      showToast("error", err?.message || "Could not accept project");
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (id: string, title: string) => {
    if (busyId) return;
    if (!confirm(`Decline project "${title}"?`)) return;

    setBusyId(id);
    try {
      const result = await declineIncomingProject(id);

      if (result === false || result?.success === false) {
        throw new Error(result?.error || "Server rejected the request");
      }

      if (typeof refreshData === "function") {
        await refreshData();
      }

      showToast("success", `Project "${title}" declined.`);
    } catch (err: any) {
      console.error("Decline project failed:", err);
      showToast("error", err?.message || "Could not decline project");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-2">
            <Inbox size={13} />
            <span>Opportunities Exchange</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Incoming Projects Available for Supply
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            New research studies dispatched to your panel. Accept projects to
            immediately begin routing respondents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/supplier/active-projects"
            className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 transition"
          >
            Go to Active Projects
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/50 border-rose-500/30 text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search by title, project ID, target audience..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Audiences</option>
            <option value="consumer">Consumer (B2C)</option>
            <option value="b2b">Enterprise & B2B</option>
            <option value="healthcare">Healthcare & Medical</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20">
          <Inbox size={32} className="mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">
            No incoming projects
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {incomingProjects.length === 0
              ? "All incoming opportunities have been accepted or reviewed. Check back shortly for newly matched projects."
              : "No projects match your current search filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((project: any) => {
            const isBusy = busyId === project.id;

            return (
              <div
                key={project.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700/80 p-5 sm:p-6 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                        {project.projectId}
                      </span>
                      <span className="text-xs uppercase font-semibold text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                        {project.audience}
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                        <Globe size={13} />
                        Target: {project.country}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Client:{" "}
                        <strong className="text-zinc-300">
                          {project.clientName}
                        </strong>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {project.title}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 shrink-0">
                    <div className="text-lg font-black text-emerald-400">
                      ${project.cpi.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        CPI
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      Total:{" "}
                      <strong className="text-zinc-200">
                        ${project.totalValue.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Study Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/60 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-zinc-400 block text-[11px]">
                      Requested Sample
                    </span>
                    <span className="font-semibold text-zinc-200 text-sm">
                      {project.sampleRequired.toLocaleString()} Completes
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-zinc-400 block text-[11px]">
                      Length of Interview (LOI)
                    </span>
                    <span className="font-semibold text-zinc-200 text-sm">
                      {project.loi} mins
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-zinc-400 block text-[11px]">
                      Expected Incidence Rate (IR)
                    </span>
                    <span className="font-semibold text-zinc-200 text-sm">
                      {project.ir}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-zinc-400 block text-[11px]">
                      Quality Threshold
                    </span>
                    <span className="font-semibold text-cyan-400 text-sm">
                      {project.qualityScoreRequired}+ Score
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Clock size={13} className="text-zinc-400" />
                    Received: {project.receivedDate} • Target Closing:{" "}
                    {project.deadlineDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecline(project.id, project.title)}
                      disabled={!!busyId}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={14} />
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(project.id, project.title)}
                      disabled={!!busyId}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBusy ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      {isBusy ? "Activating..." : "Accept & Activate Project"}
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