"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  ArrowRight,
} from "lucide-react";

interface AuditEntry {
  _id: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  description?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionBadgeColors: Record<string, { bg: string; text: string }> = {
  create: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
  read: { bg: "rgba(99,102,241,0.12)", text: "#818cf8" },
  update: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  delete: { bg: "rgba(239,68,68,0.12)", text: "#f87171" },
  login: { bg: "rgba(6,182,212,0.12)", text: "#22d3ee" },
  logout: { bg: "rgba(168,85,247,0.12)", text: "#c084fc" },
  register: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
  block: { bg: "rgba(239,68,68,0.12)", text: "#f87171" },
  unblock: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
};

const getActionColor = (action: string) => {
  const key = action.toLowerCase().split(".").pop() || action.toLowerCase();
  return actionBadgeColors[key] || { bg: "rgba(99,102,241,0.12)", text: "#818cf8" };
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });
    if (actionFilter) params.set("action", actionFilter);
    if (resourceFilter) params.set("resource", resourceFilter);

    try {
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || pagination);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, actionFilter, resourceFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
          Audit Logs
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 4 }}>
          Track all actions performed across the platform
        </p>
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
            width: 220,
          }}
        >
          <Filter size={16} color="rgba(255,255,255,0.4)" />
          <input
            type="text"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "8px 14px",
            width: 220,
          }}
        >
          <Search size={16} color="rgba(255,255,255,0.4)" />
          <input
            type="text"
            placeholder="Filter by resource..."
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
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
      </div>

      {/* Log Entries */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <ScrollText size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>
              No audit logs found
            </p>
          </div>
        ) : (
          <>
            {logs.map((log, idx) => {
              const ac = getActionColor(log.action);
              return (
                <div
                  key={log._id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    padding: "16px 24px",
                    borderBottom:
                      idx < logs.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Timeline Dot */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: ac.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <ScrollText size={16} color={ac.text} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: ac.bg,
                          color: ac.text,
                          padding: "3px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {log.action}
                      </span>
                      <ArrowRight size={12} color="rgba(255,255,255,0.2)" />
                      <span
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        {log.resource}
                        {log.resourceId && (
                          <span style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: 11, marginLeft: 4 }}>
                            #{log.resourceId.slice(-6)}
                          </span>
                        )}
                      </span>
                    </div>

                    {log.description && (
                      <p
                        style={{
                          color: "rgba(255,255,255,0.45)",
                          fontSize: 13,
                          margin: "4px 0 0",
                          lineHeight: 1.4,
                        }}
                      >
                        {log.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 8,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <User size={12} />
                        {log.actorName || log.actorEmail || "System"}
                      </span>
                      {log.actorRole && (
                        <span style={{ textTransform: "capitalize" }}>
                          ({log.actorRole})
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} />
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 24px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
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
    </div>
  );
}
