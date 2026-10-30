
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import {
  SurveyOpportunity,
  RespondentSurveyHistoryItem,
  RedemptionTransaction,
  RespondentNotification,
  DemographicsProfile,
  INITIAL_REDEMPTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DEMOGRAPHICS,
} from "./respondent-data";

/*
 * IMPORTANT:
 *
 * DO NOT IMPORT ANYTHING FROM "@/lib/auth" HERE.
 *
 * ❌ import { getUserId } from "@/lib/auth";
 * ❌ import { getCurrentUser } from "@/lib/auth";
 * ❌ import { requireAuth } from "@/lib/auth";
 *
 * Authentication is handled by:
 *
 * Client Store
 *     ↓
 * /api/respondent/profile
 *     ↓
 * Server API
 *     ↓
 * getUserId()
 *     ↓
 * HTTP-only accessToken cookie
 */

interface SupportTicket {
  id: string;
  subject: string;
  category:
    | "Survey Issue"
    | "Reward Payout"
    | "Account / Profile"
    | "Technical Bug";
  surveyCode?: string;
  message: string;
  status:
    | "Open"
    | "In Review"
    | "Resolved";
  createdAt: string;
}

interface RespondentContextType {
  respondentId: string;

  respondentName: string;
  respondentEmail: string;

  supplierName: string;
  supplierEmail: string;

  pointsBalance: number;
  usdBalance: number;
  lifetimeEarnings: number;

  tierName: string;
  qualityScore: number;

  opportunities: SurveyOpportunity[];
  activeSurveys: SurveyOpportunity[];
  history: RespondentSurveyHistoryItem[];

  redemptions: RedemptionTransaction[];
  notifications: RespondentNotification[];
  demographics: DemographicsProfile;
  supportTickets: SupportTicket[];

  isLoading: boolean;
  error: string | null;

  refreshProfile: () => Promise<void>;

  logout: () => Promise<void>;

  startSurvey: (
    surveyId: string
  ) => Promise<{
    success: boolean;
    url: string;
  }>;

  completeSurveySimulation: (
    surveyId: string,
    result:
      | "completed"
      | "screened_out"
      | "quota_full"
  ) => void;

  redeemReward: (
    rewardName: string,
    points: number,
    usd: number,
    payoutDestination: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;

  updateDemographics: (
    fields: Partial<DemographicsProfile>
  ) => void;

  markNotificationRead: (
    id: string
  ) => void;

  markAllNotificationsRead: () => void;

  createSupportTicket: (
    ticket: Omit<
      SupportTicket,
      "id" | "status" | "createdAt"
    >
  ) => void;
}

const RespondentContext =
  createContext<RespondentContextType | null>(
    null
  );

function getSurveyUrl(opp: any): string {
  return (
    opp?.surveyUrl ||
    opp?.publicUrl ||
    opp?.url ||
    opp?.link ||
    ""
  );
}

export function RespondentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ============================================================
  // BACKEND DATA
  // ============================================================

  const [
    respondentId,
    setRespondentId,
  ] = useState("");

  const [
    respondentName,
    setRespondentName,
  ] = useState("");

  const [
    respondentEmail,
    setRespondentEmail,
  ] = useState("");

  const [
    supplierName,
    setSupplierName,
  ] = useState("");

  const [
    supplierEmail,
    setSupplierEmail,
  ] = useState("");

  const [
    tierName,
    setTierName,
  ] = useState("Panelist");

  const [
    qualityScore,
    setQualityScore,
  ] = useState(0);

  const [
    pointsBalance,
    setPointsBalance,
  ] = useState(0);

  const [
    lifetimeEarnings,
    setLifetimeEarnings,
  ] = useState(0);

  const [
    opportunities,
    setOpportunities,
  ] = useState<SurveyOpportunity[]>(
    []
  );

