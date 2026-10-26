"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  SupplierProject,
  RespondentActivityLog,
  SupplierPanel,
  RevenueRecord,
  INITIAL_SUPPLIER_PROJECTS,
  INITIAL_RESPONDENT_LOGS,
  INITIAL_SUPPLIER_PANELS,
  INITIAL_REVENUE_RECORDS,
} from "./supplier-data";

interface SupplierApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string;
  createdAt: string;
  lastUsed: string;
  status: "active" | "revoked";
}

interface SupplierContextType {
  supplierName: string;
  supplierCode: string;
  projects: SupplierProject[];
  respondentLogs: RespondentActivityLog[];
  panels: SupplierPanel[];
  revenue: RevenueRecord[];
  apiKeys: SupplierApiKey[];
  acceptIncomingProject: (projectId: string) => void;
  declineIncomingProject: (projectId: string) => void;
  toggleProjectPause: (projectId: string) => void;
  markProjectComplete: (projectId: string) => void;
  createNewPanel: (panel: Omit<SupplierPanel, "id" | "lastRefreshed">) => void;
  generateApiKey: (name: string) => string;
  revokeApiKey: (keyId: string) => void;
  postbackTestResult: string | null;
  runPostbackTest: (url: string) => Promise<{ success: boolean; message: string }>;
}

const SupplierContext = createContext<SupplierContextType | null>(null);

export function SupplierProvider({ children }: { children: React.ReactNode }) {
  const [supplierName] = useState("Apex Global Sample Network");
  const [supplierCode] = useState("SUP_APEX");
  
  const [projects, setProjects] = useState<SupplierProject[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gms_supplier_projects");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_SUPPLIER_PROJECTS;
  });

  const [respondentLogs, setRespondentLogs] = useState<RespondentActivityLog[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gms_supplier_logs");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_RESPONDENT_LOGS;
  });

  const [panels, setPanels] = useState<SupplierPanel[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gms_supplier_panels");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_SUPPLIER_PANELS;
  });

  const [revenue] = useState<RevenueRecord[]>(INITIAL_REVENUE_RECORDS);

  const [apiKeys, setApiKeys] = useState<SupplierApiKey[]>([
    {
      id: "key-1",
      name: "Production Routing API Key",
      keyPrefix: "gms_live_8921a4f...",
      createdAt: "2026-08-10",
      lastUsed: "Just now",
      status: "active",
    },
    {
      id: "key-2",
      name: "Staging Sandbox Integration",
      keyPrefix: "gms_test_39801b7...",
      createdAt: "2026-09-15",
      lastUsed: "2 days ago",
      status: "active",
    },
  ]);

  const [postbackTestResult, setPostbackTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gms_supplier_projects", JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gms_supplier_logs", JSON.stringify(respondentLogs));
    }
  }, [respondentLogs]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gms_supplier_panels", JSON.stringify(panels));
    }
  }, [panels]);

  const acceptIncomingProject = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "active" as const } : p))
    );
  };

  const declineIncomingProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleProjectPause = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          status: p.status === "active" ? ("paused" as const) : ("active" as const),
        };
      })
    );
  };

  const markProjectComplete = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          status: "completed" as const,
          sampleDelivered: p.sampleRequired,
        };
      })
    );
  };

  const createNewPanel = (panelData: Omit<SupplierPanel, "id" | "lastRefreshed">) => {
    const newPanel: SupplierPanel = {
      ...panelData,
      id: `pnl-${Date.now()}`,
      lastRefreshed: new Date().toISOString().split("T")[0],
    };
    setPanels((prev) => [newPanel, ...prev]);
  };

  const generateApiKey = (name: string) => {
    const rawSecret = `gms_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const newKey: SupplierApiKey = {
      id: `key-${Date.now()}`,
      name: name.trim() || "New API Integration Key",
      keyPrefix: `${rawSecret.substring(0, 14)}...`,
      fullKey: rawSecret,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      status: "active",
    };
    setApiKeys((prev) => [newKey, ...prev]);
    return rawSecret;
  };

  const revokeApiKey = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, status: "revoked" as const } : k))
    );
  };

  const runPostbackTest = async (url: string) => {
    // Simulate server-to-server HTTP 200 postback call
    await new Promise((resolve) => setTimeout(resolve, 800));
    const isSuccess = url.includes("http");
    const resultMsg = isSuccess
      ? `HTTP 200 OK: S2S Postback delivered successfully. Payload accepted: {"event": "complete", "rid": "TEST-RESP-994", "status": "200"}`
      : "Error: Invalid postback URL provided. Must start with http:// or https://";
    setPostbackTestResult(resultMsg);
    return { success: isSuccess, message: resultMsg };
  };

  return (
    <SupplierContext.Provider
      value={{
        supplierName,
        supplierCode,
        projects,
        respondentLogs,
        panels,
        revenue,
        apiKeys,
        acceptIncomingProject,
        declineIncomingProject,
        toggleProjectPause,
        markProjectComplete,
        createNewPanel,
        generateApiKey,
        revokeApiKey,
        postbackTestResult,
        runPostbackTest,
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
}

export function useSupplier() {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error("useSupplier must be used within a SupplierProvider");
  }
  return context;
}
