"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Supply = {
  _id: string;
  supplierName: string;
  supplierCode: string;
  country: string;
  audienceType: "consumer" | "b2b" | "healthcare";
  audienceDescription?: string;
  availableSample: number;
  baseCpi: number;
  historicalIr: number;
  averageLoi: number;
  qualityScore: number;
  active: boolean;
};

type Allocation = {
  _id?: string;
  supply:
    | string
    | {
        _id: string;
        supplierName: string;
        supplierCode: string;
        availableSample: number;
        baseCpi: number;
        qualityScore: number;
      };
  allocatedSample: number;
  allocatedCpi: number;
  routingPercent: number;
  priority: number;
  status: "active" | "paused" | "completed";
};

type Project = {
  _id: string;
  name: string;
  country: string;
  audienceType: "consumer" | "b2b" | "healthcare";
  sampleSize: number;
  loi: number;
  ir: number;
  status: "draft" | "live" | "paused" | "stopped";
  surveySetup?: {
    status: "not_configured" | "ready";
    surveyUrl?: string;
    estimatedLoi?: number;
  };
};

type RoutingRow = {
  supplyId: string;
  supplierName: string;
  supplierCode: string;
  availableSample: number;
  cpi: number;
  qualityScore: number;
  historicalIr: number;
  allocatedSample: number;
  routingPercent: number;
  priority: number;
};

