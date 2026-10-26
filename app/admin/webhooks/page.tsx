"use client";

import React, { useState, useEffect } from "react";
import {
  Webhook,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  Check,
  Copy,
  AlertTriangle,
  Globe,
  Radio,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface WebhookItem {
  _id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  failureCount: number;
  lastStatusCode?: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

export default function WebhooksAdminPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, failureCount: 0, successRate: "100%" });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; status: number; latency: number } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  // New webhook form
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "respondent.complete",
    "respondent.screenout",
  ]);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/webhooks");
      const data = await res.json();
      setWebhooks(data.webhooks || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error loading webhooks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreateWebhook = async () => {
    if (!name || !url) return;
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, events: selectedEvents }),
      });
      if (res.ok) {
        setShowModal(false);
        setName("");
        setUrl("");
        fetchWebhooks();
      }
    } catch (err) {
      console.error("Error creating webhook:", err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("Are you sure you want to remove this webhook endpoint?")) return;
    try {
      const res = await fetch(`/api/admin/webhooks/${id}`, { method: "DELETE" });
      if (res.ok) fetchWebhooks();
    } catch (err) {
      console.error("Error deleting webhook:", err);
    }
  };

  const handleTestPing = async (hook: WebhookItem) => {
    setTestingId(hook._id);
    try {
      const res = await fetch("/api/admin/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId: hook._id, url: hook.url }),
      });
      const data = await res.json();
      setTestResult({
        id: hook._id,
        status: data.statusCode || 200,
        latency: data.latencyMs || 120,
      });
      setTimeout(() => setTestResult(null), 4000);
      fetchWebhooks();
    } catch (err) {
      console.error("Test ping error:", err);
    } finally {
      setTestingId(null);
    }
  };

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(id);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  const toggleEvent = (ev: string) => {
    if (selectedEvents.includes(ev)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== ev));
    } else {
      setSelectedEvents([...selectedEvents, ev]);
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
            <Webhook size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Webhook Subscriptions & Event Relays
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Dispatch instant HTTPS webhooks for respondent completes, quota capping events, and fraud threat alerts
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchWebhooks}
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
            onClick={() => setShowModal(true)}
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
            <Plus size={14} /> Register Webhook
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
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>ACTIVE ENDPOINTS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399" }}>{stats.active}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>DELIVERY SUCCESS RATE</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{stats.successRate}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>FAILED RETRIES</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f87171" }}>{stats.failureCount}</div>
        </div>
      </div>

      {/* Webhooks Table */}
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
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Endpoint Name</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Target URL</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Subscribed Events</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Signing Secret</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Last Status</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                    Loading webhook registrations...
                  </td>
                </tr>
              ) : webhooks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No webhooks registered.
                  </td>
                </tr>
              ) : (
                webhooks.map((hook) => (
                  <tr
                    key={hook._id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{hook.name}</div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {hook.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <code style={{ color: "#a5b4fc", fontFamily: "monospace", fontSize: 12, maxWidth: 260, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {hook.url}
                      </code>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {hook.events.map((ev) => (
                          <span
                            key={ev}
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(99,102,241,0.1)",
                              color: "#a5b4fc",
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <code style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace", fontSize: 11 }}>
                          whsec_••••••••
                        </code>
                        <button
                          onClick={() => copySecret(hook.secret, hook._id)}
                          style={{ background: "transparent", border: "none", color: copiedSecret === hook._id ? "#34d399" : "rgba(255,255,255,0.3)", cursor: "pointer", padding: 2 }}
                        >
                          {copiedSecret === hook._id ? <Check size={11} /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {testResult && testResult.id === hook._id ? (
                        <span style={{ color: "#34d399", fontSize: 11, fontWeight: 700 }}>
                          HTTP {testResult.status} ({testResult.latency}ms)
                        </span>
                      ) : hook.lastStatusCode ? (
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            background: hook.lastStatusCode === 200 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                            color: hook.lastStatusCode === 200 ? "#34d399" : "#f87171",
                          }}
                        >
                          HTTP {hook.lastStatusCode}
                        </span>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Never triggered</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          onClick={() => handleTestPing(hook)}
                          disabled={testingId === hook._id}
                          style={{
                            background: "rgba(99,102,241,0.15)",
                            border: "1px solid rgba(99,102,241,0.3)",
                            color: "#a5b4fc",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Send size={11} />
                          {testingId === hook._id ? "Pinging..." : "Test Ping"}
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(hook._id)}
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Modal */}
      {showModal && (
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
              maxWidth: 500,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 18 }}>Register Webhook Endpoint</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Endpoint Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zapier / Slack Survey Alert"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  HTTPS Callback URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-domain.com/api/gms-events"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 8 }}>
                  Event Triggers
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { id: "respondent.complete", label: "Respondent Complete (Qualified)" },
                    { id: "respondent.screenout", label: "Respondent Disqualified (Screenout)" },
                    { id: "respondent.quota_full", label: "Quota Cell Filled" },
                    { id: "project.complete", label: "Study Sample Target Fulfilled" },
                    { id: "fraud.alert", label: "Fraud Anomaly / Bot Terminated" },
                  ].map((ev) => (
                    <label
                      key={ev.id}
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
                        checked={selectedEvents.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id)}
                        style={{ accentColor: "#6366f1" }}
                      />
                      {ev.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWebhook}
                style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
