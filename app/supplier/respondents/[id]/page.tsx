"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  ShieldAlert,
  Award,
  DollarSign,
  Layers,
  Activity,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  Check,
  X,
  Lock,
  Unlock,
} from "lucide-react";

interface RespondentProfile {
  _id: string;
  respondentId: string;
  externalId?: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  state?: string;
  city?: string;
  gender?: string;
  age?: number;
  dateOfBirth?: string;
  employment?: string;
  industry?: string;
  jobTitle?: string;
  education?: string;
  incomeRange?: string;
  demographics?: Record<string, any>;
  panels: Array<{
    _id: string;
    name: string;
    category?: string;
    country?: string;
    status?: string;
    qualityIndex?: number;
    activeMembers?: number;
  }>;
  status: "Active" | "Inactive" | "Blocked" | "Suspended";
  qualityScore: number;
  fraudRiskScore: number;
  totalSurveys: number;
  completedSurveys: number;
  screenouts: number;
  quotaFull: number;
  qualityRejects: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  lastActiveAt?: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  projectId: string;
  projectTitle: string;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number;
  outcome: string;
  reward: number;
  qualityScore: number;
  fraudRisk: number;
  ip: string;
  device: string;
}

interface PanelOption {
  _id: string;
  name: string;
  category: string;
  country: string;
}

