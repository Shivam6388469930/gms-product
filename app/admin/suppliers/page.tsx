"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Truck,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Globe,
  DollarSign,
  BarChart3,
} from "lucide-react";

interface Supplier {
  _id: string;
  supplierName: string;
  supplierCode: string;
  country: string;
  audienceType: string;
  audienceDescription: string;
  availableSample: number;
  baseCpi: number;
  historicalIr: number;
  averageLoi: number;
  qualityScore: number;
  active: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const audienceTypes = ["consumer", "b2b", "healthcare"];

const audienceColors: Record<string, { bg: string; text: string }> = {
  consumer: { bg: "rgba(99,102,241,0.12)", text: "#818cf8" },
  b2b: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  healthcare: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
};

const emptyForm = {
  supplierName: "",
  supplierCode: "",
  country: "",
  audienceType: "consumer",
  audienceDescription: "",
  availableSample: 0,
  baseCpi: 0,
  historicalIr: 0,
  averageLoi: 0,
  qualityScore: 0,
};

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });
    if (search) params.set("search", search);
    if (countryFilter) params.set("country", countryFilter);
    if (audienceFilter) params.set("audienceType", audienceFilter);

    try {
      const res = await fetch(`/api/admin/suppliers?${params}`);
      const data = await res.json();
      setSuppliers(data.suppliers || []);
      setPagination(data.pagination || pagination);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, search, countryFilter, audienceFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setFormData({
      supplierName: s.supplierName,
      supplierCode: s.supplierCode,
      country: s.country,
      audienceType: s.audienceType,
      audienceDescription: s.audienceDescription || "",
      availableSample: s.availableSample,
      baseCpi: s.baseCpi,
      historicalIr: s.historicalIr,
      averageLoi: s.averageLoi,
      qualityScore: s.qualityScore,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await fetch(`/api/admin/suppliers/${editing._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/admin/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
      fetchSuppliers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (s: Supplier) => {
    try {
      await fetch(`/api/admin/suppliers/${s._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !s.active }),
      });
      fetchSuppliers();
    } catch (e) {
      console.error(e);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
            Supplier Management
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 4 }}>
            Manage supply sources, capacity, and pricing
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "8px 14px",
            flex: 1,
            maxWidth: 400,
          }}
        >
          <Search size={16} color="rgba(255,255,255,0.4)" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 14,
              width: "100%",
            }}
          />
        </div>
        <input
          type="text"
          placeholder="Country filter..."
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          style={{
            ...inputStyle,
            width: 160,
          }}
        />
        <select
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "8px 14px",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="">All Audiences</option>
          {audienceTypes.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {[
                  "Supplier",
                  "Code",
                  "Country",
                  "Audience",
                  "Sample",
                  "CPI ($)",
                  "IR (%)",
                  "Quality",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "14px 12px",
                      color: "rgba(255,255,255,0.4)",
                      fontWeight: 500,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>
                    Loading...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => {
                  const ac = audienceColors[s.audienceType] || audienceColors.consumer;
                  return (
                    <tr key={s._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "12px", color: "#fff", fontWeight: 500 }}>
                        {s.supplierName}
                      </td>
                      <td style={{ padding: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                        {s.supplierCode}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Globe size={14} color="rgba(255,255,255,0.4)" />
                          <span style={{ color: "rgba(255,255,255,0.7)" }}>{s.country}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            background: ac.bg,
                            color: ac.text,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {s.audienceType}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "rgba(255,255,255,0.7)" }}>
                        {s.availableSample?.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <DollarSign size={13} color="#fbbf24" />
                          <span style={{ color: "#fbbf24" }}>{s.baseCpi?.toFixed(2)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px", color: "rgba(255,255,255,0.6)" }}>
                        {s.historicalIr}%
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              background: "rgba(255,255,255,0.06)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${s.qualityScore}%`,
                                height: "100%",
                                borderRadius: 3,
                                background:
                                  s.qualityScore >= 70
                                    ? "#22c55e"
                                    : s.qualityScore >= 40
                                    ? "#f59e0b"
                                    : "#ef4444",
                              }}
                            />
                          </div>
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                            {s.qualityScore}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <button
                          onClick={() => handleToggleActive(s)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: s.active ? "#22c55e" : "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {s.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => openEdit(s)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "rgba(255,255,255,0.04)",
                              color: "#818cf8",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              border: "1px solid rgba(239,68,68,0.2)",
                              background: "rgba(239,68,68,0.06)",
                              color: "#f87171",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Trash2 size={14} />
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: pagination.page === 1 ? "rgba(255,255,255,0.2)" : "#fff",
                  cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 13,
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: pagination.page >= pagination.totalPages ? "rgba(255,255,255,0.2)" : "#fff",
                  cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 13,
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 32,
              width: 520,
              maxHeight: "85vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 600, margin: 0 }}>
                {editing ? "Edit Supplier" : "Add New Supplier"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { key: "supplierName", label: "Supplier Name", type: "text", span: 2 },
                { key: "supplierCode", label: "Supplier Code", type: "text", span: 1 },
                { key: "country", label: "Country", type: "text", span: 1 },
                { key: "availableSample", label: "Available Sample", type: "number", span: 1 },
                { key: "baseCpi", label: "Base CPI ($)", type: "number", span: 1 },
                { key: "historicalIr", label: "Historical IR (%)", type: "number", span: 1 },
                { key: "averageLoi", label: "Average LOI (min)", type: "number", span: 1 },
                { key: "qualityScore", label: "Quality Score (0-100)", type: "number", span: 1 },
              ].map((field) => (
                <div
                  key={field.key}
                  style={{ gridColumn: field.span === 2 ? "span 2" : "span 1" }}
                >
                  <label
                    style={{
                      display: "block",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field.key]:
                          field.type === "number"
                            ? parseFloat(e.target.value) || 0
                            : e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
              ))}

              <div>
                <label
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  Audience Type
                </label>
                <select
                  value={formData.audienceType}
                  onChange={(e) => setFormData({ ...formData, audienceType: e.target.value })}
                  style={inputStyle}
                >
                  {audienceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  Audience Description
                </label>
                <textarea
                  value={formData.audienceDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, audienceDescription: e.target.value })
                  }
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {editing ? "Save Changes" : "Create Supplier"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
