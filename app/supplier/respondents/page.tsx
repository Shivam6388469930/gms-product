


"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  Mail,
  UserCheck,
  Calendar,
  X,
  FileSpreadsheet,
  Check,
  SlidersHorizontal,
  Copy,
  KeyRound,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";

interface PanelOption {
  id: string;
  name: string;
  category: string;
  country: string;
}

interface RespondentRecord {
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
  panels?: Array<{ _id: string; name: string; category?: string }>;
  status: "Active" | "Inactive" | "Blocked" | "Suspended";
  qualityScore: number;
  fraudRiskScore: number;
  totalSurveys: number;
  completedSurveys: number;
  lastActiveAt?: string;
  createdAt: string;
}

interface StatsData {
  totalRespondents: number;
  activeRespondents: number;
  inactiveRespondents: number;
  blockedRespondents: number;
  completedSurveys: number;
  avgQualityScore: number;
}

interface CreatedCredentials {
  respondentId: string;
  email: string;
  password: string;
  mustChangePassword: boolean;
}

export default function SupplierRespondentsPage() {
  const { supplierCode, supplierName } = useSupplier();

  // Data states
  const [respondents, setRespondents] = useState<RespondentRecord[]>([]);
  const [panels, setPanels] = useState<PanelOption[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalRespondents: 0,
    activeRespondents: 0,
    inactiveRespondents: 0,
    blockedRespondents: 0,
    completedSurveys: 0,
    avgQualityScore: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [panelFilter, setPanelFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    msg: string;
  } | null>(null);

  // Add Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    externalId: "",
    country: "US",
    state: "",
    city: "",
    gender: "Unspecified",
    age: "",
    dateOfBirth: "",
    employment: "Employed Full-Time",
    industry: "Technology",
    jobTitle: "",
    education: "Bachelor's Degree",
    incomeRange: "$50k-$75k",
    panelId: "",
    status: "Active",
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Import CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importValidation, setImportValidation] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    rowsToInsert: any[];
    invalidRows: any[];
    duplicateRows: any[];
  } | null>(null);

  // Toast helper
  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4500);
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Load available panels for dropdowns
  useEffect(() => {
    async function loadPanels() {
      try {
        const res = await fetch("/api/supplier/panels");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.panels)) {
            setPanels(
              data.panels.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                country: p.country,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load panels", err);
      }
    }
    loadPanels();
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/supplier/respondents/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, []);

  // Fetch respondents list
  const fetchRespondents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (panelFilter !== "all") params.set("panelId", panelFilter);
      if (countryFilter !== "all") params.set("country", countryFilter);
      if (genderFilter !== "all") params.set("gender", genderFilter);
      if (ageGroupFilter !== "all") params.set("ageGroup", ageGroupFilter);
      if (qualityFilter !== "all") {
        if (qualityFilter === "90plus") params.set("minQuality", "90");
        else if (qualityFilter === "80plus") params.set("minQuality", "80");
        else if (qualityFilter === "70plus") params.set("minQuality", "70");
      }

      const res = await fetch(`/api/supplier/respondents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRespondents(data.respondents || []);
          setTotalCount(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      console.error("Failed to fetch respondents", err);
      showToast("Could not load respondents", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, statusFilter, panelFilter, countryFilter, genderFilter, ageGroupFilter, qualityFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchRespondents();
  }, [fetchRespondents]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchRespondents();
  };

  // Add Respondent Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      showToast("First name, last name, and email are required", "error");
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await fetch("/api/supplier/respondents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        // Backend automatically creates the respondent User account.
        // Expected response:
        // credentials: { respondentId, email, password, mustChangePassword }
        if (data.credentials) {
          setCreatedCredentials({
            respondentId: data.credentials.respondentId || data.respondent?.respondentId || "",
            email: data.credentials.email || formData.email.trim().toLowerCase(),
            password: data.credentials.password || formData.email.trim().toLowerCase(),
            mustChangePassword: data.credentials.mustChangePassword !== false,
          });
        }

        showToast(
          data.message || "Respondent and login account created successfully",
          "success"
        );
        setAddModalOpen(false);
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          externalId: "",
          country: "US",
          state: "",
          city: "",
          gender: "Unspecified",
          age: "",
          dateOfBirth: "",
          employment: "Employed Full-Time",
          industry: "Technology",
          jobTitle: "",
          education: "Bachelor's Degree",
          incomeRange: "$50k-$75k",
          panelId: "",
          status: "Active",
        });
        fetchStats();
        fetchRespondents();
      } else {
        showToast(data.error || "Failed to create respondent", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Parse and validate CSV locally before sending to dryRun/execute
  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const text = await file.text();
    const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      showToast("CSV must contain a header row and at least one data row", "error");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || "";
      });
      rows.push(rowObj);
    }

    // Call dry run validation API
    try {
      const res = await fetch("/api/supplier/respondents/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, dryRun: true }),
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setImportValidation({
          totalRows: data.summary.totalRows,
          validCount: data.summary.validCount,
          invalidCount: data.summary.invalidCount,
          duplicateCount: data.summary.duplicateCount,
          rowsToInsert: rows,
          invalidRows: data.invalidRows || [],
          duplicateRows: data.duplicateRows || [],
        });
      }
    } catch (err) {
      console.error("Dry run validation failed", err);
    }
  };

  const handleConfirmImport = async () => {
    if (!importValidation || importValidation.rowsToInsert.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/supplier/respondents/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: importValidation.rowsToInsert, dryRun: false }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Successfully imported ${data.summary?.importedCount} respondents`, "success");
        setImportModalOpen(false);
        setCsvFile(null);
        setImportValidation(null);
        fetchStats();
        fetchRespondents();
      } else {
        showToast(data.error || "Import failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to process import", "error");
    } finally {
      setImporting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (respondents.length === 0) {
      showToast("No respondents to export", "info");
      return;
    }

    const headers = [
      "Respondent ID",
      "External ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Country",
      "State",
      "City",
      "Gender",
      "Age",
      "Employment",
      "Industry",
      "Panel",
      "Status",
      "Quality Score",
      "Total Surveys",
      "Completed Surveys",
      "Created At",
    ];

    const rows = respondents.map((r) => [
      r.respondentId,
      r.externalId || "",
      r.firstName,
      r.lastName,
      r.email,
      r.phone || "",
      r.country,
      r.state || "",
      r.city || "",
      r.gender || "",
      r.age || "",
      r.employment || "",
      r.industry || "",
      r.panels?.[0]?.name || "Unassigned",
      r.status,
      r.qualityScore,
      r.totalSurveys,
      r.completedSurveys,
      new Date(r.createdAt).toISOString().split("T")[0],
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `respondents_${supplierCode || "panel"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported CSV successfully", "success");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
            <CheckCircle size={11} />
            Active
          </span>
        );
      case "Inactive":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-medium">
            Inactive
          </span>
        );
      case "Blocked":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-semibold">
            <XCircle size={11} />
            Blocked
          </span>
        );
      case "Suspended":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
            <AlertTriangle size={11} />
            Suspended
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[11px]">
            {status}
          </span>
        );
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-cyan-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
            <Users size={13} />
            <span>Panelist Management & Supply Network</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Respondents
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your panelists, respondent profiles, participation and quality.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition"
            title="Refresh list"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={respondents.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition disabled:opacity-40"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setImportModalOpen(true);
              setCsvFile(null);
              setImportValidation(null);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition"
          >
            <Upload size={13} />
            <span>Import Respondents</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus size={14} />
            <span>Add Respondent</span>
          </button>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Total Respondents
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white">
            {stats.totalRespondents.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-1">Enrolled Panelists</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Active
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {stats.activeRespondents.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-500/80 block mt-1">Ready for Surveys</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Inactive
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-400">
            {stats.inactiveRespondents.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-1">Paused / Dormant</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Blocked
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            {stats.blockedRespondents.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-500/80 block mt-1">Sentinel Blocked</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Completes
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-indigo-400">
            {stats.completedSurveys.toLocaleString()}
          </span>
          <span className="text-[10px] text-indigo-500/80 block mt-1">Finished Sessions</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Avg Quality
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">
            {stats.avgQualityScore > 0 ? `${stats.avgQualityScore}%` : "96.4%"}
          </span>
          <span className="text-[10px] text-cyan-500/80 block mt-1">Confidence Score</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search by Respondent ID, Name, Email, Panel or External ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick status selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {["all", "Active", "Inactive", "Blocked", "Suspended"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                    : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {st === "all" ? "All Status" : st}
              </button>
            ))}

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition whitespace-nowrap ${
                showAdvancedFilters || panelFilter !== "all" || countryFilter !== "all" || genderFilter !== "all" || ageGroupFilter !== "all" || qualityFilter !== "all"
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                  : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
              title="Toggle filters"
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-zinc-800/60 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Panel</label>
              <select
                value={panelFilter}
                onChange={(e) => {
                  setPanelFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Panels</option>
                {panels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Country</label>
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Countries</option>
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="IN">India (IN)</option>
                <option value="CA">Canada (CA)</option>
                <option value="AU">Australia (AU)</option>
                <option value="DE">Germany (DE)</option>
                <option value="FR">France (FR)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Age Group</label>
              <select
                value={ageGroupFilter}
                onChange={(e) => {
                  setAgeGroupFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Ages</option>
                <option value="under25">&lt; 25</option>
                <option value="25-34">25 - 34</option>
                <option value="35-49">35 - 49</option>
                <option value="50plus">50+</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Quality Score</label>
              <select
                value={qualityFilter}
                onChange={(e) => {
                  setQualityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Quality Levels</option>
                <option value="90plus">90%+ (Premium)</option>
                <option value="80plus">80%+ (Standard)</option>
                <option value="70plus">70%+ (Acceptable)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Respondent Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="text-indigo-400 animate-spin" />
            <span className="text-xs text-zinc-400">Loading respondent directory...</span>
          </div>
        ) : respondents.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center mx-auto text-zinc-400 shadow-lg">
              <Users size={26} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No respondents yet</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Add respondents to your panel to start sending survey opportunities.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
              >
                <Plus size={13} />
                <span>+ Add Respondent</span>
              </button>
              <button
                onClick={() => {
                  setImportModalOpen(true);
                  setCsvFile(null);
                  setImportValidation(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
              >
                <Upload size={13} />
                <span>Import Respondents</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Respondent</th>
                  <th className="py-3 px-4">Respondent ID</th>
                  <th className="py-3 px-4">Panel</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Profile</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4">Survey Activity</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {respondents.map((r) => {
                  const panelObj = r.panels?.[0];
                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-zinc-800/30 transition group"
                    >
                      {/* Respondent Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white group-hover:text-indigo-300 transition">
                          {r.name || `${r.firstName} ${r.lastName}`}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Mail size={10} className="text-zinc-500" />
                          <span>{r.email}</span>
                        </div>
                      </td>

                      {/* Respondent ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-zinc-200 font-semibold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px]">
                          {r.respondentId}
                        </span>
                        {r.externalId && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            EXT: {r.externalId}
                          </div>
                        )}
                      </td>

                      {/* Panel */}
                      <td className="py-3.5 px-4">
                        {panelObj ? (
                          <div>
                            <div className="font-medium text-zinc-200 truncate max-w-[150px]">
                              {panelObj.name}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {panelObj.category || "Consumer"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Country */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <MapPin size={12} className="text-zinc-500" />
                          <span>{r.country}</span>
                          {r.city && <span className="text-zinc-500">({r.city})</span>}
                        </div>
                      </td>

                      {/* Profile Demographics */}
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-300">
                          {r.gender || "Unspecified"} • {r.age ? `${r.age} yrs` : "Age N/A"}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                          {r.employment || r.industry || "General"}
                        </div>
                      </td>

                      {/* Quality Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold">
                          <ShieldCheck size={13} className={getQualityColor(r.qualityScore)} />
                          <span className={getQualityColor(r.qualityScore)}>
                            {r.qualityScore?.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Survey Activity */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-zinc-200 font-medium">
                          {r.completedSurveys}{" "}
                          <span className="text-zinc-500 text-[10px]">
                            / {r.totalSurveys} total
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          {r.totalSurveys > 0
                            ? `${Math.round((r.completedSurveys / r.totalSurveys) * 100)}% comp.`
                            : "No starts"}
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                        {r.lastActiveAt
                          ? new Date(r.lastActiveAt).toISOString().split("T")[0]
                          : "Recently"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/supplier/respondents/${r._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalCount > 0 && (
          <div className="px-4 py-3 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Showing <strong className="text-white">{respondents.length}</strong> of{" "}
              <strong className="text-white">{totalCount}</strong> respondents
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-mono text-zinc-300">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
                title="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD RESPONDENT */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add New Respondent</h3>
                  <p className="text-[11px] text-zinc-400">Enroll panelist into {supplierName}</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="john.smith@domain.com"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">External ID</label>
                  <input
                    type="text"
                    value={formData.externalId}
                    onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="EXT-9921"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="IN">India (IN)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="AU">Australia (AU)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="FR">France (FR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Unspecified">Unspecified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="California"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="San Francisco"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Age</label>
                  <input
                    type="number"
                    min="13"
                    max="110"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="34"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Employment</label>
                  <select
                    value={formData.employment}
                    onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Employed Full-Time">Employed Full-Time</option>
                    <option value="Employed Part-Time">Employed Part-Time</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired</option>
                    <option value="Unemployed">Unemployed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Technology">Technology & Software</option>
                    <option value="Healthcare">Healthcare & Life Sciences</option>
                    <option value="Finance">Financial Services</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail & Consumer Goods</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Assign to Panel</label>
                  <select
                    value={formData.panelId}
                    onChange={(e) => setFormData({ ...formData, panelId: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">No panel (General Pool)</option>
                    {panels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingAdd ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{submittingAdd ? "Saving..." : "Create Respondent"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESPONDENT LOGIN CREDENTIALS */}
      {createdCredentials && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-indigo-500/30 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Respondent Account Created
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  A login account was automatically created for this respondent.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Respondent ID
                </div>
                <div className="font-mono text-sm font-semibold text-white">
                  {createdCredentials.respondentId || "—"}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                      Login Email
                    </div>
                    <div className="text-sm font-medium text-white break-all">
                      {createdCredentials.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.email);
                      showToast("Email copied", "success");
                    }}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                    title="Copy email"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                      Initial Password
                    </div>
                    <div className="font-mono text-sm font-semibold text-amber-300 break-all">
                      {createdCredentials.password}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.password);
                      showToast("Password copied", "success");
                    }}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                    title="Copy password"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              {createdCredentials.mustChangePassword && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-300">
                  The respondent must change this initial password after the first login.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  const credentialsText =
                    `Respondent ID: ${createdCredentials.respondentId}\n` +
                    `Email: ${createdCredentials.email}\n` +
                    `Password: ${createdCredentials.password}`;
                  navigator.clipboard.writeText(credentialsText);
                  showToast("Login credentials copied", "success");
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold"
              >
                Copy All
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT RESPONDENTS CSV */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileSpreadsheet size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Import Panel Respondents</h3>
                  <p className="text-[11px] text-zinc-400">Upload CSV file for batch enrollment</p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-zinc-400">
                <div className="font-semibold text-zinc-200">Required CSV Columns:</div>
                <code className="text-[10px] text-indigo-300 font-mono block">
                  externalId, firstName, lastName, email, country, gender, age, panel
                </code>
                <p className="text-[10px]">
                  All imported panelists will automatically be bound to your supplier ID.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center cursor-pointer transition bg-zinc-900/30">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                  <Upload size={24} className="mx-auto text-indigo-400" />
                  <div className="text-zinc-200 font-medium">
                    {csvFile ? csvFile.name : "Choose CSV file to upload"}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Supports RFC 4180 CSV with UTF-8 encoding
                  </div>
                </label>
              </div>

              {/* Validation Summary */}
              {importValidation && (
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div className="font-semibold text-white text-xs">File Pre-Validation Results:</div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Total</span>
                      <span className="font-bold text-white font-mono">{importValidation.totalRows}</span>
                    </div>
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 block">Valid</span>
                      <span className="font-bold text-emerald-400 font-mono">{importValidation.validCount}</span>
                    </div>
                    <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30">
                      <span className="text-[10px] text-rose-400 block">Invalid</span>
                      <span className="font-bold text-rose-400 font-mono">{importValidation.invalidCount}</span>
                    </div>
                    <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30">
                      <span className="text-[10px] text-amber-400 block">Duplicates</span>
                      <span className="font-bold text-amber-400 font-mono">{importValidation.duplicateCount}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!importValidation || importValidation.validCount === 0 || importing}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  {importing ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>
                    {importing
                      ? "Importing..."
                      : `Import ${importValidation?.validCount || 0} Respondents`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
