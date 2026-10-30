"use client";

import React, { useState } from "react";
import {
  UserCheck,
  CheckCircle2,
  Sparkles,
  Save,
  Briefcase,
  Home,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { useRespondent } from "@/lib/respondent-store";

export default function RespondentProfilePage() {
  const { demographics, updateDemographics } = useRespondent();
  const [formData, setFormData] = useState(demographics);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDemographics(formData);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      const newInterests = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  const allAvailableInterests = [
    "Technology",
    "Gaming",
    "Renewable Energy",
    "Investing",
    "Specialty Coffee",
    "Fitness & Health",
    "Streaming TV",
    "Travel & Airlines",
    "Automotive",
    "Cooking & Food",
    "Cryptocurrency",
    "Fashion & Apparel",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <UserCheck size={13} />
            <span>Verified Demographics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Participant Profile & Targeting Criteria
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Keeping your profile complete unlocks higher-paying research studies and reduces screenout rates.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
          <ShieldCheck size={18} className="text-emerald-400" />
          <div className="text-xs">
            <span className="text-zinc-400 block text-[10px]">GDPR & Privacy:</span>
            <span className="font-semibold text-zinc-200">Anonymized Matching</span>
          </div>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Profile changes successfully saved! New surveys matching your criteria will appear shortly.</span>
        </div>
      )}

      {/* Completion Meter */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            Profile Strength: <span className="text-emerald-400">92% Complete</span>
          </span>
          <span className="text-zinc-400">Higher score = more survey matches</span>
        </div>
        <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full w-[92%]" />
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Personal Info */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserCheck size={16} className="text-emerald-400" />
            Basic Demographics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Full Name</label>
              <input
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Email Address</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Gender Identity</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Country</label>
              <input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">State / Province & Zip</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={formData.stateOrRegion}
                  onChange={(e) => setFormData({ ...formData, stateOrRegion: e.target.value })}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Employment & Career */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-400" />
            Employment & Profession
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Employment Status</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Employed Full-Time">Employed Full-Time</option>
                <option value="Employed Part-Time">Employed Part-Time</option>
                <option value="Self-Employed / Freelancer">Self-Employed / Freelancer</option>
                <option value="Student">Student</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Industry Sector</label>
              <input
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Job Role / Title</label>
              <input
                value={formData.jobRole}
                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Annual Household Income</label>
              <input
                value={formData.annualIncome}
                onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Education Level</label>
              <input
                value={formData.educationLevel}
                onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Company Size</label>
              <input
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Interests */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Heart size={16} className="text-pink-400" />
            Topics & Research Interests
          </h2>
          <p className="text-xs text-zinc-400">
            Select the industries and consumer products you engage with regularly:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {allAvailableInterests.map((interest) => {
              const selected = formData.interests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    selected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {selected && "✓ "}
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition"
        >
          <Save size={15} />
          Save & Update Demographics
        </button>
      </form>
    </div>
  );
}
