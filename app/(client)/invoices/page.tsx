"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJSON } from "@/lib/auth-client";
import { ErrorAlert, Spinner } from "@/components/Ui";
import {
  Receipt,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Download,
  ShieldCheck,
  FileText,
} from "lucide-react";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  project: {
    _id: string;
    surveyTitle: string;
    country: string;
    sampleSize: number;
  } | null;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "issued" | "paid" | "disputed" | "cancelled";
  dueAt?: string;
  reconciliation: {
    buyerCompletes: number;
    supplierCompletes: number;
    discrepancy: number;
    status: string;
  };
  createdAt: string;
};

function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-zinc-800 text-zinc-400 border border-zinc-700",
    issued: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    paid: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    disputed: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    cancelled: "bg-zinc-800 text-zinc-500 border border-zinc-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize inline-flex items-center gap-1 ${
        styles[status] || styles.draft
      }`}
    >
      {status === "paid" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      {status === "issued" && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />}
      {status}
    </span>
  );
}

function ReconBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    matched: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    discrepant: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    resolved: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize inline-flex items-center gap-1 ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    apiJSON<{ invoices: Invoice[] }>("/api/invoices").then(({ ok, status, data }) => {
      if (!mounted) return;
      if (status === 401) {
        router.replace("/login");
        return;
      }
      if (!ok) {
        setError(data.message || "Couldn't load invoices.");
        return;
      }
      setInvoices(data.invoices || []);
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  const totalInvoiced = invoices?.reduce((s, inv) => s + inv.total, 0) ?? 0;
  const totalPaid = invoices?.filter((i) => i.status === "paid").reduce((s, inv) => s + inv.total, 0) ?? 0;
  const totalOutstanding = invoices?.filter((i) => i.status === "issued").reduce((s, inv) => s + inv.total, 0) ?? 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Receipt size={13} />
            <span>Financial & Billing Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Invoices & Complete Reconciliation
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Audit sample billing ledgers, verify completes against partner delivery reports, and track payment transactions.
          </p>
        </div>
      </div>

      <ErrorAlert message={error} />

      {/* Loading */}
      {!invoices && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <Spinner className="h-7 w-7 text-indigo-500 animate-spin" />
          <span className="text-xs text-zinc-400 font-medium">Loading invoices and reconciliation records...</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      {invoices && invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Invoiced</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Receipt size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{usd(totalInvoiced)}</div>
            <div className="mt-2 text-xs text-zinc-400">{invoices.length} total invoice records</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Paid & Settled</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{usd(totalPaid)}</div>
            <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Fully reconciled with supply nodes
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Outstanding Due</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{usd(totalOutstanding)}</div>
            <div className="mt-2 text-xs text-amber-300">Pending invoice clearance</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {invoices?.length === 0 && (
        <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <DollarSign size={26} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No invoices generated yet</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
              Invoices are automatically generated when project sample quotas reach completion.
            </p>
          </div>
        </div>
      )}

      {/* Invoices List View */}
      {invoices && invoices.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur divide-y divide-zinc-800/80 shadow-xl">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-[1.5fr_120px_110px_110px_100px_90px] items-center gap-4 px-6 py-3 bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
            <div>Invoice & Study</div>
            <div>Billed Amount</div>
            <div>Payment</div>
            <div>Recon Match</div>
            <div>Due Date</div>
            <div className="text-right">Issued Date</div>
          </div>

          {/* Table Rows */}
          {invoices.map((inv) => (
            <div
              key={inv._id}
              className="grid grid-cols-1 sm:grid-cols-[1.5fr_120px_110px_110px_100px_90px] items-center gap-4 px-6 py-4 hover:bg-zinc-800/40 transition group"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">
                    {inv.invoiceNumber}
                  </span>
                  <span className="sm:hidden">
                    <InvoiceStatusBadge status={inv.status} />
                  </span>
                </div>

                {inv.project && (
                  <Link
                    href={`/project-details/${inv.project._id}`}
                    className="block text-xs text-zinc-400 hover:text-indigo-400 transition-colors truncate"
                  >
                    {inv.project.surveyTitle}
                  </Link>
                )}

                <div className="text-[11px] text-zinc-500">
                  {inv.items.length} item{inv.items.length !== 1 ? "s" : ""} · {inv.reconciliation.buyerCompletes} buyer completes
                </div>
              </div>

              <div className="text-sm font-bold text-white font-mono">
                {usd(inv.total)}
              </div>

              <div>
                <InvoiceStatusBadge status={inv.status} />
              </div>

              <div>
                <ReconBadge status={inv.reconciliation.status} />
              </div>

              <div className="text-xs font-mono text-zinc-400">
                {inv.dueAt
                  ? new Date(inv.dueAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </div>

              <div className="text-xs font-mono text-zinc-500 sm:text-right">
                {new Date(inv.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
