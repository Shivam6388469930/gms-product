"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface RespondentItem {
  _id: string;
  respondentId: string;
  supplierCode: string;
  project?: {
    _id: string;
    surveyTitle: string;
    country: string;
  };
  ip: string;
  status: string;
  fraudScore: number;
  durationSeconds?: number;
  terminatedReason?: string;
  screenerAnswers?: {
    questionText: string;
    selectedOptionLabel: string;
    isQualifying: boolean;
  }[];
  deviceFingerprint?: string;
  createdAt: string;
}

export default function RespondentsPage() {
  const [respondents, setRespondents] = useState<RespondentItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    screened_out: 0,
    quota_full: 0,
    quality_reject: 0,
    blocked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<RespondentItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchRespondents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/respondents?${params.toString()}`);
      const data = await res.json();
      setRespondents(data.respondents || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Failed to load respondents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRespondents();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRespondents();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/respondents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchRespondents();
        if (selectedSession && selectedSession._id === id) {
          setSelectedSession({ ...selectedSession, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
      completed: { bg: "rgba(16,185,129,0.12)", color: "#34d399", border: "rgba(16,185,129,0.3)", label: "Completed" },
      screened_out: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.3)", label: "Screenout" },
      quota_full: { bg: "rgba(139,92,246,0.12)", color: "#c084fc", border: "rgba(139,92,246,0.3)", label: "Quota Full" },
      quality_reject: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.3)", label: "Quality Reject" },
      blocked_duplicate_ip: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "rgba(239,68,68,0.4)", label: "Blocked IP" },
      blocked_fingerprint: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "rgba(239,68,68,0.4)", label: "Blocked Device" },
      blocked_exclusion: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "rgba(239,68,68,0.4)", label: "Exclusion" },
    };
    const c = map[status] || { bg: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "rgba(255,255,255,0.1)", label: status };
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
          whiteSpace: "nowrap",
        }}
      >
        {c.label}
      </span>
    );
  };

  const getFraudScoreBadge = (score: number = 0) => {
    let color = "#10b981";
    let bg = "rgba(16,185,129,0.1)";
    if (score > 65) {
      color = "#ef4444";
      bg = "rgba(239,68,68,0.15)";
    } else if (score > 35) {
      color = "#f59e0b";
      bg = "rgba(245,158,11,0.15)";
    }
    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          color,
          background: bg,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {score > 65 ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
        {score} / 100
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Page Header */}
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
            <UserCheck size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Respondent Sessions
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Audit respondent journeys, screener decisions, fraud scoring, and session status
          </p>
        </div>
        <button
          onClick={fetchRespondents}
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
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Refresh
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
          { label: "Total Sessions", val: stats.total, icon: UserCheck, color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
          { label: "Completes", val: stats.completed, icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
          { label: "Screenouts", val: stats.screened_out, icon: XCircle, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
          { label: "Quota Full", val: stats.quota_full, icon: AlertTriangle, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
          { label: "Quality Rejects", val: stats.quality_reject, icon: Ban, color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
          { label: "Security Blocks", val: stats.blocked, icon: ShieldAlert, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: c.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color={c.color} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
                  {c.val.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
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
        <form
          onSubmit={handleSearchSubmit}
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
            placeholder="Search Respondent ID, IP, or Fingerprint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 13,
              width: "100%",
            }}
          />
        </form>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "", label: "All Status" },
            { id: "completed", label: "Completed" },
            { id: "screened_out", label: "Screened Out" },
            { id: "quota_full", label: "Quota Full" },
            { id: "quality_reject", label: "Quality Rejects" },
            { id: "blocked_duplicate_ip", label: "Duplicate IP" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              style={{
                background: statusFilter === s.id ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.03)",
                border: statusFilter === s.id ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
                color: statusFilter === s.id ? "#a5b4fc" : "rgba(255,255,255,0.65)",
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
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
              <tr
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Respondent ID</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Project</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Supplier</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Fraud Score</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>IP / Geo</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Duration</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                    <div>Loading respondent records...</div>
                  </td>
                </tr>
              ) : respondents.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No respondent sessions found matching current filter.
                  </td>
                </tr>
              ) : (
                respondents.map((item) => (
                  <tr
                    key={item._id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#fff", fontWeight: 600, fontSize: 13, fontFamily: "monospace" }}>
                          {item.respondentId?.slice(0, 16)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.respondentId, item._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: copiedId === item._id ? "#10b981" : "rgba(255,255,255,0.3)",
                            cursor: "pointer",
                            padding: 2,
                          }}
                        >
                          {copiedId === item._id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.project?.surveyTitle || "General Survey"}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                        {item.project?.country || "Global"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "rgba(99,102,241,0.1)",
                          color: "#a5b4fc",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {item.supplierCode || "DIRECT"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{getStatusBadge(item.status)}</td>
                    <td style={{ padding: "12px 16px" }}>{getFraudScoreBadge(item.fraudScore)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "monospace" }}>
                        {item.ip}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                        <Clock size={12} />
                        {item.durationSeconds ? `${Math.round(item.durationSeconds / 60)} min` : "N/A"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedSession(item)}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#fff",
                          padding: "5px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Session Modal */}
      {selectedSession && (
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
              background: "#12121f",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 640,
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: "0 0 4px", color: "#fff", fontSize: 18 }}>Session Details</h3>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontFamily: "monospace" }}>
                  {selectedSession.respondentId}
                </span>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>CURRENT STATUS</div>
                <div>{getStatusBadge(selectedSession.status)}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>FRAUD RISK SCORE</div>
                <div>{getFraudScoreBadge(selectedSession.fraudScore)}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>IP ADDRESS</div>
                <div style={{ color: "#fff", fontSize: 13, fontFamily: "monospace" }}>{selectedSession.ip}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>SUPPLIER CODE</div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{selectedSession.supplierCode}</div>
              </div>
            </div>

            {selectedSession.terminatedReason && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#f87171", fontWeight: 600, marginBottom: 2 }}>TERMINATION REASON</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{selectedSession.terminatedReason}</div>
              </div>
            )}

            {/* Screener Answers Drill-down */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: "#fff", fontSize: 14, margin: "0 0 10px" }}>Screener Responses</h4>
              {selectedSession.screenerAnswers && selectedSession.screenerAnswers.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedSession.screenerAnswers.map((ans, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        padding: 10,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>
                        Q: {ans.questionText}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>
                          {ans.selectedOptionLabel}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: ans.isQualifying ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            color: ans.isQualifying ? "#34d399" : "#f87171",
                          }}
                        >
                          {ans.isQualifying ? "Qualifying" : "Disqualifying"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontStyle: "italic" }}>
                  No screener questions recorded for this session.
                </div>
              )}
            </div>

            {/* Change Status Action */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                Override Status (Manual Audit):
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => handleUpdateStatus(selectedSession._id, "completed")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "rgba(16,185,129,0.15)",
                    color: "#34d399",
                    border: "1px solid rgba(16,185,129,0.3)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSession._id, "quality_reject")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "rgba(239,68,68,0.15)",
                    color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.3)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Quality Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSession._id, "screened_out")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "rgba(245,158,11,0.15)",
                    color: "#fbbf24",
                    border: "1px solid rgba(245,158,11,0.3)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Mark Screenout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