export default function RespondentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [respondent, setRespondent] = useState<RespondentProfile | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [availablePanels, setAvailablePanels] = useState<PanelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "profile" | "participation" | "activity" | "quality" | "earnings" | "panels"
  >("profile");

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPanelToAssign, setSelectedPanelToAssign] = useState("");
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    msg: string;
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchRespondent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/supplier/respondents/${id}`);
      if (!res.ok) {
        throw new Error("Respondent not found or access denied");
      }
      const data = await res.json();
      if (data.success && data.respondent) {
        setRespondent(data.respondent);
        setActivities(data.activities || []);
        setEditFormData(data.respondent);
      } else {
        throw new Error(data.error || "Failed to load respondent");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load respondent");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load available panels for assignment
  useEffect(() => {
    async function loadPanels() {
      try {
        const res = await fetch(`/api/supplier/respondents/${id}/panels`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.availablePanels)) {
            setAvailablePanels(data.availablePanels);
          }
        }
      } catch (err) {
        console.error("Failed to load panels", err);
      }
    }
    loadPanels();
  }, [id]);

  useEffect(() => {
    fetchRespondent();
  }, [fetchRespondent]);

  // Toggle status (Active / Blocked)
  const handleStatusToggle = async (newStatus: "Active" | "Blocked" | "Inactive") => {
    try {
      const res = await fetch(`/api/supplier/respondents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Respondent marked as ${newStatus}`, "success");
        setRespondent((prev) => (prev ? { ...prev, status: newStatus } : null));
      } else {
        showToast(data.error || "Status update failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    }
  };

  // Assign panel
  const handleAssignPanel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPanelToAssign) {
      showToast("Please choose a panel to assign", "error");
      return;
    }
    setSubmittingAssign(true);
    try {
      const res = await fetch(`/api/supplier/respondents/${id}/panels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panelId: selectedPanelToAssign }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Panel assigned successfully", "success");
        setAssignModalOpen(false);
        setSelectedPanelToAssign("");
        fetchRespondent();
      } else {
        showToast(data.error || "Assignment failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Remove panel
  const handleRemovePanel = async (panelId: string, panelName: string) => {
    if (!confirm(`Are you sure you want to remove this respondent from ${panelName}?`)) return;
    try {
      const res = await fetch(`/api/supplier/respondents/${id}/panels/${panelId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Removed from ${panelName}`, "success");
        fetchRespondent();
      } else {
        showToast(data.error || "Failed to remove panel", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    }
  };

  // Save edit form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      const res = await fetch(`/api/supplier/respondents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Respondent profile updated", "success");
        setEditModalOpen(false);
        fetchRespondent();
      } else {
        showToast(data.error || "Update failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <RefreshCw size={26} className="text-indigo-400 animate-spin" />
        <span className="text-xs text-zinc-400">Loading respondent profile...</span>
      </div>
    );
  }

  if (error || !respondent) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-bold text-white">Respondent Not Available</h2>
        <p className="text-xs text-zinc-400">{error || "Could not find respondent record"}</p>
        <Link
          href="/supplier/respondents"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition"
        >
          <ArrowLeft size={13} />
          <span>Return to Respondents</span>
        </Link>
      </div>
    );
  }

  const conversionRate =
    respondent.totalSurveys > 0
      ? Math.round((respondent.completedSurveys / respondent.totalSurveys) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === "success"
              ? "bg-emerald-950 border-emerald-500/30 text-emerald-200"
              : notification.type === "error"
              ? "bg-rose-950 border-rose-500/30 text-rose-200"
              : "bg-zinc-900 border-zinc-700 text-zinc-200"
          }`}
        >
          {notification.type === "success" && <CheckCircle size={15} className="text-emerald-400 shrink-0" />}
          {notification.type === "error" && <XCircle size={15} className="text-rose-400 shrink-0" />}
          {notification.type === "info" && <ShieldCheck size={15} className="text-indigo-400 shrink-0" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Back button */}
      <div>
        <Link
          href="/supplier/respondents"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-medium"
        >
          <ArrowLeft size={13} />
          <span>Back to Respondents</span>
        </Link>
      </div>

      {/* Main Profile Header Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl font-mono shrink-0">
            {respondent.firstName?.[0]}
            {respondent.lastName?.[0]}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {respondent.name || `${respondent.firstName} ${respondent.lastName}`}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                {respondent.respondentId}
              </span>
              {respondent.status === "Active" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                  <CheckCircle size={11} />
                  Active Panelist
                </span>
              ) : respondent.status === "Blocked" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-semibold">
                  <XCircle size={11} />
                  Blocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px]">
                  {respondent.status}
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Mail size={12} className="text-zinc-500" />
                {respondent.email}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-zinc-500" />
                {respondent.country} {respondent.city ? `• ${respondent.city}` : ""}
              </span>
              {respondent.externalId && (
                <span className="font-mono text-[11px] text-zinc-500">
                  Ext ID: {respondent.externalId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            <Edit3 size={13} />
            <span>Edit Profile</span>
          </button>
          {respondent.status === "Active" ? (
            <button
              onClick={() => handleStatusToggle("Blocked")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              <Lock size={13} />
              <span>Block Respondent</span>
            </button>
          ) : (
            <button
              onClick={() => handleStatusToggle("Active")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
            >
              <Unlock size={13} />
              <span>Activate Panelist</span>
            </button>
          )}
          <button
            onClick={() => setAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
          >
            <Layers size={13} />
            <span>+ Assign Panel</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto text-xs pb-1">
        {[
          { key: "profile", label: "Profile & Demographics", icon: Users },
          { key: "participation", label: "Participation Metrics", icon: Award },
          { key: "activity", label: "Recent Survey Activity", icon: Activity },
          { key: "quality", label: "Quality & Fraud Sentinel", icon: ShieldCheck },
          { key: "earnings", label: "Rewards & Earnings", icon: DollarSign },
          { key: "panels", label: `Panel Enrolments (${respondent.panels?.length || 0})`, icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl font-medium whitespace-nowrap transition border-b-2 ${
                isActive
                  ? "border-indigo-500 text-white bg-zinc-900/60"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
              }`}
            >
              <Icon size={14} className={isActive ? "text-indigo-400" : "text-zinc-500"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PROFILE */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users size={15} className="text-indigo-400" />
              <span>Identity & Personal Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">First Name</span>
                <span className="font-semibold text-white">{respondent.firstName}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Last Name</span>
                <span className="font-semibold text-white">{respondent.lastName}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Email Address</span>
                <span className="font-semibold text-white truncate block">{respondent.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Phone</span>
                <span className="font-semibold text-white">{respondent.phone || "Not provided"}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Gender</span>
                <span className="font-semibold text-white">{respondent.gender || "Unspecified"}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Age / DOB</span>
                <span className="font-semibold text-white">
                  {respondent.age ? `${respondent.age} years` : "Age N/A"}{" "}
                  {respondent.dateOfBirth && `(${respondent.dateOfBirth})`}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Enrolled Since</span>
                <span className="font-semibold text-white">
                  {new Date(respondent.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Last Active</span>
                <span className="font-semibold text-white">
                  {respondent.lastActiveAt
                    ? new Date(respondent.lastActiveAt).toLocaleDateString()
                    : "Recently"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase size={15} className="text-indigo-400" />
              <span>Demographics & Socioeconomic Profile</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Employment Status</span>
                <span className="font-semibold text-white">
                  {respondent.employment || "Employed Full-Time"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Industry</span>
                <span className="font-semibold text-white">{respondent.industry || "General Industry"}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Job Title</span>
                <span className="font-semibold text-white">{respondent.jobTitle || "Professional"}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Education Level</span>
                <span className="font-semibold text-white">{respondent.education || "Bachelor's Degree"}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Household Income</span>
                <span className="font-semibold text-white">{respondent.incomeRange || "$50k - $75k"}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px]">Location</span>
                <span className="font-semibold text-white">
                  {respondent.city ? `${respondent.city}, ` : ""}
                  {respondent.state ? `${respondent.state}, ` : ""}
                  {respondent.country}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PARTICIPATION */}
      {activeTab === "participation" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Total Dispatched</span>
              <span className="text-xl font-bold font-mono text-white">
                {respondent.totalSurveys}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Completed</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {respondent.completedSurveys}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Screenouts</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {respondent.screenouts}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Quota Full</span>
              <span className="text-xl font-bold font-mono text-blue-400">
                {respondent.quotaFull}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Quality Rejections</span>
              <span className="text-xl font-bold font-mono text-rose-400">
                {respondent.qualityRejects}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Conversion Rate</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {conversionRate}%
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Quality Score</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {respondent.qualityScore?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACTIVITY */}
      {activeTab === "activity" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 font-bold text-white text-xs flex items-center justify-between">
            <span>Live Survey Attempt History ({activities.length})</span>
            <span className="text-zinc-500 text-[10px] font-normal">
              Recorded by Cint-Compatible Sentinel
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              No recent survey attempts recorded for this panelist yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4">Project</th>
                    <th className="py-2.5 px-4">Survey Details</th>
                    <th className="py-2.5 px-4">Started At</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Outcome</th>
                    <th className="py-2.5 px-4">Reward</th>
                    <th className="py-2.5 px-4">Quality Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4 font-semibold text-white">{act.projectId}</td>
                      <td className="py-3 px-4 font-sans text-zinc-200">{act.projectTitle}</td>
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(act.startedAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {act.durationMinutes > 0 ? `${act.durationMinutes} mins` : "< 1 min"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-sans ${
                            act.outcome === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : act.outcome === "screened_out"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : act.outcome === "quota_full"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {act.outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">
                        ${act.reward.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-cyan-400 font-bold">
                        {act.qualityScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: QUALITY */}
      {activeTab === "quality" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Sentinel Quality & Reliability Score</span>
            </h3>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 block">Overall Quality Score</span>
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {respondent.qualityScore?.toFixed(1)}%
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">Tier: High Confidence Panelist</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                ✓
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">Fraud Risk Index</span>
                <span className="font-mono font-bold text-emerald-400">
                  {respondent.fraudRiskScore?.toFixed(1)}% (Low Risk)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">Duplicate Account Risk</span>
                <span className="font-mono font-bold text-emerald-400">0.0% (Clean)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">Speeding Flags</span>
                <span className="font-mono font-bold text-zinc-300">0 infractions</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">Attention Check Pass Rate</span>
                <span className="font-mono font-bold text-emerald-400">100%</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert size={16} className="text-indigo-400" />
              <span>IP & Telemetry Environment</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 block text-[10px]">Primary IP Risk Category</span>
                <span className="font-bold text-emerald-400">Residential ISP • Verified Non-Proxy</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 block text-[10px]">Device Consistency</span>
                <span className="font-bold text-zinc-200">Consistent OS & Browser Fingerprint</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 block text-[10px]">Geo-location Alignment</span>
                <span className="font-bold text-zinc-200">
                  IP coordinates match {respondent.country} profile registration
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EARNINGS */}
      {activeTab === "earnings" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-2">
            <span className="text-xs text-zinc-400">Total Lifetime Earned</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${respondent.totalEarnings?.toFixed(2) || "0.00"}
            </div>
            <span className="text-[10px] text-zinc-500">Gross completed survey incentives</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-2">
            <span className="text-xs text-zinc-400">Pending Approval</span>
            <div className="text-2xl font-bold font-mono text-amber-400">
              ${respondent.pendingEarnings?.toFixed(2) || "0.00"}
            </div>
            <span className="text-[10px] text-zinc-500">Awaiting client reconciliation</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-2">
            <span className="text-xs text-zinc-400">Paid Out</span>
            <div className="text-2xl font-bold font-mono text-indigo-400">
              ${respondent.paidEarnings?.toFixed(2) || "0.00"}
            </div>
            <span className="text-[10px] text-zinc-500">Disbursed rewards & gift cards</span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PANELS */}
      {activeTab === "panels" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-indigo-400" />
              <span>Enrolled Panels for this Panelist</span>
            </h3>
            <button
              onClick={() => setAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              <Plus size={13} />
              <span>Assign Panel</span>
            </button>
          </div>

          {respondent.panels?.length === 0 ? (
            <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-center text-xs text-zinc-400 space-y-3">
              <p>This respondent is not currently assigned to any specific sub-panel.</p>
              <button
                onClick={() => setAssignModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Plus size={13} />
                <span>Assign to Panel</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {respondent.panels.map((p) => (
                <div
                  key={p._id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                        {p.category || "General"}
                      </span>
                      <button
                        onClick={() => handleRemovePanel(p._id, p.name)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                        title="Remove from panel"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-white">{p.name}</h4>
                    <span className="text-[11px] text-zinc-400 block">{p.country || "US"}</span>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Quality: {p.qualityIndex || 95}/100</span>
                    <Link
                      href={`/supplier/panels/${p._id}`}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-0.5"
                    >
                      <span>View Panel</span>
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ASSIGN PANEL */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-indigo-400" />
                <span>Assign to Panel</span>
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignPanel} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Select Panel</label>
                <select
                  value={selectedPanelToAssign}
                  onChange={(e) => setSelectedPanelToAssign(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose a Panel --</option>
                  {availablePanels.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign || !selectedPanelToAssign}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  {submittingAssign ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{submittingAssign ? "Assigning..." : "Confirm Enrollment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFILE */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 size={16} className="text-indigo-400" />
                <span>Edit Respondent Profile</span>
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editFormData.firstName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editFormData.lastName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">External ID</label>
                  <input
                    type="text"
                    value={editFormData.externalId || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, externalId: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={editFormData.state || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Employment</label>
                  <input
                    type="text"
                    value={editFormData.employment || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, employment: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Industry</label>
                  <input
                    type="text"
                    value={editFormData.industry || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingEdit ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{submittingEdit ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
