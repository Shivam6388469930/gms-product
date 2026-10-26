"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Search,
  DollarSign,
  Download,
  Calendar,
  FileText,
  ShieldCheck,
  Globe,
  ArrowRight,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";

export default function CompletedProjectsPage() {
  const { projects } = useSupplier();
  const [search, setSearch] = useState("");

  const completed = projects.filter((p) => p.status === "completed");
  const filtered = completed.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.projectId.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const totalEarnings = completed.reduce((sum, p) => sum + p.totalValue, 0);
  const totalCompletes = completed.reduce((sum, p) => sum + p.sampleDelivered, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <CheckCircle2 size={13} />
            <span>Fulfillment Archives</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Completed Projects Archive
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Historical studies where fieldwork quotas have closed and samples are fully reconciled.
          </p>
        </div>

        <Link
          href="/supplier/revenue"
          className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 transition shrink-0"
        >
          View Revenue Statements
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">Total Completed Projects</span>
          <div className="text-2xl font-bold text-white mt-1">{completed.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">Total Completes Delivered</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {totalCompletes.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">Total Value Realized</span>
          <div className="text-2xl font-bold text-white mt-1">
            ${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by title, project code, or client name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Study Details</th>
              <th className="px-5 py-3.5 font-semibold">Client</th>
              <th className="px-5 py-3.5 font-semibold">Audience / Country</th>
              <th className="px-5 py-3.5 font-semibold">Completes</th>
              <th className="px-5 py-3.5 font-semibold">CPI / Total</th>
              <th className="px-5 py-3.5 font-semibold">Audit Status</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
            {filtered.map((project) => (
              <tr key={project.id} className="hover:bg-zinc-800/30 transition">
                <td className="px-5 py-4">
                  <div className="font-semibold text-white">{project.title}</div>
                  <div className="text-[11px] font-mono text-indigo-400 mt-0.5">
                    {project.projectId}
                  </div>
                </td>
                <td className="px-5 py-4 text-zinc-400">{project.clientName}</td>
                <td className="px-5 py-4">
                  <div className="font-medium text-zinc-200 uppercase">{project.audience}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">{project.country}</div>
                </td>
                <td className="px-5 py-4">
                  <span className="font-bold text-white font-mono">
                    {project.sampleDelivered.toLocaleString()}
                  </span>{" "}
                  <span className="text-zinc-500">/ {project.sampleRequired}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="font-bold text-emerald-400">${project.cpi.toFixed(2)}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    ${project.totalValue.toLocaleString()}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    <ShieldCheck size={12} />
                    Reconciled
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => alert(`Downloaded reconciliation certificate for ${project.projectId}`)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                    title="Download Report"
                  >
                    <Download size={14} />
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
