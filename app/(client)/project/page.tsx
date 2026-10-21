"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiJSON } from "@/lib/auth-client";
import { COUNTRIES, type ProjectDTO } from "@/lib/project-config";
import { StatusBadge } from "@/components/Statusbadge";
import { usd } from "@/components/Estimatecard";
import {
  ErrorAlert,
  Spinner,
  primaryButtonClass,
} from "@/components/Ui";

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | ProjectDTO["status"]
  >("all");

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

  const liveProjects =
    projects?.filter((project) => project.status === "live").length ?? 0;

  const draftProjects =
    projects?.filter((project) => project.status === "draft").length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Projects
          </h1>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your research projects, targeting, feasibility and survey
            setup.
          </p>
        </div>

        <Link
          href="/new-project"
          className={`${primaryButtonClass} !w-auto`}
        >
          + New project
        </Link>
      </div>

      <ErrorAlert message={error} />

      {/* Loading */}
      {!projects && !error && (
        <div className="flex items-center gap-2 py-10">
          <Spinner className="h-5 w-5 text-zinc-500" />
          <span className="text-sm text-zinc-500">
            Loading projects...
          </span>
        </div>
      )}

      {/* Summary cards */}
      {projects && projects.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total Projects"
            value={totalProjects}
          />

          <SummaryCard
            label="Live Projects"
            value={liveProjects}
          />

          <SummaryCard
            label="Draft Projects"
            value={draftProjects}
          />
        </div>
      )}

      {/* Search / Filters */}
      {projects && projects.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects, country, audience or ID..."
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | ProjectDTO["status"]
              )
            }
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="paused">Paused</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>
      )}

      {/* Empty state */}
      {projects?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl dark:bg-zinc-800">
            +
          </div>

          <p className="font-medium">No projects yet</p>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create your first project to get feasibility and a quote in
            seconds.
          </p>

          <Link
            href="/new-project"
            className={`${primaryButtonClass} mx-auto mt-5 !w-auto`}
          >
            Create project
          </Link>
        </div>
      )}

      {/* No search results */}
      {projects &&
        projects.length > 0 &&
        filteredProjects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 py-14 text-center dark:border-zinc-700">
            <p className="font-medium">No matching projects</p>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Try changing your search or status filter.
            </p>
          </div>
        )}

      {/* Project list */}
      {filteredProjects.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {/* Desktop header */}
          <div className="hidden grid-cols-[1fr_150px_110px_110px] gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 sm:grid dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <div>Project</div>
            <div>Progress</div>
            <div>Estimated Cost</div>
            <div className="text-right">Status</div>
          </div>

          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredProjects.map((project) => {
              const completes = Number(
                project.progress?.completes ?? 0
              );

              const sampleSize = Number(project.sampleSize ?? 0);

              const pct =
                sampleSize > 0
                  ? Math.min(
                      100,
                      Math.round((completes / sampleSize) * 100)
                    )
                  : 0;

              const countryName =
                COUNTRIES.find(
                  (country) => country.code === project.country
                )?.name || project.country;

              return (
                <li key={project._id}>
                  <Link
                    href={`/project-details/${project._id}`}
                    className="block px-5 py-5 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div className="grid items-center gap-4 sm:grid-cols-[1fr_150px_110px_110px]">
                      {/* Project */}
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {project.surveyTitle}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                          <span>{countryName}</span>

                          <span>·</span>

                          <span>
                            N={sampleSize.toLocaleString()}
                          </span>

                          <span>·</span>

                          <span>{project.loi} min LOI</span>

                          <span>·</span>

                          <span className="capitalize">
                            {project.audienceType}
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                          ID: {project._id}
                        </div>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-zinc-400">
                            Progress
                          </span>

                          <span className="font-medium tabular-nums">
                            {pct}%
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                            style={{
                              width: `${pct}%`,
                            }}
                          />
                        </div>

                        <div className="mt-1 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                          {completes.toLocaleString()} /{" "}
                          {sampleSize.toLocaleString()}
                        </div>
                      </div>

                      {/* Estimate */}
                      <div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          Estimated cost
                        </div>

                        <div className="mt-1 text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                          {usd(project.estimate.totalMin)}+
                        </div>
                      </div>

                      {/* Status */}
                      <div className="sm:text-right">
                        <StatusBadge status={project.status} />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold tracking-tight">
        {value.toLocaleString()}
      </div>
    </div>
  );
}