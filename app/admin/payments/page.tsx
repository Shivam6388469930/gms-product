"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  Send,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  AlertCircle,
  Building,
} from "lucide-react";

interface PaymentItem {
  _id: string;
  paymentId: string;
  batchNumber: string;
  recipientName: string;
  recipientType: string;
  supplierCode?: string;
  amount: number;
  currency: string;
  method: string;
  status: "draft" | "processing" | "paid" | "failed";
  referenceNotes?: string;
  paidAt?: string;
  createdAt: string;
}

export default function PaymentsAdminPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState({ totalPaid: 0, pendingAmount: 0, totalDisbursements: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    recipientName: "",
    supplierCode: "CINT",
    amount: 1000,
    method: "wire",
    batchNumber: "BATCH-NEW",
    referenceNotes: "",
    status: "draft",
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      const data = await res.json();
      setPayments(data.payments || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error loading payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchPayments();
    } catch (err) {
      console.error("Error updating payment:", err);
    }
  };

  const handleCreatePayment = async () => {
    if (!newPayment.recipientName) return;
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayment),
      });
      if (res.ok) {
        setShowModal(false);
        fetchPayments();
      }
    } catch (err) {
      console.error("Error creating payment:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      paid: { bg: "rgba(16,185,129,0.12)", color: "#34d399" },
      processing: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24" },
      draft: { bg: "rgba(99,102,241,0.12)", color: "#a5b4fc" },
      failed: { bg: "rgba(239,68,68,0.12)", color: "#f87171" },
    };
    const c = map[status] || map.draft;
    return (
      <span
        style={{
          padding: "3px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          background: c.bg,
          color: c.color,
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
            <CreditCard size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Supplier Payments & Payout Batches
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Manage supplier payouts, wire remittances, ACH batches, and disbursement status
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchPayments}
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
            <Plus size={14} /> Create Payout
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>TOTAL DISBURSED (PAID)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399" }}>
            ${stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>PENDING INVOICES / BATCHES</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fbbf24" }}>
            ${stats.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>DISBURSEMENT RECORDS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
            {stats.totalDisbursements}
          </div>
        </div>
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
            placeholder="Search payout ID, batch, or recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPayments()}
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
          {["", "paid", "processing", "draft"].map((s) => (
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
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Payment ID</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Recipient / Supplier</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Batch #</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Method</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Amount</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr
                    key={p._id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: "#fff", fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>
                        {p.paymentId}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{p.recipientName}</div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {p.supplierCode ? `SUP: ${p.supplierCode}` : p.recipientType}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                      {p.batchNumber}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(255,255,255,0.05)",
                          color: "#fff",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.method}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                        ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{getStatusBadge(p.status)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {p.status !== "paid" ? (
                        <button
                          onClick={() => handleUpdateStatus(p._id, "paid")}
                          style={{
                            background: "rgba(16,185,129,0.15)",
                            border: "1px solid rgba(16,185,129,0.3)",
                            color: "#34d399",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
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
              maxWidth: 480,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 18 }}>Create Supplier Payout</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cint Global Inc"
                  value={newPayment.recipientName}
                  onChange={(e) => setNewPayment({ ...newPayment, recipientName: e.target.value })}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Payout Amount (USD)
                </label>
                <input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                    Payment Method
                  </label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                  >
                    <option value="wire" style={{ background: "#111" }}>Wire Transfer</option>
                    <option value="wise" style={{ background: "#111" }}>Wise</option>
                    <option value="paypal" style={{ background: "#111" }}>PayPal</option>
                    <option value="stripe" style={{ background: "#111" }}>Stripe</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                    Batch Reference
                  </label>
                  <input
                    type="text"
                    value={newPayment.batchNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, batchNumber: e.target.value })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                  />
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
                onClick={handleCreatePayment}
                style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Create Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
