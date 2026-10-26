"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  Globe,
  Truck,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowDown,
} from "lucide-react";

interface ReportData {
  funnel: {
    starts: number;
    screenerPass: number;
    completed: number;
    screenouts: number;
    quotaFull: number;
    blocked: number;
  };
  supplierScorecards: {
    supplierCode: string;
    supplierName: string;
    country: string;
    qualityScore: number;
    baseCpi: number;
    completes: number;
    screenouts: number;
    speederRate: string;
    conversionRate: string;
  }[];
  geoBreakdown: {
    country: string;
    projects: number;
    completes: number;
  }[];
}

export default function ReportsAdminPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const headers = "SupplierCode,SupplierName,QualityScore,Completes,Screenouts,SpeederRate,ConversionRate\n";
    const rows = data.supplierScorecards
      .map(
        (s) =>
          `"${s.supplierCode}","${s.supplierName}",${s.qualityScore},${s.completes},${s.screenouts},"${s.speederRate}","${s.conversionRate}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GMS_Supplier_Scorecards_${Date.now()}.csv`;
    a.click();
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
            <BarChart3 size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Operational Reports & Analytical Intelligence
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Funnel drop-off analytics, panel supplier scorecard quality indices, and global fieldwork metrics
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchReports}
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
            onClick={handleExportCsv}
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
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
          Computing platform analytics & intelligence...
        </div>
      ) : (
        <>
          {/* Conversion Funnel Section */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: "24px 28px",
              marginBottom: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 17, fontWeight: 600 }}>
              Survey Traffic & Conversion Funnel
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { label: "1. Total Starts", val: data.funnel.starts, color: "#6366f1", bg: "rgba(99,102,241,0.15)", pct: "100%" },
                { label: "2. Screener Passed", val: data.funnel.screenerPass, color: "#38bdf8", bg: "rgba(56,189,248,0.15)", pct: `${Math.round((data.funnel.screenerPass / (data.funnel.starts || 1)) * 100)}%` },
                { label: "3. Survey Completes", val: data.funnel.completed, color: "#10b981", bg: "rgba(16,185,129,0.15)", pct: `${Math.round((data.funnel.completed / (data.funnel.starts || 1)) * 100)}%` },
                { label: "Disqualified (Screenout)", val: data.funnel.screenouts, color: "#f59e0b", bg: "rgba(245,158,11,0.15)", pct: `${Math.round((data.funnel.screenouts / (data.funnel.starts || 1)) * 100)}%` },
                { label: "Quota Full Terminates", val: data.funnel.quotaFull, color: "#c084fc", bg: "rgba(192,132,252,0.15)", pct: `${Math.round((data.funnel.quotaFull / (data.funnel.starts || 1)) * 100)}%` },
                { label: "Fraud Security Rejects", val: data.funnel.blocked, color: "#ef4444", bg: "rgba(239,68,68,0.15)", pct: `${Math.round((data.funnel.blocked / (data.funnel.starts || 1)) * 100)}%` },
              ].map((step) => (
                <div
                  key={step.label}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 12,
                    padding: "16px",
                  }}
                >
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, marginBottom: 4 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: step.color, marginBottom: 2 }}>
                    {step.val.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {step.pct} of total traffic
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Quality Scorecard */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 600 }}>
                Supplier Quality & Performance Scorecard
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Supplier Partner</th>
                    <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Quality Score</th>
                    <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Base CPI</th>
                    <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Completes</th>
                    <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Screenouts</th>
                    <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Speeder Rate</th>
                    <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Conversion %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.supplierScorecards.map((sup) => (
                    <tr key={sup.supplierCode} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{sup.supplierName}</div>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>CODE: {sup.supplierCode}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#34d399", fontWeight: 700, fontSize: 12 }}>
                          {sup.qualityScore} / 100
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                        ${sup.baseCpi.toFixed(2)}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontSize: 13 }}>
                        {sup.completes}
                      </td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                        {sup.screenouts}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>
                        {sup.speederRate}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#a5b4fc", fontSize: 12, fontWeight: 600 }}>
                        {sup.conversionRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