function SampleRoutingContent() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [routing, setRouting] = useState<RoutingRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!projectId) return;

    loadData();
  }, [projectId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/projects/${projectId}/sample-routing`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load sample routing"
        );
      }

      setProject(data.project);
      setSupplies(data.supplies || []);

      const existingAllocations: Allocation[] =
        data.allocations || [];

      const allocationMap = new Map<string, Allocation>();

      existingAllocations.forEach((allocation) => {
        const supplyId =
          typeof allocation.supply === "string"
            ? allocation.supply
            : allocation.supply._id;

        allocationMap.set(supplyId, allocation);
      });

      const rows: RoutingRow[] = (data.supplies || []).map(
        (supply: Supply, index: number) => {
          const existing = allocationMap.get(supply._id);

          return {
            supplyId: supply._id,
            supplierName: supply.supplierName,
            supplierCode: supply.supplierCode,
            availableSample: supply.availableSample,
            cpi: existing?.allocatedCpi ?? supply.baseCpi,
            qualityScore: supply.qualityScore,
            historicalIr: supply.historicalIr,
            allocatedSample: existing?.allocatedSample ?? 0,
            routingPercent: existing?.routingPercent ?? 0,
            priority: existing?.priority ?? index + 1,
          };
        }
      );

      setRouting(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  const totalAllocated = useMemo(() => {
    return routing.reduce(
      (total, row) => total + Number(row.allocatedSample || 0),
      0
    );
  }, [routing]);

  const totalRoutingPercent = useMemo(() => {
    return routing.reduce(
      (total, row) => total + Number(row.routingPercent || 0),
      0
    );
  }, [routing]);

  const selectedSuppliers = useMemo(() => {
    return routing.filter(
      (row) => Number(row.allocatedSample) > 0
    );
  }, [routing]);

  const remainingSample =
    (project?.sampleSize || 0) - totalAllocated;

  const isExactAllocation =
    project &&
    totalAllocated === project.sampleSize;

  function updateRow(
    supplyId: string,
    field: keyof RoutingRow,
    value: number
  ) {
    setRouting((current) =>
      current.map((row) => {
        if (row.supplyId !== supplyId) {
          return row;
        }

        return {
          ...row,
          [field]: value,
        };
      })
    );

    setError("");
    setSuccess("");
  }

  function autoDistribute() {
    if (!project) return;

    const activeSupplies = routing.filter(
      (row) => row.availableSample > 0
    );

    if (!activeSupplies.length) {
      setError("No suppliers have available sample.");
      return;
    }

    let remaining = project.sampleSize;

    const updated = routing.map((row) => {
      if (remaining <= 0) {
        return {
          ...row,
          allocatedSample: 0,
          routingPercent: 0,
        };
      }

      const allocation = Math.min(
        row.availableSample,
        remaining
      );

      remaining -= allocation;

      return {
        ...row,
        allocatedSample: allocation,
        routingPercent: 0,
      };
    });

    const total = updated.reduce(
      (sum, row) => sum + row.allocatedSample,
      0
    );

    const finalRows = updated.map((row) => ({
      ...row,
      routingPercent:
        total > 0
          ? Number(
              ((row.allocatedSample / total) * 100).toFixed(2)
            )
          : 0,
    }));

    setRouting(finalRows);
    setError("");
    setSuccess("");
  }

  function distributeByQuality() {
    if (!project) return;

    const available = routing.filter(
      (row) => row.availableSample > 0
    );

    if (!available.length) {
      setError("No suppliers have available sample.");
      return;
    }

    const totalQuality = available.reduce(
      (sum, row) => sum + Math.max(row.qualityScore, 1),
      0
    );

    let remaining = project.sampleSize;

    const updated = routing.map((row) => {
      if (!row.availableSample || remaining <= 0) {
        return {
          ...row,
          allocatedSample: 0,
          routingPercent: 0,
        };
      }

      const weightedAllocation = Math.round(
        (row.qualityScore / totalQuality) *
          project.sampleSize
      );

      const allocation = Math.min(
        weightedAllocation,
        row.availableSample,
        remaining
      );

      remaining -= allocation;

      return {
        ...row,
        allocatedSample: allocation,
        routingPercent: 0,
      };
    });

    // If rounding leaves some sample, fill from available suppliers.
    if (remaining > 0) {
      for (const row of updated) {
        if (remaining <= 0) break;

        const capacity =
          row.availableSample - row.allocatedSample;

        if (capacity <= 0) continue;

        const extra = Math.min(capacity, remaining);

        row.allocatedSample += extra;
        remaining -= extra;
      }
    }

    const total = updated.reduce(
      (sum, row) => sum + row.allocatedSample,
      0
    );

    const finalRows = updated.map((row) => ({
      ...row,
      routingPercent:
        total > 0
          ? Number(
              ((row.allocatedSample / total) * 100).toFixed(2)
            )
          : 0,
    }));

    setRouting(finalRows);
    setError("");
    setSuccess("");
  }

  async function saveRouting() {
    if (!project) return;

    setError("");
    setSuccess("");

    if (project.status !== "draft") {
      setError(
        "Sample routing can only be configured while the project is in draft status."
      );
      return;
    }

    if (project.surveySetup?.status !== "ready") {
      setError(
        "Please complete Survey Setup before configuring Sample Routing."
      );
      return;
    }

    if (selectedSuppliers.length === 0) {
      setError("Please allocate sample to at least one supplier.");
      return;
    }

    if (totalAllocated !== project.sampleSize) {
      setError(
        `Allocated sample must be exactly ${project.sampleSize}. Current allocation is ${totalAllocated}.`
      );
      return;
    }

    for (const row of selectedSuppliers) {
      if (row.allocatedSample > row.availableSample) {
        setError(
          `${row.supplierName} only has ${row.availableSample} available sample.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/projects/${projectId}/sample-routing`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            routing: selectedSuppliers.map((row) => ({
              supplyId: row.supplyId,
              allocatedSample: Number(row.allocatedSample),
              routingPercent: Number(row.routingPercent),
              priority: Number(row.priority),
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save sample routing"
        );
      }

      setSuccess("Sample routing saved successfully.");

      setTimeout(() => {
        router.push(
          `/project/${projectId}/review`
        );
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save sample routing"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-slate-200" />
            <div className="h-32 rounded-xl bg-white" />
            <div className="h-96 rounded-xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error || "Project not found"}
          </div>
        </div>
      </div>
    );
  }

  const canEdit = project.status === "draft";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <button
              onClick={() =>
                router.push(
                  `/project/${projectId}/survey-setup`
                )
              }
              className="hover:text-slate-900"
            >
              Survey Setup
            </button>

            <span>/</span>

            <span className="text-slate-900">
              Sample Routing
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Sample Routing
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Select suppliers and allocate sample for this
                project.
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                project.status === "draft"
                  ? "bg-amber-100 text-amber-700"
                  : project.status === "live"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {project.status.toUpperCase()}
            </span>
          </div>
        </div>

    

        {/* Project summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <SummaryCard
            label="Project"
            value={project.name}
          />

          <SummaryCard
            label="Country"
            value={project.country}
          />

          <SummaryCard
            label="Audience"
            value={project.audienceType}
          />

          <SummaryCard
            label="Required Completes"
            value={project.sampleSize.toLocaleString()}
          />

          <SummaryCard
            label="LOI"
            value={`${project.loi} min`}
          />
        </div>

        {/* Allocation status */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Required Sample
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {project.sampleSize.toLocaleString()}
            </p>
          </div>

          <div
            className={`rounded-xl border p-5 shadow-sm ${
              isExactAllocation
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-sm text-slate-600">
              Allocated Sample
            </p>

            <p
              className={`mt-1 text-2xl font-bold ${
                isExactAllocation
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {totalAllocated.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {remainingSample > 0
                ? `${remainingSample.toLocaleString()} remaining`
                : remainingSample < 0
                ? `${Math.abs(
                    remainingSample
                  ).toLocaleString()} over`
                : "Allocation complete"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Suppliers Selected
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {selectedSuppliers.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {totalRoutingPercent.toFixed(2)}% routing allocated
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-bold">!</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span className="font-bold">✓</span>
            <span>{success}</span>
          </div>
        )}

        {!canEdit && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This project is no longer in draft status.
            Sample routing cannot be modified after the project
            has been launched.
          </div>
        )}

        {/* Controls */}
        <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">
              Supplier Allocation
            </h2>

            <p className="text-sm text-slate-500">
              Allocate exactly{" "}
              <strong>{project.sampleSize}</strong>{" "}
              completes.
            </p>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={autoDistribute}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Auto Distribute
              </button>

              <button
                onClick={distributeByQuality}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Distribute by Quality
              </button>
            </div>
          )}
        </div>

        {/* Supplier table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Supplier
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Available
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    CPI
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Quality
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Historical IR
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Priority
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Allocation
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Routing %
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {routing.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center"
                    >
                      <div className="text-sm font-medium text-slate-700">
                        No suppliers available
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        No active suppliers match this
                        project&apos;s country and audience.
                      </p>
                    </td>
                  </tr>
                ) : (
                  routing.map((row) => (
                    <tr
                      key={row.supplyId}
                      className={
                        row.allocatedSample > 0
                          ? "bg-slate-50/60"
                          : ""
                      }
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {row.supplierName}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {row.supplierCode}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {row.availableSample.toLocaleString()}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                        ${row.cpi.toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span
                          className={`text-sm font-semibold ${
                            row.qualityScore >= 80
                              ? "text-emerald-600"
                              : row.qualityScore >= 60
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {row.qualityScore}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {row.historicalIr}%
                      </td>

                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          min={1}
                          value={row.priority}
                          disabled={!canEdit}
                          onChange={(e) =>
                            updateRow(
                              row.supplyId,
                              "priority",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 rounded-lg border text-black border-slate-300 px-2 py-2 text-center text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                        />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <input
                          type="number"
                          min={0}
                          max={row.availableSample}
                          value={
                            row.allocatedSample || ""
                          }
                          disabled={!canEdit}
                          onChange={(e) =>
                            updateRow(
                              row.supplyId,
                              "allocatedSample",
                              Number(e.target.value)
                            )
                          }
                          placeholder="0"
                          className="w-28 rounded-lg border text-black border-slate-300 px-3 py-2 text-right text-sm font-medium outline-none focus:border-slate-500 disabled:bg-slate-100"
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={
                              row.routingPercent || ""
                            }
                            disabled={!canEdit}
                            onChange={(e) =>
                              updateRow(
                                row.supplyId,
                                "routingPercent",
                                Number(e.target.value)
                              )
                            }
                            placeholder="0"
                            className="w-24 rounded-lg border text-black border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                          />

                          <span className="text-sm text-slate-500">
                            %
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {routing.length > 0 && (
                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-4 text-right text-sm font-semibold text-slate-700"
                    >
                      Total
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                      {totalAllocated.toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                      {totalRoutingPercent.toFixed(2)}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Allocation validation */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">
            Routing Validation
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <ValidationItem
              label="Survey Setup"
              valid={
                project.surveySetup?.status === "ready"
              }
            />

            <ValidationItem
              label="Supplier Selected"
              valid={selectedSuppliers.length > 0}
            />

            <ValidationItem
              label="Exact Sample"
              valid={Boolean(isExactAllocation)}
            />

            <ValidationItem
              label="Project Draft"
              valid={project.status === "draft"}
            />

          </div>
        </div>

        {/* Bottom navigation */}
        <div className="mt-6 flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row">
          <button
            onClick={() =>
              router.push(
                `/project/${projectId}/survey-setup`
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to Survey Setup
          </button>

          <button
            onClick={saveRouting}
            disabled={
              saving ||
              !canEdit ||
              !isExactAllocation ||
              selectedSuppliers.length === 0
            }
            className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save & Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ValidationItem({
  label,
  valid,
}: {
  label: string;
  valid: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        valid
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          valid
            ? "bg-emerald-500 text-white"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {valid ? "✓" : "—"}
      </div>

      <span
        className={`text-sm font-medium ${
          valid
            ? "text-emerald-700"
            : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function SampleRoutingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      }
    >
      <SampleRoutingContent />
    </Suspense>
  );
}