"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Link2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { generateRedirectUrls, replaceRespondentPlaceholder } from "@/lib/survey-urls";

export interface SurveyIntegrationCardProps {
  projectId: string;
  surveyUrl?: string;
  mode?: "supplier" | "client";
  title?: string;
  showEntryUrl?: boolean;
}

export default function SurveyIntegrationCard({
  projectId,
  surveyUrl = "",
  mode = "supplier",
  title,
  showEntryUrl = true,
}: SurveyIntegrationCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [sampleRid, setSampleRid] = useState<string>("TEST001");

  const templateUrls = generateRedirectUrls(projectId);

  // Compute active URLs depending on whether developer is in test mode or template mode
  const activeRid = testMode ? sampleRid.trim() || "TEST001" : "{respondentId}";

  const urls = {
    entryUrl: replaceRespondentPlaceholder(templateUrls.entryUrl, activeRid),
    completeUrl: replaceRespondentPlaceholder(templateUrls.completeUrl, activeRid),
    disqualifiedUrl: replaceRespondentPlaceholder(templateUrls.disqualifiedUrl, activeRid),
    quotaUrl: replaceRespondentPlaceholder(templateUrls.quotaUrl, activeRid),
    securityTerminateUrl: replaceRespondentPlaceholder(templateUrls.securityTerminateUrl, activeRid),
  };

  const handleCopy = (text: string, label: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setToastMessage(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isSupplier = mode === "supplier";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 sm:p-6 space-y-5 text-white shadow-xl">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs text-emerald-400 animate-in fade-in slide-in-from-top-1 duration-200">
          <Check size={14} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-medium mb-1.5">
            <Link2 size={12} />
            <span>{isSupplier ? "Survey Integration" : "Client Redirect URLs"}</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {title || (isSupplier ? "Survey Integration & Redirect Links" : "Client Redirect URLs")}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isSupplier
              ? "Share these redirect URLs with your client for complete, disqualified, quota-full, and security-termination outcomes."
              : "The client must configure these URLs in their survey system. The {respondentId} placeholder must be replaced with the actual respondent/panelist ID."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-zinc-400 font-mono bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
            PID: <strong className="text-zinc-200">{projectId}</strong>
          </span>
        </div>
      </div>

      {/* Mode Selector Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center gap-2">
          <FlaskConical size={14} className={testMode ? "text-amber-400" : "text-zinc-400"} />
          <div>
            <div className="text-xs font-semibold text-zinc-200">
              {testMode ? "Test / Preview Mode Active" : "Client Configuration Mode"}
            </div>
            <div className="text-[11px] text-zinc-400">
              {testMode
                ? "Showing executable URLs with sample respondent ID for direct browser testing."
                : "Showing template URLs containing {respondentId} to give to your client."}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {testMode && (
            <input
              type="text"
              value={sampleRid}
              onChange={(e) => setSampleRid(e.target.value)}
              placeholder="e.g. TEST001"
              className="w-28 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              title="Sample Respondent ID to test with"
            />
          )}
          <button
            type="button"
            onClick={() => setTestMode(!testMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              testMode
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {testMode ? "Switch to Client Template" : "Test with Sample ID"}
          </button>
        </div>
      </div>

      {/* Client Survey Target Link (if available) */}
      {surveyUrl && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <ExternalLink size={13} className="text-indigo-400" />
              Original Client Survey URL:
            </span>
            <span className="text-[11px] text-zinc-500">Target questionnaire</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={surveyUrl}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 select-all focus:outline-none focus:border-zinc-700"
            />
            <button
              onClick={() => handleCopy(surveyUrl, "Survey URL", "surveyUrl")}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition shrink-0"
              title="Copy Survey URL"
            >
              {copiedKey === "surveyUrl" ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Panelist Entry Link */}
      {showEntryUrl && (
        <div className="space-y-1.5 p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-400" />
              Panelist Entry URL (Our Gateway)
            </span>
            <span className="text-[11px] text-indigo-400/80">Passes respondent into client survey</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={urls.entryUrl}
              className="w-full bg-zinc-950/80 border border-indigo-500/30 rounded-xl px-3.5 py-2 text-xs font-mono text-indigo-200 select-all focus:outline-none"
            />
            {testMode && (
              <a
                href={urls.entryUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-indigo-300 text-xs font-medium flex items-center gap-1 shrink-0"
                title="Open entry URL in new tab"
              >
                <ExternalLink size={13} />
                <span>Open</span>
              </a>
            )}
            <button
              onClick={() => handleCopy(urls.entryUrl, "Panelist Entry URL", "entryUrl")}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-sm"
            >
              {copiedKey === "entryUrl" ? (
                <>
                  <Check size={13} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Redirect URLs Grid */}
  

      {/* Explanation Banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-400">
        <Info size={15} className="text-indigo-400 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          {testMode ? (
            <span>
              <strong>Developer Testing Mode:</strong> Click any <strong className="text-zinc-200">&quot;Test&quot;</strong> button to execute the callback with respondent ID <code className="text-amber-300 font-mono font-semibold">{activeRid}</code>.
            </span>
          ) : (
            <span>
              <strong>Client Configuration:</strong> Provide these URLs to your survey client. Their platform (Qualtrics, Decipher, etc.) must replace the{" "}
              <code className="text-indigo-300 font-mono font-semibold">{"{respondentId}"}</code> placeholder with the real panelist ID for all four survey outcomes.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
