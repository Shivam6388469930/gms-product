"use client";

import React, { useState, useEffect } from "react";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Play,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Layers,
  ArrowRight,
  Code,
  Terminal,
} from "lucide-react";

interface SupplierLinkItem {
  id: string;
  projectId: string;
  projectTitle: string;
  supplierCode: string;
  supplierName: string;
  country: string;
  entryUrl: string;
  testUrl: string;
  returnUrls: {
    complete: string;
    screenout: string;
    quotaFull: string;
    security: string;
  };
  status: string;
}

export default function SupplierLinksAdminPage() {
  const [links, setLinks] = useState<SupplierLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<SupplierLinkItem | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/supplier-links");
      const data = await res.json();
      setLinks(data.links || []);
      if (data.links?.length > 0 && !selectedLink) {
        setSelectedLink(data.links[0]);
      }
    } catch (err) {
      console.error("Error loading links:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredLinks = links.filter((l) => {
    const matchesSearch =
      l.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      l.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      l.supplierCode.toLowerCase().includes(search.toLowerCase());
    const matchesSup = supplierFilter ? l.supplierCode === supplierFilter : true;
    return matchesSearch && matchesSup;
  });

  const suppliersList = Array.from(new Set(links.map((l) => l.supplierCode)));

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
            <Link2 size={24} color="#818cf8" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              Supplier Integration & Tracking Links
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
            Generate live entry links, test sandboxes, and postback redirect URLs with query token mapping
          </p>
        </div>
        <button
          onClick={fetchLinks}
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
          <RefreshCw size={14} /> Refresh Links
        </button>
      </div>

      {/* Integration Guide Snippet */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "rgba(99,102,241,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Code size={20} color="#a5b4fc" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
              Dynamic Macro Placeholders
            </div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
              Partner panels should replace <code style={{ color: "#a5b4fc", background: "rgba(99,102,241,0.15)", padding: "2px 5px", borderRadius: 4 }}>[RID]</code> with their unique respondent ID upon forwarding traffic.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
            [RID] = Respondent ID
          </span>
          <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
            [PID] = Project ID
          </span>
          <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
            [SUBCPID] = Sub-Source ID
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "6px 12px",
            flex: "1 1 280px",
            maxWidth: 420,
          }}
        >
          <Search size={14} color="rgba(255,255,255,0.4)" />
          <input
            type="text"
            placeholder="Search study title or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 13,
              width: "100%",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setSupplierFilter("")}
            style={{
              background: supplierFilter === "" ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.03)",
              border: supplierFilter === "" ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
              color: supplierFilter === "" ? "#a5b4fc" : "rgba(255,255,255,0.65)",
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            All Suppliers
          </button>
          {suppliersList.map((code) => (
            <button
              key={code}
              onClick={() => setSupplierFilter(code)}
              style={{
                background: supplierFilter === code ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.03)",
                border: supplierFilter === code ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
                color: supplierFilter === code ? "#a5b4fc" : "rgba(255,255,255,0.65)",
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Links List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
            Generating dynamic integration endpoints...
          </div>
        ) : filteredLinks.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
            No supplier links found matching criteria.
          </div>
        ) : (
          filteredLinks.map((link) => (
            <div
              key={link.id}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "18px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Row Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "rgba(99,102,241,0.15)",
                      color: "#a5b4fc",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {link.supplierCode}
                  </span>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 15, fontWeight: 600 }}>
                    {link.projectTitle}
                  </h3>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    ({link.country})
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: link.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                      color: link.status === "active" ? "#34d399" : "#fbbf24",
                    }}
                  >
                    {link.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => setSelectedLink(link)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    View Postbacks
                  </button>
                </div>
              </div>

              {/* Live Link Field */}
              <div
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", flex: 1 }}>
                  <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700, textTransform: "uppercase" }}>
                    LIVE:
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "monospace",
                      color: "rgba(255,255,255,0.85)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {link.entryUrl}
                  </span>
                </div>
                <button
                  onClick={() => copyText(link.entryUrl, `${link.id}-live`)}
                  style={{
                    background: copiedKey === `${link.id}-live` ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)",
                    border: "none",
                    color: copiedKey === `${link.id}-live` ? "#34d399" : "#fff",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  {copiedKey === `${link.id}-live` ? <Check size={12} /> : <Copy size={12} />}
                  {copiedKey === `${link.id}-live` ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Test Link Field */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", flex: 1 }}>
                  <span style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase" }}>
                    TEST:
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: "rgba(255,255,255,0.5)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {link.testUrl}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => copyText(link.testUrl, `${link.id}-test`)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: copiedKey === `${link.id}-test` ? "#34d399" : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    {copiedKey === `${link.id}-test` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <a
                    href={link.testUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#818cf8",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      textDecoration: "none",
                      background: "rgba(99,102,241,0.1)",
                      padding: "3px 8px",
                      borderRadius: 5,
                    }}
                  >
                    <ExternalLink size={11} /> Launch Sandbox
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Postbacks Modal */}
      {selectedLink && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#131322",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 620,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: "0 0 4px", color: "#fff", fontSize: 18 }}>
                  Postback Redirect Loops: {selectedLink.supplierCode}
                </h3>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                  Return endpoints dispatched to supplier upon respondent conclusion
                </span>
              </div>
              <button
                onClick={() => setSelectedLink(null)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Complete (Qualified)", url: selectedLink.returnUrls.complete, color: "#34d399", key: "complete" },
                { label: "Screenout (Disqualified)", url: selectedLink.returnUrls.screenout, color: "#fbbf24", key: "screenout" },
                { label: "Quota Full (Over-Quota)", url: selectedLink.returnUrls.quotaFull, color: "#c084fc", key: "quotafull" },
                { label: "Security Terminate (Fraud / Bot)", url: selectedLink.returnUrls.security, color: "#f87171", key: "security" },
              ].map((pb) => (
                <div key={pb.key} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: pb.color }}>{pb.label}</span>
                    <button
                      onClick={() => copyText(pb.url, `modal-${pb.key}`)}
                      style={{
                        background: copiedKey === `modal-${pb.key}` ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)",
                        border: "none",
                        color: copiedKey === `modal-${pb.key}` ? "#34d399" : "#fff",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {copiedKey === `modal-${pb.key}` ? <Check size={10} /> : <Copy size={10} />}
                      Copy
                    </button>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.7)", wordBreak: "break-all" }}>
                    {pb.url}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => setSelectedLink(null)}
                style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", cursor: "pointer", fontSize: 13 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
