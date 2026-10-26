"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Activity,
  CheckCircle2,
  Users,
  DollarSign,
  Layers,
  Code2,
  BarChart3,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Bell,
  Menu,
  X,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react";
import { SupplierProvider, useSupplier } from "@/lib/supplier-store";

function SupplierLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { projects, supplierName, supplierCode } = useSupplier();

  const incomingCount = projects.filter((p) => p.status === "incoming").length;
  const activeCount = projects.filter((p) => p.status === "active").length;

  const navItems = [
    {
      name: "Dashboard",
      href: "/supplier/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Incoming Projects",
      href: "/supplier/incoming-projects",
      icon: Inbox,
      badge: incomingCount > 0 ? `${incomingCount} New` : undefined,
      badgeColor: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    },
    {
      name: "Active Projects",
      href: "/supplier/active-projects",
      icon: Activity,
      badge: activeCount > 0 ? `${activeCount} Live` : undefined,
      badgeColor: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    },
    {
      name: "Completed Projects",
      href: "/supplier/completed-projects",
      icon: CheckCircle2,
    },
    {
      name: "Respondent Activity",
      href: "/supplier/respondent-activity",
      icon: Users,
    },
    {
      name: "Revenue",
      href: "/supplier/revenue",
      icon: DollarSign,
    },
    {
      name: "Panels",
      href: "/supplier/panels",
      icon: Layers,
    },
    {
      name: "API Integration",
      href: "/supplier/api-integration",
      icon: Code2,
    },
    {
      name: "Reports",
      href: "/supplier/reports",
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white flex flex-col md:flex-row antialiased">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
            S
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              Supplier Portal
              <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">{supplierCode}</div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:flex flex-col w-full md:w-64 lg:w-72 border-r border-zinc-800/80 bg-zinc-950 shrink-0 md:sticky md:top-0 md:h-screen z-40`}
      >
        {/* Brand / Supplier Card */}
        <div className="p-5 border-b border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <Link href="/supplier/dashboard" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-black text-white shadow-md shadow-indigo-600/30">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Supplier Hub
                  <span className="text-[9px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
                    GMS
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Sample Supply Ops</p>
              </div>
            </Link>
          </div>

          <div className="rounded-xl bg-zinc-900/70 border border-zinc-800 p-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Supply Partner:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <div className="text-xs font-semibold text-zinc-200 truncate">{supplierName}</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Code: {supplierCode}</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Supplier Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/20"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    className={`${
                      isActive ? "text-white" : "text-zinc-400 group-hover:text-indigo-400"
                    } transition-colors`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                      isActive ? "bg-white/20 text-white" : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Portal Switcher & Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 space-y-3">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3">
            <div className="text-[11px] font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
              <ArrowRightLeft size={13} className="text-indigo-400" />
              Switch Portal View
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <Link
                href="/admin"
                className="text-[10px] font-medium text-center py-1.5 px-1.5 rounded-lg bg-zinc-800/80 hover:bg-violet-600/20 hover:text-violet-300 hover:border-violet-500/30 border border-zinc-700/60 text-zinc-300 transition"
              >
                Admin
              </Link>
              <Link
                href="/respondent/dashboard"
                className="text-[10px] font-medium text-center py-1.5 px-1.5 rounded-lg bg-zinc-800/80 hover:bg-emerald-600/20 hover:text-emerald-300 hover:border-emerald-500/30 border border-zinc-700/60 text-zinc-300 transition"
              >
                Respondent
              </Link>
              <Link
                href="/dashboard"
                className="text-[10px] font-medium text-center py-1.5 px-1.5 rounded-lg bg-zinc-800/80 hover:bg-indigo-600/20 hover:text-indigo-300 hover:border-indigo-500/30 border border-zinc-700/60 text-zinc-300 transition"
              >
                Client
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              Secured TLS 1.3
            </span>
            <span className="font-mono text-[10px]">v2.4.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Supplier Portal</span>
            <ChevronRight size={14} className="text-zinc-600" />
            <span className="text-zinc-200 font-medium capitalize">
              {pathname.replace("/supplier/", "").replace("-", " ") || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-zinc-300">Live Feasibility Engine</span>
            </div>

            <Link
              href="/supplier/incoming-projects"
              className="relative p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
              title="Notifications"
            >
              <Bell size={18} />
              {incomingCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-zinc-950" />
              )}
            </Link>

            <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                AP
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-zinc-200">Apex Sample Lead</div>
                <div className="text-[10px] text-zinc-400 font-mono">ops@apexsample.com</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupplierProvider>
      <SupplierLayoutContent>{children}</SupplierLayoutContent>
    </SupplierProvider>
  );
}
