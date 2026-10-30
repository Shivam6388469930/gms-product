
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Compass,
  PlayCircle,
  CheckCircle2,
  FilterX,
  History,
  Gift,
  UserCheck,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  ArrowRightLeft,
  Award,
  Wallet,
  LogOut,
} from "lucide-react";

import {
  RespondentProvider,
  useRespondent,
} from "@/lib/respondent-store";

// ============================================================
// LAYOUT CONTENT
// ============================================================

function RespondentLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const {
    respondentName,
    respondentEmail,
    supplierName,

    pointsBalance,
    usdBalance,
    tierName,

    opportunities,
    notifications,

    logout,
    isLoading,
  } = useRespondent();

  const unreadNotifications =
    notifications.filter(
      (n) => !n.read
    ).length;

  // ==========================================================
  // AVATAR INITIALS
  // ==========================================================

  const getInitials = (
    name: string
  ) => {
    if (!name) return "R";

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  };

  const initials =
    getInitials(
      respondentName
    );

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      // Safety fallback
      window.location.href =
        "/login";
    }
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navItems = [
    {
      name: "Dashboard",
      href: "/respondent/dashboard",
      icon: LayoutDashboard,
    },

    {
      name: "Available Surveys",
      href: "/respondent/opportunities",
      icon: Compass,
      badge:
        opportunities.length > 0
          ? `${opportunities.length} Match`
          : undefined,
      badgeColor:
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },

    {
      name: "My Surveys",
      href: "/respondent/active-surveys",
      icon: PlayCircle,
    },

    {
      name: "Completed",
      href: "/respondent/completed-surveys",
      icon: CheckCircle2,
    },

    {
      name: "Screenings",
      href: "/respondent/screenings",
      icon: FilterX,
    },

    {
      name: "Survey History",
      href: "/respondent/history",
      icon: History,
    },

    {
      name: "Rewards",
      href: "/respondent/rewards",
      icon: Gift,
      badge: `$${usdBalance.toFixed(
        2
      )}`,
      badgeColor:
        "bg-amber-500/10 text-amber-300 border border-amber-500/20",
    },

    {
      name: "Wallet",
      href: "/respondent/rewards",
      icon: Wallet,
    },

    {
      name: "Profile",
      href: "/respondent/profile",
      icon: UserCheck,
    },

    {
      name: "Notifications",
      href: "/respondent/notifications",
      icon: Bell,
      badge:
        unreadNotifications > 0
          ? `${unreadNotifications}`
          : undefined,
      badgeColor:
        "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    },

    {
      name: "Account",
      href: "/respondent/account",
      icon: Settings,
    },

    {
      name: "Support",
      href: "/respondent/support",
      icon: HelpCircle,
    },
  ];

  // ==========================================================
  // DISPLAY NAME
  // ==========================================================

  const displayName =
    respondentName ||
    (isLoading
      ? "Loading..."
      : "Respondent");

  const displayEmail =
    respondentEmail ||
    (isLoading
      ? "Loading..."
      : "No email");

  const displaySupplier =
    supplierName ||
    (isLoading
      ? "Loading..."
      : "Unknown Supplier");

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-white flex flex-col md:flex-row antialiased">

      {/* ======================================================
          MOBILE HEADER
      ====================================================== */}

      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 backdrop-blur sticky top-0 z-50">

        <div className="flex items-center gap-2">

          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-zinc-950 shadow-md">
            {initials}
          </div>

          <div>
            <div className="text-sm font-bold text-white">
              {displayName}
            </div>

            <div className="text-[11px] text-emerald-400 font-mono">
              ${usdBalance.toFixed(2)}{" "}
              (
              {pointsBalance.toLocaleString()}{" "}
              pts)
            </div>
          </div>

        </div>

        <button
          onClick={() =>
            setMobileMenuOpen(
              !mobileMenuOpen
            )
          }
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>

      </header>

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`${
          mobileMenuOpen
            ? "block"
            : "hidden"
        } md:flex flex-col w-full md:w-64 lg:w-72 border-r border-zinc-800/80 bg-zinc-950 shrink-0 md:sticky md:top-0 md:h-screen z-40`}
      >

        {/* BRAND + USER */}
        <div className="p-5 border-b border-zinc-800/80 space-y-3">

          <Link
            href="/respondent/dashboard"
            className="flex items-center gap-2.5"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-black text-zinc-950 shadow-md shadow-emerald-500/20">
              <Award
                size={18}
                className="text-zinc-950"
              />
            </div>

            <div>
              <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Respondent Hub

                <span className="text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <p className="text-[11px] text-zinc-400">
                Paid Opinion Network
              </p>
            </div>
          </Link>

          {/* CURRENT RESPONDENT */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3.5">

            <div className="flex items-center gap-3">

              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xs font-bold text-zinc-950">
                {initials}
              </div>

              <div className="min-w-0">

                <div className="text-sm font-semibold text-white truncate">
                  {displayName}
                </div>

                <div className="text-[11px] text-zinc-400 truncate">
                  {displayEmail}
                </div>

                <div className="text-[11px] text-blue-400 truncate">
                  Supplier:{" "}
                  {displaySupplier}
                </div>

              </div>

            </div>

          </div>

          {/* BALANCE */}
          <div className="rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 border border-emerald-500/20 p-3.5 space-y-2">

            <div className="flex items-center justify-between text-xs text-zinc-400">

              <span className="flex items-center gap-1.5">
                <Wallet
                  size={13}
                  className="text-emerald-400"
                />

                Available Rewards:
              </span>

              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {tierName}
              </span>

            </div>

            <div className="flex items-baseline justify-between">

              <div className="text-2xl font-black text-white tracking-tight">
                $
                {usdBalance.toFixed(
                  2
                )}
              </div>

              <div className="text-xs font-mono text-zinc-400">
                {pointsBalance.toLocaleString()}{" "}
                pts
              </div>

            </div>

          </div>

        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">

          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Survey Participant Menu
          </div>

          {navItems.map(
            (item) => {
              const Icon =
                item.icon;

              const isActive =
                pathname ===
                item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/20"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-900/80"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <Icon
                      size={17}
                      className={`${
                        isActive
                          ? "text-white"
                          : "text-zinc-400 group-hover:text-emerald-400"
                      } transition-colors`}
                    />

                    <span>
                      {item.name}
                    </span>

                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                </Link>
              );
            }
          )}

        </nav>

        {/* SWITCH PORTAL */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 space-y-3">

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3">

            <div className="text-[11px] font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">

              <ArrowRightLeft
                size={13}
                className="text-emerald-400"
              />

              Switch Portal View

            </div>

            <div className="grid grid-cols-3 gap-1.5">

              <Link
                href="/admin"
                className="text-[10px] font-medium text-center py-1.5 px-1.5 rounded-lg bg-zinc-800/80 hover:bg-violet-600/20 hover:text-violet-300 border border-zinc-700/60 text-zinc-300 transition"
              >
                Admin
              </Link>

              <Link
                href="/supplier/dashboard"
                className="text-[10px] font-medium text-center py-1.5 px-1.5 rounded-lg bg-zinc-800/80 hover:bg-indigo-600/20 hover:text-indigo-300 border border-zinc-700/60 text-zinc-300 transition"
              >
                Supplier
              </Link>

              <Link
                href="/dashboard"
                className="text-[10px] font-medium text-center py-1.5 px-1.5 rounded-lg bg-zinc-800/80 hover:bg-emerald-600/20 hover:text-emerald-300 border border-zinc-700/60 text-zinc-300 transition"
              >
                Client
              </Link>

            </div>

          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            <LogOut size={15} />

            Logout
          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* DESKTOP HEADER */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-30">

          {/* BREADCRUMB */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">

            <span>
              Respondent Panel
            </span>

            <ChevronRight
              size={14}
              className="text-zinc-600"
            />

            <span className="text-zinc-200 font-medium capitalize">
              {pathname
                .replace(
                  "/respondent/",
                  ""
                )
                .replaceAll(
                  "-",
                  " "
                ) ||
                "Dashboard"}
            </span>

          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            {/* BALANCE */}
            <Link
              href="/respondent/rewards"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <Gift size={14} />

              <span>
                Balance: $
                {usdBalance.toFixed(
                  2
                )}
              </span>
            </Link>

            {/* NOTIFICATIONS */}
            <Link
              href="/respondent/notifications"
              className="relative p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
              title="Notifications"
            >

              <Bell size={18} />

              {unreadNotifications >
                0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
              )}

            </Link>

            {/* CURRENT USER */}
            <Link
              href="/respondent/profile"
              className="flex items-center gap-3 pl-3 border-l border-zinc-800"
            >

              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xs font-bold text-zinc-950 shadow-sm">
                {initials}
              </div>

              <div className="hidden lg:block text-left">

                <div className="text-xs font-semibold text-zinc-200">
                  {displayName}
                </div>

                <div className="text-[10px] text-zinc-400 font-mono">
                  {displayEmail}
                </div>

                <div className="text-[10px] text-blue-400">
                  Supplier:{" "}
                  {displaySupplier}
                </div>

              </div>

            </Link>

            {/* HEADER LOGOUT */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-xs font-semibold"
            >
              <LogOut
                size={14}
              />

              Logout
            </button>

          </div>

        </header>

        {/* PAGE */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

      </div>

    </div>
  );
}

// ============================================================
// PROVIDER
// ============================================================

export default function RespondentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RespondentProvider>
      <RespondentLayoutContent>
        {children}
      </RespondentLayoutContent>
    </RespondentProvider>
  );
}
