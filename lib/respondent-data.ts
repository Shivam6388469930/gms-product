// lib/respondent-data.ts

export interface SurveyOpportunity {
  id: string;
  surveyCode: string;
  title: string;
  category: "Technology" | "Lifestyle & Consumer" | "Healthcare" | "Finance & Investments" | "Workplace & Career";
  rewardAmount: number;
  points: number;
  estimatedLoi: number; // in minutes
  matchScore: number; // 0 - 100%
  expiresInHours: number;
  deviceAllowed: ("Desktop" | "Mobile" | "Tablet")[];
  qualificationHint: string;
  difficulty: "Easy" | "Moderate" | "In-Depth";
  status: "available" | "in_progress" | "completed" | "screened_out";
}

export interface RespondentSurveyHistoryItem {
  id: string;
  surveyCode: string;
  title: string;
  completedAt: string;
  loiMinutes: number;
  rewardEarned: number;
  pointsEarned: number;
  status: "approved" | "pending_review" | "screened_out" | "quota_full";
  rejectionReason?: string;
}

export interface RewardOption {
  id: string;
  name: string;
  category: "gift_card" | "cash" | "crypto" | "charity";
  minPoints: number;
  usdEquivalent: number;
  image: string;
  popular?: boolean;
  instantDelivery: boolean;
}

export interface RedemptionTransaction {
  id: string;
  rewardName: string;
  pointsSpent: number;
  amountUsd: number;
  status: "Delivered" | "Processing" | "Pending Verification";
  date: string;
  payoutDestination: string;
  claimCode?: string;
}

export interface RespondentNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "survey" | "reward" | "tier" | "system";
}

export interface DemographicsProfile {
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  stateOrRegion: string;
  postalCode: string;
  employmentStatus: string;
  industry: string;
  jobRole: string;
  companySize: string;
  annualIncome: string;
  educationLevel: string;
  householdSize: number;
  hasChildren: boolean;
  primaryDevice: string;
  carOwner: boolean;
  interests: string[];
}

export const INITIAL_SURVEY_OPPORTUNITIES: SurveyOpportunity[] = [
  {
    id: "opp-1",
    surveyCode: "SRV-4412",
    title: "Generative AI Assistants in Everyday Programming",
    category: "Technology",
    rewardAmount: 6.50,
    points: 650,
    estimatedLoi: 12,
    matchScore: 98,
    expiresInHours: 6,
    deviceAllowed: ["Desktop"],
    qualificationHint: "Software engineers or developers working with AI code completions",
    difficulty: "Easy",
    status: "available",
  },
  {
    id: "opp-2",
    surveyCode: "SRV-4418",
    title: "Streaming Entertainment & Subscription Fatigue Study",
    category: "Lifestyle & Consumer",
    rewardAmount: 2.25,
    points: 225,
    estimatedLoi: 8,
    matchScore: 92,
    expiresInHours: 14,
    deviceAllowed: ["Desktop", "Mobile", "Tablet"],
    qualificationHint: "Subscribes to at least 1 video streaming service (Netflix, Prime, Disney+)",
    difficulty: "Easy",
    status: "available",
  },
  {
    id: "opp-3",
    surveyCode: "SRV-4422",
    title: "Personal Banking & Mobile Payment Security Opinions",
    category: "Finance & Investments",
    rewardAmount: 4.80,
    points: 480,
    estimatedLoi: 15,
    matchScore: 88,
    expiresInHours: 18,
    deviceAllowed: ["Desktop", "Mobile"],
    qualificationHint: "Holds an active checking account and uses Apple Pay, Google Pay, or Venmo",
    difficulty: "Moderate",
    status: "available",
  },
  {
    id: "opp-4",
    surveyCode: "SRV-4429",
    title: "Remote Work Ergonomics & Hardware Preferences",
    category: "Workplace & Career",
    rewardAmount: 3.50,
    points: 350,
    estimatedLoi: 10,
    matchScore: 84,
    expiresInHours: 24,
    deviceAllowed: ["Desktop", "Mobile", "Tablet"],
    qualificationHint: "Works remotely or hybrid at least 2 days a week",
    difficulty: "Easy",
    status: "available",
  },
  {
    id: "opp-5",
    surveyCode: "SRV-4435",
    title: "Healthcare Telehealth Consultations & Prescription Delivery",
    category: "Healthcare",
    rewardAmount: 8.00,
    points: 800,
    estimatedLoi: 20,
    matchScore: 76,
    expiresInHours: 36,
    deviceAllowed: ["Desktop"],
    qualificationHint: "Used online doctor consultation or prescription app in past 12 months",
    difficulty: "In-Depth",
    status: "available",
  },
];

