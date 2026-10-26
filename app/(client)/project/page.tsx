"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiJSON } from "@/lib/auth-client";
import { COUNTRIES, type ProjectDTO } from "@/lib/project-config";
import { StatusBadge } from "@/components/Statusbadge";
import { usd } from "@/components/Estimatecard";
import { ErrorAlert, Spinner } from "@/components/Ui";
import {
  FolderKanban,
  PlusCircle,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Activity,
  Layers,
  Clock,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectDTO["status"]>("all");
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  useEffect(() => {
    let mounted = true;

    apiJSON<{ projects: ProjectDTO[] }>("/api/projects").then(
      ({ ok, status, data }) => {
        if (!mounted) return;

        if (status === 401) {
          router.replace("/login");
          return;
        }

        if (!ok) {
          setError(data.message || "Couldn't load projects.");
          return;
        }

        setProjects(data.projects || []);
      }
    );

    return () => {
      mounted = false;
    };
  }, [router]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.surveyTitle.toLowerCase().includes(query) ||
        project.country.toLowerCase().includes(query) ||
        project.audienceType.toLowerCase().includes(query) ||
        project._id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const totalProjects = projects?.length ?? 0;
  const liveProjects = projects?.filter((p) => p.status === "live").length ?? 0;
  const draftProjects = projects?.filter((p) => p.status === "draft").length ?? 0;
  const pausedProjects = projects?.filter((p) => p.status === "paused").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <FolderKanban size={13} />
            <span>Research Projects Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Research Studies & Fieldwork
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Configure sample audiences, run feasibility algorithms, review dynamic pricing, and monitor real-time fieldwork progression.
          </p>
        </div>

        <Link
          href="/new-project"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
        >
          <PlusCircle size={16} />
          <span>+ Create New Project</span>
        </Link>
      </div>

      <ErrorAlert message={error} />

      {/* Loading State */}
      {!projects && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <Spinner className="h-7 w-7 text-indigo-500 animate-spin" />
          <span className="text-xs text-zinc-400 font-medium">Loading research projects...</span>
        </div>
      )}

      {/* Metric Counters */}
      {projects && projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur">
            <div className="text-xs font-medium text-zinc-400">Total Studies</div>
            <div className="text-2xl font-bold text-white mt-1">{totalProjects}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 backdrop-blur">
            <div className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Fieldwork
            </div>
            <div className="text-2xl font-bold text-white mt-1">{liveProjects}</div>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur">
            <div className="text-xs font-medium text-zinc-400">Draft Setup</div>
            <div className="text-2xl font-bold text-white mt-1">{draftProjects}</div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur">
            <div className="text-xs font-medium text-amber-400">Paused Studies</div>
            <div className="text-2xl font-bold text-white mt-1">{pausedProjects}</div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      {projects && projects.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search studies by title, country, audience, or ID..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All" },
              { id: "live", label: "Live" },
              { id: "draft", label: "Draft" },
              { id: "paused", label: "Paused" },
              { id: "stopped", label: "Stopped" },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20"
                      : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {projects?.length === 0 && (
        <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FolderKanban size={26} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No research studies yet</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
              Define your audience demographics, calculate feasibility and obtain CPI quotes in less than 60 seconds.
            </p>
          </div>
          <Link
            href="/new-project"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
          >
            <PlusCircle size={15} />
            <span>Launch Your First Study</span>
          </Link>
        </div>
      )}

      {/* No Filter Results */}
      {projects && projects.length > 0 && filteredProjects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center space-y-2">
          <p className="text-sm font-semibold text-white">No matching research studies found</p>
          <p className="text-xs text-zinc-400">Try adjusting your keyword query or resetting status filters.</p>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="mt-2 text-xs font-semibold text-indigo-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Projects List View */}
      {filteredProjects.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur divide-y divide-zinc-800/70 shadow-xl">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-[1.5fr_1fr_120px_100px_40px] items-center gap-4 px-6 py-3 bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
            <div>Study Information</div>
            <div>Fieldwork Quota Progress</div>
            <div>Estimated Cost</div>
            <div className="text-right">Fieldwork Status</div>
            <div />
          </div>

          {/* Table Rows */}
          {filteredProjects.map((project) => {
            const completes = Number(project.progress?.completes ?? 0);
            const sampleSize = Number(project.sampleSize ?? 0);
            const pct =
              sampleSize > 0
                ? Math.min(100, Math.round((completes / sampleSize) * 100))
                : 0;

            const countryName =
              COUNTRIES.find((c) => c.code === project.country)?.name || project.country;

            return (
              <Link
                key={project._id}
                href={`/project-details/${project._id}`}
                className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_120px_100px_40px] items-center gap-4 px-6 py-4.5 hover:bg-zinc-800/40 transition group"
              >
                {/* Study Information */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {project.surveyTitle}
                    </span>
                    <span className="sm:hidden">
                      <StatusBadge status={project.status} />
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                      {countryName}
                    </span>
                    <span>·</span>
                    <span className="capitalize text-zinc-300">{project.audienceType}</span>
                    <span>·</span>
                    <span>{project.loi} min LOI</span>
                    <span>·</span>
                    <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[120px]">
                      ID: {project._id}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono text-[11px]">
                      {completes.toLocaleString()} / {sampleSize.toLocaleString()}
                    </span>
                    <span className="font-bold text-white">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct === 100 ? "bg-emerald-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Estimated Cost */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 sm:hidden">Cost</div>
                  <div className="text-xs font-bold text-white font-mono">
                    {usd(project.estimate?.totalMin || 0)}+
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    ~${project.estimate?.cpiMin?.toFixed(2) || "2.20"} CPI
                  </div>
                </div>

                {/* Status */}
                <div className="hidden sm:block text-right">
                  <StatusBadge status={project.status} />
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex justify-end text-zinc-500 group-hover:text-white transition-colors">
                  <ArrowUpRight size={17} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}