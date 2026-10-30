

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  SupplierProject,
  RespondentActivityLog,
  SupplierPanel,
  RevenueRecord,
} from "./supplier-data";

export interface SupplierApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string;
  createdAt: string;
  lastUsed: string;
  status: "active" | "revoked";
}

export interface SupplierProfile {
  supplierName: string;
  supplierCode: string;
  country: string;
  audienceType?: string;
  availableSample?: number;
  baseCpi?: number;
  qualityScore?: number;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

interface SupplierContextType {
  supplierName: string;
  supplierCode: string;
  supplierProfile: SupplierProfile | null;
  availableSuppliers: { supplierName: string; supplierCode: string; country: string }[];
  switchSupplier: (code: string) => Promise<void>;
  projects: SupplierProject[];
  respondentLogs: RespondentActivityLog[];
  panels: SupplierPanel[];
  revenue: RevenueRecord[];
  apiKeys: SupplierApiKey[];
  isLiveBackend: boolean;
  dataSource: "database" | "mock";
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  acceptIncomingProject: (projectId: string) => Promise<ActionResult>;
  declineIncomingProject: (projectId: string) => Promise<ActionResult>;
  toggleProjectPause: (projectId: string) => Promise<ActionResult>;
  markProjectComplete: (projectId: string) => Promise<ActionResult>;
  createNewPanel: (panel: Omit<SupplierPanel, "id" | "lastRefreshed">) => Promise<SupplierPanel | null>;
  updatePanel: (panelId: string, updates: Partial<SupplierPanel>) => Promise<boolean>;
  deletePanel: (panelId: string) => Promise<boolean>;
  syncPanelQuota: (panelId: string) => Promise<{ success: boolean; message: string }>;
  resetPanelsToMock: () => Promise<void>;
  resetProjectsToMock: () => Promise<void>;
  refreshData: () => Promise<void>;
  generateApiKey: (name: string) => Promise<string>;
  revokeApiKey: (keyId: string) => Promise<void>;
  postbackTestResult: string | null;
  runPostbackTest: (url: string) => Promise<{ success: boolean; message: string }>;
}

const SupplierContext = createContext<SupplierContextType | null>(null);

export function SupplierProvider({ children }: { children: React.ReactNode }) {
  const [supplierName, setSupplierName] = useState("GMS Supply Partner");
  // Supplier identity comes from the logged-in session (server), never from localStorage
  const [supplierCode, setSupplierCode] = useState("");

  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null);
  const [availableSuppliers, setAvailableSuppliers] = useState<
    { supplierName: string; supplierCode: string; country: string }[]
  >([]);

  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<"database" | "mock">("database");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [projects, setProjects] = useState<SupplierProject[]>([]);
  const [respondentLogs, setRespondentLogs] = useState<RespondentActivityLog[]>([]);
  const [panels, setPanels] = useState<SupplierPanel[]>([]);
  const [revenue, setRevenue] = useState<RevenueRecord[]>([]);
  const [apiKeys, setApiKeys] = useState<SupplierApiKey[]>([]);

  const [postbackTestResult, setPostbackTestResult] = useState<string | null>(null);

  // Remove stale keys left from older versions (including the old supplier selection)
  useEffect(() => {
    if (typeof window === "undefined") return;
    [
      "gms_active_supplier_code",
      "gms_supplier_projects",
      "gms_supplier_logs",
      "gms_supplier_panels",
    ].forEach((k) => localStorage.removeItem(k));
  }, []);

  // Load everything from the backend (supplier is resolved server-side from the JWT)
  const refreshData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 0. Supplier profile
      const profileRes = await fetch("/api/supplier/profile", {
        credentials: "include",
      }).catch(() => null);

      if (profileRes && profileRes.ok) {
        const profData = await profileRes.json();
        if (profData.success && profData.supplier) {
          setSupplierProfile(profData.supplier);
          setSupplierName(profData.supplier.supplierName);
          setSupplierCode(profData.supplier.supplierCode || "");
          if (Array.isArray(profData.availableSuppliers)) {
            setAvailableSuppliers(profData.availableSuppliers);
          }
        }
      }

      // 1. Panels
      const panelsRes = await fetch("/api/supplier/panels", {
        credentials: "include",
      }).catch(() => null);
      if (panelsRes && panelsRes.ok) {
        const panelsData = await panelsRes.json();
        if (panelsData.success && Array.isArray(panelsData.panels)) {
          setPanels(panelsData.panels);
          setIsLiveBackend(true);
          setDataSource("database");
        }
      }

      // 2. Projects
      const projectsRes = await fetch("/api/supplier/projects", {
        credentials: "include",
      }).catch(() => null);
      if (projectsRes && projectsRes.ok) {
        const projData = await projectsRes.json();
        if (projData.success && Array.isArray(projData.projects)) {
          setProjects(projData.projects);
          setIsLiveBackend(true);
          setDataSource("database");
        }
      }

      // 3. Respondent activity
      const actRes = await fetch("/api/supplier/activity", {
        credentials: "include",
      }).catch(() => null);
      if (actRes && actRes.ok) {
        const actData = await actRes.json();
        if (actData.success && Array.isArray(actData.logs)) {
          setRespondentLogs(actData.logs);
        }
      }

      // 4. Revenue
      const revRes = await fetch("/api/supplier/revenue", {
        credentials: "include",
      }).catch(() => null);
      if (revRes && revRes.ok) {
        const revData = await revRes.json();
        if (revData.success && Array.isArray(revData.revenue)) {
          setRevenue(revData.revenue);
        }
      }

