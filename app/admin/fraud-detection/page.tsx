"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  AlertTriangle,
  Zap,
  Globe,
  Smartphone,
  Eye,
  CheckCircle,
} from "lucide-react";

interface FraudRuleItem {
  _id: string;
  ruleType: string;
  value: string;
  reason: string;
  riskScore: number;
  active: boolean;
  blockCount: number;
  addedBy: string;
  createdAt: string;
}

interface SuspiciousSession {
  _id: string;
  respondentId: string;
  ip: string;
  deviceFingerprint?: string;
  fraudScore: number;
  status: string;
  terminatedReason?: string;
  supplierCode: string;
  project?: {
    surveyTitle: string;
  };
  createdAt: string;
}

export default function FraudDetectionAdminPage() {
  const [rules, setRules] = useState<FraudRuleItem[]>([]);
  const [sessions, setSessions] = useState<SuspiciousSession[]>([]);
  const [stats, setStats] = useState({
    blockedIps: 0,
    blockedFingerprints: 0,
    activeRules: 0,
    highRiskFlagged: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rules" | "sessions">("rules");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleType, setNewRuleType] = useState("ip_block");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newRuleReason, setNewRuleReason] = useState("");

  const fetchFraudData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fraud-detection");
      const data = await res.json();
      setRules(data.rules || []);
      setSessions(data.highRiskSessions || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error fetching fraud data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudData();
  }, []);

  const handleAddRule = async () => {
    if (!newRuleValue) return;
    try {
      const res = await fetch("/api/admin/fraud-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleType: newRuleType,
          value: newRuleValue,
          reason: newRuleReason || "Manual security blacklist",
          riskScore: 90,
          active: true,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewRuleValue("");
        setNewRuleReason("");
        fetchFraudData();
      }
    } catch (err) {
      console.error("Error adding rule:", err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/fraud-detection/${id}`, { method: "DELETE" });
      if (res.ok) fetchFraudData();
    } catch (err) {
      console.error("Error deleting rule:", err);
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
            <ShieldAlert size={24} color="#ef4444" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Fraud Detection & Quality Security Hub
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Automated IP reputation checks, speeder LOI limits, device canvas fingerprinting, and blacklists
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchFraudData}
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
            onClick={() => setShowAddModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Add Block Rule
          </button>
        </div>
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
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>ACTIVE FRAUD RULES</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{stats.activeRules}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>BLOCKED IPS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444" }}>{stats.blockedIps}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>BLOCKED FINGERPRINTS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>{stats.blockedFingerprints}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>FLAGGED THREATS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f87171" }}>{stats.highRiskFlagged}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab("rules")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: activeTab === "rules" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.03)",
            border: activeTab === "rules" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.06)",
            color: activeTab === "rules" ? "#fca5a5" : "rgba(255,255,255,0.6)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Security Rules & Blacklist ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: activeTab === "sessions" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.03)",
            border: activeTab === "sessions" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.06)",
            color: activeTab === "sessions" ? "#fca5a5" : "rgba(255,255,255,0.6)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Recent High-Risk Sessions ({sessions.length})
        </button>
      </div>

      {/* Rules Table */}
      {activeTab === "rules" && (
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
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Type</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Rule Target / Value</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Reason</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Threat Score</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Total Blocked</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr
                    key={rule._id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(99,102,241,0.12)",
                          color: "#a5b4fc",
                        }}
                      >
                        {rule.ruleType.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: "#fff", fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>
                        {rule.value}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                      {rule.reason}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 12 }}>
                        {rule.riskScore} / 100
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#fff", fontSize: 12, fontWeight: 600 }}>
                      {rule.blockCount || 0}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: "#34d399", fontSize: 11, fontWeight: 600 }}>Enforcing</span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => handleDeleteRule(rule._id)}
                        style={{
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          color: "#f87171",
                          padding: "4px 8px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* High Risk Sessions Table */}
      {activeTab === "sessions" && (
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
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Respondent ID</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Threat Score</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>IP Address</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Supplier</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status Outcome</th>
                  <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Termination Reason</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 16px", color: "#fff", fontFamily: "monospace", fontSize: 12 }}>
                      {s.respondentId?.slice(0, 16)}...
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "rgba(239,68,68,0.15)",
                          color: "#f87171",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {s.fraudScore || 75} / 100
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.8)", fontFamily: "monospace", fontSize: 12 }}>
                      {s.ip}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#a5b4fc", fontSize: 12, fontWeight: 600 }}>
                      {s.supplierCode}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: "rgba(239,68,68,0.1)",
                          color: "#fca5a5",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                      {s.terminatedReason || "Heuristic anomaly score exceeded threshold"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddModal && (
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
              maxWidth: 460,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 18 }}>Add Fraud Blocklist Rule</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Rule Type
                </label>
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                >
                  <option value="ip_block" style={{ background: "#111" }}>IP Address Block</option>
                  <option value="fingerprint_block" style={{ background: "#111" }}>Device Fingerprint Hash Block</option>
                  <option value="respondent_block" style={{ background: "#111" }}>Respondent ID Global Ban</option>
                  <option value="speeder_loi" style={{ background: "#111" }}>Speeder Threshold (% Median LOI)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Value / Pattern
                </label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.1 or FP_HASH_xxx"
                  value={newRuleValue}
                  onChange={(e) => setNewRuleValue(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Reason & Context
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bot farm identified during field audit"
                  value={newRuleReason}
                  onChange={(e) => setNewRuleReason(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRule}
                style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Enforce Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
