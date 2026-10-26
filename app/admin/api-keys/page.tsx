"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Clock,
  AlertCircle,
  Lock,
} from "lucide-react";

interface ApiKeyItem {
  _id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: "active" | "revoked" | "expired";
  rateLimit: number;
  lastUsedAt?: string;
  createdAt: string;
}

export default function ApiKeysAdminPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [stats, setStats] = useState({ activeKeys: 0, revokedKeys: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // New key form
  const [keyName, setKeyName] = useState("");
  const [rateLimit, setRateLimit] = useState(60);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "read:projects",
    "write:surveys",
  ]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-keys");
      const data = await res.json();
      setKeys(data.keys || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error loading API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async () => {
    if (!keyName) return;
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName,
          rateLimit,
          scopes: selectedScopes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.plainTextSecret) {
        setCreatedSecret(data.plainTextSecret);
        setShowCreateModal(false);
        setKeyName("");
        fetchKeys();
      }
    } catch (err) {
      console.error("Error creating key:", err);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action is immediate and permanent.")) return;
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) fetchKeys();
    } catch (err) {
      console.error("Error revoking key:", err);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
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
            <KeyRound size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Partner & Enterprise API Keys
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Generate REST integration credentials, granular permission scopes, and request rate-limiting
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchKeys}
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
            <Plus size={14} /> Generate New Key
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
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>ACTIVE CREDENTIALS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399" }}>{stats.activeKeys}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>REVOKED KEYS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f87171" }}>{stats.revokedKeys}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>DEFAULT RATE LIMIT</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>60 req/min</div>
        </div>
      </div>

      {/* Keys Table */}
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
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Key Name</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Key Prefix</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Permissions / Scopes</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Rate Limit</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Last Used</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Revoke</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                    Loading API keys...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No API keys generated yet.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr
                    key={k._id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{k.name}</div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        Created: {new Date(k.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <code style={{ color: "#a5b4fc", fontFamily: "monospace", fontSize: 12 }}>
                          {k.keyPrefix}••••••••
                        </code>
                        <button
                          onClick={() => copyText(k.keyPrefix, k._id)}
                          style={{ background: "transparent", border: "none", color: copiedKey === k._id ? "#34d399" : "rgba(255,255,255,0.3)", cursor: "pointer", padding: 2 }}
                        >
                          {copiedKey === k._id ? <Check size={11} /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(99,102,241,0.1)",
                              color: "#a5b4fc",
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                      {k.rateLimit} req/min
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: k.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                          color: k.status === "active" ? "#34d399" : "#f87171",
                          textTransform: "uppercase",
                        }}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never used"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {k.status === "active" && (
                        <button
                          onClick={() => handleRevokeKey(k._id)}
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            color: "#f87171",
                            padding: "4px 8px",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                          title="Revoke Key"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secret Reveal Modal */}
      {createdSecret && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
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
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 520,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={18} color="#34d399" />
              </div>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 18 }}>API Key Generated Successfully</h3>
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.5, margin: "0 0 16px" }}>
              Please copy your API key now. For security purposes, <strong>you will not be able to see this key again</strong>.
            </p>

            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <code style={{ color: "#34d399", fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>
                {createdSecret}
              </code>
              <button
                onClick={() => copyText(createdSecret, "reveal-secret")}
                style={{
                  background: copiedKey === "reveal-secret" ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)",
                  border: "none",
                  color: copiedKey === "reveal-secret" ? "#34d399" : "#fff",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                {copiedKey === "reveal-secret" ? <Check size={12} /> : <Copy size={12} />}
                {copiedKey === "reveal-secret" ? "Copied" : "Copy"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setCreatedSecret(null)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                I have saved this key safely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
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
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 18 }}>Generate API Key</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Key Name / Client Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dynata Production Gateway"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Rate Limit (Requests per minute)
                </label>
                <input
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 8 }}>
                  Scopes & Permissions
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { id: "read:projects", label: "Read Research Projects" },
                    { id: "write:surveys", label: "Create & Configure Surveys" },
                    { id: "read:respondents", label: "Audit Respondent Sessions" },
                    { id: "manage:webhooks", label: "Manage Webhook Subscriptions" },
                  ].map((s) => (
                    <label
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(s.id)}
                        onChange={() => toggleScope(s.id)}
                        style={{ accentColor: "#6366f1" }}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
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
                onClick={handleCreateKey}
                style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