  const [
    history,
    setHistory,
  ] = useState<
    RespondentSurveyHistoryItem[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  // ============================================================
  // LOCAL DATA
  // ============================================================

  const [
    redemptions,
    setRedemptions,
  ] = useState<RedemptionTransaction[]>(
    INITIAL_REDEMPTIONS
  );

  const [
    notifications,
    setNotifications,
  ] = useState<RespondentNotification[]>(
    INITIAL_NOTIFICATIONS
  );

  const [
    demographics,
    setDemographics,
  ] = useState<DemographicsProfile>(
    INITIAL_DEMOGRAPHICS
  );

  const [
    supportTickets,
    setSupportTickets,
  ] = useState<SupportTicket[]>([]);

  const [
    localLoaded,
    setLocalLoaded,
  ] = useState(false);

  // ============================================================
  // LOCAL STORAGE
  // ============================================================

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    [
      "gms_resp_points",
      "gms_resp_lifetime",
      "gms_resp_opps",
      "gms_resp_history",
    ].forEach((key) =>
      localStorage.removeItem(key)
    );

    try {
      const savedRedemptions =
        localStorage.getItem(
          "gms_resp_redemptions"
        );

      if (savedRedemptions) {
        setRedemptions(
          JSON.parse(savedRedemptions)
        );
      }

      const savedDemographics =
        localStorage.getItem(
          "gms_resp_demo"
        );

      if (savedDemographics) {
        setDemographics(
          JSON.parse(savedDemographics)
        );
      }
    } catch (err) {
      console.error(
        "Failed to load respondent local data:",
        err
      );
    }

    setLocalLoaded(true);
  }, []);

  useEffect(() => {
    if (
      !localLoaded ||
      typeof window === "undefined"
    ) {
      return;
    }

    localStorage.setItem(
      "gms_resp_redemptions",
      JSON.stringify(redemptions)
    );

    localStorage.setItem(
      "gms_resp_demo",
      JSON.stringify(demographics)
    );
  }, [
    localLoaded,
    redemptions,
    demographics,
  ]);

  // ============================================================
  // LOAD CURRENT RESPONDENT
  // ============================================================

  const refreshProfile =
    useCallback(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          "/api/respondent/profile",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          await res.json().catch(
            () => null
          );

        if (res.status === 401) {
          setError(
            "Your session has expired. Please log in again."
          );

          return;
        }

        if (
          !res.ok ||
          !data?.success ||
          !data?.respondent
        ) {
          setError(
            data?.error ||
              `Could not load your profile (${res.status})`
          );

          return;
        }

        const respondent =
          data.respondent;

        // ======================================================
        // RESPONDENT
        // ======================================================

        setRespondentId(
          respondent.respondentId || ""
        );

        setRespondentName(
          respondent.name ||
            "Respondent"
        );

        setRespondentEmail(
          respondent.email || ""
        );

        // ======================================================
        // SUPPLIER
        // ======================================================

        setSupplierName(
          respondent.supplier?.name ||
            respondent.supplierName ||
            "Unknown Supplier"
        );

        setSupplierEmail(
          respondent.supplier?.email ||
            respondent.supplierEmail ||
            ""
        );

        // ======================================================
        // BALANCE
        // ======================================================

        setTierName(
          respondent.tierName ||
            "Panelist"
        );

        setQualityScore(
          Number(
            respondent.qualityScore ?? 0
          )
        );

        setPointsBalance(
          Number(
            respondent.pointsBalance ?? 0
          )
        );

        setLifetimeEarnings(
          Number(
            respondent.totalEarnings ?? 0
          )
        );

        // ======================================================
        // OPPORTUNITIES
        // ======================================================

        setOpportunities(
          Array.isArray(
            data.opportunities
          )
            ? data.opportunities
            : []
        );

        // ======================================================
        // HISTORY
        // ======================================================

        setHistory(
          Array.isArray(data.history)
            ? data.history
            : []
        );
      } catch (err: any) {
        console.error(
          "Respondent profile sync error:",
          err
        );

        setError(
          err?.message ||
            "Network error while loading your profile"
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout =
    useCallback(async () => {
      try {
        const res = await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          await res.json().catch(
            () => null
          );

        if (!res.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Logout failed"
          );
        }

        // Clear client state
        setRespondentId("");
        setRespondentName("");
        setRespondentEmail("");

        setSupplierName("");
        setSupplierEmail("");

        setPointsBalance(0);
        setLifetimeEarnings(0);
        setTierName("Panelist");
        setQualityScore(0);

        setOpportunities([]);
        setHistory([]);

        // Redirect after successful logout
        window.location.href =
          "/login";
      } catch (err) {
        console.error(
          "Respondent logout error:",
          err
        );

        throw err;
      }
    }, []);

  // ============================================================
  // BALANCE
  // ============================================================

  const usdBalance = Number(
    (
      pointsBalance / 100
    ).toFixed(2)
  );

  // ============================================================
  // ACTIVE SURVEYS
  // ============================================================

  const activeSurveys =
    useMemo(
      () =>
        opportunities.filter(
          (opportunity: any) =>
            opportunity.status ===
            "in_progress"
        ),
      [opportunities]
    );

  // ============================================================
  // SURVEY ACTION
  // ============================================================

  const startSurvey = async (
    surveyId: string
  ) => {
    const opportunity =
      opportunities.find(
        (item: any) =>
          item.id === surveyId
      );

    const url =
      getSurveyUrl(
        opportunity
      );

    if (!url) {
      return {
        success: false,
        url: "",
      };
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    return {
      success: true,
      url,
    };
  };

  // ============================================================
  // SIMULATION
  // ============================================================

  const completeSurveySimulation = (
    surveyId: string,
    result:
      | "completed"
      | "screened_out"
      | "quota_full"
  ) => {
    setOpportunities(
      (previous) =>
        previous.map(
          (opportunity: any) =>
            opportunity.id ===
            surveyId
              ? {
                  ...opportunity,
                  status:
                    result ===
                    "completed"
                      ? "completed"
                      : result,
                }
              : opportunity
        )
    );
  };

  // ============================================================
  // REDEEM
  // ============================================================

  const redeemReward = async (
    rewardName: string,
    points: number,
    usd: number,
    payoutDestination: string
  ) => {
    if (
      pointsBalance < points
    ) {
      return {
        success: false,
        message:
          "Insufficient point balance.",
      };
    }

    setPointsBalance(
      (previous) =>
        previous - points
    );

    const isInstant =
      rewardName
        .toLowerCase()
        .includes("amazon") ||
      rewardName
        .toLowerCase()
        .includes("apple");

    const code = isInstant
      ? `${rewardName
          .substring(0, 4)
          .toUpperCase()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`
      : undefined;

    setRedemptions(
      (previous) => [
        {
          id: `tx-${Date.now()}`,
          rewardName,
          pointsSpent: points,
          amountUsd: usd,
          status: isInstant
            ? "Delivered"
            : "Processing",
          date: "Just now",
          payoutDestination,
          claimCode: code,
        } as RedemptionTransaction,
        ...previous,
      ]
    );

    setNotifications(
      (previous) => [
        {
          id: `notif-${Date.now()}`,
          title: `Redemption Confirmed: ${rewardName}`,
          message: isInstant
            ? `Your claim code ${code} is ready!`
            : `Your request has been queued for payout to ${payoutDestination}.`,
          time: "Just now",
          read: false,
          type: "reward",
        } as RespondentNotification,
        ...previous,
      ]
    );

    return {
      success: true,
      message: isInstant
        ? `Claim code generated: ${code}`
        : "Payout initiated. Sent for bank/processing approval.",
    };
  };

  // ============================================================
  // DEMOGRAPHICS
  // ============================================================

  const updateDemographics = (
    fields: Partial<DemographicsProfile>
  ) => {
    setDemographics(
      (previous) => ({
        ...previous,
        ...fields,
      })
    );
  };

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const markNotificationRead = (
    id: string
  ) => {
    setNotifications(
      (previous) =>
        previous.map(
          (notification) =>
            notification.id === id
              ? {
                  ...notification,
                  read: true,
                }
              : notification
        )
    );
  };

  const markAllNotificationsRead =
    () => {
      setNotifications(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              read: true,
            })
          )
      );
    };

  // ============================================================
  // SUPPORT
  // ============================================================

  const createSupportTicket = (
    ticketData: Omit<
      SupportTicket,
      "id" | "status" | "createdAt"
    >
  ) => {
    setSupportTickets(
      (previous) => [
        {
          ...ticketData,
          id: `TCK-${Math.floor(
            1000 +
              Math.random() * 9000
          )}`,
          status: "Open",
          createdAt:
            new Date()
              .toISOString()
              .split("T")[0],
        },
        ...previous,
      ]
    );
  };

  // ============================================================
  // PROVIDER
  // ============================================================

  return (
    <RespondentContext.Provider
      value={{
        respondentId,

        respondentName,
        respondentEmail,

        supplierName,
        supplierEmail,

        pointsBalance,
        usdBalance,
        lifetimeEarnings,

        tierName,
        qualityScore,

        opportunities,
        activeSurveys,
        history,

        redemptions,
        notifications,
        demographics,
        supportTickets,

        isLoading,
        error,

        refreshProfile,
        logout,

        startSurvey,
        completeSurveySimulation,
        redeemReward,

        updateDemographics,

        markNotificationRead,
        markAllNotificationsRead,

        createSupportTicket,
      }}
    >
      {children}
    </RespondentContext.Provider>
  );
}

export function useRespondent() {
  const context =
    useContext(
      RespondentContext
    );

  if (!context) {
    throw new Error(
      "useRespondent must be used within a RespondentProvider"
    );
  }

  return context;
}
