"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Truck,
  FolderKanban,
  ShieldAlert,
  CheckCircle2,
  Ban,
  TrendingUp,
  Activity,
  Clock,
  UserCheck,
  ClipboardList,
  PieChart,
  Target,
  GitFork,
  Link2,
  Receipt,
  CreditCard,
  Scale,
  BarChart3,
  KeyRound,
  Webhook,
  Settings,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  activeSuppliers: number;
  totalProjects: number;
  liveProjects?: number;
  blockedUsers: number;
  verifiedUsers: number;
  totalRespondents?: number;
  completedSessions?: number;
  screenoutSessions?: number;
  quotaFullSessions?: number;
  fraudBlocks?: number;
  conversionRate?: string;
  fraudRulesActive?: number;
}

interface RoleCount {
  _id: string;
  count: number;
}

interface StatusCount {
  _id: string;
  count: number;
}

interface AuditEntry {
  _id: string;
  action: string;
  resource: string;
  actorName?: string;
  actorEmail?: string;
  description?: string;
  createdAt: string;
}

const cardStyle = (gradient: string): React.CSSProperties => ({
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: "24px 28px",
  position: "relative",
  overflow: "hidden",
});

const iconBoxStyle = (gradient: string): React.CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  background: gradient,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 16,
});

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [usersByRole, setUsersByRole] = useState<RoleCount[]>([]);
  const [projectsByStatus, setProjectsByStatus] = useState<StatusCount[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setUsersByRole(data.usersByRole || []);
        setProjectsByStatus(data.projectsByStatus || []);
        setRecentActivity(data.recentActivity || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(99,102,241,0.2)",
            borderTop: "3px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      change: "+12%",
    },
    {
      label: "Active Suppliers",
      value: stats?.activeSuppliers ?? 0,
      icon: Truck,
      gradient: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
      change: "+5%",
    },
    {
      label: "Total Projects",
      value: stats?.totalProjects ?? 0,
      icon: FolderKanban,
      gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
      change: "+8%",
    },
    {
      label: "Verified Completes",
      value: stats?.completedSessions ?? 0,
      icon: UserCheck,
      gradient: "linear-gradient(135deg, #22c55e, #10b981)",
      change: `${stats?.conversionRate ?? "28.5"}% conv`,
    },
    {
      label: "Fraud Rejections",
      value: stats?.fraudBlocks ?? 0,
      icon: ShieldAlert,
      gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
      change: "Blocked",
    },
  ];

  const allAdminFeatures = [
    { label: "Dashboard", href: "/admin", icon: FolderKanban, desc: "Executive KPI overview & activity logs", color: "#6366f1" },
    { label: "User", href: "/admin/users", icon: Users, desc: "Manage client & team member accounts", color: "#8b5cf6" },
    { label: "Suppliers", href: "/admin/suppliers", icon: Truck, desc: "Panel sources, scoring & capacity", color: "#06b6d4" },
    { label: "Respondents", href: "/admin/respondents", icon: UserCheck, desc: "Session tracking, screeners & audit", color: "#10b981" },
    { label: "Surveys", href: "/admin/surveys", icon: ClipboardList, desc: "External endpoints, loops & launch", color: "#38bdf8" },
    { label: "Projects", href: "/admin/projects", icon: FolderKanban, desc: "Fieldwork monitoring & quotas", color: "#f59e0b" },
    { label: "Quotas", href: "/admin/quotas", icon: PieChart, desc: "Demographic balancing & auto-caps", color: "#ec4899" },
    { label: "Targeting", href: "/admin/targeting", icon: Target, desc: "Geos, devices & screener logic", color: "#f97316" },
    { label: "Routing", href: "/admin/routing", icon: GitFork, desc: "Traffic distributor & priority waterfall", color: "#14b8a6" },
    { label: "Supplier Links", href: "/admin/supplier-links", icon: Link2, desc: "Trackers, test sandbox & postbacks", color: "#8b5cf6" },
    { label: "Fraud Detection", href: "/admin/fraud-detection", icon: ShieldAlert, desc: "IP blocklist, speeder LOI & threats", color: "#ef4444" },
    { label: "Transactions", href: "/admin/transactions", icon: Receipt, desc: "Financial ledger, charges & payouts", color: "#34d399" },
    { label: "Payments", href: "/admin/payments", icon: CreditCard, desc: "Disbursements, wires & batch payouts", color: "#0ea5e9" },
    { label: "Reconciliation", href: "/admin/reconciliation", icon: Scale, desc: "Buyer vs supplier delta settlement", color: "#a855f7" },
    { label: "Reports", href: "/admin/reports", icon: BarChart3, desc: "Funnel drop-off & scorecard CSVs", color: "#fbbf24" },
    { label: "API Keys", href: "/admin/api-keys", icon: KeyRound, desc: "Developer tokens & rate limit scopes", color: "#a5b4fc" },
    { label: "Webhooks", href: "/admin/webhooks", icon: Webhook, desc: "Real-time HTTPS event relays & pings", color: "#6ee7b7" },
    { label: "System Settings", href: "/admin/settings", icon: Settings, desc: "Platform defaults, security & config", color: "#9ca3af" },
  ];

  const statusColors: Record<string, string> = {
    draft: "#6366f1",
    live: "#22c55e",
    paused: "#f59e0b",
    stopped: "#ef4444",
  };

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#fff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Admin Command Center
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 4 }}>
          Executive management suite for GMS Research Platform operations
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={cardStyle(card.gradient)}>
              <div style={iconBoxStyle(card.gradient)}>
                <Icon size={22} color="#fff" />
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 4 }}>
                {card.label}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.1,
                  marginBottom: 8,
                }}
              >
                {card.value.toLocaleString()}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: card.change.includes("+") || card.change.includes("%") ? "#22c55e" : "rgba(255,255,255,0.4)",
                  background: card.change.includes("+") || card.change.includes("%")
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(255,255,255,0.04)",
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                <TrendingUp size={12} />
                {card.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Navigation Hub */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
              Administration Modules & Operations
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "2px 0 0" }}>
              All 18 core platform management features
            </p>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(99,102,241,0.15)",
              color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            18 Features Active
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {allAdminFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link
                key={feat.href}
                href={feat.href}
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: `${feat.color}20`,
                    border: `1px solid ${feat.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={feat.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
                      {feat.label}
                    </span>
                    <ArrowRight size={13} color="rgba(255,255,255,0.3)" />
                  </div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 11,
                      margin: "4px 0 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {feat.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Users by Role */}
        <div style={cardStyle("")}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <div style={iconBoxStyle("linear-gradient(135deg, #6366f1, #8b5cf6)")}>
              <ShieldAlert size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>Users by Role</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Role distribution</div>
            </div>
          </div>
          {usersByRole.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, padding: "20px 0" }}>
              No role data available
            </div>
          ) : (
            usersByRole.map((r) => (
              <div
                key={r._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    textTransform: "capitalize",
                  }}
                >
                  {r._id || "No Role"}
                </span>
                <span
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    color: "#818cf8",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {r.count}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Projects by Status */}
        <div style={cardStyle("")}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <div style={iconBoxStyle("linear-gradient(135deg, #f59e0b, #f97316)")}>
              <Activity size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>Projects by Status</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Current breakdown</div>
            </div>
          </div>
          {projectsByStatus.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, padding: "20px 0" }}>
              No project data available
            </div>
          ) : (
            projectsByStatus.map((p) => {
              const color = statusColors[p._id] || "#6366f1";
              return (
                <div
                  key={p._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                      }}
                    />
                    <span
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 14,
                        textTransform: "capitalize",
                      }}
                    >
                      {p._id || "Unknown"}
                    </span>
                  </div>
                  <span
                    style={{
                      background: `${color}20`,
                      color,
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {p.count}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={cardStyle("")}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div style={iconBoxStyle("linear-gradient(135deg, #06b6d4, #0ea5e9)")}>
            <Clock size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>Recent Activity</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Latest audit log entries</div>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 14,
              padding: "40px 0",
              textAlign: "center",
            }}
          >
            No recent activity
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  {["Action", "Resource", "Actor", "Description", "Time"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        color: "rgba(255,255,255,0.4)",
                        fontWeight: 500,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((log) => (
                  <tr key={log._id}>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "#818cf8",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      {log.action}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "rgba(255,255,255,0.7)",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      {log.resource}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "rgba(255,255,255,0.6)",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      {log.actorName || log.actorEmail || "System"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "rgba(255,255,255,0.5)",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.description || "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "rgba(255,255,255,0.4)",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
