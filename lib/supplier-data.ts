// lib/supplier-data.ts

export interface SupplierProject {
  id: string;
  projectId: string;
  title: string;
  clientName: string;
  audience: "consumer" | "b2b" | "healthcare";
  country: string;
  sampleRequired: number;
  sampleDelivered: number;
  cpi: number;
  totalValue: number;
  loi: number; // in minutes
  ir: number; // incidence rate %
  status: "incoming" | "active" | "paused" | "completed";
  receivedDate: string;
  deadlineDate: string;
  surveyUrlTemplate: string;
  qualityScoreRequired: number;
  description: string;
}

export interface RespondentActivityLog {
  id: string;
  sessionId: string;
  respondentId: string;
  projectTitle: string;
  projectId: string;
  country: string;
  device: "Desktop" | "Mobile" | "Tablet";
  ipAddress: string;
  fraudScore: number; // 0 - 100
  durationSeconds: number;
  status: "completed" | "screened_out" | "quota_full" | "quality_reject" | "in_progress";
  earnedCpi: number;
  timestamp: string;
  date?: string;
}

export interface SupplierPanel {
  id: string;
  name: string;
  category: "Consumer" | "B2B Tech" | "Healthcare HCP" | "Gen Z & Youth" | "Finance & Banking";
  country: string;
  activeMembers: number;
  responseRate: number; // %
  avgCompletionTime: number; // min
  qualityIndex: number; // 0 - 100
  status: "Active" | "Recruiting" | "Maintenance";
  lastRefreshed: string;
}

export interface RevenueRecord {
  id: string;
  period: string;
  grossRevenue: number;
  completesCount: number;
  avgCpi: number;
  processingFee: number;
  netPayout: number;
  status: "paid" | "processing" | "pending";
  invoiceNumber: string;
  paymentMethod: string;
  payoutDate: string;
}

