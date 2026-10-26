"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/Logoutbutton";
import {
  PlusCircle,
  Shield,
  Sparkles,
  Compass,
  LayoutDashboard,
  FolderKanban,
  Receipt,
  Menu,
  X,
  ChevronDown,
  Activity,
  Layers,
  ArrowRightLeft,
  HelpCircle,
  Grid,
  BarChart3,
  SlidersHorizontal,
  PieChart,
  Search,
} from "lucide-react";

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [surveysDropdownOpen, setSurveysDropdownOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const portals = [
    {
      name: "Admin Console",
      role: "Governance & RBAC",
      href: "/admin",
      icon: Shield,
      color:
        "text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    {
      name: "Supplier Hub",
      role: "Sample Supply & API",
      href: "/supplier/dashboard",
      icon: Sparkles,
      color:
        "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      name: "Respondent Panel",
      role: "Panelist & Rewards",
      href: "/respondent/dashboard",
      icon: Compass,
      color:
        "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0c10] text-zinc-100 selection:bg-purple-600 selection:text-white flex flex-col antialiased">
      <header className="sticky top-0 z-50 bg-[#23022e] border-b border-[#3e0a4f] text-white shadow-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">

          {/* LEFT */}
          <div className="flex items-center gap-5 sm:gap-7">

            <Link
              href="/project"
              className="flex items-center gap-2.5 group"
            >
              <span className="text-xl font-bold tracking-tight text-[#ff2e93] font-sans flex items-center gap-1.5 group-hover:opacity-90 transition">
                Cint

                <span className="text-[10px] text-zinc-300 font-normal tracking-wide px-1.5 py-0.5 rounded bg-white/10 border border-white/15">
                  GMS Studio
                </span>
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-1 text-[13px] font-normal">

              {/* SURVEYS */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSurveysDropdownOpen(!surveysDropdownOpen);
                    setReportsDropdownOpen(false);
                    setAdminDropdownOpen(false);
                    setUserDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition hover:bg-white/10 ${pathname.startsWith("/project") ||
                      pathname === "/dashboard"
                      ? "text-white font-medium bg-white/15"
                      : "text-zinc-200"
                    }`}
                >
                  <span>Surveys</span>

                  <ChevronDown
                    size={12}
                    className={`transition-transform opacity-70 ${surveysDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {surveysDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() =>
                        setSurveysDropdownOpen(false)
                      }
                    />

                    <div className="absolute left-0 mt-2 w-56 rounded-xl border border-zinc-700 bg-[#1c0225] p-2 shadow-2xl z-50">
                      <Link
                        href="/project"
                        onClick={() =>
                          setSurveysDropdownOpen(false)
                        }
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-purple-900/40 text-zinc-200 hover:text-white transition"
                      >
                        <FolderKanban
                          size={14}
                          className="text-[#ff2e93]"
                        />

                        <div>
                          <div className="font-medium">
                            All Surveys
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            View and manage fieldwork
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/new-project"
                        onClick={() =>
                          setSurveysDropdownOpen(false)
                        }
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-purple-900/40 text-zinc-200 hover:text-white transition"
                      >
                        <PlusCircle
                          size={14}
                          className="text-emerald-400"
                        />

                        <div>
                          <div className="font-medium">
                            Create Target Screener
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Launch a new sample study
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() =>
                          setSurveysDropdownOpen(false)
                        }
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-purple-900/40 text-zinc-200 hover:text-white transition"
                      >
                        <LayoutDashboard
                          size={14}
                          className="text-purple-300"
                        />

                        <div>
                          <div className="font-medium">
                            Dashboard Overview
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            KPIs & sample telemetry
                          </div>
                        </div>
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* SUPPLY */}
              <Link
                href="/project"
                className="px-3 py-1.5 rounded-md text-zinc-200 hover:text-white hover:bg-white/10 transition"
              >
                Supply
              </Link>

              {/* BID */}
              <Link
                href="/new-project"
                className="px-3 py-1.5 rounded-md text-zinc-200 hover:text-white hover:bg-white/10 transition"
              >
                Bid
              </Link>

              {/* REPORTS */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setReportsDropdownOpen(
                      !reportsDropdownOpen
                    );
                    setSurveysDropdownOpen(false);
                    setAdminDropdownOpen(false);
                    setUserDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition hover:bg-white/10 ${reportsDropdownOpen
                      ? "text-white font-medium bg-white/15"
                      : "text-zinc-200"
                    }`}
                >
                  <span>Reports</span>

                  <ChevronDown
                    size={12}
                    className={`transition-transform opacity-70 ${reportsDropdownOpen
                        ? "rotate-180"
                        : ""
                      }`}
                  />
                </button>

                {reportsDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() =>
                        setReportsDropdownOpen(false)
                      }
                    />

                    <div className="absolute left-0 mt-2 w-56 rounded-xl border border-zinc-700 bg-[#1c0225] p-2 shadow-2xl z-50">

                      <Link
                        href="/dashboard"
                        onClick={() =>
                          setReportsDropdownOpen(false)
                        }
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-purple-900/40 text-zinc-200 hover:text-white transition"
                      >
                        <BarChart3
                          size={14}
                          className="text-cyan-400"
                        />

                        <div>
                          <div className="font-medium">
                            Fieldwork Activity
                          </div>

                          <div className="text-[10px] text-zinc-400">
                            Live entrants & completes
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/invoices"
                        onClick={() =>
                          setReportsDropdownOpen(false)
                        }
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-purple-900/40 text-zinc-200 hover:text-white transition"
                      >
                        <Receipt
                          size={14}
                          className="text-amber-400"
                        />

                        <div>
                          <div className="font-medium">
                            Financial & Invoices
                          </div>

                          <div className="text-[10px] text-zinc-400">
                            CPI billing & reconciliation
                          </div>
                        </div>
                      </Link>

                    </div>
                  </>
                )}
              </div>

              {/* ADMIN */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAdminDropdownOpen(
                      !adminDropdownOpen
                    );
                    setSurveysDropdownOpen(false);
                    setReportsDropdownOpen(false);
                    setUserDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition hover:bg-white/10 ${adminDropdownOpen
                      ? "text-white font-medium bg-white/15"
                      : "text-zinc-200"
                    }`}
                >
                  <span>Admin</span>

                  <ChevronDown
                    size={12}
                    className={`transition-transform opacity-70 ${adminDropdownOpen
                        ? "rotate-180"
                        : ""
                      }`}
                  />
                </button>

                {adminDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() =>
                        setAdminDropdownOpen(false)
                      }
                    />

                    <div className="absolute left-0 mt-2 w-64 rounded-xl border border-zinc-700 bg-[#1c0225] p-2 shadow-2xl z-50">

                      <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-zinc-400">
                        System Portals
                      </div>

                      {portals.map((p) => {
                        const Icon = p.icon;

                        return (
                          <Link
                            key={p.name}
                            href={p.href}
                            onClick={() =>
                              setAdminDropdownOpen(false)
                            }
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-purple-900/40 text-zinc-200 hover:text-white transition"
                          >
                            <div
                              className={`p-1.5 rounded-md border ${p.color}`}
                            >
                              <Icon size={13} />
                            </div>

                            <div>
                              <div className="font-medium">
                                {p.name}
                              </div>

                              <div className="text-[10px] text-zinc-400">
                                {p.role}
                              </div>
                            </div>
                          </Link>
                        );
                      })}

                      <div className="my-1 border-t border-purple-900/50" />

                      <Link
                        href="/admin/quotas"
                        onClick={() =>
                          setAdminDropdownOpen(false)
                        }
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-purple-900/40 text-zinc-200 hover:text-white transition"
                      >
                        <PieChart
                          size={14}
                          className="text-pink-400"
                        />

                        <div>
                          <div className="font-medium">
                            Quota Engine Global View
                          </div>

                          <div className="text-[10px] text-zinc-400">
                            Multi-project balancing
                          </div>
                        </div>
                      </Link>

                    </div>
                  </>
                )}
              </div>

            </nav>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            <Link
              href="/new-project"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#642582] hover:bg-[#7b2c9f] text-white text-xs font-medium shadow-sm transition border border-purple-400/20"
            >
              <PlusCircle size={14} />
              <span>Create Survey</span>
            </Link>

            <button
              type="button"
              title="Documentation & Support"
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition"
            >
              <HelpCircle size={17} />
            </button>

            <button
              type="button"
              title="Cint Applications"
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition"
            >
              <Grid size={17} />
            </button>

            {/* USER */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setSurveysDropdownOpen(false);
                  setReportsDropdownOpen(false);
                  setAdminDropdownOpen(false);
                }}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-[#521360] hover:bg-[#68187a] border border-purple-300/30 text-white font-semibold text-xs transition"
              >
                RB
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() =>
                      setUserDropdownOpen(false)
                    }
                  />

                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-700 bg-[#1c0225] p-2 shadow-2xl z-50">

                    <div className="px-3 py-2 border-b border-purple-900/50">
                      <div className="text-xs font-semibold text-white">
                        Ratan Bhan
                      </div>

                      <div className="text-[11px] text-zinc-400">
                        Project Manager / Client
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/project"
                        onClick={() =>
                          setUserDropdownOpen(false)
                        }
                        className="block px-3 py-1.5 text-xs text-zinc-200 hover:text-white hover:bg-purple-900/40 rounded-md"
                      >
                        My Projects
                      </Link>

                      <Link
                        href="/invoices"
                        onClick={() =>
                          setUserDropdownOpen(false)
                        }
                        className="block px-3 py-1.5 text-xs text-zinc-200 hover:text-white hover:bg-purple-900/40 rounded-md"
                      >
                        Billing & Invoices
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-purple-900/50">
                      <LogoutButton />
                    </div>

                  </div>
                </>
              )}
            </div>

            {/* MOBILE */}
            <button
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="md:hidden p-1.5 text-zinc-300 hover:text-white rounded-md hover:bg-white/10"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>

          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#3e0a4f] bg-[#1a0122] px-4 py-3 space-y-2 text-sm">

            <Link
              href="/project"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-white"
            >
              <FolderKanban size={16} />
              <span>Surveys</span>
            </Link>

            <Link
              href="/new-project"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-white"
            >
              <PlusCircle size={16} />
              <span>Create Survey</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-white"
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/invoices"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-white"
            >
              <Receipt size={16} />
              <span>Invoices</span>
            </Link>

            <div className="pt-2 border-t border-purple-900/40">
              <LogoutButton />
            </div>

          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0c10]" />
      }
    >
      <AppLayoutContent>
        {children}
      </AppLayoutContent>
    </Suspense>
  );
}