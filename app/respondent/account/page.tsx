"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Key,
  Smartphone,
  Mail,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function RespondentAccountPage() {
  const { respondentId, tierName } = useRespondent();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium mb-2">
          <Settings size={13} />
          <span>Security & Authentication</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Account Settings & Security
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your credentials, two-factor authentication, email preferences, and data privacy.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Account security preferences updated!</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-400">Respondent Panelist ID</div>
          <div className="text-xl font-bold text-white font-mono mt-0.5">{respondentId}</div>
          <div className="text-xs text-emerald-400 font-medium mt-1">
            Status: {tierName} • Identity Verified
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <ShieldCheck size={14} />
            KYC Verified
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Security Section */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield size={16} className="text-cyan-400" />
            Security & Login
          </h2>

          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div>
              <div className="font-semibold text-zinc-200">Two-Factor Authentication (2FA)</div>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Require an SMS or authenticator code when cashing out rewards
              </p>
            </div>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div>
              <div className="font-semibold text-zinc-200">Instant Survey Invite Emails</div>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Receive high-urgency notifications when high-paying studies launch
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => alert("Password reset link sent to your registered email.")}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Data Privacy & GDPR */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Data Privacy & GDPR Rights</h2>
          <p className="text-zinc-400 text-xs">
            You retain complete control over your research telemetry and demographic records.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => alert("Compiling your personal data export (JSON)... Download will start shortly.")}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold flex items-center gap-1.5"
            >
              <Download size={14} />
              Export My Data Archive (JSON)
            </button>

            <button
              type="button"
              onClick={() => alert("Please contact support to process right-to-be-forgotten erasure.")}
              className="px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-500/20 font-semibold flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Request Account Deletion
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition"
        >
          Save Account Preferences
        </button>
      </form>
    </div>
  );
}