export const INITIAL_SUPPLIER_PROJECTS: SupplierProject[] = [
  {
    id: "proj-inc-101",
    projectId: "PRJ-9921",
    title: "Global Enterprise Cloud Migration Survey",
    clientName: "Enterprise Research Inc",
    audience: "b2b",
    country: "US",
    sampleRequired: 450,
    sampleDelivered: 0,
    cpi: 18.50,
    totalValue: 8325,
    loi: 14,
    ir: 32,
    status: "incoming",
    receivedDate: "2026-10-23",
    deadlineDate: "2026-11-05",
    surveyUrlTemplate: "https://survey.researchpulse.io/s/9921?sup=SUP_APEX&rid=[RID]",
    qualityScoreRequired: 85,
    description: "Targeting IT Decision Makers, VP of Infrastructure, and Cloud Architects in firms with 500+ employees.",
  },
  {
    id: "proj-inc-102",
    projectId: "PRJ-9925",
    title: "Electric Vehicle Consumer Purchase Intent 2027",
    clientName: "Automotive Insights Group",
    audience: "consumer",
    country: "UK",
    sampleRequired: 1200,
    sampleDelivered: 0,
    cpi: 3.80,
    totalValue: 4560,
    loi: 10,
    ir: 65,
    status: "incoming",
    receivedDate: "2026-10-24",
    deadlineDate: "2026-10-31",
    surveyUrlTemplate: "https://survey.researchpulse.io/s/9925?sup=SUP_APEX&rid=[RID]",
    qualityScoreRequired: 80,
    description: "General vehicle owners evaluating EV vs Hybrid purchase within the next 18 months.",
  },
  {
    id: "proj-inc-103",
    projectId: "PRJ-9928",
    title: "Oncology Drug Prescription Protocols",
    clientName: "Biomedical Dynamics",
    audience: "healthcare",
    country: "DE",
    sampleRequired: 150,
    sampleDelivered: 0,
    cpi: 85.00,
    totalValue: 12750,
    loi: 22,
    ir: 18,
    status: "incoming",
    receivedDate: "2026-10-24",
    deadlineDate: "2026-11-12",
    surveyUrlTemplate: "https://survey.researchpulse.io/s/9928?sup=SUP_APEX&rid=[RID]",
    qualityScoreRequired: 92,
    description: "Board-certified Oncologists practicing in university hospitals treating metastatic cancer patients.",
  },
  {
    id: "proj-act-201",
    projectId: "PRJ-8810",
    title: "Next-Gen Fintech & Mobile Payments Usability",
    clientName: "Stripe / PayGlobal Labs",
    audience: "consumer",
    country: "US",
    sampleRequired: 2000,
    sampleDelivered: 1420,
    cpi: 4.25,
    totalValue: 8500,
    loi: 12,
    ir: 55,
    status: "active",
    receivedDate: "2026-10-15",
    deadlineDate: "2026-10-28",
    surveyUrlTemplate: "https://survey.researchpulse.io/s/8810?sup=SUP_APEX&rid=[RID]",
    qualityScoreRequired: 80,
    description: "Daily mobile wallet and digital banking consumers aged 18-45 across all US states.",
  },
  {
    id: "proj-act-202",
    projectId: "PRJ-8814",
    title: "AI Developer Tooling & CoPilot Adoption Study",
    clientName: "DevCorp Ventures",
    audience: "b2b",
    country: "US",
    sampleRequired: 800,
    sampleDelivered: 615,
    cpi: 16.00,
    totalValue: 12800,
    loi: 16,
    ir: 42,
    status: "active",
    receivedDate: "2026-10-18",
    deadlineDate: "2026-10-30",
    surveyUrlTemplate: "https://survey.researchpulse.io/s/8814?sup=SUP_APEX&rid=[RID]",
    qualityScoreRequired: 88,
    description: "Full-stack and backend software engineers using generative AI assistants in production workflows.",
  },
  {
    id: "proj-act-203",
    projectId: "PRJ-8819",
    title: "European Household Groceries & Eco-Packaging",
    clientName: "Nielsen Brand Tracker",
    audience: "consumer",
    country: "FR",
    sampleRequired: 1500,
    sampleDelivered: 890,
    cpi: 3.40,
    totalValue: 5100,
    loi: 9,
    ir: 78,
    status: "active",
    receivedDate: "2026-10-20",
    deadlineDate: "2026-11-02",
    surveyUrlTemplate: "https://survey.researchpulse.io/s/8819?sup=SUP_APEX&rid=[RID]",
    qualityScoreRequired: 75,
    description: "Primary grocery shoppers evaluating sustainable and biodegradable supermarket packaging.",
  },
  {
    id: "proj-cmp-301",
    projectId: "PRJ-7650",
    title: "Cybersecurity SOC Analyst Burnout & Tooling",
    clientName: "SecureTech Alliance",
    audience: "b2b",
    country: "US",
    sampleRequired: 500,
    sampleDelivered: 500,
    cpi: 22.00,
    totalValue: 11000,
    loi: 18,
    ir: 25,
    status: "completed",
    receivedDate: "2026-09-12",
    deadlineDate: "2026-10-05",
    surveyUrlTemplate: "https://survey.researchpulse.io/s/7650?sup=SUP_APEX&rid=[RID]",
    qualityScoreRequired: 90,
    description: "Security Operations Center tier 2 & tier 3 analysts assessing alert fatigue and automated remediation.",
  },
  {
    id: "proj-cmp-302",
    projectId: "PRJ-7652",
    title: "Streaming Platform Subscription Retention 2026",
    clientName: "MediaMetrics International",
    audience: "consumer",
    country: "CA",
    sampleRequired: 2500,
    sampleDelivered: 2500,
    cpi: 2.90,
    totalValue: 7250,
    loi: 8,
    ir: 82,
    status: "completed",
    receivedDate: "2026-09-20",
    deadlineDate: "2026-10-10",
    surveyUrlTemplate: "https://survey.researchpulse.io/s/7652?sup=SUP_APEX&rid=[RID]",
    qualityScoreRequired: 75,
    description: "Subscribers to 2+ SVOD streaming platforms evaluating price tolerance and bundle plans.",
  },
];

export const INITIAL_RESPONDENT_LOGS: RespondentActivityLog[] = [
  {
    id: "log-1",
    sessionId: "SES-892110",
    respondentId: "R-77491",
    projectTitle: "Next-Gen Fintech & Mobile Payments",
    projectId: "PRJ-8810",
    country: "US",
    device: "Mobile",
    ipAddress: "172.56.42.19",
    fraudScore: 4,
    durationSeconds: 724,
    status: "completed",
    earnedCpi: 4.25,
    timestamp: "2 mins ago",
  },
  {
    id: "log-2",
    sessionId: "SES-892109",
    respondentId: "R-33108",
    projectTitle: "AI Developer Tooling & CoPilot Adoption",
    projectId: "PRJ-8814",
    country: "US",
    device: "Desktop",
    ipAddress: "73.189.21.104",
    fraudScore: 12,
    durationSeconds: 980,
    status: "completed",
    earnedCpi: 16.00,
    timestamp: "5 mins ago",
  },
  {
    id: "log-3",
    sessionId: "SES-892108",
    respondentId: "R-44299",
    projectTitle: "Next-Gen Fintech & Mobile Payments",
    projectId: "PRJ-8810",
    country: "US",
    device: "Mobile",
    ipAddress: "198.54.133.2",
    fraudScore: 92,
    durationSeconds: 48,
    status: "quality_reject",
    earnedCpi: 0,
    timestamp: "8 mins ago",
  },
  {
    id: "log-4",
    sessionId: "SES-892107",
    respondentId: "R-99120",
    projectTitle: "European Household Groceries",
    projectId: "PRJ-8819",
    country: "FR",
    device: "Tablet",
    ipAddress: "82.65.19.41",
    fraudScore: 6,
    durationSeconds: 512,
    status: "completed",
    earnedCpi: 3.40,
    timestamp: "12 mins ago",
  },
  {
    id: "log-5",
    sessionId: "SES-892106",
    respondentId: "R-55823",
    projectTitle: "AI Developer Tooling & CoPilot Adoption",
    projectId: "PRJ-8814",
    country: "US",
    device: "Desktop",
    ipAddress: "138.199.35.12",
    fraudScore: 28,
    durationSeconds: 110,
    status: "screened_out",
    earnedCpi: 0,
    timestamp: "15 mins ago",
  },
  {
    id: "log-6",
    sessionId: "SES-892105",
    respondentId: "R-11422",
    projectTitle: "European Household Groceries",
    projectId: "PRJ-8819",
    country: "FR",
    device: "Mobile",
    ipAddress: "90.44.182.7",
    fraudScore: 8,
    durationSeconds: 140,
    status: "quota_full",
    earnedCpi: 0,
    timestamp: "19 mins ago",
  },
  {
    id: "log-7",
    sessionId: "SES-892104",
    respondentId: "R-66301",
    projectTitle: "Next-Gen Fintech & Mobile Payments",
    projectId: "PRJ-8810",
    country: "US",
    device: "Desktop",
    ipAddress: "24.181.99.231",
    fraudScore: 5,
    durationSeconds: 685,
    status: "completed",
    earnedCpi: 4.25,
    timestamp: "24 mins ago",
  },
];

