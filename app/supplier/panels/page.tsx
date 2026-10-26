"use client";

import React, { useState } from "react";
import {
  Layers,
  Plus,
  Search,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";
import { SupplierPanel } from "@/lib/supplier-data";

export default function SupplierPanelsPage() {
  const { panels, createNewPanel } = useSupplier();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // New panel form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SupplierPanel["category"]>("Consumer");
  const [country, setCountry] = useState("US");
  const [activeMembers, setActiveMembers] = useState("25000");
  const [responseRate, setResponseRate] = useState("55");
  const [avgCompletionTime, setAvgCompletionTime] = useState("12");

  const filtered = panels.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = panels.reduce((sum, p) => sum + p.activeMembers, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createNewPanel({
      name: name.trim(),
      category,
      country,
      activeMembers: Number(activeMembers) || 10000,
      responseRate: Number(responseRate) || 50,
      avgCompletionTime: Number(avgCompletionTime) || 10,
      qualityIndex: 94.5,
      status: "Active",
    });

    setName("");
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-2">
            <Layers size={13} />
            <span>Audience Inventory Hub</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Proprietary Panels & Audience Segments
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your registered respondent panels, response rate health, and capacity allocation for GMS sample matching.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="text-xs font-semibold text-white px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition shrink-0"
        >
          <Plus size={15} />
          Register New Panel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">Total Active Panelists</span>
          <div className="text-2xl font-bold text-white mt-1">
            {totalMembers.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">Panel Segments Configured</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{panels.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">Average Panel Quality Index</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">93.2 / 100</div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search panel name, audience classification, or target geography..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Panels Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((panel) => (
          <div
            key={panel.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700/80 p-5 transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {panel.category}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    panel.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {panel.status}
                </span>
              </div>

              <h2 className="text-base font-bold text-white tracking-tight">{panel.name}</h2>
              <div className="text-xs text-zinc-400">Target Region: <strong className="text-zinc-200">{panel.country}</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/60 text-xs">
              <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-400 block text-[10px]">Active Members</span>
                <span className="font-bold text-white text-sm font-mono">
                  {panel.activeMembers.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-400 block text-[10px]">Response Rate</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  {panel.responseRate}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-400 block text-[10px]">Avg Speed (LOI)</span>
                <span className="font-semibold text-zinc-200 text-xs font-mono">
                  {panel.avgCompletionTime} mins
                </span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-400 block text-[10px]">Quality Index</span>
                <span className="font-semibold text-cyan-400 text-xs font-mono">
                  {panel.qualityIndex}/100
                </span>
              </div>
            </div>

            <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1">
              <span>Last Sync: {panel.lastRefreshed}</span>
              <button
                onClick={() => alert(`Synchronized capacity data for "${panel.name}"`)}
                className="text-indigo-400 hover:underline"
              >
                Sync Quota Feed
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Panel Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white">Register Panel Segment</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Panel Name</label>
                <input
                  required
                  placeholder="e.g. Nordic Financial Advisors Panel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Audience Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Consumer">Consumer</option>
                    <option value="B2B Tech">B2B Tech</option>
                    <option value="Healthcare HCP">Healthcare HCP</option>
                    <option value="Gen Z & Youth">Gen Z & Youth</option>
                    <option value="Finance & Banking">Finance & Banking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Country / Market</label>
                  <input
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Estimated Active Members</label>
                  <input
                    type="number"
                    value={activeMembers}
                    onChange={(e) => setActiveMembers(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Response Rate (%)</label>
                  <input
                    type="number"
                    value={responseRate}
                    onChange={(e) => setResponseRate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Panel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
