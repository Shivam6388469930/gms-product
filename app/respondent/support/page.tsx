"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  ChevronDown,
  Clock,
  Sparkles,
  LifeBuoy,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function RespondentSupportPage() {
  const { supportTickets, createSupportTicket } = useRespondent();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<
    "Survey Issue" | "Reward Payout" | "Account / Profile" | "Technical Bug"
  >("Survey Issue");
  const [surveyCode, setSurveyCode] = useState("");
  const [message, setMessage] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "When are survey points added to my wallet balance?",
      a: "Points are credited immediately upon completing the final question of a study and reaching the completion screen. For rare high-value studies requiring client data audit, points may show as pending for up to 24 hours.",
    },
    {
      q: "Why did I get screened out of a study?",
      a: "Researchers look for very specific participants (e.g. owners of a specific electric car or IT decision makers). If your responses don't match that exact quota, you are screened out. GMS always credits 10 points to compensate for your time.",
    },
    {
      q: "How fast are digital gift cards and PayPal payouts delivered?",
      a: "Amazon and Apple gift card claim codes are delivered instantly on your Rewards screen. PayPal and ACH bank transfers are processed in daily batches within 24 to 48 hours.",
    },
    {
      q: "What should I do if a survey freezes or shows a technical error?",
      a: "Copy the Survey Code (e.g. SRV-4412) and submit a ticket below. Our panel support team will review the question timestamp and manual credit points to your account.",
    },
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    createSupportTicket({
      subject: subject.trim(),
      category,
      surveyCode: surveyCode.trim() || undefined,
      message: message.trim(),
    });

    setSubject("");
    setSurveyCode("");
    setMessage("");
    setTicketSuccess(true);
    setTimeout(() => setTicketSuccess(false), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-2">
          <HelpCircle size={13} />
          <span>Panelist Help Desk</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Support & Frequently Asked Questions
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Have an inquiry regarding a survey or reward payout? Find quick answers or contact our team directly.
        </p>
      </div>

      {ticketSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Support ticket submitted! A member of our panel desk will reply within 4 hours.</span>
        </div>
      )}

      {/* FAQ Accordion */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <LifeBuoy size={16} className="text-emerald-400" />
          Common Inquiries
        </h2>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden text-xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-zinc-200 hover:text-white transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={15}
                    className={`text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-zinc-400 leading-relaxed border-t border-zinc-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Ticket & Active Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-cyan-400" />
            Submit a Help Ticket
          </h2>

          <form onSubmit={handleSubmitTicket} className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Inquiry Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Survey Issue">Survey Technical Issue / Freeze</option>
                <option value="Reward Payout">Reward Payout / Claim Code Inquiry</option>
                <option value="Account / Profile">Account / Demographic Profile</option>
                <option value="Technical Bug">General Bug Report</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Subject</label>
              <input
                required
                placeholder="e.g. Survey froze after question 12"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Survey Code (Optional)
              </label>
              <input
                placeholder="e.g. SRV-4418"
                value={surveyCode}
                onChange={(e) => setSurveyCode(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Detailed Explanation</label>
              <textarea
                required
                rows={4}
                placeholder="Please describe what happened..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center gap-2 transition"
            >
              <Send size={14} />
              Submit Ticket
            </button>
          </form>
        </div>

        {/* Existing Tickets */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock size={16} className="text-amber-400" />
            Your Ticket Status
          </h2>

          <div className="space-y-3">
            {supportTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-zinc-300">{ticket.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      ticket.status === "Resolved"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : ticket.status === "In Review"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <div className="font-semibold text-white">{ticket.subject}</div>
                <p className="text-zinc-400 leading-relaxed text-[11px] line-clamp-2">
                  {ticket.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500 font-mono">
                  <span>Category: {ticket.category}</span>
                  <span>{ticket.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
