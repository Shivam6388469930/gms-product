"use client";

import React, { useState } from "react";
import {
  Gift,
  Wallet,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  CreditCard,
  Building2,
  X,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";
import { REWARD_OPTIONS, RewardOption } from "@/lib/respondent-data";

export default function RewardsEarningsPage() {
  const { pointsBalance, usdBalance, lifetimeEarnings, redemptions, redeemReward } = useRespondent();

  const [selectedReward, setSelectedReward] = useState<RewardOption | null>(null);
  const [payoutDestination, setPayoutDestination] = useState("alex.morgan@researcher.io");
  const [redeeming, setRedeeming] = useState(false);
  const [successModal, setSuccessModal] = useState<{ name: string; code?: string; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReward) return;

    setRedeeming(true);
    const res = await redeemReward(
      selectedReward.name,
      selectedReward.minPoints,
      selectedReward.usdEquivalent,
      payoutDestination
    );
    setRedeeming(false);

    if (res.success) {
      setSuccessModal({
        name: selectedReward.name,
        code: res.message.includes("Claim code")
          ? res.message.replace("Claim code generated: ", "")
          : undefined,
        message: res.message,
      });
      setSelectedReward(null);
    } else {
      alert(res.message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
          <Gift size={13} />
          <span>Reward Redemption Catalog</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Rewards, Payouts & Lifetime Earnings
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Exchange your earned points for cash deposits, digital gift cards, or charitable contributions.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Ready to Cash Out</span>
          <div className="text-3xl font-black text-white tracking-tight">
            ${usdBalance.toFixed(2)}
          </div>
          <div className="text-xs font-mono text-emerald-400 mt-1">
            {pointsBalance.toLocaleString()} points available
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Total Lifetime Earnings</span>
          <div className="text-3xl font-black text-white tracking-tight">
            ${lifetimeEarnings.toFixed(2)}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Transferred & redeemed safely
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Payout Delivery Speed</span>
          <div className="text-lg font-bold text-emerald-400 tracking-tight flex items-center gap-1.5 mt-1">
            <Sparkles size={16} />
            <span>Instant Digital Fulfillment</span>
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Amazon & Apple codes generated immediately
          </div>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Choose Your Reward</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REWARD_OPTIONS.map((reward) => {
            const canAfford = pointsBalance >= reward.minPoints;
            return (
              <div
                key={reward.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700/80 p-5 space-y-4 flex flex-col justify-between transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{reward.image}</span>
                    {reward.popular && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Popular
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{reward.name}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                      Min: {reward.minPoints.toLocaleString()} pts (${reward.usdEquivalent.toFixed(2)})
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    {reward.instantDelivery ? "⚡ Instant code" : "1-2 Business Days"}
                  </span>

                  <button
                    onClick={() => setSelectedReward(reward)}
                    disabled={!canAfford}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      canAfford
                        ? "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-sm"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    {canAfford ? "Redeem" : "Need more pts"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Redemptions Ledger */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Redemption History & Claim Codes</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Reward</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Points Spent</th>
                <th className="px-5 py-3.5 font-semibold">Delivery Destination</th>
                <th className="px-5 py-3.5 font-semibold">Claim Code</th>
                <th className="px-5 py-3.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
              {redemptions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-5 py-4 font-semibold text-white">{tx.rewardName}</td>
                  <td className="px-5 py-4 text-zinc-400 font-mono">{tx.date}</td>
                  <td className="px-5 py-4 font-mono font-bold text-amber-400">
                    -{tx.pointsSpent} pts (${tx.amountUsd.toFixed(2)})
                  </td>
                  <td className="px-5 py-4 text-zinc-300 font-mono">{tx.payoutDestination}</td>
                  <td className="px-5 py-4">
                    {tx.claimCode ? (
                      <code className="px-2 py-1 rounded bg-zinc-950 text-emerald-300 font-mono border border-emerald-500/20 select-all">
                        {tx.claimCode}
                      </code>
                    ) : (
                      <span className="text-zinc-500 font-mono">Direct Deposit</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                      <CheckCircle2 size={11} />
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redeem Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{selectedReward.image}</span>
                Confirm {selectedReward.name}
              </h3>
              <button
                onClick={() => setSelectedReward(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRedeem} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>Points to deduct:</span>
                  <span className="font-bold font-mono text-amber-400">
                    -{selectedReward.minPoints} pts
                  </span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Cash value:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ${selectedReward.usdEquivalent.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Recipient Email / Payout Address
                </label>
                <input
                  required
                  type="email"
                  value={payoutDestination}
                  onChange={(e) => setPayoutDestination(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReward(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeeming}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold"
                >
                  {redeeming ? "Processing..." : "Confirm & Redeem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-zinc-950 p-6 space-y-4 shadow-2xl text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Redemption Successful!</h3>
              <p className="text-xs text-zinc-400 mt-1">{successModal.message}</p>
            </div>

            {successModal.code && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <span className="text-[11px] text-zinc-400 block font-medium">Your Gift Card Claim Code:</span>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-sm font-bold font-mono text-emerald-400 select-all">
                    {successModal.code}
                  </code>
                  <button
                    onClick={() => copyCode(successModal.code!)}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    title="Copy code"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setSuccessModal(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
