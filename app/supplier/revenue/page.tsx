"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Download,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";

export default function SupplierRevenuePage() {
  const { revenue } = useSupplier();
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const totalPaidOut = revenue
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.netPayout, 0);

  const pendingPayout = revenue
    .filter((r) => r.status === "processing" || r.status === "pending")
    .reduce((sum, r) => sum + r.netPayout, 0);

  const handleDownloadInvoice = (inv: string) => {
    setDownloadMsg(`Generated tax invoice ${inv}. Downloading PDF...`);
    setTimeout(() => setDownloadMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <DollarSign size={13} />
            <span>Financial Settlement & Payouts</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Supplier Revenue & Earnings Ledger
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track automated fieldwork compensation, monthly remittance batches, and download reconciled billing invoices.
          </p>
        </div>

        <button
          onClick={() => handleDownloadInvoice("YEAR-2026-SUMMARY")}
          className="text-xs font-medium text-zinc-200 hover:text-white px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 transition shrink-0"
        >
          <FileText size={14} />
          Annual Tax Summary (2026)
        </button>
      </div>

      {downloadMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{downloadMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-1">
          <span className="text-xs text-zinc-400">Current Pending Remittance</span>
          <div className="text-2xl font-black text-amber-300 tracking-tight">
            ${pendingPayout.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
            <Clock size={12} />
            <span>Next settlement scheduled Nov 5, 2026</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-1">
          <span className="text-xs text-zinc-400">Lifetime Settled Payouts</span>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            ${totalPaidOut.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>100% reconciled on-chain / ACH</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-1">
          <span className="text-xs text-zinc-400">Active Payout Account</span>
          <div className="text-sm font-bold text-white flex items-center gap-2 mt-1">
            <Building2 size={16} className="text-indigo-400" />
            <span>JPMorgan Chase Wire •• 4910</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">
            Status: KYC Verified
          </div>
        </div>
      </div>

      {/* Settlement Invoices Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            Monthly Payout Statements & Invoices
          </h2>
          <span className="text-xs text-zinc-400 font-mono">Currency: USD</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 font-semibold">Invoice #</th>
                <th className="px-4 py-3 font-semibold">Completes</th>
                <th className="px-4 py-3 font-semibold">Avg CPI</th>
                <th className="px-4 py-3 font-semibold">Gross</th>
                <th className="px-4 py-3 font-semibold">Fee (2%)</th>
                <th className="px-4 py-3 font-semibold">Net Payout</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
              {revenue.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-4 py-3.5 font-semibold text-white">{row.period}</td>
                  <td className="px-4 py-3.5 font-mono text-indigo-400">{row.invoiceNumber}</td>
                  <td className="px-4 py-3.5 font-mono">{row.completesCount.toLocaleString()}</td>
                  <td className="px-4 py-3.5 font-mono">${row.avgCpi.toFixed(2)}</td>
                  <td className="px-4 py-3.5 font-mono text-zinc-200">
                    ${row.grossRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-zinc-400">
                    -${row.processingFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-400 text-sm">
                    ${row.netPayout.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        row.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {row.status === "paid" ? "Paid Remittance" : "Processing Batch"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(row.invoiceNumber)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                    >
                      <Download size={13} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
