import type { Estimate, FeasibilityStatus } from "@/lib/project-config";

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const statusStyle: Record<FeasibilityStatus, string> = {
  feasible: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  at_risk: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  not_feasible: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};
const statusLabel: Record<FeasibilityStatus, string> = {
  feasible: "Feasible",
  at_risk: "At risk",
  not_feasible: "Not feasible",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function EstimateCard({ estimate, loading }: { estimate: Estimate | null; loading?: boolean }) {
  return (
    <aside
      aria-live="polite"
      className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Feasibility &amp; quote</h2>
        {estimate?.status && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[estimate.status]}`}>
            {statusLabel[estimate.status]}
          </span>
        )}
      </div>

      {!estimate ? (
        <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">
          {loading ? "Calculating…" : "Fill in the details to see feasibility and price."}
        </p>
      ) : (
        <div className={loading ? "opacity-60 transition" : "transition"}>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            <Row label="Available sample" value={estimate.availableSample.toLocaleString()} />
            <Row
              label="Expected completes"
              value={
                estimate.expectedCompletes.toLocaleString() +
                (estimate.fillRate != null ? ` (${Math.round(estimate.fillRate * 100)}%)` : "")
              }
            />
            <Row label="CPI range" value={`${usd(estimate.cpiMin)} – ${usd(estimate.cpiMax)}`} />
            <Row label="Total cost" value={`${usd(estimate.totalMin)} – ${usd(estimate.totalMax)}`} />
            <Row label="Field time" value={`~${estimate.fieldTimeDays} day${estimate.fieldTimeDays > 1 ? "s" : ""}`} />
            <Row label="Confidence" value={estimate.confidence[0].toUpperCase() + estimate.confidence.slice(1)} />
          </div>

          {!!estimate.steps?.length && (
            <details className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">
                How this was calculated
              </summary>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                {estimate.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </details>
          )}

          <ul className="mt-4 list-disc space-y-1 pl-4 text-xs text-zinc-500 dark:text-zinc-400">
            {estimate.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            Generated {new Date(estimate.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </aside>
  );
}