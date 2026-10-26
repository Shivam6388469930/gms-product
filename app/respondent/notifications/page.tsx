"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Gift,
  Compass,
  Award,
  Info,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function RespondentNotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useRespondent();

  const getIcon = (type: string) => {
    switch (type) {
      case "survey":
        return <Compass size={16} className="text-emerald-400" />;
      case "reward":
        return <Gift size={16} className="text-amber-400" />;
      case "tier":
        return <Award size={16} className="text-indigo-400" />;
      default:
        return <Info size={16} className="text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
            <Bell size={13} />
            <span>Activity Alerts</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Notifications & Invitations
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time survey invitations, reward fulfillment confirmations, and account tier notices.
          </p>
        </div>

        <button
          onClick={markAllNotificationsRead}
          className="text-xs font-semibold text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 transition shrink-0"
        >
          <CheckCheck size={14} className="text-emerald-400" />
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500">
            No notifications right now.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markNotificationRead(item.id)}
              className={`p-4 rounded-xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                item.read
                  ? "bg-zinc-950/40 border-zinc-800/60 opacity-80"
                  : "bg-zinc-950/90 border-emerald-500/30 shadow-md"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{item.title}</h3>
                    {!item.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 font-mono shrink-0">
                {item.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