export const INITIAL_SUPPLIER_PANELS: SupplierPanel[] = [
  {
    id: "pnl-1",
    name: "North America Verified Tech & B2B",
    category: "B2B Tech",
    country: "US & CA",
    activeMembers: 34500,
    responseRate: 46.2,
    avgCompletionTime: 14.5,
    qualityIndex: 94.8,
    status: "Active",
    lastRefreshed: "2026-10-23",
  },
  {
    id: "pnl-2",
    name: "General Consumer Omnibus US",
    category: "Consumer",
    country: "US",
    activeMembers: 89000,
    responseRate: 62.4,
    avgCompletionTime: 9.8,
    qualityIndex: 91.2,
    status: "Active",
    lastRefreshed: "2026-10-24",
  },
  {
    id: "pnl-3",
    name: "UK & Western Europe Shoppers",
    category: "Consumer",
    country: "UK, FR, DE",
    activeMembers: 52400,
    responseRate: 58.1,
    avgCompletionTime: 11.2,
    qualityIndex: 93.0,
    status: "Active",
    lastRefreshed: "2026-10-22",
  },
  {
    id: "pnl-4",
    name: "Physicians & Medical Specialists",
    category: "Healthcare HCP",
    country: "Global (US, DE, UK)",
    activeMembers: 8200,
    responseRate: 28.5,
    avgCompletionTime: 21.0,
    qualityIndex: 97.4,
    status: "Recruiting",
    lastRefreshed: "2026-10-21",
  },
  {
    id: "pnl-5",
    name: "Global Gen Z Digital Native Panel",
    category: "Gen Z & Youth",
    country: "US, UK, BR, IN",
    activeMembers: 41800,
    responseRate: 71.0,
    avgCompletionTime: 7.5,
    qualityIndex: 88.5,
    status: "Active",
    lastRefreshed: "2026-10-24",
  },
];

export const INITIAL_REVENUE_RECORDS: RevenueRecord[] = [
  {
    id: "rev-01",
    period: "October 2026 (MTD)",
    grossRevenue: 28450.00,
    completesCount: 4210,
    avgCpi: 6.75,
    processingFee: 569.00,
    netPayout: 27881.00,
    status: "processing",
    invoiceNumber: "INV-SUP-2026-10",
    paymentMethod: "ACH Wire Transfer",
    payoutDate: "2026-11-05 (Scheduled)",
  },
  {
    id: "rev-02",
    period: "September 2026",
    grossRevenue: 34120.50,
    completesCount: 5100,
    avgCpi: 6.69,
    processingFee: 682.41,
    netPayout: 33438.09,
    status: "paid",
    invoiceNumber: "INV-SUP-2026-09",
    paymentMethod: "ACH Wire Transfer",
    payoutDate: "2026-10-05",
  },
  {
    id: "rev-03",
    period: "August 2026",
    grossRevenue: 29800.00,
    completesCount: 4480,
    avgCpi: 6.65,
    processingFee: 596.00,
    netPayout: 29204.00,
    status: "paid",
    invoiceNumber: "INV-SUP-2026-08",
    paymentMethod: "ACH Wire Transfer",
    payoutDate: "2026-09-05",
  },
  {
    id: "rev-04",
    period: "July 2026",
    grossRevenue: 26500.00,
    completesCount: 3950,
    avgCpi: 6.70,
    processingFee: 530.00,
    netPayout: 25970.00,
    status: "paid",
    invoiceNumber: "INV-SUP-2026-07",
    paymentMethod: "ACH Wire Transfer",
    payoutDate: "2026-08-05",
  },
];
