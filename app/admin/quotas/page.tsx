"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Layers,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Sliders,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface QuotaCell {
  id: string;
  category: string;
  name: string;
  target: number;
  current: number;
  percentage: number;
  status: "open" | "capped" | "near_cap";
}

interface ProjectQuota {
  _id: string;
  surveyTitle: string;
  country: string;
  sampleSize: number;
  status: string;
  completes: number;
  quotaCells: QuotaCell[];
  totalCells: number;
  cappedCells: number;
}

export default function QuotasAdminPage() {
  const [projects, setProjects] = useState<ProjectQuota[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<QuotaCell | null>(null);

  const fetchQuotas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/quotas");
      const data = await res.json();
      setProjects(data.projects || []);
      if (data.projects?.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data.projects[0]._id);
      }
    } catch (err) {
      console.error("Error loading quotas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const activeProject = projects.find((p) => p._id === selectedProjectId) || projects[0];

  const totalOpenCells = projects.reduce(
    (sum, p) => sum + (p.totalCells - p.cappedCells),
    0
  );
  const totalCappedCells = projects.reduce((sum, p) => sum + p.cappedCells, 0);

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
            <PieChart size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Quota Management & Cell Balancing
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Monitor demographic cell fulfillment, auto-capping rules, and cross-nested sample targets
          </p>
        </div>
        <button
          onClick={fetchQuotas}
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
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>PROJECTS MONITORED</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{projects.length}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>OPEN QUOTA CELLS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>{totalOpenCells}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>CAPPED CELLS (AUTO-CLOSED)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444" }}>{totalCappedCells}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>AUTO-REBALANCE ENGINE</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            Active & Enforcing
          </div>
        </div>
      </div>

      {/* Project Selector Bar */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500 }}>
          Select Research Study:
        </span>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: "8px 14px",
            color: "#fff",
            fontSize: 13,
            minWidth: 300,
          }}
        >
          {projects.map((p) => (
            <option key={p._id} value={p._id} style={{ background: "#111" }}>
              {p.surveyTitle} ({p.country}) — {p.completes}/{p.sampleSize} completes
            </option>
          ))}
        </select>
        {activeProject && (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(99,102,241,0.12)",
              color: "#a5b4fc",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Target Sample: {activeProject.sampleSize} N
          </span>
        )}
      </div>

      {/* Quota Matrix Grid */}
      {activeProject ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {activeProject.quotaCells.map((cell) => {
            const fillPct = Math.min(100, Math.round((cell.current / (cell.target || 1)) * 100));
            const isCapped = cell.status === "capped" || fillPct >= 100;
            const isNearCap = !isCapped && fillPct >= 85;

            return (
              <div
                key={cell.id}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: isCapped
                    ? "1px solid rgba(239,68,68,0.3)"
                    : isNearCap
                    ? "1px solid rgba(245,158,11,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <span
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "rgba(255,255,255,0.4)",
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      {cell.category}
                    </span>
                    <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 600 }}>
                      {cell.name}
                    </h3>
                  </div>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: isCapped ? "rgba(239,68,68,0.15)" : isNearCap ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                      color: isCapped ? "#f87171" : isNearCap ? "#fbbf24" : "#34d399",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {isCapped ? <Lock size={11} /> : <CheckCircle2 size={11} />}
                    {isCapped ? "Capped / Closed" : isNearCap ? "Near Quota" : "Open"}
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
                    <span>
                      Completes: <strong style={{ color: "#fff" }}>{cell.current}</strong> / {cell.target}
                    </span>
                    <span>{fillPct}%</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${fillPct}%`,
                        height: "100%",
                        background: isCapped
                          ? "linear-gradient(90deg, #ef4444, #f87171)"
                          : isNearCap
                          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                          : "linear-gradient(90deg, #6366f1, #10b981)",
                        borderRadius: 4,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  <span>Allocation: {cell.percentage}% of study</span>
                  <button
                    onClick={() => setEditingCell(cell)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.8)",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    Adjust Cap
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
          No project quotas available.
        </div>
      )}

      {/* Adjust Cap Modal */}
      {editingCell && (
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
              maxWidth: 440,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "#fff", fontSize: 18 }}>
              Adjust Quota Target: {editingCell.name}
            </h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 16px" }}>
              Modify target completes cap for this cell. When reached, subsequent respondents will be redirected to Quota Full URL.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                Target Completes
              </label>
              <input
                type="number"
                defaultValue={editingCell.target}
                id="targetCapInput"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#fff",
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setEditingCell(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEditingCell(null);
                  fetchQuotas();
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save Quota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
