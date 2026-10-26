"use client";

import React, { useState, useEffect } from "react";
import {
  GitFork,
  Network,
  Sliders,
  Plus,
  RefreshCw,
  Play,
  Pause,
  ArrowRight,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertCircle,
  Shuffle,
  Shield,
} from "lucide-react";

interface RoutingSupplier {
  supplierCode: string;
  supplierName: string;
  priority: number;
  allocationPercent: number;
  maxCompletes: number;
  currentCompletes: number;
  active: boolean;
}

interface RoutingRuleItem {
  _id: string;
  name: string;
  project?: {
    _id: string;
    surveyTitle: string;
    country: string;
  };
  strategy: "waterfall" | "weighted_allocation" | "priority_first" | "auto_rebalance";
  suppliers: RoutingSupplier[];
  fallbackAction: string;
  backupSurveyUrl?: string;
  active: boolean;
}

export default function RoutingAdminPage() {
  const [rules, setRules] = useState<RoutingRuleItem[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleStrategy, setNewRuleStrategy] = useState<string>("weighted_allocation");

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/routing");
      const data = await res.json();
      setRules(data.rules || []);
      if (data.rules?.length > 0 && !selectedRuleId) {
        setSelectedRuleId(data.rules[0]._id);
      }
    } catch (err) {
      console.error("Error loading routing rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const activeRule = rules.find((r) => r._id === selectedRuleId) || rules[0];

  const handleUpdateSupplierWeight = async (index: number, newWeight: number) => {
    if (!activeRule) return;
    const updatedSuppliers = [...activeRule.suppliers];
    updatedSuppliers[index].allocationPercent = newWeight;

    try {
      const res = await fetch(`/api/admin/routing/${activeRule._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suppliers: updatedSuppliers }),
      });
      if (res.ok) fetchRules();
    } catch (err) {
      console.error("Error updating weight:", err);
    }
  };

  const handleToggleSupplierActive = async (index: number) => {
    if (!activeRule) return;
    const updatedSuppliers = [...activeRule.suppliers];
    updatedSuppliers[index].active = !updatedSuppliers[index].active;

    try {
      const res = await fetch(`/api/admin/routing/${activeRule._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suppliers: updatedSuppliers }),
      });
      if (res.ok) fetchRules();
    } catch (err) {
      console.error("Error updating active status:", err);
    }
  };

  const handleCreateRule = async () => {
    if (!newRuleName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRuleName,
          strategy: newRuleStrategy,
          suppliers: [
            {
              supplierCode: "CINT",
              supplierName: "Cint Global Exchange",
              priority: 1,
              allocationPercent: 60,
              maxCompletes: 200,
              currentCompletes: 0,
              active: true,
            },
            {
              supplierCode: "DYNATA",
              supplierName: "Dynata Direct Panel",
              priority: 2,
              allocationPercent: 40,
              maxCompletes: 200,
              currentCompletes: 0,
              active: true,
            },
          ],
          active: true,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewRuleName("");
        fetchRules();
      }
    } catch (err) {
      console.error("Error creating rule:", err);
    } finally {
      setSaving(false);
    }
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
            <GitFork size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Sample Routing & Allocation Engine
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Orchestrate blended sample traffic, priority waterfall dispatching, and screenout fallback chains
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchRules}
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
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> New Routing Rule
          </button>
        </div>
      </div>

      {/* Strategies Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            title: "Waterfall Routing",
            desc: "Sends 100% of traffic to Priority 1 supplier until capacity cap or quota is met, then falls through to Priority 2.",
            badge: "Sequential",
            color: "#6366f1",
          },
          {
            title: "Weighted Allocation",
            desc: "Dynamically splits traffic proportionally based on assigned percentage weights across multiple panel partners.",
            badge: "Blended Split",
            color: "#10b981",
          },
          {
            title: "Quality Re-balancing",
            desc: "Automatically shifts traffic toward suppliers with highest incidence rates and lowest speeder/fraud scores.",
            badge: "AI Heuristic",
            color: "#f59e0b",
          },
        ].map((s) => (
          <div
            key={s.title}
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 15, fontWeight: 600 }}>{s.title}</h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: `${s.color}22`,
                  color: s.color,
                }}
              >
                {s.badge}
              </span>
            </div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5 }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Active Rule Selector Bar */}
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
          Active Routing Strategy:
        </span>
        <select
          value={selectedRuleId}
          onChange={(e) => setSelectedRuleId(e.target.value)}
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
          {rules.map((r) => (
            <option key={r._id} value={r._id} style={{ background: "#111" }}>
              {r.name} — {r.strategy.replace("_", " ").toUpperCase()}
            </option>
          ))}
        </select>
        {activeRule && (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(16,185,129,0.12)",
              color: "#34d399",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {activeRule.suppliers?.length || 0} Suppliers Integrated
          </span>
        )}
      </div>

      {/* Supplier Allocation Table */}
      {activeRule && (
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
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Priority</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Supplier Partner</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Traffic Weight (%)</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Completes Delivered</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {activeRule.suppliers?.map((sup, idx) => (
                  <tr
                    key={sup.supplierCode}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "rgba(99,102,241,0.15)",
                          color: "#a5b4fc",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {sup.priority || idx + 1}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{sup.supplierName}</div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                        CODE: {sup.supplierCode}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sup.allocationPercent}
                          onChange={(e) => handleUpdateSupplierWeight(idx, Number(e.target.value))}
                          style={{ width: 120, accentColor: "#6366f1" }}
                        />
                        <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, width: 36 }}>
                          {sup.allocationPercent}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                        <strong style={{ color: "#fff" }}>{sup.currentCompletes || 0}</strong> / {sup.maxCompletes || 200}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: sup.active ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                          color: sup.active ? "#34d399" : "#f87171",
                        }}
                      >
                        {sup.active ? "Active In Routing" : "Paused"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => handleToggleSupplierActive(idx)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#fff",
                          padding: "5px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        {sup.active ? "Pause" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Rule Modal */}
      {showCreateModal && (
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
              maxWidth: 480,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 18 }}>Create Routing Strategy</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Strategy Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. US B2B Blended Routing"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Dispatch Mechanism
                </label>
                <select
                  value={newRuleStrategy}
                  onChange={(e) => setNewRuleStrategy(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                >
                  <option value="weighted_allocation" style={{ background: "#111" }}>Weighted Allocation (%)</option>
                  <option value="waterfall" style={{ background: "#111" }}>Waterfall (Sequential Priority)</option>
                  <option value="auto_rebalance" style={{ background: "#111" }}>Auto Re-balance (Quality Driven)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={saving}
                style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                {saving ? "Creating..." : "Create Strategy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