export const INITIAL_SURVEY_HISTORY: RespondentSurveyHistoryItem[] = [
  {
    id: "hist-1",
    surveyCode: "SRV-4399",
    title: "Smart Home Security & IoT Device Usability",
    completedAt: "Oct 23, 2026",
    loiMinutes: 11,
    rewardEarned: 3.20,
    pointsEarned: 320,
    status: "approved",
  },
  {
    id: "hist-2",
    surveyCode: "SRV-4384",
    title: "Electric Vehicle Charging Station Access Evaluation",
    completedAt: "Oct 21, 2026",
    loiMinutes: 14,
    rewardEarned: 4.50,
    pointsEarned: 450,
    status: "approved",
  },
  {
    id: "hist-3",
    surveyCode: "SRV-4370",
    title: "Cloud Infrastructure Tooling & CI/CD Pipelines",
    completedAt: "Oct 19, 2026",
    loiMinutes: 18,
    rewardEarned: 7.00,
    pointsEarned: 700,
    status: "approved",
  },
  {
    id: "hist-4",
    surveyCode: "SRV-4361",
    title: "Enterprise Cybersecurity Awareness",
    completedAt: "Oct 18, 2026",
    loiMinutes: 2,
    rewardEarned: 0.10,
    pointsEarned: 10,
    status: "screened_out",
    rejectionReason: "Industry quota for IT Security Executives was already fulfilled",
  },
  {
    id: "hist-5",
    surveyCode: "SRV-4355",
    title: "Grocery Shopping & Brand Loyalty Survey",
    completedAt: "Oct 16, 2026",
    loiMinutes: 9,
    rewardEarned: 2.50,
    pointsEarned: 250,
    status: "approved",
  },
  {
    id: "hist-6",
    surveyCode: "SRV-4348",
    title: "Luxury Travel & Airline Cabin Experience",
    completedAt: "Oct 14, 2026",
    loiMinutes: 3,
    rewardEarned: 0.10,
    pointsEarned: 10,
    status: "quota_full",
    rejectionReason: "Survey target reached maximum quota for your age group",
  },
];

export const REWARD_OPTIONS: RewardOption[] = [
  {
    id: "rwd-paypal",
    name: "PayPal Cash",
    category: "cash",
    minPoints: 1000,
    usdEquivalent: 10.00,
    image: "💵",
    popular: true,
    instantDelivery: true,
  },
  {
    id: "rwd-amazon",
    name: "Amazon Gift Card",
    category: "gift_card",
    minPoints: 500,
    usdEquivalent: 5.00,
    image: "🛒",
    popular: true,
    instantDelivery: true,
  },
  {
    id: "rwd-apple",
    name: "Apple Gift Card",
    category: "gift_card",
    minPoints: 1000,
    usdEquivalent: 10.00,
    image: "🍎",
    instantDelivery: true,
  },
  {
    id: "rwd-visa",
    name: "Virtual Visa Card",
    category: "cash",
    minPoints: 2000,
    usdEquivalent: 20.00,
    image: "💳",
    popular: true,
    instantDelivery: false,
  },
  {
    id: "rwd-bank",
    name: "Direct ACH Bank Transfer",
    category: "cash",
    minPoints: 2500,
    usdEquivalent: 25.00,
    image: "🏦",
    instantDelivery: false,
  },
  {
    id: "rwd-charity",
    name: "Donate to Red Cross",
    category: "charity",
    minPoints: 500,
    usdEquivalent: 5.00,
    image: "❤️",
    instantDelivery: true,
  },
];

export const INITIAL_REDEMPTIONS: RedemptionTransaction[] = [
  {
    id: "tx-991",
    rewardName: "Amazon Gift Card $25",
    pointsSpent: 2500,
    amountUsd: 25.00,
    status: "Delivered",
    date: "Oct 18, 2026",
    payoutDestination: "alex.morgan@researcher.io",
    claimCode: "AMZN-9281-K9X2-5501",
  },
  {
    id: "tx-990",
    rewardName: "PayPal Cash $20",
    pointsSpent: 2000,
    amountUsd: 20.00,
    status: "Delivered",
    date: "Sep 29, 2026",
    payoutDestination: "alex.morgan@researcher.io",
  },
  {
    id: "tx-989",
    rewardName: "Amazon Gift Card $15",
    pointsSpent: 1500,
    amountUsd: 15.00,
    status: "Delivered",
    date: "Sep 08, 2026",
    payoutDestination: "alex.morgan@researcher.io",
    claimCode: "AMZN-1184-P2L8-7390",
  },
];

export const INITIAL_NOTIFICATIONS: RespondentNotification[] = [
  {
    id: "notif-1",
    title: "High-paying survey match ($6.50)",
    message: "A new study on Generative AI Programming is waiting for you with a 98% profile match.",
    time: "10 mins ago",
    read: false,
    type: "survey",
  },
  {
    id: "notif-2",
    title: "Reward processed successfully",
    message: "Your Amazon $25 Gift Card code AMZN-9281-K9X2-5501 has been delivered to your inbox.",
    time: "2 days ago",
    read: true,
    type: "reward",
  },
  {
    id: "notif-3",
    title: "Gold Tier Status Maintained",
    message: "Your Quality Score is at 98.2%. You enjoy a 10% bonus boost on all survey completions!",
    time: "5 days ago",
    read: true,
    type: "tier",
  },
];

export const INITIAL_DEMOGRAPHICS: DemographicsProfile = {
  fullName: "Alex Morgan",
  email: "alex.morgan@researcher.io",
  dateOfBirth: "1994-06-15",
  gender: "Non-binary",
  country: "United States",
  stateOrRegion: "California",
  postalCode: "94107",
  employmentStatus: "Employed Full-Time",
  industry: "Technology / Software",
  jobRole: "Senior Software Engineer",
  companySize: "250 - 999 Employees",
  annualIncome: "$120,000 - $149,999",
  educationLevel: "Bachelor's Degree",
  householdSize: 2,
  hasChildren: false,
  primaryDevice: "MacBook Pro / iPhone 15",
  carOwner: true,
  interests: ["Technology", "Gaming", "Renewable Energy", "Investing", "Specialty Coffee"],
};
