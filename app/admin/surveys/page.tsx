"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Play,
  Pause,
  StopCircle,
  ExternalLink,
  Edit,
  Search,
  CheckCircle,
  Clock,
  BarChart,
  RefreshCw,
  Globe,
  Sliders,
} from "lucide-react";

interface SurveyItem {
  _id: string;
  surveyTitle: string;
  country: string;
  audienceType: string;
  sampleSize: number;
  loi: number;
  ir: number;
  status: "draft" | "live" | "paused" | "stopped";
  surveySetup?: {
    surveyUrl: string;
    surveyType: string;
    redirectUrl?: string;
    terminationUrl?: string;
    qualificationUrl?: string;
    status?: string;
  };
  progress?: {
    starts: number;
    completes: number;
    screenouts: number;
    quotaFull: number;
  };
  owner?: {
    name: string;
    email: string;
  };
}

export default function SurveysAdminPage() {
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [stats, setStats] = useState({ total: 0, live: 0, paused: 0, draft: 0, stopped: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingSurvey, setEditingSurvey] = useState<SurveyItem | null>(null);
  const [editForm, setEditForm] = useState({
    surveyUrl: "",
    redirectUrl: "",
    terminationUrl: "",
    loi: 10,
    ir: 50,
    status: "draft",
  });

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/surveys?${params.toString()}`);
      const data = await res.json();
      setSurveys(data.surveys || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error fetching surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/surveys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchSurveys();
    } catch (err) {
      console.error("Error updating survey status:", err);
    }
  };

  const openEditModal = (survey: SurveyItem) => {
    setEditingSurvey(survey);
    setEditForm({
      surveyUrl: survey.surveySetup?.surveyUrl || "",
      redirectUrl: survey.surveySetup?.redirectUrl || "",
      terminationUrl: survey.surveySetup?.terminationUrl || "",
      loi: survey.loi || 10,
      ir: survey.ir || 50,
      status: survey.status || "draft",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSurvey) return;
    try {
      const res = await fetch(`/api/admin/surveys/${editingSurvey._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editForm.status,
          loi: editForm.loi,
          ir: editForm.ir,
          surveySetup: {
            surveyUrl: editForm.surveyUrl,
            redirectUrl: editForm.redirectUrl,
            terminationUrl: editForm.terminationUrl,
            status: editForm.surveyUrl ? "ready" : "not_configured",
          },
        }),
      });
      if (res.ok) {
        setEditingSurvey(null);
        fetchSurveys();
      }
    } catch (err) {
      console.error("Save edit failed:", err);
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
            <ClipboardList size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Surveys Catalogue & Endpoints
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Configure client survey links, qualification and termination redirect loops, LOI, and live status
          </p>
        </div>
        <button
          onClick={fetchSurveys}
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
          { label: "Total Surveys", val: stats.total, color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
          { label: "Live Surveys", val: stats.live, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
          { label: "Paused Surveys", val: stats.paused, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
          { label: "Draft Surveys", val: stats.draft, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
          { label: "Stopped", val: stats.stopped, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
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
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search survey title or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchSurveys()}
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
              {s || "All Surveys"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Survey Title</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Target / Country</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Completes / Target</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>LOI / IR</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Survey Endpoint</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                    Loading surveys catalogue...
                  </td>
                </tr>
              ) : surveys.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No surveys found.
                  </td>
                </tr>
              ) : (
                surveys.map((survey) => {
                  const completes = survey.progress?.completes || 0;
                  const target = survey.sampleSize || 100;
                  const pct = Math.min(100, Math.round((completes / target) * 100));

                  return (
                    <tr
                      key={survey._id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{survey.surveyTitle}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                          Client: {survey.owner?.name || "Direct Client"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "#fff", fontSize: 12 }}>{survey.country}</div>
                        <span style={{ fontSize: 11, color: "#818cf8", textTransform: "capitalize" }}>
                          {survey.audienceType}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>{getStatusBadge(survey.status)}</td>
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
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                          {survey.loi || 10} min | IR: {survey.ir || 50}%
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {survey.surveySetup?.surveyUrl ? (
                          <a
                            href={survey.surveySetup.surveyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#60a5fa",
                              fontSize: 12,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              textDecoration: "none",
                              maxWidth: 180,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <ExternalLink size={12} /> Test Link
                          </a>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontStyle: "italic" }}>
                            Not configured
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          {survey.status === "live" ? (
                            <button
                              onClick={() => handleStatusChange(survey._id, "paused")}
                              title="Pause Survey"
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
                              onClick={() => handleStatusChange(survey._id, "live")}
                              title="Launch Survey"
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
                            onClick={() => openEditModal(survey)}
                            title="Edit Survey Setup"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#fff",
                              padding: "4px 8px",
                              borderRadius: 6,
                              cursor: "pointer",
                            }}
                          >
                            <Edit size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Survey Modal */}
      {editingSurvey && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#131322",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 580,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 18 }}>Edit Survey Configuration</h3>
              <button
                onClick={() => setEditingSurvey(null)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  External Client Survey URL
                </label>
                <input
                  type="text"
                  placeholder="https://client-survey.com/start?rid=[RID]"
                  value={editForm.surveyUrl}
                  onChange={(e) => setEditForm({ ...editForm, surveyUrl: e.target.value })}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#fff",
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Completion Redirect URL
                </label>
                <input
                  type="text"
                  placeholder="https://gms-product.vercel.app/survey/complete"
                  value={editForm.redirectUrl}
                  onChange={(e) => setEditForm({ ...editForm, redirectUrl: e.target.value })}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#fff",
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Termination / Screenout Redirect URL
                </label>
                <input
                  type="text"
                  placeholder="https://gms-product.vercel.app/survey/screenout"
                  value={editForm.terminationUrl}
                  onChange={(e) => setEditForm({ ...editForm, terminationUrl: e.target.value })}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#fff",
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>LOI (Minutes)</label>
                  <input
                    type="number"
                    value={editForm.loi}
                    onChange={(e) => setEditForm({ ...editForm, loi: Number(e.target.value) })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>IR (%)</label>
                  <input
                    type="number"
                    value={editForm.ir}
                    onChange={(e) => setEditForm({ ...editForm, ir: Number(e.target.value) })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                  >
                    <option value="draft" style={{ background: "#111" }}>Draft</option>
                    <option value="live" style={{ background: "#111" }}>Live</option>
                    <option value="paused" style={{ background: "#111" }}>Paused</option>
                    <option value="stopped" style={{ background: "#111" }}>Stopped</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setEditingSurvey(null)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