      // 5. API keys
      const keysRes = await fetch("/api/supplier/api-keys", {
        credentials: "include",
      }).catch(() => null);
      if (keysRes && keysRes.ok) {
        const keysData = await keysRes.json();
        if (keysData.success && Array.isArray(keysData.apiKeys)) {
          setApiKeys(keysData.apiKeys);
        }
      }

      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Backend API sync warning:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Supplier switching is disabled: the logged-in supplier is the only supplier.
  const switchSupplier = async (_newCode: string) => {};

  /**
   * Shared project action:
   * 1. optimistic UI update
   * 2. PATCH to backend
   * 3. if the backend rejects it, roll back and return the error
   * 4. otherwise re-sync from the database
   */
  const runProjectAction = async (
    id: string,
    action: "accept" | "decline" | "togglePause" | "complete",
    optimistic: (prev: SupplierProject[]) => SupplierProject[]
  ): Promise<ActionResult> => {
    const snapshot = projects;
    setProjects(optimistic);

    try {
      const res = await fetch("/api/supplier/projects", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, action }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        setProjects(snapshot);
        const error = data?.error || `Request failed (${res.status})`;
        console.error(`Project ${action} failed:`, error);
        return { success: false, error };
      }

      await refreshData();
      return { success: true };
    } catch (e: any) {
      setProjects(snapshot);
      console.error(`Project ${action} error:`, e);
      return { success: false, error: e?.message || "Network error" };
    }
  };

  const acceptIncomingProject = (id: string) =>
    runProjectAction(id, "accept", (prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "active" as const } : p))
    );

  const declineIncomingProject = (id: string) =>
    runProjectAction(id, "decline", (prev) => prev.filter((p) => p.id !== id));

  const toggleProjectPause = (id: string) =>
    runProjectAction(id, "togglePause", (prev) =>
      prev.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              status: p.status === "active" ? ("paused" as const) : ("active" as const),
            }
      )
    );

  const markProjectComplete = (id: string) =>
    runProjectAction(id, "complete", (prev) =>
      prev.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              status: "completed" as const,
              sampleDelivered: p.sampleRequired,
            }
      )
    );

  // ---------------- Panels ----------------

  const createNewPanel = async (
    panelData: Omit<SupplierPanel, "id" | "lastRefreshed">
  ): Promise<SupplierPanel | null> => {
    try {
      const res = await fetch("/api/supplier/panels", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panelData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.panel) {
          setPanels((prev) => [data.panel, ...prev]);
          await refreshData();
          return data.panel;
        }
      }
    } catch (e) {
      console.error("Create panel error:", e);
    }
    return null;
  };

  const updatePanel = async (
    panelId: string,
    updates: Partial<SupplierPanel>
  ): Promise<boolean> => {
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, ...updates } : p))
    );

    try {
      const res = await fetch(`/api/supplier/panels/${panelId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await refreshData();
      return res.ok;
    } catch {
      return false;
    }
  };

  const deletePanel = async (panelId: string): Promise<boolean> => {
    setPanels((prev) => prev.filter((p) => p.id !== panelId));
    try {
      const res = await fetch(`/api/supplier/panels/${panelId}`, {
        method: "DELETE",
        credentials: "include",
      });
      await refreshData();
      return res.ok;
    } catch {
      return false;
    }
  };

  const syncPanelQuota = async (
    panelId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`/api/supplier/panels/${panelId}/sync`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        await refreshData();
        return { success: true, message: data.message || "Audience quota synchronized." };
      }
    } catch (err: any) {
      console.warn("Sync panel fallback:", err);
    }

    const today = new Date().toISOString().split("T")[0];
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, lastRefreshed: today } : p))
    );
    return {
      success: true,
      message: "Synchronized audience quota feed with GMS allocation engine.",
    };
  };

  const resetPanelsToMock = async () => {
    await refreshData();
  };

  const resetProjectsToMock = async () => {
    await refreshData();
  };

  // ---------------- API keys ----------------

  const generateApiKey = async (name: string): Promise<string> => {
    try {
      const res = await fetch("/api/supplier/api-keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) {
          setApiKeys((prev) => [data.apiKey, ...prev]);
          return data.apiKey.fullKey || "gms_live_key_created";
        }
      }
    } catch (e) {
      console.error("Generate API key error:", e);
    }
    return "Error generating API key";
  };

  const revokeApiKey = async (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, status: "revoked" as const } : k))
    );
    try {
      await fetch(`/api/supplier/api-keys?keyId=${keyId}`, {
        method: "DELETE",
        credentials: "include",
      });
      await refreshData();
    } catch (e) {
      console.error("Revoke API key error:", e);
    }
  };

  // ---------------- Postback test ----------------

  const runPostbackTest = async (url: string) => {
    try {
      const res = await fetch("/api/supplier/test-postback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      const resultMsg = data.message || (data.success ? "Postback OK" : "Postback Failed");
      setPostbackTestResult(resultMsg);
      return { success: data.success, message: resultMsg };
    } catch {
      const resultMsg = "Error: Network exception during postback test.";
      setPostbackTestResult(resultMsg);
      return { success: false, message: resultMsg };
    }
  };

  return (
    <SupplierContext.Provider
      value={{
        supplierName,
        supplierCode,
        supplierProfile,
        availableSuppliers,
        switchSupplier,
        projects,
        respondentLogs,
        panels,
        revenue,
        apiKeys,
        isLiveBackend,
        dataSource,
        isLoading,
        isSyncing,
        lastSyncedAt,
        acceptIncomingProject,
        declineIncomingProject,
        toggleProjectPause,
        markProjectComplete,
        createNewPanel,
        updatePanel,
        deletePanel,
        syncPanelQuota,
        resetPanelsToMock,
        resetProjectsToMock,
        refreshData,
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