"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  SurveyOpportunity,
  RespondentSurveyHistoryItem,
  RedemptionTransaction,
  RespondentNotification,
  DemographicsProfile,
  INITIAL_SURVEY_OPPORTUNITIES,
  INITIAL_SURVEY_HISTORY,
  INITIAL_REDEMPTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DEMOGRAPHICS,
} from "./respondent-data";

interface SupportTicket {
  id: string;
  subject: string;
  category: "Survey Issue" | "Reward Payout" | "Account / Profile" | "Technical Bug";
  surveyCode?: string;
  message: string;
  status: "Open" | "In Review" | "Resolved";
  createdAt: string;
}

interface RespondentContextType {
  respondentId: string;
  pointsBalance: number;
  usdBalance: number;
  lifetimeEarnings: number;
  tierName: string;
  qualityScore: number;
  opportunities: SurveyOpportunity[];
  history: RespondentSurveyHistoryItem[];
  redemptions: RedemptionTransaction[];
  notifications: RespondentNotification[];
  demographics: DemographicsProfile;
  supportTickets: SupportTicket[];
  startSurvey: (surveyId: string) => Promise<{ success: boolean; url: string }>;
  completeSurveySimulation: (surveyId: string, result: "completed" | "screened_out" | "quota_full") => void;
  redeemReward: (rewardName: string, points: number, usd: number, payoutDestination: string) => Promise<{ success: boolean; message: string }>;
  updateDemographics: (fields: Partial<DemographicsProfile>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  createSupportTicket: (ticket: Omit<SupportTicket, "id" | "status" | "createdAt">) => void;
}

const RespondentContext = createContext<RespondentContextType | null>(null);

export function RespondentProvider({ children }: { children: React.ReactNode }) {
  const [respondentId] = useState("RESP-98421");
  const [tierName] = useState("Gold Panelist");
  const [qualityScore] = useState(98.4);

  const [pointsBalance, setPointsBalance] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gms_resp_points");
      if (saved) return Number(saved);
    }
    return 4250; // $42.50
  });

  const [lifetimeEarnings, setLifetimeEarnings] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gms_resp_lifetime");
      if (saved) return Number(saved);
    }
    return 348.50;
  });

  const [opportunities, setOpportunities] = useState<SurveyOpportunity[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gms_resp_opps");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_SURVEY_OPPORTUNITIES;
  });

  const [history, setHistory] = useState<RespondentSurveyHistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gms_resp_history");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_SURVEY_HISTORY;
  });

  const [redemptions, setRedemptions] = useState<RedemptionTransaction[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gms_resp_redemptions");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_REDEMPTIONS;
  });

  const [notifications, setNotifications] = useState<RespondentNotification[]>(INITIAL_NOTIFICATIONS);
  const [demographics, setDemographics] = useState<DemographicsProfile>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gms_resp_demo");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_DEMOGRAPHICS;
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: "TCK-8812",
      subject: "Survey terminated at question 14 without explanation",
      category: "Survey Issue",
      surveyCode: "SRV-4361",
      message: "I spent 12 minutes answering in detail, but reached a screen that said quota closed.",
      status: "Resolved",
      createdAt: "2026-10-19",
    },
    {
      id: "TCK-8924",
      subject: "Reward email confirmation delivery speed inquiry",
      category: "Reward Payout",
      message: "Checking when the virtual visa redemption batch will be issued.",
      status: "In Review",
      createdAt: "2026-10-23",
    },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gms_resp_points", pointsBalance.toString());
      localStorage.setItem("gms_resp_lifetime", lifetimeEarnings.toString());
      localStorage.setItem("gms_resp_opps", JSON.stringify(opportunities));
      localStorage.setItem("gms_resp_history", JSON.stringify(history));
      localStorage.setItem("gms_resp_redemptions", JSON.stringify(redemptions));
      localStorage.setItem("gms_resp_demo", JSON.stringify(demographics));
    }
  }, [pointsBalance, lifetimeEarnings, opportunities, history, redemptions, demographics]);

  const usdBalance = Number((pointsBalance / 100).toFixed(2));

  const startSurvey = async (surveyId: string) => {
    const opp = opportunities.find((o) => o.id === surveyId);
    if (!opp) return { success: false, url: "" };
    
    // Mark as in-progress
    setOpportunities((prev) =>
      prev.map((o) => (o.id === surveyId ? { ...o, status: "in_progress" as const } : o))
    );

    return {
      success: true,
      url: `/survey/session?surveyCode=${opp.surveyCode}&loi=${opp.estimatedLoi}&reward=${opp.rewardAmount}`,
    };
  };

  const completeSurveySimulation = (
    surveyId: string,
    result: "completed" | "screened_out" | "quota_full"
  ) => {
    const opp = opportunities.find((o) => o.id === surveyId);
    if (!opp) return;

    if (result === "completed") {
      setPointsBalance((p) => p + opp.points);
      setLifetimeEarnings((l) => Number((l + opp.rewardAmount).toFixed(2)));
      
      const newHistoryItem: RespondentSurveyHistoryItem = {
        id: `hist-${Date.now()}`,
        surveyCode: opp.surveyCode,
        title: opp.title,
        completedAt: "Just now",
        loiMinutes: opp.estimatedLoi,
        rewardEarned: opp.rewardAmount,
        pointsEarned: opp.points,
        status: "approved",
      };
      setHistory((prev) => [newHistoryItem, ...prev]);

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: `Survey Completed! +$${opp.rewardAmount.toFixed(2)}`,
          message: `You earned ${opp.points} points for completing "${opp.title}".`,
          time: "Just now",
          read: false,
          type: "reward",
        },
        ...prev,
      ]);
    } else {
      const compensation = 10; // 10 points ($0.10) for participation
      setPointsBalance((p) => p + compensation);

      const newHistoryItem: RespondentSurveyHistoryItem = {
        id: `hist-${Date.now()}`,
        surveyCode: opp.surveyCode,
        title: opp.title,
        completedAt: "Just now",
        loiMinutes: 2,
        rewardEarned: 0.10,
        pointsEarned: 10,
        status: result,
        rejectionReason:
          result === "screened_out"
            ? "Your responses did not match the specific study criteria"
            : "The target demographic quota was fulfilled",
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
    }

    // Remove from available opportunities
    setOpportunities((prev) => prev.filter((o) => o.id !== surveyId));
  };

  const redeemReward = async (
    rewardName: string,
    points: number,
    usd: number,
    payoutDestination: string
  ) => {
    if (pointsBalance < points) {
      return { success: false, message: "Insufficient point balance." };
    }

    setPointsBalance((p) => p - points);

    const isInstant = rewardName.toLowerCase().includes("amazon") || rewardName.toLowerCase().includes("apple");
    const simulatedCode = isInstant
      ? `${rewardName.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      : undefined;

    const newTx: RedemptionTransaction = {
      id: `tx-${Date.now()}`,
      rewardName,
      pointsSpent: points,
      amountUsd: usd,
      status: isInstant ? "Delivered" : "Processing",
      date: "Just now",
      payoutDestination,
      claimCode: simulatedCode,
    };

    setRedemptions((prev) => [newTx, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `Redemption Confirmed: ${rewardName}`,
        message: isInstant
          ? `Your claim code ${simulatedCode} is ready!`
          : `Your request has been queued for payout to ${payoutDestination}.`,
        time: "Just now",
        read: false,
        type: "reward",
      },
      ...prev,
    ]);

    return {
      success: true,
      message: isInstant
        ? `Claim code generated: ${simulatedCode}`
        : "Payout initiated. Sent for bank/processing approval.",
    };
  };

  const updateDemographics = (fields: Partial<DemographicsProfile>) => {
    setDemographics((prev) => ({ ...prev, ...fields }));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const createSupportTicket = (
    ticketData: Omit<SupportTicket, "id" | "status" | "createdAt">
  ) => {
    const newTicket: SupportTicket = {
      ...ticketData,
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Open",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
  };

  return (
    <RespondentContext.Provider
      value={{
        respondentId,
        pointsBalance,
        usdBalance,
        lifetimeEarnings,
        tierName,
        qualityScore,
        opportunities,
        history,
        redemptions,
        notifications,
        demographics,
        supportTickets,
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
  const context = useContext(RespondentContext);
  if (!context) {
    throw new Error("useRespondent must be used within a RespondentProvider");
  }
  return context;
}
