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
  Plus,
  X,
  Link2,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";
import SurveyIntegrationCard from "@/components/SurveyIntegrationCard";

export default function ActiveProjectsPage() {
  const {
    projects,
    toggleProjectPause,
    markProjectComplete,
    createSurveyProject,
  } = useSupplier();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedIntegrationId, setExpandedIntegrationId] = useState<string | null>(null);

  // New survey project form state
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    projectId: "",
    surveyName: "",
    client: "",
    country: "US",
    targetN: 250,
    loi: 10,
    ir: 30,
    cpi: 2.5,
    surveyUrl: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    status: "live",
    audience: "consumer",
  });

  const activeProjects = projects.filter(
    (p) => p.status === "active" || p.status === "paused"
  );

  const filtered = activeProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.projectId.toLowerCase().includes(search.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    if (!form.surveyName.trim()) {
      setCreateError("Survey Name is required");
      setCreating(false);
      return;
    }

    const res = await createSurveyProject(form);
    setCreating(false);

    if (res.success) {
      setShowCreateModal(false);
      if (res.project?.projectId) {
        setExpandedIntegrationId(res.project.projectId);
      }
      // Reset form
      setForm({
        projectId: "",
        surveyName: "",
        client: "",
        country: "US",
        targetN: 250,
        loi: 10,
        ir: 30,
        cpi: 2.5,
        surveyUrl: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        status: "live",
        audience: "consumer",
      });
    } else {
      setCreateError(res.error || "Failed to create project");
    }
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

        <div className="flex items-center gap-2.5">
          {/* <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-bold text-white px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 transition shrink-0 shadow-sm"
          >
            <Plus size={14} />
            Add New Survey
          </button> */}

          <Link
            href="/supplier/respondent-activity"
            className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 transition shrink-0"
          >
            View Live Respondents
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search active studies by project ID, title, or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Projects List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-3">
          <Activity size={32} className="mx-auto text-zinc-600 mb-2" />
          <h3 className="text-sm font-semibold text-zinc-300">No active projects</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Create a new survey or accept pending studies from the Incoming Projects queue to start routing sample.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
          >
            <Plus size={14} />
            Add Survey Project
          </button>
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
                        Client: <strong className="text-zinc-200">{project.clientName}</strong> • Target:{" "}
                        <strong className="text-zinc-200">{project.country}</strong> ({project.audience})
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

                {/* Survey Integration & Redirect URLs Section */}
                <SurveyIntegrationCard
                  projectId={project.projectId}
                  surveyUrl={project.surveyUrl}
                  mode="supplier"
                  title="Survey Integration & Client Redirect URLs"
                />

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-zinc-800/60">
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

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Link2 size={16} className="text-emerald-400" />
                  Add Client Survey & Generate Redirects
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Enter survey details provided by client to automatically generate return redirect URLs.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                <X size={16} />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Project ID <span className="text-zinc-500">(e.g. GMS82473)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={form.projectId}
                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Market Research"
                    value={form.client}
                    onChange={(e) => setForm({ ...form, client: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Survey Name / Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Brand Perception & Consumer Behavior Study"
                  value={form.surveyName}
                  onChange={(e) => setForm({ ...form, surveyName: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Client Survey URL <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://client.com/survey?pid=GMS82473"
                  value={form.surveyUrl}
                  onChange={(e) => setForm({ ...form, surveyUrl: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  The panelist will enter our platform gateway and be seamlessly redirected to this questionnaire with respondent ID attached.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Target N
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={form.targetN}
                    onChange={(e) => setForm({ ...form, targetN: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    LOI (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.loi}
                    onChange={(e) => setForm({ ...form, loi: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    IR (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.ir}
                    onChange={(e) => setForm({ ...form, ir: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    CPI ($)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0.1"
                    value={form.cpi}
                    onChange={(e) => setForm({ ...form, cpi: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create & Generate Redirects"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
