"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  UserCheck,
  ClipboardList,
  FolderKanban,
  PieChart,
  Target,
  GitFork,
  Link2,
  ShieldAlert,
  Receipt,
  CreditCard,
  Scale,
  BarChart3,
  KeyRound,
  Webhook,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  ArrowRightLeft,
  Sparkles,
  Compass,
} from "lucide-react";

interface MenuItem {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

const navSections: MenuGroup[] = [
  {
    group: "Overview & Accounts",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { key: "users", label: "User", href: "/admin/users", icon: Users },
      { key: "suppliers", label: "Suppliers", href: "/admin/suppliers", icon: Truck },
      {
        key: "respondents-manage",
        label: "Respondents Management",
        href: "/admin/respondents/manage",
        icon: UserCheck,
      },
      {
        key: "respondents-activity",
        label: "Respondents Activity",
        href: "/admin/respondents",
        icon: UserCheck,
      },
    ],
  },
  {
    group: "Research Operations",
    items: [
      { key: "surveys", label: "Surveys", href: "/admin/surveys", icon: ClipboardList },
      // { key: "projects", label: "Projects", href: "/admin/projects", icon: FolderKanban },
      { key: "quotas", label: "Quotas", href: "/admin/quotas", icon: PieChart },
      { key: "targeting", label: "Targeting", href: "/admin/targeting", icon: Target },
      { key: "routing", label: "Routing", href: "/admin/routing", icon: GitFork },
      { key: "supplier-links", label: "Supplier Links", href: "/admin/supplier-links", icon: Link2 },
      { key: "fraud-detection", label: "Fraud Detection", href: "/admin/fraud-detection", icon: ShieldAlert },
    ],
  },
  {
    group: "Finance & Accounting",
    items: [
      { key: "transactions", label: "Transactions", href: "/admin/transactions", icon: Receipt },
      { key: "payments", label: "Payments", href: "/admin/payments", icon: CreditCard },
      { key: "reconciliation", label: "Reconciliation", href: "/admin/reconciliation", icon: Scale },
      { key: "reports", label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    group: "Integrations & Platform",
    items: [
      { key: "api-keys", label: "API Keys", href: "/admin/api-keys", icon: KeyRound },
      { key: "webhooks", label: "Webhooks", href: "/admin/webhooks", icon: Webhook },
      { key: "settings", label: "System Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        console.error("LOGOUT_FAILED:", data);
      }
    } catch (error) {
      console.error("LOGOUT_ERROR:", error);
    } finally {
      // Force a completely fresh login page instead of Next.js
      // client-side navigation, which can preserve the old login state.
      window.location.replace("/auth/login");
    }
  }

  const isActive = (href: string) => {
    // Dashboard must only match /admin exactly.
    if (href === "/admin") {
      return pathname === "/admin";
    }

    // Respondents Activity is the parent route:
    // /admin/respondents
    // It must NOT become active on:
    // /admin/respondents/manage
    if (href === "/admin/respondents") {
      return pathname === "/admin/respondents";
    }

    // All other menu items can match their child routes.
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.label.toLowerCase().includes(navSearch.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0f" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 72 : 260,
          background: "linear-gradient(180deg, #0d0d18 0%, #131325 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? "18px 16px" : "18px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            minHeight: 68,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16,
              color: "#fff",
              boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              flexShrink: 0,
            }}
          >
            G
          </div>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>
                GMS Platform
              </span>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 500 }}>
                Enterprise Administration
              </span>
            </div>
          )}
        </div>

        {/* Quick Filter (when not collapsed) */}
        {!collapsed && (
          <div style={{ padding: "10px 14px 4px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "6px 10px",
              }}
            >
              <Search size={13} color="rgba(255,255,255,0.4)" />
              <input
                type="text"
                placeholder="Filter menu..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 12,
                  width: "100%",
                }}
              />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: "8px 10px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}
        >
          {filteredSections.map((section) => (
            <div key={section.group} style={{ marginBottom: 12 }}>
              {!collapsed && (
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.35)",
                    padding: "6px 10px 4px",
                  }}
                >
                  {section.group}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: collapsed ? "10px 14px" : "8px 12px",
                      margin: "2px 0",
                      borderRadius: 8,
                      color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
                      background: active
                        ? "linear-gradient(135deg, rgba(99,102,241,0.28), rgba(139,92,246,0.18))"
                        : "transparent",
                      border: active ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                  >
                    <Icon
                      size={18}
                      style={{
                        flexShrink: 0,
                        color: active ? "#a5b4fc" : "inherit",
                      }}
                    />
                    {!collapsed && (
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Portal Switcher */}
        {!collapsed && (
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <ArrowRightLeft size={11} color="#818cf8" />
              Switch Portal
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              <Link
                href="/supplier/dashboard"
                style={{
                  fontSize: 11,
                  padding: "5px 6px",
                  borderRadius: 6,
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.22)",
                  color: "#a5b4fc",
                  textDecoration: "none",
                  textAlign: "center",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <Sparkles size={10} />
                Supplier
              </Link>
              <Link
                href="/respondent/dashboard"
                style={{
                  fontSize: 11,
                  padding: "5px 6px",
                  borderRadius: 6,
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.22)",
                  color: "#6ee7b7",
                  textDecoration: "none",
                  textAlign: "center",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <Compass size={10} />
                Respondent
              </Link>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <div
          style={{
            padding: "8px 12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: 12,
              transition: "all 0.2s ease",
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: collapsed ? 72 : 260,
          transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Top Header */}
        <header
          style={{
            height: 64,
            background: "rgba(13,13,24,0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#a5b4fc",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              System Live
            </span>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
              title="Notifications"
            >
              <Bell size={16} />
              <span
                style={{
                  position: "absolute",
                  top: 7,
                  right: 7,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#6366f1",
                }}
              />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#fff",
                }}
              >
                A
              </div>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}>
                Super Admin
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: loggingOut
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.7)",
                cursor: loggingOut ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                opacity: loggingOut ? 0.6 : 1,
              }}
              title={loggingOut ? "Logging out..." : "Logout"}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
