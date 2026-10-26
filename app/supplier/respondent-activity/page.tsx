"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  Download,
  RefreshCw,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";
import { RespondentActivityLog } from "@/lib/supplier-data";

export default function RespondentActivityPage() {
  const { respondentLogs } = useSupplier();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<RespondentActivityLog | null>(null);

  const filtered = respondentLogs.filter((log) => {
    const matchesSearch =
      log.respondentId.toLowerCase().includes(search.toLowerCase()) ||
      log.sessionId.toLowerCase().includes(search.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
      log.projectTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "Mobile":
        return <Smartphone size={13} className="text-zinc-400" />;
      case "Tablet":
        return <Tablet size={13} className="text-zinc-400" />;
      default:
        return <Laptop size={13} className="text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
            <CheckCircle size={11} />
            Complete
          </span>
        );
      case "screened_out":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
            <Info size={11} />
            Screenout
          </span>
        );
      case "quota_full":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
            Overquota
          </span>
        );
      case "quality_reject":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold">
            <ShieldAlert size={11} />
            Quality Reject
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
            <Users size={13} />
            <span>Telemetry & Quality Sentinel</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Respondent Traffic & Session Stream
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time feed of panelist sessions routed to active surveys, with automated fingerprinting and fraud detection.
          </p>
        </div>

        <button
          onClick={() => alert("Exporting respondent session CSV log...")}
          className="text-xs font-medium text-zinc-200 hover:text-white px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 transition shrink-0"
        >
          <Download size={14} />
          Export CSV Log
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by Respondent ID, Session, IP Address, or Study..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Outcomes</option>
          <option value="completed">Completed (Earned CPI)</option>
          <option value="screened_out">Screened Out</option>
          <option value="quota_full">Quota Full</option>
          <option value="quality_reject">Quality Reject / Fraud</option>
        </select>
      </div>

      {/* Respondent Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Respondent / Session</th>
              <th className="px-5 py-3.5 font-semibold">Project</th>
              <th className="px-5 py-3.5 font-semibold">Geo & Device</th>
              <th className="px-5 py-3.5 font-semibold">Fraud Risk Score</th>
              <th className="px-5 py-3.5 font-semibold">Duration</th>
              <th className="px-5 py-3.5 font-semibold">Outcome</th>
              <th className="px-5 py-3.5 font-semibold">Earned</th>
              <th className="px-5 py-3.5 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
            {filtered.map((log) => {
              const fraudHigh = log.fraudScore > 75;
              const fraudMed = log.fraudScore > 25 && log.fraudScore <= 75;

              return (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-semibold text-white">
                      {log.respondentId}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">{log.sessionId}</div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="font-medium text-zinc-200 line-clamp-1">
                      {log.projectTitle}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">{log.projectId}</div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-zinc-200">
                      {getDeviceIcon(log.device)}
                      <span>{log.country}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">{log.ipAddress}</div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          fraudHigh
                            ? "bg-red-400 animate-ping"
                            : fraudMed
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span
                        className={`font-mono font-bold ${
                          fraudHigh
                            ? "text-red-400"
                            : fraudMed
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {log.fraudScore}/100
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 font-mono text-zinc-300">
                    {Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s
                  </td>

                  <td className="px-5 py-3.5">{getStatusBadge(log.status)}</td>

                  <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">
                    {log.earnedCpi > 0 ? `$${log.earnedCpi.toFixed(2)}` : "—"}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Respondent Audit Record</h3>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  ID: {selectedLog.respondentId}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Session ID</span>
                  <span className="font-mono text-zinc-200">{selectedLog.sessionId}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">IP Address</span>
                  <span className="font-mono text-zinc-200">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Device Type</span>
                  <span className="text-zinc-200">{selectedLog.device}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Geo Country</span>
                  <span className="text-zinc-200">{selectedLog.country}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-500 text-[10px] block">Fraud Detection Analysis</span>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">Machine Learning Risk Index:</span>
                  <span className="font-bold font-mono text-zinc-100">
                    {selectedLog.fraudScore} / 100
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {selectedLog.fraudScore < 20
                    ? "Safe score. Residential IP address verified, natural mouse cadence and device fingerprint consistent."
                    : selectedLog.fraudScore > 80
                    ? "High Risk Alert: Detected datacenter proxy, suspicious completion speed or duplicate fingerprint."
                    : "Moderate risk score: Minor timing deviation recorded."}
                </p>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
                <span className="text-zinc-400">Outcome CPI Payout:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  ${selectedLog.earnedCpi.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Close Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
