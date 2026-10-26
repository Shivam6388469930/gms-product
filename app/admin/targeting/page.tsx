"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Globe,
  Smartphone,
  Users,
  MapPin,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Save,
  Sliders,
  Filter,
} from "lucide-react";

interface ProjectTargeting {
  _id: string;
  surveyTitle: string;
  country: string;
  audienceType: string;
  status: string;
  targeting?: {
    country?: string;
    language?: string;
    gender?: string;
    age?: any;
    income?: any;
    employment?: string;
    education?: string;
    device?: string;
    location?: {
      state?: string[];
      dma?: string[];
      zipcode?: string[];
    };
  };
  screener?: {
    enabled?: boolean;
    blockDuplicateIp?: boolean;
    strictIpTermination?: boolean;
    questions?: {
      id: string;
      questionText: string;
      category: string;
      options: { id: string; label: string; isQualifying: boolean }[];
    }[];
  };
}

export default function TargetingAdminPage() {
  const [projects, setProjects] = useState<ProjectTargeting[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"demographics" | "geography" | "devices" | "screeners">("demographics");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [gender, setGender] = useState("All");
  const [language, setLanguage] = useState("English");
  const [device, setDevice] = useState("All");
  const [employment, setEmployment] = useState("All");
  const [education, setEducation] = useState("All");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/targeting");
      const data = await res.json();
      setProjects(data.projects || []);
      if (data.projects?.length > 0) {
        const p = data.projects[0];
        setSelectedProjectId(p._id);
        populateForm(p);
      }
    } catch (err) {
      console.error("Error fetching targeting:", err);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (p: ProjectTargeting) => {
    setGender(p.targeting?.gender || "All");
    setLanguage(p.targeting?.language || "English");
    setDevice(p.targeting?.device || "All");
    setEmployment(p.targeting?.employment || "All");
    setEducation(p.targeting?.education || "All");
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    const p = projects.find((x) => x._id === id);
    if (p) populateForm(p);
  };

  const activeProject = projects.find((p) => p._id === selectedProjectId) || projects[0];

  const handleSaveTargeting = async () => {
    if (!activeProject) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/targeting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject._id,
          targeting: {
            ...activeProject.targeting,
            gender,
            language,
            device,
            employment,
            education,
          },
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Error saving targeting:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Target size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Sample Targeting & Qualification Matrix
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Fine-tune demographic filters, geographic boundaries, device permissions, and screener question branching
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchProjects}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleSaveTargeting}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              color: "#fff",
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saving ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            {saveSuccess ? "Saved!" : "Save Targeting"}
          </button>
        </div>
      </div>

      {/* Project Selector Bar */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500 }}>
          Targeting Study:
        </span>
        <select
          value={selectedProjectId}
          onChange={(e) => handleSelectProject(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: "8px 14px",
            color: "#fff",
            fontSize: 13,
            minWidth: 320,
          }}
        >
          {projects.map((p) => (
            <option key={p._id} value={p._id} style={{ background: "#111" }}>
              {p.surveyTitle} — {p.country} ({p.audienceType})
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 10 }}>
        {[
          { key: "demographics", label: "Demographics", icon: Users },
          { key: "geography", label: "Geographics", icon: MapPin },
          { key: "devices", label: "Devices & Tech", icon: Smartphone },
          { key: "screeners", label: "Screener Questions", icon: HelpCircle },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 8,
                background: active ? "rgba(99,102,241,0.2)" : "transparent",
                border: active ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent",
                color: active ? "#a5b4fc" : "rgba(255,255,255,0.55)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "demographics" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} color="#818cf8" /> Gender & Language
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>Gender Criteria</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                >
                  <option value="All" style={{ background: "#111" }}>All Genders (Even Split)</option>
                  <option value="Male Only" style={{ background: "#111" }}>Male Only (100%)</option>
                  <option value="Female Only" style={{ background: "#111" }}>Female Only (100%)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>Survey Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Sliders size={18} color="#34d399" /> Employment & Education
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>Employment Status</label>
                <select
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                >
                  <option value="All" style={{ background: "#111" }}>All Employment Types</option>
                  <option value="Employed Full-Time" style={{ background: "#111" }}>Employed Full-Time</option>
                  <option value="Business Decision Maker" style={{ background: "#111" }}>B2B Decision Maker</option>
                  <option value="Student" style={{ background: "#111" }}>Student</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>Education Level</label>
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
                >
                  <option value="All" style={{ background: "#111" }}>Any Education Level</option>
                  <option value="High School or Higher" style={{ background: "#111" }}>High School or Higher</option>
                  <option value="Undergraduate Degree" style={{ background: "#111" }}>Undergraduate Degree</option>
                  <option value="Postgraduate / PhD" style={{ background: "#111" }}>Postgraduate / PhD</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "geography" && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={18} color="#f59e0b" /> Geographic Restrictions: {activeProject?.country || "United States"}
          </h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>
            Target specific states, designated market areas (DMAs), or zip code batches.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>Included States / Regions</label>
              <textarea
                rows={4}
                placeholder="CA, NY, TX, FL, IL (Leave empty for nationwide)"
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>Target Zipcodes (CSV or Line Separated)</label>
              <textarea
                rows={4}
                placeholder="10001, 90210, 30301 (Optional)"
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "devices" && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Smartphone size={18} color="#38bdf8" /> Device Eligibility & Operating Systems
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 500 }}>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>Supported Devices</label>
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
              >
                <option value="All" style={{ background: "#111" }}>All Devices (Desktop, Mobile, Tablet)</option>
                <option value="Desktop Only" style={{ background: "#111" }}>Desktop Only (Laptop & PC)</option>
                <option value="Mobile Only" style={{ background: "#111" }}>Mobile Smartphones Only</option>
                <option value="Tablet & Mobile" style={{ background: "#111" }}>Tablet & Mobile Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "screeners" && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <HelpCircle size={18} color="#c084fc" /> Pre-Survey Screener Questions
            </h3>
            <span style={{ fontSize: 12, color: "#34d399", background: "rgba(16,185,129,0.1)", padding: "3px 8px", borderRadius: 6 }}>
              {activeProject?.screener?.questions?.length || 0} Questions Active
            </span>
          </div>

          {activeProject?.screener?.questions && activeProject.screener.questions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeProject.screener.questions.map((q, i) => (
                <div key={q.id || i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14 }}>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Q{i + 1}: {q.questionText}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {q.options?.map((opt) => (
                      <span
                        key={opt.id}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: opt.isQualifying ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                          color: opt.isQualifying ? "#34d399" : "#f87171",
                          border: opt.isQualifying ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
                        }}
                      >
                        {opt.label} ({opt.isQualifying ? "Pass" : "Screenout"})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
              No custom screener questions configured for this study. All incoming respondents proceed directly to quota check.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
