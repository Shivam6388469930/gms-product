"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  FolderKanban,
  Play,
  Pause,
  Search,
  RefreshCw,
  Users,
  Trash2,
} from "lucide-react";

interface ProjectItem {
  _id: string;
  projectId?: string;
  surveyTitle: string;
  country: string;
  audienceType: string;
  sampleSize: number;
  loi: number;
  ir: number;
  status: "draft" | "live" | "paused" | "stopped";
  softLaunch?: {
    enabled: boolean;
    threshold: number;
    autopaused: boolean;
  };
  progress?: {
    starts: number;
    completes: number;
    screenouts: number;
    quotaFull: number;
    spend: number;
  };
  owner?: {
    name: string;
    email: string;
  };
  supplierAllocations?: {
    id: string;
    name: string;
    email: string;
    supplierCode: string;
    status: string;
  }[];
  createdAt: string;
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    paused: 0,
    draft: 0,
    stopped: 0,
    totalSpend: 0,
    totalCompletes: 0,
    totalTarget: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [removingSupplierId, setRemovingSupplierId] = useState<string | null>(null);
  const [supplierError, setSupplierError] = useState("");

  const fetchProjects = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (audienceFilter) params.set("audienceType", audienceFilter);

    const response = await fetch(`/api/admin/projects?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || "Failed to fetch projects");
    }
    return data;
  }, [search, statusFilter, audienceFilter]);

  useEffect(() => {
    let active = true;
    fetchProjects()
      .then((data) => {
        if (!active) return;
        setProjects(data.projects || []);
        if (data.stats) setStats(data.stats);
      })
      .catch((error) => {
        console.error("Error fetching projects:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchProjects]);

  const refreshProjects = async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data.projects || []);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setSupplierError(
        error instanceof Error ? error.message : "Failed to fetch projects"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await refreshProjects();
    } catch (err) {
      console.error("Error updating project status:", err);
    }
  };

  const handleRemoveSupplier = async (
    projectId: string,
    supplier: NonNullable<ProjectItem["supplierAllocations"]>[number]
  ) => {
    if (!window.confirm(`Remove ${supplier.name} from this project?`)) return;

    setRemovingSupplierId(supplier.id);
    setSupplierError("");
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "removeSupplier",
          supplierId: supplier.id,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to remove supplier");
      }
      await refreshProjects();
    } catch (error) {
      console.error("Failed to remove supplier from project:", error);
      setSupplierError(
        error instanceof Error ? error.message : "Failed to remove supplier"
      );
    } finally {
      setRemovingSupplierId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      live: { bg: "rgba(16,185,129,0.12)", color: "#34d399", border: "rgba(16,185,129,0.3)" },
      paused: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
      draft: { bg: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "rgba(99,102,241,0.3)" },
      stopped: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.3)" },
    };
    const c = map[status] || map.draft;
    return (
      <span
        style={{
          padding: "3px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          background: c.bg,
          color: c.color,
          border: `1px solid ${c.border}`,
          textTransform: "uppercase",
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <FolderKanban size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Research Projects Operations
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Oversee all client fieldwork studies, quota fulfillment, spend burn rate, and soft launches
          </p>
        </div>
        <button
          onClick={refreshProjects}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {supplierError && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: 8,
            padding: "10px 12px",
            color: "#fca5a5",
            fontSize: 12,
          }}
        >
          {supplierError}
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Total Projects", val: stats.total, color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
          { label: "Live Fieldwork", val: stats.live, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
          { label: "Total Target N", val: stats.totalTarget.toLocaleString(), color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
          { label: "Total Completes", val: stats.totalCompletes.toLocaleString(), color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
          { label: "Total Spend (USD)", val: `$${(stats.totalSpend || 0).toLocaleString()}`, color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "6px 12px",
            flex: "1 1 280px",
            maxWidth: 420,
          }}
        >
          <Search size={14} color="rgba(255,255,255,0.4)" />
          <input
            type="text"
            placeholder="Search project title or market country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && refreshProjects()}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 13,
              width: "100%",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "6px 10px",
              color: "#fff",
              fontSize: 12,
            }}
          >
            <option value="" style={{ background: "#111" }}>All Audiences</option>
            <option value="consumer" style={{ background: "#111" }}>Consumer</option>
            <option value="b2b" style={{ background: "#111" }}>B2B</option>
            <option value="healthcare" style={{ background: "#111" }}>Healthcare</option>
          </select>

          {["", "live", "paused", "draft", "stopped"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                background: statusFilter === s ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.03)",
                border: statusFilter === s ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
                color: statusFilter === s ? "#a5b4fc" : "rgba(255,255,255,0.65)",
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Project Title</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Client</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Audience / Geo</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Fieldwork Progress</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Soft Launch</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Spend</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                    Loading research projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const completes = proj.progress?.completes || 0;
                  const target = proj.sampleSize || 100;
                  const pct = Math.min(100, Math.round((completes / target) * 100));

                  return (
                    <React.Fragment key={proj._id}>
                    <tr
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{proj.surveyTitle}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "monospace" }}>
                          PID: {proj.projectId || proj._id.slice(0, 10)}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
                          {proj.owner?.name || "Direct Client"}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                          {proj.owner?.email}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "#fff", fontSize: 12 }}>{proj.country}</div>
                        <span style={{ fontSize: 11, color: "#818cf8", textTransform: "capitalize" }}>
                          {proj.audienceType}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>{getStatusBadge(proj.status)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, width: 60 }}>
                            {completes} / {target}
                          </div>
                          <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #10b981)", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{pct}%</span>
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                          Starts: {proj.progress?.starts || 0} • Term: {proj.progress?.screenouts || 0} • Quota: {proj.progress?.quotaFull || 0}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {proj.softLaunch?.enabled ? (
                          <span
                            style={{
                              padding: "2px 7px",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              background: proj.softLaunch.autopaused ? "rgba(239,68,68,0.12)" : "rgba(99,102,241,0.12)",
                              color: proj.softLaunch.autopaused ? "#f87171" : "#a5b4fc",
                            }}
                          >
                            {proj.softLaunch.autopaused ? "Autopaused" : `Limit: ${proj.softLaunch.threshold}`}
                          </span>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Off</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#34d399", fontSize: 12, fontWeight: 600 }}>
                        ${(proj.progress?.spend || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          {proj.status === "live" ? (
                            <button
                              onClick={() => handleStatusChange(proj._id, "paused")}
                              title="Pause"
                              style={{
                                background: "rgba(245,158,11,0.15)",
                                border: "1px solid rgba(245,158,11,0.3)",
                                color: "#fbbf24",
                                padding: "4px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                              }}
                            >
                              <Pause size={12} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(proj._id, "live")}
                              title="Launch"
                              style={{
                                background: "rgba(16,185,129,0.15)",
                                border: "1px solid rgba(16,185,129,0.3)",
                                color: "#34d399",
                                padding: "4px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                              }}
                            >
                              <Play size={12} />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setExpandedProjectId((current) =>
                                current === proj._id ? null : proj._id
                              )
                            }
                            title="Manage suppliers"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "rgba(99,102,241,0.12)",
                              border: "1px solid rgba(99,102,241,0.3)",
                              color: "#a5b4fc",
                              padding: "4px 8px",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 11,
                            }}
                          >
                            <Users size={12} />
                            {proj.supplierAllocations?.length || 0}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedProjectId === proj._id && (
                      <tr>
                        <td
                          colSpan={8}
                          style={{
                            padding: "12px 16px",
                            background: "rgba(255,255,255,0.025)",
                          }}
                        >
                          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 8 }}>
                            Eligible suppliers and current project assignments
                          </div>
                          {proj.supplierAllocations?.length ? (
                            <div style={{ display: "grid", gap: 8 }}>
                              {proj.supplierAllocations.map((supplier) => (
                                <div
                                  key={supplier.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                  }}
                                >
                                  <div>
                                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                                      {supplier.name} <span style={{ color: "#818cf8" }}>({supplier.supplierCode})</span>
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                                      {supplier.email} · {supplier.status}
                                    </div>
                                  </div>
                                  {supplier.status === "removed" ? (
                                    <span style={{ color: "#fca5a5", fontSize: 11 }}>Removed</span>
                                  ) : (
                                    <button
                                      onClick={() => handleRemoveSupplier(proj._id, supplier)}
                                      disabled={removingSupplierId === supplier.id}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        background: "rgba(239,68,68,0.12)",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                        color: "#fca5a5",
                                        padding: "5px 8px",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        fontSize: 11,
                                        opacity: removingSupplierId === supplier.id ? 0.6 : 1,
                                      }}
                                    >
                                      <Trash2 size={12} />
                                      {removingSupplierId === supplier.id ? "Removing..." : "Remove"}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                              No suppliers are assigned yet.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
