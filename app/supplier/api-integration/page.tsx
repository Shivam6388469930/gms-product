"use client";

import React, { useState } from "react";
import {
  Code2,
  Key,
  Copy,
  Check,
  Play,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  Terminal,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";

export default function ApiIntegrationPage() {
  const {
    apiKeys,
    generateApiKey,
    revokeApiKey,
    runPostbackTest,
    postbackTestResult,
  } = useSupplier();

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);

  // Postback test state
  const [testUrl, setTestUrl] = useState(
    "https://api.apexsample.com/v1/postbacks/complete?rid=TEST-RID-1092&status=complete&hash=abc9812"
  );
  const [testing, setTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  // Postback URLs configuration
  const [completeUrl, setCompleteUrl] = useState(
    "https://api.apexsample.com/v1/postbacks/complete?rid=[RID]&cpi=[CPI]"
  );
  const [terminateUrl, setTerminateUrl] = useState(
    "https://api.apexsample.com/v1/postbacks/terminate?rid=[RID]&reason=[REASON]"
  );
  const [quotaUrl, setQuotaUrl] = useState(
    "https://api.apexsample.com/v1/postbacks/quota_full?rid=[RID]"
  );
  const [savedUrlsMsg, setSavedUrlsMsg] = useState(false);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const secret = await generateApiKey(newKeyName);
    setNewlyCreatedSecret(secret);
    setNewKeyName("");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleTestPostback = async () => {
    setTesting(true);
    setTestOutput(null);
    const res = await runPostbackTest(testUrl);
    setTesting(false);
    setTestOutput(res.message);
  };

  const handleSaveUrls = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedUrlsMsg(true);
    setTimeout(() => setSavedUrlsMsg(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
            <Code2 size={13} />
            <span>Developer S2S Infrastructure</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            API Integration & S2S Postbacks
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure automated Server-to-Server callbacks, HMAC signatures, and programmatic sample allocation keys.
          </p>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key size={18} className="text-indigo-400" />
              API Access Credentials
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Use Bearer token authorization in the <code className="text-indigo-300">Authorization: Bearer &lt;key&gt;</code> header.
            </p>
          </div>
        </div>

        {newlyCreatedSecret && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300">New API Key Created!</span>
              <span className="text-[10px] text-emerald-400">Save now: will not be displayed again.</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 rounded bg-zinc-950 font-mono text-emerald-200 select-all border border-emerald-500/30">
                {newlyCreatedSecret}
              </code>
              <button
                onClick={() => copyToClipboard(newlyCreatedSecret, "new-secret")}
                className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1 transition"
              >
                {copiedKeyId === "new-secret" ? <Check size={13} /> : <Copy size={13} />}
                Copy
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Key Description (e.g. US Production S2S Router)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shrink-0"
          >
            <Plus size={14} />
            Generate New Key
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Key Name</th>
                <th className="px-4 py-3 font-semibold">Token Prefix</th>
                <th className="px-4 py-3 font-semibold">Created Date</th>
                <th className="px-4 py-3 font-semibold">Last Used</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
              {apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-4 py-3.5 font-medium text-white">{k.name}</td>
                  <td className="px-4 py-3.5 font-mono text-zinc-300">{k.keyPrefix}</td>
                  <td className="px-4 py-3.5 font-mono text-zinc-400">{k.createdAt}</td>
                  <td className="px-4 py-3.5 text-zinc-400">{k.lastUsed}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        k.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {k.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {k.status === "active" && (
                      <button
                        onClick={() => revokeApiKey(k.id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-400 transition"
                        title="Revoke Token"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Server-to-Server Postbacks Configuration */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Send size={18} className="text-emerald-400" />
            Server-to-Server (S2S) Postback Endpoints
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            When a respondent finishes a survey on GMS, we make a server HTTP GET/POST callback to notify your system.
          </p>
        </div>

        {savedUrlsMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} />
            Postback configurations updated and synchronized with GMS Router.
          </div>
        )}

        <form onSubmit={handleSaveUrls} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Complete Postback URL (Eligible for CPI Credit)
            </label>
            <input
              value={completeUrl}
              onChange={(e) => setCompleteUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-zinc-400 block mt-1">
              Supports: <code className="text-indigo-300">[RID]</code>, <code className="text-indigo-300">[CPI]</code>, <code className="text-indigo-300">[TRANSACTION_ID]</code>
            </span>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Screenout / Terminate Postback URL
            </label>
            <input
              value={terminateUrl}
              onChange={(e) => setTerminateUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Quota Full (Overquota) Postback URL
            </label>
            <input
              value={quotaUrl}
              onChange={(e) => setQuotaUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
          >
            Save Postback Configuration
          </button>
        </form>
      </div>

      {/* Interactive Postback Testing Console */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal size={18} className="text-cyan-400" />
          Interactive S2S Postback Simulator
        </h3>
        <p className="text-xs text-zinc-400">
          Fire a mock HTTP 200 ping to your callback server to verify parameter parsing and SSL handshake.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleTestPostback}
            disabled={testing}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shrink-0"
          >
            {testing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {testing ? "Sending..." : "Test Endpoint"}
          </button>
        </div>

        {testOutput && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-zinc-300 text-[11px] uppercase">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Postback Test Output:
            </div>
            <div>{testOutput}</div>
          </div>
        )}
      </div>
    </div>
  );
}
