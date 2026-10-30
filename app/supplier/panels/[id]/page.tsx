"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Users,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Trash2,
  X,
  Check,
  MapPin,
  Mail,
  UserPlus,
} from "lucide-react";

interface PanelData {
  id: string;
  name: string;
  category: string;
  country: string;
  activeMembers: number;
  qualityIndex: number;
  status: string;
  stats: {
    totalRespondents: number;
    activeRespondents: number;
    availableRespondents: number;
    qualityScore: number;
  };
}

interface RespondentItem {
  _id: string;
  respondentId: string;
  externalId?: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  gender?: string;
  age?: number;
  qualityScore: number;
  completedSurveys: number;
  status: string;
  lastActiveAt?: string;
}

export default function SupplierPanelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [panel, setPanel] = useState<PanelData | null>(null);
  const [respondents, setRespondents] = useState<RespondentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [addExistingModalOpen, setAddExistingModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Add existing state
  const [existingIdInput, setExistingIdInput] = useState("");
  const [submittingExisting, setSubmittingExisting] = useState(false);

  // Create new state
  const [createFormData, setCreateFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    externalId: "",
    country: "US",
    gender: "Unspecified",
    age: "",
    status: "Active",
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/supplier/panels/${id}/respondents`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPanel(data.panel);
          setRespondents(data.respondents || []);
        }
      }
    } catch (err) {
      console.error("Failed to load panel respondents", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle assign existing respondent
  const handleAddExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingIdInput.trim()) return;
    setSubmittingExisting(true);
    try {
      const res = await fetch(`/api/supplier/panels/${id}/respondents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingRespondentId: existingIdInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Respondent added to panel", "success");
        setAddExistingModalOpen(false);
        setExistingIdInput("");
        loadData();
      } else {
        showToast(data.error || "Failed to add respondent", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmittingExisting(false);
    }
  };

  // Handle create and enroll
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    try {
      const res = await fetch(`/api/supplier/panels/${id}/respondents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createFormData,
          country: createFormData.country || panel?.country || "US",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Respondent created and enrolled", "success");
        setCreateModalOpen(false);
        setCreateFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          externalId: "",
          country: "US",
          gender: "Unspecified",
          age: "",
          status: "Active",
        });
        loadData();
      } else {
        showToast(data.error || "Failed to create respondent", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Remove respondent from this panel
  const handleRemoveFromPanel = async (respId: string, name: string) => {
    if (!confirm(`Remove ${name} from this panel?`)) return;
    try {
      const res = await fetch(`/api/supplier/respondents/${respId}/panels/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Removed ${name} from panel`, "success");
        loadData();
      } else {
        showToast(data.error || "Failed to remove respondent", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    }
  };

  const filtered = respondents.filter((r) => {
    const matchesSearch =
      r.respondentId.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.externalId && r.externalId.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && !panel) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <RefreshCw size={26} className="text-indigo-400 animate-spin" />
        <span className="text-xs text-zinc-400">Loading panel details...</span>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-xs text-zinc-400">Panel not found.</p>
        <Link
          href="/supplier/panels"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold"
        >
          <ArrowLeft size={13} />
          <span>Back to Panels</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === "success"
              ? "bg-emerald-950 border-emerald-500/30 text-emerald-200"
              : "bg-rose-950 border-rose-500/30 text-rose-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={15} className="text-emerald-400" />
          ) : (
            <XCircle size={15} className="text-rose-400" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Back button */}
      <div>
        <Link
          href="/supplier/panels"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-medium"
        >
          <ArrowLeft size={13} />
          <span>Back to Panels Directory</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {panel.category}
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {panel.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{panel.name}</h1>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
            <MapPin size={12} className="text-zinc-500" />
            <span>Region: {panel.country}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddExistingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            <UserPlus size={13} />
            <span>Add Existing Respondent</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
          >
            <Plus size={14} />
            <span>Create Respondent</span>
          </button>
        </div>
      </div>

      {/* PANEL OVERVIEW STATS CARDS */}
      <div>
        <h2 className="text-xs font-mono uppercase text-zinc-400 tracking-wider mb-2">
          Panel Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block mb-1">Total Respondents</span>
            <span className="text-2xl font-bold font-mono text-white">
              {panel.stats?.totalRespondents ?? respondents.length}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-1">Enrolled Panelists</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block mb-1">Active Respondents</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {panel.stats?.activeRespondents ?? respondents.filter((r) => r.status === "Active").length}
            </span>
            <span className="text-[10px] text-emerald-500/80 block mt-1">Ready for Surveys</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block mb-1">Available Respondents</span>
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {panel.stats?.availableRespondents ?? respondents.filter((r) => r.status === "Active").length}
            </span>
            <span className="text-[10px] text-cyan-500/80 block mt-1">Eligible Capacity</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block mb-1">Quality Score</span>
            <span className="text-2xl font-bold font-mono text-indigo-400">
              {panel.stats?.qualityScore ?? panel.qualityIndex}%
            </span>
            <span className="text-[10px] text-indigo-500/80 block mt-1">Sentinel Verified</span>
          </div>
        </div>
      </div>

      {/* PANEL RESPONDENTS SECTION */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-indigo-400" />
            <span>Panel Respondents ({filtered.length})</span>
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search respondents in this panel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Respondents Table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-xl">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400 space-y-2">
              <p>No respondents found in this panel matching your search criteria.</p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={() => setAddExistingModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  + Add Existing Respondent
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4">Respondent</th>
                    <th className="py-2.5 px-4">ID</th>
                    <th className="py-2.5 px-4">Country</th>
                    <th className="py-2.5 px-4">Demographics</th>
                    <th className="py-2.5 px-4">Quality</th>
                    <th className="py-2.5 px-4">Surveys</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4 font-semibold text-white">
                        {r.name}
                        <div className="text-[10px] text-zinc-500 font-normal">{r.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {r.respondentId}
                        {r.externalId && (
                          <div className="text-[9px] text-zinc-500">EXT: {r.externalId}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{r.country}</td>
                      <td className="py-3 px-4 text-zinc-400">
                        {r.gender || "Unspecified"} • {r.age ? `${r.age} yrs` : "N/A"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {r.qualityScore?.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {r.completedSurveys} completes
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <Link
                          href={`/supplier/respondents/${r._id}`}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 inline-flex items-center text-[11px]"
                          title="View Profile"
                        >
                          <Eye size={12} />
                        </Link>
                        <button
                          onClick={() => handleRemoveFromPanel(r._id, r.name)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 inline-flex items-center text-[11px]"
                          title="Remove from panel"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD EXISTING RESPONDENT */}
      {addExistingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus size={16} className="text-indigo-400" />
                <span>Add Existing Respondent to Panel</span>
              </h3>
              <button
                onClick={() => setAddExistingModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExisting} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">
                  Respondent ID, External ID, or Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. R00231 or respondent email"
                  value={existingIdInput}
                  onChange={(e) => setExistingIdInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAddExistingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExisting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  {submittingExisting ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{submittingExisting ? "Adding..." : "Add to Panel"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE RESPONDENT IN PANEL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" />
                <span>Create & Enroll into {panel.name}</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={createFormData.firstName}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, firstName: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={createFormData.lastName}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, lastName: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, email: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, phone: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">External ID</label>
                  <input
                    type="text"
                    value={createFormData.externalId}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, externalId: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={createFormData.country}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, country: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Gender</label>
                  <select
                    value={createFormData.gender}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, gender: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Unspecified">Unspecified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Age</label>
                  <input
                    type="number"
                    value={createFormData.age}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, age: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  {submittingCreate ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{submittingCreate ? "Creating..." : "Create & Enroll"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
