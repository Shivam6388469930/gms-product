"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  FileSpreadsheet,
  Check,
} from "lucide-react";

interface ReconItem {
  _id: string;
  projectTitle: string;
  clientName: string;
  country: string;
  clientCompletes: number;
  supplierCompletes: number;
  discrepancy: number;
  discrepancyPercent: string;
  status: "matched" | "discrepant" | "pending" | "resolved";
  scrubbedSpeeders: number;
  reconciledAt: string;
}

export default function ReconciliationAdminPage() {
  const [items, setItems] = useState<ReconItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    discrepant: 0,
    resolved: 0,
    totalScrubbed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [resolvingItem, setResolvingItem] = useState<ReconItem | null>(null);

  const fetchReconciliation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reconciliation");
      const data = await res.json();
      setItems(data.items || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error loading reconciliation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  const handleResolveDispute = async (finalCount: number) => {
    if (!resolvingItem) return;
    try {
      const res = await fetch("/api/admin/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: resolvingItem._id,
          finalCompletes: finalCount,
          resolutionNotes: "Discrepancy reconciled and verified by admin",
        }),
      });
      if (res.ok) {
        setResolvingItem(null);
        fetchReconciliation();
      }
    } catch (err) {
      console.error("Error resolving:", err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      item.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

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
            <Scale size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              End-of-Study Complete Reconciliation
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Compare client accepted completes vs supplier delivered sessions, resolve speeder scrubs, and lock final payable billings
          </p>
        </div>
        <button
          onClick={fetchReconciliation}
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
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>TOTAL STUDIES AUDITED</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{stats.total}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>MATCHED STUDIES (DELTA &lt; 5%)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399" }}>{stats.matched}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>DISCREPANCIES FLAGGED</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f87171" }}>{stats.discrepant}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>SCRUBBED SESSIONS (REMOVED)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fbbf24" }}>{stats.totalScrubbed}</div>
        </div>
      </div>

      {/* Filter Bar */}
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
            placeholder="Search study title or client..."
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
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["", "matched", "discrepant", "pending"].map((s) => (
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

      {/* Reconciliation Table */}
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
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Research Study</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Client Account</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Client Verified N</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Supplier Tracked N</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Delta Variance</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                    Loading reconciliation data...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No reconciliation records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{item.projectTitle}</div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.country}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                      {item.clientName}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: "#34d399", fontWeight: 700, fontSize: 13 }}>
                        {item.clientCompletes}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                        {item.supplierCompletes}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: item.discrepancy === 0 ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.15)",
                          color: item.discrepancy === 0 ? "#34d399" : "#fbbf24",
                        }}
                      >
                        {item.discrepancyPercent} ({item.discrepancy >= 0 ? "+" : ""}{item.discrepancy})
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: item.status === "matched" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: item.status === "matched" ? "#34d399" : "#f87171",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setResolvingItem(item)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#fff",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Reconcile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {resolvingItem && (
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
              maxWidth: 520,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 6px", color: "#fff", fontSize: 18 }}>
              Resolve Complete Discrepancy
            </h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 20px" }}>
              Study: {resolvingItem.projectTitle}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>CLIENT VERIFIED</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#34d399" }}>{resolvingItem.clientCompletes} completes</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>SUPPLIER CLAIMED</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{resolvingItem.supplierCompletes} completes</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => handleResolveDispute(resolvingItem.clientCompletes)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#34d399",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Accept Client Verified Count ({resolvingItem.clientCompletes}) — Uphold Scrub
              </button>
              <button
                onClick={() => handleResolveDispute(resolvingItem.supplierCompletes)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#a5b4fc",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Accept Supplier Delivery Count ({resolvingItem.supplierCompletes}) — Waive Scrub
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setResolvingItem(null)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
