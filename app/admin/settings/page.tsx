"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Globe,
  Mail,
  Shield,
  Database,
  Bell,
  Palette,
  Save,
  Check,
  ExternalLink,
} from "lucide-react";

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

const sections: SettingSection[] = [
  {
    id: "general",
    title: "General Settings",
    description: "Platform name, URL, and basic configuration",
    icon: Globe,
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
  {
    id: "email",
    title: "Email Configuration",
    description: "SMTP settings for transactional emails",
    icon: Mail,
    gradient: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
  },
  {
    id: "security",
    title: "Security",
    description: "Authentication, tokens, and access policies",
    icon: Shield,
    gradient: "linear-gradient(135deg, #22c55e, #10b981)",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Alert preferences and notification channels",
    icon: Bell,
    gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Theme, branding, and display preferences",
    icon: Palette,
    gradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
  },
  {
    id: "database",
    title: "Database",
    description: "Connection status and data management",
    icon: Database,
    gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)",
  },
];

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState("general");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: "GMS Research Platform",
    appUrl: "",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpFrom: "",
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    maxLoginAttempts: "5",
    requireEmailVerification: true,
    enableNotifications: true,
    emailOnNewUser: true,
    emailOnNewProject: false,
    darkMode: true,
    compactMode: false,
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch((err) => console.error("Error fetching settings:", err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <div>
            <SettingField label="Platform Name" description="Display name for the platform">
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => updateSetting("platformName", e.target.value)}
                style={inputStyle}
              />
            </SettingField>
            <SettingField label="Application URL" description="Public URL for email links and redirects">
              <input
                type="text"
                value={settings.appUrl}
                onChange={(e) => updateSetting("appUrl", e.target.value)}
                placeholder="https://your-domain.com"
                style={inputStyle}
              />
            </SettingField>
          </div>
        );

      case "email":
        return (
          <div>
            <SettingField label="SMTP Host" description="Email server hostname">
              <input type="text" value={settings.smtpHost} onChange={(e) => updateSetting("smtpHost", e.target.value)} style={inputStyle} />
            </SettingField>
            <SettingField label="SMTP Port" description="Email server port (usually 587 or 465)">
              <input type="text" value={settings.smtpPort} onChange={(e) => updateSetting("smtpPort", e.target.value)} style={inputStyle} />
            </SettingField>
            <SettingField label="SMTP User" description="Authentication email address">
              <input type="email" value={settings.smtpUser} onChange={(e) => updateSetting("smtpUser", e.target.value)} style={inputStyle} />
            </SettingField>
            <SettingField label="From Address" description="Sender email for outgoing messages">
              <input type="email" value={settings.smtpFrom} onChange={(e) => updateSetting("smtpFrom", e.target.value)} style={inputStyle} />
            </SettingField>
          </div>
        );

      case "security":
        return (
          <div>
            <SettingField label="Access Token Expiry" description="How long access tokens remain valid">
              <input type="text" value={settings.accessTokenExpiry} onChange={(e) => updateSetting("accessTokenExpiry", e.target.value)} style={inputStyle} />
            </SettingField>
            <SettingField label="Refresh Token Expiry" description="How long refresh tokens remain valid">
              <input type="text" value={settings.refreshTokenExpiry} onChange={(e) => updateSetting("refreshTokenExpiry", e.target.value)} style={inputStyle} />
            </SettingField>
            <SettingField label="Max Login Attempts" description="Lock account after this many failed attempts">
              <input type="number" value={settings.maxLoginAttempts} onChange={(e) => updateSetting("maxLoginAttempts", e.target.value)} style={inputStyle} />
            </SettingField>
            <SettingField label="Require Email Verification" description="Users must verify email before accessing the platform">
              <ToggleSwitch
                value={settings.requireEmailVerification}
                onChange={(v) => updateSetting("requireEmailVerification", v)}
              />
            </SettingField>
          </div>
        );

      case "notifications":
        return (
          <div>
            <SettingField label="Enable Notifications" description="Master toggle for all notification channels">
              <ToggleSwitch
                value={settings.enableNotifications}
                onChange={(v) => updateSetting("enableNotifications", v)}
              />
            </SettingField>
            <SettingField label="New User Registration" description="Send email when a new user registers">
              <ToggleSwitch
                value={settings.emailOnNewUser}
                onChange={(v) => updateSetting("emailOnNewUser", v)}
              />
            </SettingField>
            <SettingField label="New Project Created" description="Send email when a new project is created">
              <ToggleSwitch
                value={settings.emailOnNewProject}
                onChange={(v) => updateSetting("emailOnNewProject", v)}
              />
            </SettingField>
          </div>
        );

      case "appearance":
        return (
          <div>
            <SettingField label="Dark Mode" description="Use dark theme across the admin panel">
              <ToggleSwitch
                value={settings.darkMode}
                onChange={(v) => updateSetting("darkMode", v)}
              />
            </SettingField>
            <SettingField label="Compact Mode" description="Reduce spacing for denser information display">
              <ToggleSwitch
                value={settings.compactMode}
                onChange={(v) => updateSetting("compactMode", v)}
              />
            </SettingField>
          </div>
        );

      case "database":
        return (
          <div>
            <div
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.15)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px rgba(34,197,94,0.4)",
                }}
              />
              <span style={{ color: "#4ade80", fontSize: 14, fontWeight: 500 }}>
                Database connected — MongoDB Atlas
              </span>
            </div>

            <SettingField label="Connection String" description="MongoDB connection URI (read-only)">
              <div
                style={{
                  ...inputStyle,
                  color: "rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>mongodb+srv://••••••@cluster.mongodb.net/...</span>
                <ExternalLink size={14} color="rgba(255,255,255,0.3)" />
              </div>
            </SettingField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 8 }}>
              {[
                { label: "Collections", value: "10" },
                { label: "Total Documents", value: "~2,400" },
                { label: "Indexes", value: "18" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: "16px 20px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Success Toast */}
      {saved && (
        <div
          style={{
            position: "fixed",
            top: 90,
            right: 32,
            background: "rgba(34,197,94,0.15)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 12,
            padding: "12px 20px",
            color: "#4ade80",
            fontSize: 14,
            fontWeight: 500,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Check size={16} /> Settings saved successfully!
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
            Settings
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 4 }}>
            Platform configuration and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        {/* Section Nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: isActive
                    ? "1px solid rgba(99,102,241,0.2)"
                    : "1px solid transparent",
                  background: isActive
                    ? "rgba(99,102,241,0.08)"
                    : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  fontSize: 14,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: isActive ? section.gradient : "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={isActive ? "#fff" : "rgba(255,255,255,0.4)"} />
                </div>
                <div>
                  <div style={{ fontWeight: isActive ? 600 : 400 }}>{section.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {section.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 32,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 600, margin: 0 }}>
              {sections.find((s) => s.id === activeSection)?.title}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>
              {sections.find((s) => s.id === activeSection)?.description}
            </p>
          </div>

          {renderSection()}
        </div>
      </div>
    </div>
  );
}

/* Helper Components */

function SettingField({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        gap: 24,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{description}</div>
      </div>
      <div style={{ width: 320, flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function ToggleSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48,
        height: 26,
        borderRadius: 13,
        border: "none",
        background: value
          ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
          : "rgba(255,255,255,0.1)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s ease",
        padding: 0,
        display: "block",
        marginLeft: "auto",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: value ? 25 : 3,
          transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}
