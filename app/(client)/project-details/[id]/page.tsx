// "use client";

// import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import { useParams, useRouter } from "next/navigation";

// import { apiJSON } from "@/lib/auth-client";
// import {
//   AUDIENCES,
//   COUNTRIES,
//   type ProjectDTO,
// } from "@/lib/project-config";

// import { StatusBadge } from "@/components/Statusbadge";
// import { usd } from "@/components/Estimatecard";
// import {
//   ErrorAlert,
//   Spinner,
//   primaryButtonClass,
// } from "@/components/Ui";

// import {
//   CheckCircle2,
//   Sparkles,
//   Clock,
//   ArrowUpRight,
//   ArrowRightLeft,

//   SlidersHorizontal,
//   Layers,
//   Settings,
//   Shield,
//   Filter,
//   BarChart3,
//   PieChart,
//   Plus,
//   Trash2,
//   Play,
//   Pause,
//   RefreshCw,
//   ExternalLink,
//   Copy,
//   FileText,
//   ChevronDown,
//   Download,
//   AlertCircle,
//   Edit2,
//   Save,
//   X,
//   ChevronRight,
//   Users,
//   Target,
//   FileCheck,
//   Calendar,
//   Lock,
//   Unlock,
//   Check,
// } from "lucide-react";

// /* =========================================================
//    TYPES
// ========================================================= */

// type CintTab =
//   | "details"
//   | "qualifications"
//   | "quotas"
//   | "allocations"
//   | "reports"
//   | "documents"
//   | "security"
//   | "reconciliations";

// interface QuotaCell {
//   id: string;
//   name: string;
//   targetPct: number;
//   targetCount: number;
//   currentCompletes: number;
//   remaining: number;
//   percentageAchieved: number;
//   status: "open" | "capped" | "paused";
//   marketPct?: number;
// }

// interface QuotaDimension {
//   id: string;
//   name: string;
//   category: "gender" | "age" | "region" | "income" | "custom";
//   isInterlocked?: boolean;
//   cells: QuotaCell[];
// }

// interface OverquotaConfig {
//   bufferPercent: number;
//   action: "terminate" | "redirect" | "secondary";
//   redirectUrl: string;
// }

// /* =========================================================
//    PAGE
// ========================================================= */

// function ProjectDetailContent() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();

//   const [project, setProject] = useState<ProjectDTO | null>(null);
//   const [error, setError] = useState("");
//   const [successMsg, setSuccessMsg] = useState("");
//   const [busy, setBusy] = useState(false);

//   // Cint Navigation Tab
//   const [activeTab, setActiveTab] = useState<CintTab>("quotas");
//   const [reportsSubTab, setReportsSubTab] = useState<"analysis" | "financial">("analysis");

//   // Title Editing State
//   const [isEditingTitle, setIsEditingTitle] = useState(false);
//   const [editedTitle, setEditedTitle] = useState("");

//   // Status Dropdown & Actions Dropdown
//   const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
//   const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
//   const [fieldingAssistantOpen, setFieldingAssistantOpen] = useState(false);

//   // Quotas State
//   const [quotas, setQuotas] = useState<QuotaDimension[]>([]);
//   const [overquotaConfig, setOverquotaConfig] = useState<OverquotaConfig>({
//     bufferPercent: 5,
//     action: "terminate",
//     redirectUrl: "",
//   });
//   const [quotasLoading, setQuotasLoading] = useState(false);
//   const [isAddingQuotaModal, setIsAddingQuotaModal] = useState(false);
//   const [newDimCategory, setNewDimCategory] = useState<"gender" | "age" | "region" | "income" | "custom">("gender");
//   const [newDimName, setNewDimName] = useState("");
//   const [newCellNames, setNewCellNames] = useState("Male, Female");
//   const [copiedLink, setCopiedLink] = useState("");

//   // Settings State
//   const [slEnabled, setSlEnabled] = useState(false);
//   const [slThreshold, setSlThreshold] = useState(10);
//   const [exclusionInput, setExclusionInput] = useState("");
//   const [newWebhookUrl, setNewWebhookUrl] = useState("");
//   const [newWebhookEvent, setNewWebhookEvent] = useState("respondent.complete");
//   const [liveCpiInput, setLiveCpiInput] = useState("");
//   const [isEditingCpi, setIsEditingCpi] = useState(false);

//   // Screener Questions State
//   const [newQuestionText, setNewQuestionText] = useState("");
//   const [newOptionsText, setNewOptionsText] = useState("");

//   const load = useCallback(async () => {
//     if (!id) return;
//     setError("");

//     try {
//       const { ok, status, data } = await apiJSON<{
//         project: ProjectDTO;
//         message?: string;
//       }>(`/api/projects/${id}`);

//       if (status === 401) {
//         router.replace("/login");
//         return;
//       }

//       if (!ok) {
//         setError(data?.message || "Couldn't load the project.");
//         return;
//       }

//       setProject(data.project);
//       if (data.project) {
//         setEditedTitle(data.project.surveyTitle);
//         setSlEnabled(Boolean(data.project.softLaunch?.enabled));
//         setSlThreshold(data.project.softLaunch?.threshold || 10);
//         setLiveCpiInput(String(data.project.estimate?.estimatedCpi || "2.50"));
//       }
//     } catch (err) {
//       console.error("Load project error:", err);
//       setError("Couldn't load the project.");
//     }
//   }, [id, router]);

//   // Load Quotas
//   const loadQuotas = useCallback(async () => {
//     if (!id) return;
//     setQuotasLoading(true);
//     try {
//       const { ok, data } = await apiJSON<{
//         quotas: QuotaDimension[];
//         overquotaConfig: OverquotaConfig;
//       }>(`/api/projects/${id}/quotas`);

//       if (ok && data?.quotas) {
//         setQuotas(data.quotas);
//         if (data.overquotaConfig) {
//           setOverquotaConfig(data.overquotaConfig);
//         }
//       }
//     } catch (err) {
//       console.error("Failed to load quotas:", err);
//     } finally {
//       setQuotasLoading(false);
//     }
//   }, [id]);

//   useEffect(() => {
//     load();
//     loadQuotas();
//   }, [load, loadQuotas]);

//   // Save Quotas
//   async function saveQuotas(updatedQuotas: QuotaDimension[], updatedConfig?: OverquotaConfig) {
//     setBusy(true);
//     setError("");
//     try {
//       const { ok, data } = await apiJSON<{ message?: string; quotas: QuotaDimension[] }>(
//         `/api/projects/${id}/quotas`,
//         "POST",
//         {
//           quotas: updatedQuotas,
//           overquotaConfig: updatedConfig || overquotaConfig,
//         }
//       );

//       if (ok) {
//         setQuotas(updatedQuotas);
//         if (updatedConfig) setOverquotaConfig(updatedConfig);
//         setSuccessMsg("Quotas updated and saved successfully!");
//         setTimeout(() => setSuccessMsg(""), 3000);
//       } else {
//         setError(data?.message || "Failed to save quotas");
//       }
//     } catch (err) {
//       console.error("Save quotas error:", err);
//       setError("Failed to save quotas");
//     } finally {
//       setBusy(false);
//     }
//   }

//   // Handle Title Save
//   async function saveTitle() {
//     if (!editedTitle.trim()) return;
//     setBusy(true);
//     try {
//       const { ok } = await apiJSON(`/api/projects/${id}/settings`, "PATCH", {
//         surveyTitle: editedTitle.trim(),
//       });
//       if (ok) {
//         setIsEditingTitle(false);
//         setSuccessMsg("Survey name updated!");
//         setTimeout(() => setSuccessMsg(""), 2500);
//         load();
//       }
//     } catch {
//       setError("Failed to update title");
//     } finally {
//       setBusy(false);
//     }
//   }

//   // Act on Status
//   async function act(action: "launch" | "pause" | "resume" | "stop") {
//     if (
//       action === "stop" &&
//       !window.confirm("Stop this survey fieldwork? This cannot be undone.")
//     ) {
//       return;
//     }

//     setBusy(true);
//     setError("");

//     try {
//       const { ok, data } = await apiJSON<{
//         project: ProjectDTO;
//         message?: string;
//       }>(`/api/projects/${id}/status`, "POST", { action });

//       if (ok && data?.project) {
//         setProject(data.project);
//         setStatusDropdownOpen(false);
//         setSuccessMsg(`Survey is now ${data.project.status.toUpperCase()}`);
//         setTimeout(() => setSuccessMsg(""), 3000);
//       } else {
//         setError(data?.message || "Status change failed.");
//       }
//     } catch {
//       setError("Status change failed.");
//     } finally {
//       setBusy(false);
//     }
//   }

//   // Clone Project
//   async function cloneProject() {
//     if (!window.confirm("Clone this survey into a new study with identical targeting & quotas?")) return;
//     setBusy(true);
//     try {
//       const { ok, data } = await apiJSON<{ project?: { _id: string }; message?: string }>(
//         `/api/projects/${id}/clone`,
//         "POST"
//       );
//       if (ok && data?.project?._id) {
//         router.push(`/project-details/${data.project._id}`);
//       } else {
//         setError(data?.message || "Failed to clone survey");
//       }
//     } catch {
//       setError("Failed to clone survey");
//     } finally {
//       setBusy(false);
//     }
//   }

//   // Copy Link with Feedback
//   function copyToClipboard(text: string, label: string) {
//     navigator.clipboard.writeText(text);
//     setCopiedLink(label);
//     setTimeout(() => setCopiedLink(""), 2000);
//   }

//   // Quota Handlers: Add Dimension
//   function handleAddDimensionSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     const cellNames = newCellNames
//       .split(/[,;\n]+/)
//       .map((s) => s.trim())
//       .filter(Boolean);

//     if (cellNames.length === 0) {
//       alert("Please provide at least one quota cell name.");
//       return;
//     }

//     const sampleSize = project?.sampleSize || 100;
//     const splitPct = Math.round(100 / cellNames.length);

//     const newCells: QuotaCell[] = cellNames.map((name, idx) => {
//       const targetPct = idx === cellNames.length - 1 ? 100 - splitPct * (cellNames.length - 1) : splitPct;
//       const targetCount = Math.round((targetPct / 100) * sampleSize);
//       return {
//         id: `cell-${Date.now()}-${idx}`,
//         name,
//         targetPct,
//         targetCount,
//         currentCompletes: 0,
//         remaining: targetCount,
//         percentageAchieved: 0,
//         status: "open",
//       };
//     });

//     const newDim: QuotaDimension = {
//       id: `dim-${Date.now()}`,
//       name: newDimName.trim() || `${newDimCategory.charAt(0).toUpperCase() + newDimCategory.slice(1)} Quotas`,
//       category: newDimCategory,
//       cells: newCells,
//     };

//     const updated = [...quotas, newDim];
//     saveQuotas(updated);
//     setIsAddingQuotaModal(false);
//     setNewDimName("");
//   }

//   // Quota Handlers: Update Cell Target Pct
//   function updateCellPct(dimId: string, cellId: string, newPct: number) {
//     const sampleSize = project?.sampleSize || 100;
//     const updated = quotas.map((dim) => {
//       if (dim.id !== dimId) return dim;
//       const cells = dim.cells.map((cell) => {
//         if (cell.id !== cellId) return cell;
//         const targetCount = Math.round((newPct / 100) * sampleSize);
//         return {
//           ...cell,
//           targetPct: newPct,
//           targetCount,
//           remaining: Math.max(0, targetCount - cell.currentCompletes),
//           percentageAchieved: targetCount > 0 ? Math.round((cell.currentCompletes / targetCount) * 100) : 0,
//           status: (cell.currentCompletes >= targetCount && targetCount > 0 ? "capped" : cell.status === "paused" ? "paused" : "open") as "open" | "capped" | "paused",
//         };
//       });
//       return { ...dim, cells };
//     });
//     setQuotas(updated);
//   }

//   // Auto Balance Dimension to 100%
//   function autoBalanceDimension(dimId: string) {
//     const sampleSize = project?.sampleSize || 100;
//     const updated = quotas.map((dim) => {
//       if (dim.id !== dimId) return dim;
//       const count = dim.cells.length;
//       if (count === 0) return dim;
//       const evenPct = Math.floor(100 / count);
//       const remainder = 100 - evenPct * count;

//       const cells = dim.cells.map((cell, idx) => {
//         const pct = idx === count - 1 ? evenPct + remainder : evenPct;
//         const targetCount = Math.round((pct / 100) * sampleSize);
//         return {
//           ...cell,
//           targetPct: pct,
//           targetCount,
//           remaining: Math.max(0, targetCount - cell.currentCompletes),
//           percentageAchieved: targetCount > 0 ? Math.round((cell.currentCompletes / targetCount) * 100) : 0,
//           status: (cell.currentCompletes >= targetCount && targetCount > 0 ? "capped" : cell.status === "paused" ? "paused" : "open") as "open" | "capped" | "paused",
//         };
//       });
//       return { ...dim, cells };
//     });
//     saveQuotas(updated);
//   }

//   // Toggle Cell Pause / Open
//   function toggleCellPause(dimId: string, cellId: string) {
//     const updated = quotas.map((dim) => {
//       if (dim.id !== dimId) return dim;
//       const cells = dim.cells.map((cell) => {
//         if (cell.id !== cellId) return cell;
//         const newStatus = cell.status === "paused" ? (cell.currentCompletes >= cell.targetCount ? "capped" : "open") : "paused";
//         return { ...cell, status: newStatus as "open" | "capped" | "paused" };
//       });
//       return { ...dim, cells };
//     });
//     saveQuotas(updated);
//   }

//   // Delete Dimension
//   function deleteDimension(dimId: string) {
//     if (!window.confirm("Remove this quota group?")) return;
//     const updated = quotas.filter((d) => d.id !== dimId);
//     saveQuotas(updated);
//   }

//   // Delete Cell
//   function deleteCell(dimId: string, cellId: string) {
//     const updated = quotas.map((dim) => {
//       if (dim.id !== dimId) return dim;
//       return { ...dim, cells: dim.cells.filter((c) => c.id !== cellId) };
//     });
//     saveQuotas(updated);
//   }

//   // Apply Standard Cint Demographics
//   function applyCintGenpopPresets() {
//     const sampleSize = project?.sampleSize || 100;
//     const gender50 = Math.round(sampleSize * 0.5);

//     const presetDims: QuotaDimension[] = [
//       {
//         id: `dim-gender-${Date.now()}`,
//         name: "Gender Balancing",
//         category: "gender",
//         cells: [
//           {
//             id: `c-male-${Date.now()}`,
//             name: "Male",
//             targetPct: 50,
//             targetCount: gender50,
//             currentCompletes: 0,
//             remaining: gender50,
//             percentageAchieved: 0,
//             status: "open",
//             marketPct: 49.2,
//           },
//           {
//             id: `c-female-${Date.now()}`,
//             name: "Female",
//             targetPct: 50,
//             targetCount: gender50,
//             currentCompletes: 0,
//             remaining: gender50,
//             percentageAchieved: 0,
//             status: "open",
//             marketPct: 50.8,
//           },
//         ],
//       },
//       {
//         id: `dim-age-${Date.now()}`,
//         name: "Age Cohorts",
//         category: "age",
//         cells: [
//           {
//             id: `c-age1-${Date.now()}`,
//             name: "18 - 34 years",
//             targetPct: 35,
//             targetCount: Math.round(sampleSize * 0.35),
//             currentCompletes: 0,
//             remaining: Math.round(sampleSize * 0.35),
//             percentageAchieved: 0,
//             status: "open",
//             marketPct: 34.5,
//           },
//           {
//             id: `c-age2-${Date.now()}`,
//             name: "35 - 54 years",
//             targetPct: 40,
//             targetCount: Math.round(sampleSize * 0.40),
//             currentCompletes: 0,
//             remaining: Math.round(sampleSize * 0.40),
//             percentageAchieved: 0,
//             status: "open",
//             marketPct: 40.0,
//           },
//           {
//             id: `c-age3-${Date.now()}`,
//             name: "55+ years",
//             targetPct: 25,
//             targetCount: Math.round(sampleSize * 0.25),
//             currentCompletes: 0,
//             remaining: Math.round(sampleSize * 0.25),
//             percentageAchieved: 0,
//             status: "open",
//             marketPct: 25.5,
//           },
//         ],
//       },
//     ];

//     saveQuotas(presetDims);
//   }

//   // Loading skeleton
//   if (!project) {
//     return (
//       <div className="flex h-96 items-center justify-center">
//         <Spinner size={32} />
//       </div>
//     );
//   }

//   const p = project;
//   const sampleSize = p.sampleSize || 100;
//   const completes = p.progress?.completes || 0;
//   const starts = p.progress?.starts || (completes > 0 ? Math.round(completes * 1.4) : 110);
//   const screenouts = p.progress?.screenouts || 37;
//   const quotaFull = p.progress?.quotaFull || 2;
//   const qualityRejects = p.progress?.qualityRejects || 1;
//   const pct = Math.min(100, Math.round((completes / sampleSize) * 100));
//   const avgCpi = p.estimate?.estimatedCpi ? Number(p.estimate.estimatedCpi).toFixed(2) : "1.30";
//   const epc = completes > 0 ? (completes / starts).toFixed(2) : "0.00";

//   const surveyNumber = p._id.slice(-8).toUpperCase();
//   const projectCode = p.surveyTitle.split(" ")[0] || "Template_Genpop";

//   // Quota totals
//   const allCells = quotas.flatMap((d) => d.cells);
//   const totalCappedCells = allCells.filter((c) => c.status === "capped").length;
//   const totalOpenCells = allCells.filter((c) => c.status === "open").length;
//   const totalPausedCells = allCells.filter((c) => c.status === "paused").length;

//   return (
//     <div className="space-y-4 font-sans text-zinc-100">

//       {/* =========================================================
//           CINT HORIZONTAL SUB-NAVIGATION TABS BAR
//       ========================================================= */}
//       <div className="flex items-center gap-1 border-b border-zinc-800 bg-zinc-950/60 px-1 py-1 text-xs font-medium overflow-x-auto rounded-t-xl">
//         {(
//           [
//             { id: "details", label: "Details" },
//             { id: "qualifications", label: "Qualifications" },
//             { id: "quotas", label: "Quotas", count: quotas.length },
//             { id: "allocations", label: "Allocations" },
//             { id: "reports", label: "Reports" },
//             { id: "documents", label: "Documents" },
//             { id: "security", label: "Security" },
//             { id: "reconciliations", label: "Reconciliations" },
//           ] as { id: CintTab; label: string; count?: number }[]
//         ).map((tab) => {
//           const isActive = activeTab === tab.id;
//           return (
//             <button
//               key={tab.id}
//               type="button"
//               onClick={() => setActiveTab(tab.id)}
//               className={`relative px-4 py-2 transition-all rounded-md flex items-center gap-1.5 whitespace-nowrap ${isActive
//                   ? "text-white font-semibold after:absolute after:bottom-[-5px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#ff2e93]"
//                   : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
//                 }`}
//             >
//               <span>{tab.label}</span>
//               {tab.count !== undefined && (
//                 <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? "bg-[#ff2e93]/20 text-[#ff71b7]" : "bg-zinc-800 text-zinc-400"
//                   }`}>
//                   {tab.count}
//                 </span>
//               )}
//             </button>
//           );
//         })}
//       </div>

//       {/* =========================================================
//           CINT SURVEY HEADER (Matches Image 2)
//       ========================================================= */}
//       <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 sm:p-5">
//         <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

//           {/* Title & Metadata */}
//           <div className="space-y-1.5">
//             <div className="flex items-center gap-2 flex-wrap">
//               {isEditingTitle ? (
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="text"
//                     value={editedTitle}
//                     onChange={(e) => setEditedTitle(e.target.value)}
//                     className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
//                   />
//                   <button
//                     type="button"
//                     onClick={saveTitle}
//                     disabled={busy}
//                     className="px-2.5 py-1 rounded bg-[#642582] text-white text-xs font-medium hover:bg-[#7b2c9f]"
//                   >
//                     Save
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setEditedTitle(p.surveyTitle);
//                       setIsEditingTitle(false);
//                     }}
//                     className="p-1 text-zinc-400 hover:text-white"
//                   >
//                     <X size={15} />
//                   </button>
//                 </div>
//               ) : (
//                 <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
//                   <span>{p.surveyTitle}</span>
//                   <button
//                     type="button"
//                     onClick={() => setIsEditingTitle(true)}
//                     className="text-xs text-zinc-400 hover:text-[#ff2e93] transition font-normal"
//                   >
//                     Edit
//                   </button>
//                 </h1>
//               )}
//             </div>

//             {/* Breadcrumb / Chips (PROJECT Template_Genpop | SURVEY NUMBER 84931429 | LIVE) */}
//             <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
//               <span className="font-semibold text-zinc-400 uppercase tracking-wide">
//                 PROJECT
//               </span>
//               <span className="text-zinc-200">{projectCode}</span>
//               <span className="text-zinc-600">/</span>
//               <span className="font-semibold text-zinc-400 uppercase tracking-wide">
//                 SURVEY NUMBER
//               </span>
//               <span className="text-zinc-200 font-mono">{surveyNumber}</span>
//               <span className="text-zinc-600">/</span>
//               <span
//                 className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === "live"
//                     ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
//                     : p.status === "paused"
//                       ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
//                       : "bg-zinc-800 text-zinc-400 border border-zinc-700"
//                   }`}
//               >
//                 {p.status}
//               </span>
//             </div>
//           </div>

//           {/* Right Header Action Buttons: Status selector, Fielding Assistant, Actions */}
//           <div className="flex items-center gap-2.5 flex-wrap">
//             {/* Status Dropdown */}
//             <div className="relative">
//               <button
//                 type="button"
//                 onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
//                 className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition ${p.status === "live"
//                     ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
//                     : p.status === "paused"
//                       ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
//                       : "border-zinc-700 bg-zinc-800 text-zinc-300"
//                   }`}
//               >
//                 <span className={`h-2 w-2 rounded-full ${p.status === "live" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
//                 <span className="capitalize">{p.status}</span>
//                 <ChevronDown size={13} className="text-zinc-400" />
//               </button>

//               {statusDropdownOpen && (
//                 <>
//                   <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)} />
//                   <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-700 bg-[#1c0225] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
//                     {p.status === "draft" && (
//                       <button
//                         type="button"
//                         onClick={() => act("launch")}
//                         className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-950/40 rounded-lg text-left"
//                       >
//                         <Play size={13} />
//                         <span>Launch Survey (Live)</span>
//                       </button>
//                     )}
//                     {p.status === "live" && (
//                       <button
//                         type="button"
//                         onClick={() => act("pause")}
//                         className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-300 hover:bg-amber-950/40 rounded-lg text-left"
//                       >
//                         <Pause size={13} />
//                         <span>Pause Fielding</span>
//                       </button>
//                     )}
//                     {p.status === "paused" && (
//                       <button
//                         type="button"
//                         onClick={() => act("resume")}
//                         className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-950/40 rounded-lg text-left"
//                       >
//                         <Play size={13} />
//                         <span>Resume Fielding</span>
//                       </button>
//                     )}
//                     {(p.status === "live" || p.status === "paused") && (
//                       <button
//                         type="button"
//                         onClick={() => act("stop")}
//                         className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-lg text-left border-t border-zinc-800"
//                       >
//                         <span>Close / Stop Study</span>
//                       </button>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>

//             {/* Fielding Assistant Purple Button */}
//             <button
//               type="button"
//               onClick={() => setFieldingAssistantOpen(!fieldingAssistantOpen)}
//               className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#642582] hover:bg-[#7a2e9e] text-white text-xs font-semibold shadow-sm transition border border-purple-400/20"
//             >
//               <Sparkles size={13} />
//               <span>Fielding Assistant</span>
//             </button>

//             {/* Actions Dropdown */}
//             <div className="relative">
//               <button
//                 type="button"
//                 onClick={() => setActionsDropdownOpen(!actionsDropdownOpen)}
//                 className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700/80 text-white text-xs font-medium transition"
//               >
//                 <span>Actions</span>
//                 <ChevronDown size={13} className="text-zinc-400" />
//               </button>

//               {actionsDropdownOpen && (
//                 <>
//                   <div className="fixed inset-0 z-40" onClick={() => setActionsDropdownOpen(false)} />
//                   <div className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-700 bg-[#1c0225] p-2 shadow-2xl z-50 text-xs">
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setActionsDropdownOpen(false);
//                         copyToClipboard(
//                           `${window.location.origin}/survey/start/${p._id}?rid=TEST_RESP_${Date.now()}&mode=test`,
//                           "test"
//                         );
//                       }}
//                       className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:text-white hover:bg-purple-900/40 rounded-lg text-left"
//                     >
//                       <Copy size={13} />
//                       <span>{copiedLink === "test" ? "Copied Test Link!" : "Copy Test Link"}</span>
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setActionsDropdownOpen(false);
//                         cloneProject();
//                       }}
//                       className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:text-white hover:bg-purple-900/40 rounded-lg text-left"
//                     >
//                       <Copy size={13} />
//                       <span>Clone Study</span>
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setActionsDropdownOpen(false);
//                         window.open(`/api/projects/${id}/export`, "_blank");
//                       }}
//                       className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:text-white hover:bg-purple-900/40 rounded-lg text-left"
//                     >
//                       <Download size={13} />
//                       <span>Export Fieldwork CSV</span>
//                     </button>
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Fielding Assistant Drawer / Drawer Card */}
//         {fieldingAssistantOpen && (
//           <div className="mt-4 pt-4 border-t border-zinc-800 bg-purple-950/20 p-4 rounded-xl border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
//             <div className="space-y-1">
//               <div className="flex items-center gap-2 font-semibold text-sm text-purple-200">
//                 <Sparkles size={15} className="text-[#ff2e93]" />
//                 <span>Fielding Assistant AI Optimization Active</span>
//               </div>
//               <p className="text-xs text-zinc-300 max-w-2xl">
//                 Automatically monitors incidence rate (IR), soft launch quality gate, and re-allocates supplier traffic across open demographic quota cells to prevent Overquota 40 drop-offs.
//               </p>
//             </div>
//             <div className="flex items-center gap-3">
//               <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
//                 Auto-Pacing: 100% Optimized
//               </span>
//               <button
//                 type="button"
//                 onClick={() => setFieldingAssistantOpen(false)}
//                 className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded"
//               >
//                 Dismiss
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Notifications */}
//       {successMsg && (
//         <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-3.5 text-xs font-medium text-emerald-300 flex items-center gap-2 animate-in fade-in">
//           <CheckCircle2 size={16} />
//           <span>{successMsg}</span>
//         </div>
//       )}
//       {error && <ErrorAlert message={error} />}

//       {/* =========================================================
//           TAB 1: QUOTAS MANAGEMENT (Requested Feature)
//       ========================================================= */}
//       {activeTab === "quotas" && (
//         <div className="space-y-6">

//           {/* Top Quota Metrics Banner */}
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//             <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
//               <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
//                 Total Sample Target
//               </div>
//               <div className="mt-1 text-2xl font-bold text-white font-mono">
//                 {sampleSize.toLocaleString()}
//               </div>
//               <div className="text-[11px] text-zinc-500 mt-0.5">Required Completes</div>
//             </div>

//             <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
//               <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
//                 Quota Completes
//               </div>
//               <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono">
//                 {completes.toLocaleString()}
//               </div>
//               <div className="text-[11px] text-zinc-500 mt-0.5">{pct}% of fieldwork target</div>
//             </div>

//             <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
//               <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
//                 Active Quota Cells
//               </div>
//               <div className="mt-1 text-2xl font-bold text-cyan-400 font-mono">
//                 {totalOpenCells} / {allCells.length}
//               </div>
//               <div className="text-[11px] text-zinc-500 mt-0.5">Accepting respondents</div>
//             </div>

//             <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
//               <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
//                 Capped (Overquota 40)
//               </div>
//               <div className="mt-1 text-2xl font-bold text-amber-400 font-mono">
//                 {totalCappedCells}
//               </div>
//               <div className="text-[11px] text-zinc-500 mt-0.5">Auto-terminated safely</div>
//             </div>
//           </div>

//           {/* Quota Action Bar */}
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
//             <div>
//               <h2 className="text-sm font-bold text-white flex items-center gap-2">
//                 <PieChart size={16} className="text-[#ff2e93]" />
//                 <span>Demographic Quota Groups & Balancing</span>
//               </h2>
//               <p className="text-xs text-zinc-400 mt-0.5">
//                 Manage quotas, assign target weights, and control Overquota 40 routing rules.
//               </p>
//             </div>

//             <div className="flex items-center gap-2 flex-wrap">
//               <button
//                 type="button"
//                 onClick={applyCintGenpopPresets}
//                 className="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition"
//               >
//                 Apply Cint GenPop Presets
//               </button>

//               <button
//                 type="button"
//                 onClick={() => setIsAddingQuotaModal(true)}
//                 className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#642582] hover:bg-[#7b2c9f] text-white text-xs font-semibold shadow-sm transition"
//               >
//                 <Plus size={14} />
//                 <span>Add Quota Dimension</span>
//               </button>
//             </div>
//           </div>

//           {/* Quota Dimensions List */}
//           {quotas.length === 0 ? (
//             <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-950/40">
//               <PieChart size={36} className="mx-auto text-zinc-600 mb-3" />
//               <h3 className="text-sm font-semibold text-zinc-200">No Quota Dimensions Defined</h3>
//               <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
//                 Define demographic quotas (Gender, Age Groups, Geographic Divisions) to ensure a representative sample.
//               </p>
//               <div className="mt-4 flex items-center justify-center gap-3">
//                 <button
//                   type="button"
//                   onClick={applyCintGenpopPresets}
//                   className="px-4 py-2 rounded-lg bg-[#642582] text-white text-xs font-medium hover:bg-[#7b2c9f]"
//                 >
//                   Generate Standard Demographics
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-6">
//               {quotas.map((dim) => {
//                 const totalTargetPct = dim.cells.reduce((sum, c) => sum + c.targetPct, 0);
//                 const totalTargetCount = dim.cells.reduce((sum, c) => sum + c.targetCount, 0);
//                 const totalCompletesInDim = dim.cells.reduce((sum, c) => sum + c.currentCompletes, 0);

//                 return (
//                   <div
//                     key={dim.id}
//                     className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden shadow-sm"
//                   >
//                     {/* Dimension Header */}
//                     <div className="px-5 py-3.5 bg-zinc-800/50 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//                       <div className="flex items-center gap-3">
//                         <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
//                           {dim.category}
//                         </span>
//                         <h3 className="text-sm font-bold text-white">{dim.name}</h3>
//                         <span className="text-xs text-zinc-400">
//                           ({dim.cells.length} cells • {totalTargetCount.toLocaleString()} total target)
//                         </span>
//                       </div>

//                       <div className="flex items-center gap-2">
//                         {/* 100% check badge */}
//                         <span
//                           className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${totalTargetPct === 100
//                               ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
//                               : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
//                             }`}
//                         >
//                           Target Sum: {totalTargetPct}%
//                         </span>

//                         <button
//                           type="button"
//                           onClick={() => autoBalanceDimension(dim.id)}
//                           className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
//                           title="Evenly distribute 100% across all cells"
//                         >
//                           Auto-Balance 100%
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() => deleteDimension(dim.id)}
//                           className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-800 transition"
//                           title="Remove Dimension"
//                         >
//                           <Trash2 size={14} />
//                         </button>
//                       </div>
//                     </div>

//                     {/* Quota Cells Table */}
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-left text-xs">
//                         <thead className="bg-zinc-950/40 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800/80">
//                           <tr>
//                             <th className="py-2.5 px-4 font-semibold">Quota Cell Name</th>
//                             <th className="py-2.5 px-4 font-semibold text-center w-36">Target %</th>
//                             <th className="py-2.5 px-4 font-semibold text-right">Target Completes</th>
//                             <th className="py-2.5 px-4 font-semibold text-right">Current</th>
//                             <th className="py-2.5 px-4 font-semibold text-right">Remaining</th>
//                             <th className="py-2.5 px-4 font-semibold w-48">Progress</th>
//                             <th className="py-2.5 px-4 font-semibold text-center">Status</th>
//                             <th className="py-2.5 px-4 font-semibold text-center w-24">Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-zinc-800/50">
//                           {dim.cells.map((cell) => {
//                             const progress = cell.targetCount > 0 ? Math.min(100, Math.round((cell.currentCompletes / cell.targetCount) * 100)) : 0;
//                             const isCapped = cell.status === "capped" || cell.currentCompletes >= cell.targetCount;
//                             const isPaused = cell.status === "paused";

//                             return (
//                               <tr key={cell.id} className="hover:bg-zinc-800/30 transition">
//                                 <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
//                                   <span>{cell.name}</span>
//                                   {cell.marketPct && (
//                                     <span className="text-[10px] text-zinc-500">
//                                       (Mkt: {cell.marketPct}%)
//                                     </span>
//                                   )}
//                                 </td>

//                                 {/* Editable Target % */}
//                                 <td className="py-3 px-4 text-center">
//                                   <div className="inline-flex items-center gap-1">
//                                     <input
//                                       type="number"
//                                       min={0}
//                                       max={100}
//                                       value={cell.targetPct}
//                                       onChange={(e) => updateCellPct(dim.id, cell.id, Number(e.target.value))}
//                                       className="w-14 text-center rounded bg-zinc-800 border border-zinc-700 px-1 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
//                                     />
//                                     <span className="text-zinc-400">%</span>
//                                   </div>
//                                 </td>

//                                 <td className="py-3 px-4 text-right font-mono text-zinc-300 font-medium">
//                                   {cell.targetCount.toLocaleString()}
//                                 </td>

//                                 <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
//                                   {cell.currentCompletes.toLocaleString()}
//                                 </td>

//                                 <td className="py-3 px-4 text-right font-mono text-zinc-400">
//                                   {cell.remaining.toLocaleString()}
//                                 </td>

//                                 {/* Visual Progress Bar */}
//                                 <td className="py-3 px-4">
//                                   <div className="space-y-1">
//                                     <div className="flex justify-between text-[10px] text-zinc-400">
//                                       <span>{progress}%</span>
//                                       <span>{cell.currentCompletes}/{cell.targetCount}</span>
//                                     </div>
//                                     <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
//                                       <div
//                                         className={`h-full rounded-full transition-all ${isCapped
//                                             ? "bg-purple-500"
//                                             : progress > 80
//                                               ? "bg-amber-400"
//                                               : "bg-emerald-400"
//                                           }`}
//                                         style={{ width: `${progress}%` }}
//                                       />
//                                     </div>
//                                   </div>
//                                 </td>

//                                 {/* Status Tag */}
//                                 <td className="py-3 px-4 text-center">
//                                   {isPaused ? (
//                                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
//                                       <Pause size={10} /> Paused
//                                     </span>
//                                   ) : isCapped ? (
//                                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
//                                       <Lock size={10} /> Capped (40)
//                                     </span>
//                                   ) : (
//                                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
//                                       <Unlock size={10} /> Open
//                                     </span>
//                                   )}
//                                 </td>

//                                 {/* Action Buttons */}
//                                 <td className="py-3 px-4 text-center">
//                                   <div className="flex items-center justify-center gap-1.5">
//                                     <button
//                                       type="button"
//                                       onClick={() => toggleCellPause(dim.id, cell.id)}
//                                       title={isPaused ? "Resume cell" : "Pause cell"}
//                                       className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
//                                     >
//                                       {isPaused ? <Play size={13} className="text-emerald-400" /> : <Pause size={13} />}
//                                     </button>
//                                     <button
//                                       type="button"
//                                       onClick={() => deleteCell(dim.id, cell.id)}
//                                       title="Delete cell"
//                                       className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
//                                     >
//                                       <Trash2 size={13} />
//                                     </button>
//                                   </div>
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                         </tbody>
//                       </table>
//                     </div>

//                     {/* Footer with Save changes CTA */}
//                     <div className="px-5 py-2.5 bg-zinc-950/30 border-t border-zinc-800 flex justify-between items-center text-xs">
//                       <span className="text-zinc-500">
//                         Changes to target percentages apply immediately to live fielding.
//                       </span>
//                       <button
//                         type="button"
//                         onClick={() => saveQuotas(quotas)}
//                         disabled={busy}
//                         className="px-3 py-1 rounded bg-[#642582] text-white hover:bg-[#7b2c9f] text-xs font-medium transition"
//                       >
//                         Save Quota Weights
//                       </button>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {/* Overquota 40 Configuration Card */}
//           <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
//             <div className="flex items-center gap-2">
//               <Shield size={17} className="text-[#ff2e93]" />
//               <h3 className="text-sm font-bold text-white">
//                 Overquota 40 Automation & Buffer Rules
//               </h3>
//             </div>
//             <p className="text-xs text-zinc-400">
//               When a quota cell hits its designated target completes, Cint and GMS automatically trigger Client Code <strong>Overquota 40</strong> to protect you from paying for surplus completes.
//             </p>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
//               <div className="space-y-1.5">
//                 <label className="text-xs font-semibold text-zinc-300">
//                   Overquota Buffer Cushion
//                 </label>
//                 <div className="flex items-center gap-2">
//                   <select
//                     value={overquotaConfig.bufferPercent}
//                     onChange={(e) => {
//                       const updated = { ...overquotaConfig, bufferPercent: Number(e.target.value) };
//                       setOverquotaConfig(updated);
//                       saveQuotas(quotas, updated);
//                     }}
//                     className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
//                   >
//                     <option value={0}>0% — Hard Cap (Strict Overquota 40)</option>
//                     <option value={5}>5% Buffer (Recommended for speed)</option>
//                     <option value={10}>10% Cushion (High feasibility)</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="space-y-1.5">
//                 <label className="text-xs font-semibold text-zinc-300">
//                   Overquota Routing Action
//                 </label>
//                 <select
//                   value={overquotaConfig.action}
//                   onChange={(e) => {
//                     const updated = { ...overquotaConfig, action: e.target.value as any };
//                     setOverquotaConfig(updated);
//                     saveQuotas(quotas, updated);
//                   }}
//                   className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
//                 >
//                   <option value="terminate">Return as Cint Overquota 40 (Client Survey Quota Full)</option>
//                   <option value="redirect">Custom Overquota Redirect URL</option>
//                   <option value="secondary">Route to Secondary / Sister Survey</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* =========================================================
//           TAB 2: REPORTS (Matches Image 2 exactly!)
//       ========================================================= */}
//       {activeTab === "reports" && (
//         <div className="space-y-6">

//           {/* Sub Navigation (Analysis | Financial) */}
//           <div className="flex items-center gap-6 border-b border-zinc-800 pb-2 text-sm font-medium">
//             <button
//               type="button"
//               onClick={() => setReportsSubTab("analysis")}
//               className={`pb-2 relative ${reportsSubTab === "analysis"
//                   ? "text-[#ff2e93] font-semibold after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-[2px] after:bg-[#ff2e93]"
//                   : "text-zinc-400 hover:text-white"
//                 }`}
//             >
//               Analysis
//             </button>
//             <button
//               type="button"
//               onClick={() => setReportsSubTab("financial")}
//               className={`pb-2 relative ${reportsSubTab === "financial"
//                   ? "text-[#ff2e93] font-semibold after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-[2px] after:bg-[#ff2e93]"
//                   : "text-zinc-400 hover:text-white"
//                 }`}
//             >
//               Financial
//             </button>
//           </div>

//           {/* Progress Bar (0/500 completes) */}
//           <div className="space-y-1.5">
//             <div className="flex justify-between items-baseline text-xs text-zinc-400">
//               <span className="font-semibold text-zinc-300">Progress</span>
//               <span className="font-mono text-zinc-200">
//                 {completes}/{sampleSize} completes
//               </span>
//             </div>
//             <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
//               <div
//                 className="h-full bg-emerald-400 rounded-full transition-all"
//                 style={{ width: `${pct}%` }}
//               />
//             </div>
//           </div>

//           {/* Date Range & Quick Metrics Bar */}
//           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
//             <div className="flex items-center gap-2 flex-wrap">
//               <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#642582] text-white text-xs font-semibold shadow-sm">
//                 <Calendar size={13} />
//                 <span>Today (Live Realtime)</span>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => window.open(`/api/projects/${id}/export`, "_blank")}
//                 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
//               >
//                 <FileText size={13} />
//                 <span>Get Reports</span>
//               </button>
//             </div>

//             {/* Metrics: FIRST COMPLETE | LAST COMPLETE | AVG. CPI | EPC */}
//             <div className="flex items-center gap-6 sm:gap-8 text-xs flex-wrap">
//               <div>
//                 <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
//                   First Complete
//                 </div>
//                 <div className="text-zinc-200 font-mono mt-0.5">
//                   {p.launchedAt ? new Date(p.launchedAt).toLocaleDateString() : "—"}
//                 </div>
//               </div>

//               <div>
//                 <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
//                   Last Complete
//                 </div>
//                 <div className="text-zinc-200 font-mono mt-0.5">
//                   {completes > 0 ? "Just now" : "—"}
//                 </div>
//               </div>

//               <div>
//                 <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
//                   AVG. CPI
//                 </div>
//                 <div className="text-white font-mono font-bold mt-0.5">
//                   {avgCpi} USD
//                 </div>
//               </div>

//               <div>
//                 <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
//                   EPC
//                 </div>
//                 <div className="text-white font-mono font-bold mt-0.5">
//                   {epc} USD
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Two Main Cards: Respondent Activity & Data Analysis (Client Codes) */}
//           <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">

//             {/* Left Card: Respondent Activity */}
//             <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
//                   Respondent Activity
//                 </h3>
//               </div>

//               {/* Three Big Counters */}
//               <div className="grid grid-cols-3 gap-2 border-b border-zinc-800 pb-4">
//                 <div>
//                   <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase">
//                     <ArrowRightLeft size={12} className="text-zinc-500" />
//                     <span>Entrants</span>
//                   </div>
//                   <div className="text-2xl font-bold font-mono text-white mt-1">
//                     {starts}
//                   </div>
//                 </div>

//                 <div>
//                   <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase">
//                     <Filter size={12} className="text-zinc-500" />
//                     <span>Prescreens</span>
//                   </div>
//                   <div className="text-2xl font-bold font-mono text-zinc-200 mt-1">
//                     {Math.max(0, starts - 3)}
//                   </div>
//                 </div>

//                 <div>
//                   <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 uppercase">
//                     <CheckCircle2 size={12} />
//                     <span>Completes</span>
//                   </div>
//                   <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
//                     {completes}
//                   </div>
//                 </div>
//               </div>

//               {/* Activity Timeline Chart Simulation */}
//               <div className="space-y-2 pt-2">
//                 <div className="flex items-end justify-between h-32 gap-2 pt-4 px-2 border-b border-zinc-800">
//                   {[
//                     { time: "5:30AM", h: 20 },
//                     { time: "8:30AM", h: 45 },
//                     { time: "11:30AM", h: 90 },
//                     { time: "2:30PM", h: 65 },
//                     { time: "5:30PM", h: 40 },
//                     { time: "8:30PM", h: 15 },
//                   ].map((bar, i) => (
//                     <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
//                       <div
//                         className="w-full bg-[#642582] group-hover:bg-[#ff2e93] rounded-t-sm transition-all"
//                         style={{ height: `${bar.h}%` }}
//                       />
//                       <span className="text-[10px] text-zinc-500">{bar.time}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Right Card: Data Analysis (CLIENT CODES breakdown) */}
//             <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
//                   Data Analysis
//                 </h3>
//                 <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
//                   Live
//                 </span>
//               </div>

//               <div className="space-y-3 pt-1">
//                 <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
//                   <ChevronDown size={12} />
//                   <span>Client Codes</span>
//                 </div>

//                 {/* Term 20 */}
//                 <div className="space-y-1 rounded-lg bg-zinc-950/40 p-3 border border-zinc-800/60">
//                   <div className="flex justify-between items-baseline text-xs">
//                     <div>
//                       <span className="font-semibold text-zinc-200">Term 20</span>
//                       <div className="text-[11px] text-zinc-400">Returned as Terminate</div>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-mono font-bold text-white">{screenouts}</span>
//                       <div className="text-[10px] text-zinc-500">
//                         {starts > 0 ? Math.round((screenouts / starts) * 100) : 0}%
//                       </div>
//                     </div>
//                   </div>
//                   <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-1.5">
//                     <div
//                       className="h-full bg-indigo-500 rounded-full"
//                       style={{ width: `${starts > 0 ? (screenouts / starts) * 100 : 35}%` }}
//                     />
//                   </div>
//                 </div>

//                 {/* Overquota 40 */}
//                 <div className="space-y-1 rounded-lg bg-zinc-950/40 p-3 border border-zinc-800/60">
//                   <div className="flex justify-between items-baseline text-xs">
//                     <div>
//                       <span className="font-semibold text-zinc-200">Overquota 40</span>
//                       <div className="text-[11px] text-zinc-400">Client Survey Quota Full</div>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-mono font-bold text-amber-400">{quotaFull}</span>
//                       <div className="text-[10px] text-zinc-500">
//                         {starts > 0 ? Math.round((quotaFull / starts) * 100) : 0}%
//                       </div>
//                     </div>
//                   </div>
//                   <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-1.5">
//                     <div
//                       className="h-full bg-amber-400 rounded-full"
//                       style={{ width: `${starts > 0 ? (quotaFull / starts) * 100 : 5}%` }}
//                     />
//                   </div>
//                 </div>

//                 {/* Complete 10 */}
//                 <div className="space-y-1 rounded-lg bg-zinc-950/40 p-3 border border-zinc-800/60">
//                   <div className="flex justify-between items-baseline text-xs">
//                     <div>
//                       <span className="font-semibold text-zinc-200">Complete 10</span>
//                       <div className="text-[11px] text-zinc-400">Qualified Success</div>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-mono font-bold text-emerald-400">{completes}</span>
//                       <div className="text-[10px] text-zinc-500">{pct}%</div>
//                     </div>
//                   </div>
//                   <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-1.5">
//                     <div
//                       className="h-full bg-emerald-400 rounded-full"
//                       style={{ width: `${pct}%` }}
//                     />
//                   </div>
//                 </div>

//                 {/* Security 30 */}
//                 <div className="space-y-1 rounded-lg bg-zinc-950/40 p-3 border border-zinc-800/60">
//                   <div className="flex justify-between items-baseline text-xs">
//                     <div>
//                       <span className="font-semibold text-zinc-200">Security 30</span>
//                       <div className="text-[11px] text-zinc-400">Duplicate IP / Fraud Reject</div>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-mono font-bold text-red-400">{qualityRejects}</span>
//                       <div className="text-[10px] text-zinc-500">1%</div>
//                     </div>
//                   </div>
//                   <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-1.5">
//                     <div
//                       className="h-full bg-red-400 rounded-full"
//                       style={{ width: "2%" }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* =========================================================
//           TAB 3: DETAILS (Survey URLs, Redirects, Setup)
//       ========================================================= */}
//       {activeTab === "details" && (
//         <div className="space-y-6">
//           {/* Survey Links & Redirects Card */}
//           <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
//             <h3 className="text-sm font-bold text-white flex items-center gap-2">
//               <ExternalLink size={16} className="text-[#ff2e93]" />
//               <span>Survey Entry & Redirect Specifications</span>
//             </h3>

//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-semibold text-zinc-300">
//                   Client Target Survey URL (Where respondents are redirected)
//                 </label>
//                 <div className="mt-1 flex items-center gap-2">
//                   <input
//                     type="text"
//                     readOnly
//                     value={p.surveySetup?.surveyUrl || "https://surveys.yourclient.com/study?rid=[rid]"}
//                     className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-300 font-mono"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => copyToClipboard(p.surveySetup?.surveyUrl || "", "url")}
//                     className="px-3 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700 whitespace-nowrap"
//                   >
//                     {copiedLink === "url" ? "Copied!" : "Copy"}
//                   </button>
//                 </div>
//                 <p className="text-[11px] text-zinc-500 mt-1">
//                   Ensure your survey captures the <code>[rid]</code> token so completion redirects match back.
//                 </p>
//               </div>

//               {/* Cint Client Return Code Redirects */}
//               <div className="pt-2 border-t border-zinc-800 space-y-2">
//                 <div className="text-xs font-semibold text-zinc-300">
//                   Cint Status Return URLs
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
//                   <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
//                     <span className="text-emerald-400 font-bold block mb-1">Complete 10</span>
//                     <span className="text-zinc-400 break-all">
//                       https://api.gmsresearch.com/survey/complete?rid=[rid]&code=10
//                     </span>
//                   </div>
//                   <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
//                     <span className="text-indigo-400 font-bold block mb-1">Terminate 20</span>
//                     <span className="text-zinc-400 break-all">
//                       https://api.gmsresearch.com/survey/terminate?rid=[rid]&code=20
//                     </span>
//                   </div>
//                   <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
//                     <span className="text-amber-400 font-bold block mb-1">Overquota 40</span>
//                     <span className="text-zinc-400 break-all">
//                       https://api.gmsresearch.com/survey/overquota?rid=[rid]&code=40
//                     </span>
//                   </div>
//                   <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
//                     <span className="text-red-400 font-bold block mb-1">Security 30</span>
//                     <span className="text-zinc-400 break-all">
//                       https://api.gmsresearch.com/survey/security?rid=[rid]&code=30
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Project Details Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
//               <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
//                 Specifications
//               </h3>
//               <div className="space-y-2 text-xs">
//                 <div className="flex justify-between py-1.5 border-b border-zinc-800">
//                   <span className="text-zinc-400">Target Audience</span>
//                   <span className="font-semibold text-white capitalize">{p.audienceType}</span>
//                 </div>
//                 <div className="flex justify-between py-1.5 border-b border-zinc-800">
//                   <span className="text-zinc-400">Country</span>
//                   <span className="font-semibold text-white">{p.country}</span>
//                 </div>
//                 <div className="flex justify-between py-1.5 border-b border-zinc-800">
//                   <span className="text-zinc-400">Length of Interview (LOI)</span>
//                   <span className="font-semibold text-white">{p.loi} minutes</span>
//                 </div>
//                 <div className="flex justify-between py-1.5 border-b border-zinc-800">
//                   <span className="text-zinc-400">Incidence Rate (IR)</span>
//                   <span className="font-semibold text-white">{p.ir}%</span>
//                 </div>
//                 <div className="flex justify-between py-1.5">
//                   <span className="text-zinc-400">Project Manager</span>
//                   <span className="font-semibold text-white">Ratan Bhan</span>
//                 </div>
//               </div>
//             </div>

//             {/* Live CPI Control */}
//             <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
//               <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
//                 Cost Per Complete (CPI) Control
//               </h3>
//               <p className="text-xs text-zinc-400">
//                 Adjusting CPI dynamically alters sample routing priority across supplier networks.
//               </p>
//               <div className="flex items-center gap-2 pt-2">
//                 <span className="text-sm font-bold text-white">$</span>
//                 <input
//                   type="number"
//                   step="0.05"
//                   value={liveCpiInput}
//                   onChange={(e) => setLiveCpiInput(e.target.value)}
//                   className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 w-28 font-mono"
//                 />
//                 <button
//                   type="button"
//                   onClick={async () => {
//                     const val = parseFloat(liveCpiInput);
//                     if (!val) return;
//                     await apiJSON(`/api/projects/${id}/cpi`, "PATCH", { targetCpi: val });
//                     setSuccessMsg("CPI updated!");
//                     setTimeout(() => setSuccessMsg(""), 2000);
//                   }}
//                   className="px-3 py-2 rounded-lg bg-[#642582] text-xs text-white hover:bg-[#7b2c9f]"
//                 >
//                   Update CPI
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* =========================================================
//           TAB 4: QUALIFICATIONS & SCREENER
//       ========================================================= */}
//       {activeTab === "qualifications" && (
//         <div className="space-y-6">
//           <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="text-sm font-bold text-white flex items-center gap-2">
//                   <FileCheck size={16} className="text-[#ff2e93]" />
//                   <span>Screener Qualifications ({p.screener?.questions?.length || 0})</span>
//                 </h3>
//                 <p className="text-xs text-zinc-400 mt-0.5">
//                   Pre-screen respondents before they enter the client survey. Non-qualifying respondents trigger Term 20.
//                 </p>
//               </div>
//             </div>

//             {/* Questions List */}
//             {p.screener?.questions && p.screener.questions.length > 0 ? (
//               <div className="space-y-3">
//                 {p.screener.questions.map((q, idx) => (
//                   <div key={q.id} className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
//                     <div className="flex justify-between items-baseline">
//                       <span className="text-xs font-semibold text-white">
//                         Q{idx + 1}: {q.questionText}
//                       </span>
//                       <span className="text-[10px] text-zinc-500 uppercase">{q.type}</span>
//                     </div>
//                     <div className="flex flex-wrap gap-1.5">
//                       {q.options?.map((opt) => (
//                         <span
//                           key={opt.id}
//                           className={`text-[11px] px-2.5 py-0.5 rounded-full border ${opt.isQualifying
//                               ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
//                               : "bg-red-500/10 text-red-300 border-red-500/30 line-through"
//                             }`}
//                         >
//                           {opt.label}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-xl">
//                 No custom screener questions configured. Standard demographic targeting applies.
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* =========================================================
//           TAB 5: ALLOCATIONS (Sample Supply)
//       ========================================================= */}
//       {activeTab === "allocations" && (
//         <div className="space-y-6">
//           <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
//             <h3 className="text-sm font-bold text-white flex items-center gap-2">
//               <Users size={16} className="text-[#ff2e93]" />
//               <span>Sample Supply Allocations & Partner Routing</span>
//             </h3>
//             <p className="text-xs text-zinc-400">
//               Control sample volume caps per partner supplier to balance quota distribution.
//             </p>

//             <div className="divide-y divide-zinc-800 text-xs">
//               {[
//                 { name: "Cint Global Marketplace", cap: "60%", completes: Math.round(completes * 0.6), status: "Active" },
//                 { name: "PureSpectrum Exchange", cap: "25%", completes: Math.round(completes * 0.25), status: "Active" },
//                 { name: "Lucid / Bilendi Direct", cap: "15%", completes: Math.round(completes * 0.15), status: "Active" },
//               ].map((s, i) => (
//                 <div key={i} className="py-3 flex items-center justify-between">
//                   <div>
//                     <span className="font-semibold text-white">{s.name}</span>
//                     <span className="text-[11px] text-zinc-400 ml-2">Allocation: {s.cap}</span>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <span className="font-mono text-zinc-300">{s.completes} completes</span>
//                     <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400">
//                       {s.status}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* =========================================================
//           TAB 6: SECURITY & SOFT LAUNCH
//       ========================================================= */}
//       {activeTab === "security" && (
//         <div className="space-y-6">
//           <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
//             <h3 className="text-sm font-bold text-white flex items-center gap-2">
//               <Shield size={16} className="text-[#ff2e93]" />
//               <span>Security Gates & Quality Protection</span>
//             </h3>

//             <div className="space-y-4 text-xs">
//               <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
//                 <div>
//                   <div className="font-semibold text-white">Strict IP Deduplication</div>
//                   <div className="text-zinc-400 text-[11px]">Automatically block repeat IPs (Client Code Security 30)</div>
//                 </div>
//                 <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
//                   ENABLED
//                 </span>
//               </div>

//               <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
//                 <div>
//                   <div className="font-semibold text-white">Soft Launch Quality Gate</div>
//                   <div className="text-zinc-400 text-[11px]">
//                     Auto-pause study after {slThreshold} completes to inspect dropout and screener rates.
//                   </div>
//                 </div>
//                 <input
//                   type="checkbox"
//                   checked={slEnabled}
//                   onChange={(e) => setSlEnabled(e.target.checked)}
//                   className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-purple-500 h-4 w-4"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* =========================================================
//           TAB 7: DOCUMENTS & RECONCILIATIONS
//       ========================================================= */}
//       {(activeTab === "documents" || activeTab === "reconciliations") && (
//         <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
//           <h3 className="text-sm font-bold text-white flex items-center gap-2">
//             <FileText size={16} className="text-[#ff2e93]" />
//             <span>Fieldwork Documentation & Reconciliations</span>
//           </h3>
//           <p className="text-xs text-zinc-400">
//             Download sample logs, complete reconciliation spreadsheets, and client invoices.
//           </p>
//           <div className="flex gap-3 pt-2">
//             <button
//               type="button"
//               onClick={() => window.open(`/api/projects/${id}/export`, "_blank")}
//               className="px-4 py-2 rounded-lg bg-[#642582] text-white text-xs font-semibold hover:bg-[#7b2c9f] inline-flex items-center gap-2"
//             >
//               <Download size={14} />
//               <span>Export Full CSV Log</span>
//             </button>
//             <Link
//               href="/invoices"
//               className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-medium hover:bg-zinc-700"
//             >
//               View Invoices
//             </Link>
//           </div>
//         </div>
//       )}

//       {/* =========================================================
//           ADD QUOTA MODAL
//       ========================================================= */}
//       {isAddingQuotaModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
//           <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#190222] p-6 shadow-2xl text-zinc-100 space-y-4">
//             <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
//               <h3 className="text-base font-bold text-white flex items-center gap-2">
//                 <Plus size={16} className="text-[#ff2e93]" />
//                 <span>Add Quota Dimension</span>
//               </h3>
//               <button
//                 type="button"
//                 onClick={() => setIsAddingQuotaModal(false)}
//                 className="text-zinc-400 hover:text-white"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             <form onSubmit={handleAddDimensionSubmit} className="space-y-4 text-xs">
//               <div className="space-y-1">
//                 <label className="font-semibold text-zinc-300">Quota Category</label>
//                 <select
//                   value={newDimCategory}
//                   onChange={(e) => {
//                     const cat = e.target.value as any;
//                     setNewDimCategory(cat);
//                     if (cat === "gender") {
//                       setNewDimName("Gender Balancing");
//                       setNewCellNames("Male, Female");
//                     } else if (cat === "age") {
//                       setNewDimName("Age Cohorts");
//                       setNewCellNames("18-34, 35-54, 55+");
//                     } else if (cat === "region") {
//                       setNewDimName("Census Geographic Divisions");
//                       setNewCellNames("Northeast, Midwest, South, West");
//                     } else if (cat === "income") {
//                       setNewDimName("Household Income");
//                       setNewCellNames("Under $50k, $50k-$100k, $100k+");
//                     } else {
//                       setNewDimName("Custom Screener Quota");
//                       setNewCellNames("Segment A, Segment B");
//                     }
//                   }}
//                   className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
//                 >
//                   <option value="gender">Gender Balancing</option>
//                   <option value="age">Age Groups</option>
//                   <option value="region">Geographic Regions</option>
//                   <option value="income">Household Income</option>
//                   <option value="custom">Custom Screener Option</option>
//                 </select>
//               </div>

//               <div className="space-y-1">
//                 <label className="font-semibold text-zinc-300">Dimension Name</label>
//                 <input
//                   type="text"
//                   required
//                   value={newDimName}
//                   onChange={(e) => setNewDimName(e.target.value)}
//                   placeholder="e.g. Gender Balancing"
//                   className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
//                 />
//               </div>

//               <div className="space-y-1">
//                 <label className="font-semibold text-zinc-300">
//                   Quota Cells (comma or newline separated)
//                 </label>
//                 <textarea
//                   rows={3}
//                   required
//                   value={newCellNames}
//                   onChange={(e) => setNewCellNames(e.target.value)}
//                   placeholder="e.g. Male, Female"
//                   className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
//                 />
//                 <p className="text-[11px] text-zinc-400">
//                   Target weights will be auto-balanced equally to 100% and can be fine-tuned anytime.
//                 </p>
//               </div>

//               <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
//                 <button
//                   type="button"
//                   onClick={() => setIsAddingQuotaModal(false)}
//                   className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={busy}
//                   className="px-4 py-2 rounded-lg bg-[#642582] text-white hover:bg-[#7b2c9f] font-semibold"
//                 >
//                   Create Quota Dimension
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default function ProjectDetailPage() {
//   return (
//     <Suspense
//       fallback={
//         <div className="flex h-96 items-center justify-center">
//           <Spinner size={32} />
//         </div>
//       }
//     >
//       <ProjectDetailContent />
//     </Suspense>
//   );
// }

"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { apiJSON } from "@/lib/auth-client";
import {
  AUDIENCES,
  COUNTRIES,
  type ProjectDTO,
} from "@/lib/project-config";

import { StatusBadge } from "@/components/Statusbadge";
import { EstimateCard, usd } from "@/components/Estimatecard";
import {
  ErrorAlert,
  Spinner,
  primaryButtonClass,
} from "@/components/Ui";

const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-zinc-100 focus-visible:ring-4 focus-visible:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900";

const dangerBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 outline-none transition hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30";

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        {label}
      </div>

      <div className="mt-1 text-xl  text-black font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-100 py-3 last:border-b-0 dark:border-zinc-800">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </div>

      <div className="text-sm text-zinc-700 dark:text-zinc-200">
        {value || "—"}
      </div>
    </div>
  );
}

function ValueList({
  values,
  emptyText = "All / Not specified",
}: {
  values?: string[];
  emptyText?: string;
}) {
  if (!values?.length) {
    return <span className="text-zinc-400">{emptyText}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="rounded-md bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

/* =========================================================
   FORMAT HELPERS
========================================================= */

/**
 * Multi-select values are saved as "All" or "Male, Female".
 * Show "All" as plain text and anything else as chips.
 */
function MultiValue({ value }: { value: unknown }) {
  const list = toList(value);

  if (list.length === 0) {
    return <span>All</span>;
  }

  if (list.length === 1 && list[0].toLowerCase() === "all") {
    return <span>All</span>;
  }

  return <ValueList values={list} />;
}

function toList(value: unknown): string[] {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Ranges are saved as "All", "25-45", "25-max" or "0-45".
 */
function formatRange(value: unknown, prefix = ""): string {
  if (value === null || value === undefined || value === "") {
    return "All";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "All";
  }

  if (typeof value === "object") {
    const obj = value as { min?: unknown; max?: unknown };

    if (obj.min !== undefined || obj.max !== undefined) {
      return formatRange(
        `${obj.min ?? ""}-${obj.max ?? "max"}`,
        prefix
      );
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "Configured";
    }
  }

  const text = String(value).trim();

  if (text.toLowerCase() === "all") {
    return "All";
  }

  const match = text.match(/^(\d*)\s*-\s*(\d*|max)$/i);

  if (!match) {
    return text;
  }

  const from = match[1];
  const to = match[2].toLowerCase() === "max" ? "" : match[2];

  const fmt = (n: string) =>
    `${prefix}${Number(n).toLocaleString()}`;

  if (from && to) return `${fmt(from)} to ${fmt(to)}`;
  if (from && Number(from) > 0) return `${fmt(from)} and above`;
  if (to) return `Up to ${fmt(to)}`;

  return "All";
}

function formatRuleValue(rule: {
  value?: unknown;
  values?: unknown;
}): string {
  if (Array.isArray(rule.values) && rule.values.length > 0) {
    return rule.values.map(String).join(", ");
  }

  if (
    rule.value !== undefined &&
    rule.value !== null &&
    rule.value !== ""
  ) {
    return String(rule.value);
  }

  return "—";
}

/* =========================================================
   PAGE
========================================================= */

function ProjectDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;

    setError("");

    try {
      const { ok, status, data } = await apiJSON<{
        project: ProjectDTO;
        message?: string;
      }>(`/api/projects/${id}`);

      if (status === 401) {
        router.replace("/login");
        return;
      }

      if (!ok) {
        setError(data?.message || "Couldn't load the project.");
        return;
      }

      setProject(data.project);
    } catch (err) {
      console.error("Load project error:", err);
      setError("Couldn't load the project.");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh live-project progress every 10 seconds.
  useEffect(() => {
    if (project?.status !== "live") return;

    const timer = setInterval(() => {
      load();
    }, 10000);

    return () => clearInterval(timer);
  }, [project?.status, load]);

  async function act(
    action: "launch" | "pause" | "resume" | "stop"
  ) {
    if (
      action === "stop" &&
      !window.confirm("Stop this project? This can't be undone.")
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { ok, status, data } = await apiJSON<{
        project: ProjectDTO;
        message?: string;
      }>(`/api/projects/${id}/status`, "POST", { action });

      if (status === 401) {
        router.replace("/login");
        return;
      }

      if (ok) {
        setProject(data.project);
      } else {
        setError(data?.message || "Action failed.");
      }
    } catch (err) {
      console.error("Status action error:", err);
      setError("Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this draft?")) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { ok, status, data } = await apiJSON<{
        message?: string;
      }>(`/api/projects/${id}`, "DELETE");

      if (status === 401) {
        router.replace("/login");
        return;
      }

      if (ok) {
        router.replace("/project");
        return;
      }

      setError(data?.message || "Couldn't delete the project.");
    } catch (err) {
      console.error("Delete project error:", err);
      setError("Couldn't delete the project.");
    } finally {
      setBusy(false);
    }
  }

  const audience = useMemo(() => {
    if (!project) return "";

    return (
      AUDIENCES.find((item) => item.value === project.audienceType)
        ?.label || project.audienceType
    );
  }, [project]);

  const countryName = useMemo(() => {
    if (!project) return "";

    return (
      COUNTRIES.find((country) => country.code === project.country)
        ?.name || project.country
    );
  }, [project]);

  if (!project) {
    return error ? (
      <ErrorAlert message={error} />
    ) : (
      <Spinner className="h-5 w-5 text-zinc-500" />
    );
  }

  const p = project;

  const starts = Number(p.progress?.starts ?? 0);
  const completes = Number(p.progress?.completes ?? 0);
  const screenouts = Number(p.progress?.screenouts ?? 0);
  const quotaFull = Number(p.progress?.quotaFull ?? 0);
  const qualityRejects = Number(p.progress?.qualityRejects ?? 0);
  const spend = Number(p.progress?.spend ?? 0);
  const sampleSize = Number(p.sampleSize ?? 0);

  const pct =
    sampleSize > 0
      ? Math.min(100, Math.round((completes / sampleSize) * 100))
      : 0;

  /*
   * The create form saves demographics as flat keys on `targeting`
   * (targeting.gender, targeting.age, ...). Older projects may have
   * them nested under `targeting.demographics`, so read both.
   */
  const targeting = (p.targeting ?? {}) as Record<string, any>;
  const demographics = (targeting.demographics ?? {}) as Record<
    string,
    unknown
  >;

  const demo = (key: string): unknown =>
    targeting[key] ?? demographics[key];

  const location = (targeting.location ?? {}) as Record<
    string,
    string[] | undefined
  >;

  const advancedTargeting = (targeting.advancedTargeting ??
    []) as Array<{
    field?: unknown;
    operator?: unknown;
    value?: unknown;
    values?: unknown;
  }>;

  const quotaNesting = (targeting.quotaNesting ?? []) as unknown[];

  return (
    <>
      {/* Breadcrumb */}
      <Link
        href="/project"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Projects
      </Link>

      {/* Header */}
      <div className="mb-8 mt-3 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {p.surveyTitle}
            </h1>

            <StatusBadge status={p.status} />
          </div>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {countryName} · {audience} · N=
            {sampleSize.toLocaleString()} · {p.loi} min · IR {p.ir}%
          </p>

          {p.audienceDescription && (
            <p className="mt-2 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
              {p.audienceDescription}
            </p>
          )}

          <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Project ID: {p._id}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {p.status === "draft" && (
            <>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className={dangerBtn}
              >
                Delete
              </button>

              <a
               href={`/project/${p._id}/price`}
                
                // disabled={busy}
                className={`${primaryButtonClass} !w-auto`}
              >
                {busy && <Spinner className="h-4 w-4" />}
               {"->" } Price Engine
              </a>
            </>
          )}

          {p.status === "live" && (
            <>
              <button
                type="button"
                onClick={() => act("pause")}
                disabled={busy}
                className={secondaryBtn}
              >
                Pause
              </button>

              <button
                type="button"
                onClick={() => act("stop")}
                disabled={busy}
                className={dangerBtn}
              >
                Stop
              </button>
            </>
          )}

          {p.status === "paused" && (
            <>
              <button
                type="button"
                onClick={() => act("stop")}
                disabled={busy}
                className={dangerBtn}
              >
                Stop
              </button>

              <button
                type="button"
                onClick={() => act("resume")}
                disabled={busy}
                className={`${primaryButtonClass} !w-auto`}
              >
                Resume
              </button>
            </>
          )}

          {p.status === "stopped" && (
            <span className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Project stopped
            </span>
          )}
        </div>
      </div>

      <ErrorAlert message={error} />

      {/* Main content */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="min-w-0">
          {/* Progress */}
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">
              Completes vs target
            </span>

            <span className="font-medium tabular-nums">
              {completes.toLocaleString()} /{" "}
              {sampleSize.toLocaleString()}
            </span>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-50"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Starts" value={starts.toLocaleString()} />
            <Stat label="Completes" value={completes.toLocaleString()} />
            <Stat label="Screenouts" value={screenouts.toLocaleString()} />
            <Stat label="Quota full" value={quotaFull.toLocaleString()} />
            <Stat
              label="Quality rejects"
              value={qualityRejects.toLocaleString()}
            />
            <Stat label="Spend" value={usd(spend)} />
          </div>

          {/* Draft notice */}
          {p.status === "draft" && (
            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="text-sm text-black font-medium ">
                This project is a draft.
              </p>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Review the targeting, survey setup and feasibility
                before launching the project.
              </p>
            </div>
          )}

          {/* Targeting */}
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold text-black">Targeting</h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Audience and respondent targeting configuration.
              </p>
            </div>

            <div className="px-5">
              <DetailRow
                label="Country"
                value={(targeting.country as string) || countryName}
              />

              <DetailRow
                label="Language"
                value={(targeting.language as string) || "English"}
              />

              <DetailRow
                label="Category"
                value={(targeting.category as string) || "All"}
              />

              <DetailRow
                label="Gender"
                value={<MultiValue value={demo("gender")} />}
              />

              <DetailRow
                label="Age"
                value={formatRange(demo("age"))}
              />

              <DetailRow
                label="Income"
                value={formatRange(demo("income"), "$")}
              />

              <DetailRow
                label="Hispanic Origin"
                value={<MultiValue value={demo("hispanicOrigin")} />}
              />

              <DetailRow
                label="Relationship"
                value={<MultiValue value={demo("relationship")} />}
              />

              <DetailRow
                label="Children"
                value={<MultiValue value={demo("children")} />}
              />

              <DetailRow
                label="Employment"
                value={<MultiValue value={demo("employment")} />}
              />

              <DetailRow
                label="Education"
                value={<MultiValue value={demo("education")} />}
              />

              <DetailRow
                label="Device"
                value={<MultiValue value={demo("device")} />}
              />
            </div>
          </div>

          {/* Geographic targeting */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Geographic Targeting</h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Geographic filters configured for this project.
              </p>
            </div>

            <div className="px-5">
              <DetailRow
                label="Region"
                value={<ValueList values={location.region} />}
              />

              <DetailRow
                label="Division"
                value={<ValueList values={location.division} />}
              />

              <DetailRow
                label="State"
                value={<ValueList values={location.state} />}
              />

              <DetailRow
                label="CSA"
                value={<ValueList values={location.csa} />}
              />

              <DetailRow
                label="CBSA"
                value={<ValueList values={location.cbsa} />}
              />

              <DetailRow
                label="County"
                value={<ValueList values={location.county} />}
              />

              <DetailRow
                label="DMA"
                value={<ValueList values={location.dma} />}
              />

              <DetailRow
                label="ZIP Code"
                value={<ValueList values={location.zipcode} />}
              />
            </div>
          </div>

          {/* Advanced targeting */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Advanced Targeting</h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Additional targeting rules applied to respondents.
              </p>
            </div>

            <div className="p-5">
              {advancedTargeting.length ? (
                <div className="space-y-3">
                  {advancedTargeting.map((rule, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <div className="text-xs text-zinc-400">
                            Field
                          </div>

                          <div className="mt-1 text-sm font-medium">
                            {String(rule.field || "—")}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-zinc-400">
                            Operator
                          </div>

                          <div className="mt-1 text-sm font-medium">
                            {String(rule.operator || "—")}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-zinc-400">
                            Value
                          </div>

                          <div className="mt-1 text-sm font-medium">
                            {formatRuleValue(rule)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No advanced targeting rules configured.
                </p>
              )}
            </div>
          </div>

          {/* Quota nesting */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Quota Nesting</h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Nested quota configuration for this project.
              </p>
            </div>

            <div className="p-5">
              {quotaNesting.length ? (
                <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-200">
                  {JSON.stringify(quotaNesting, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No quota nesting configured.
                </p>
              )}
            </div>
          </div>

          {/* Survey setup */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <div>
                <h2 className="font-semibold">Survey Setup</h2>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Survey URL and respondent routing configuration.
                </p>
              </div>

              {p.surveySetup?.status === "ready" ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Ready
                </span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Not configured
                </span>
              )}
            </div>

            <div className="px-5">
              <DetailRow
                label="Survey Type"
                value={
                  p.surveySetup?.surveyType === "internal"
                    ? "Internal"
                    : "External"
                }
              />

              <DetailRow
                label="Survey URL"
                value={
                  p.surveySetup?.surveyUrl ? (
                    <a
                      href={p.surveySetup.surveyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
                    >
                      {p.surveySetup.surveyUrl}
                    </a>
                  ) : (
                    "Not configured"
                  )
                }
              />

              <DetailRow
                label="Estimated LOI"
                value={
                  p.surveySetup?.estimatedLoi
                    ? `${p.surveySetup.estimatedLoi} min`
                    : "Not configured"
                }
              />

              <DetailRow
                label="Qualification URL"
                value={p.surveySetup?.qualificationUrl || "Not configured"}
              />

              <DetailRow
                label="Termination URL"
                value={p.surveySetup?.terminationUrl || "Not configured"}
              />

              <DetailRow
                label="Redirect URL"
                value={p.surveySetup?.redirectUrl || "Not configured"}
              />
            </div>
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="space-y-6">
          <EstimateCard estimate={p.estimate} />

          {/* Project summary */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Project Summary</h2>
            </div>

            <div className="px-5">
              <DetailRow label="Country" value={countryName} />
              <DetailRow label="Audience" value={audience} />
              <DetailRow
                label="Sample Size"
                value={sampleSize.toLocaleString()}
              />
              <DetailRow label="LOI" value={`${p.loi} minutes`} />
              <DetailRow label="IR" value={`${p.ir}%`} />
              <DetailRow
                label="Status"
                value={<StatusBadge status={p.status} />}
              />
            </div>
          </div>

          {/* Fieldwork metrics */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-semibold">Fieldwork Metrics</h2>
            </div>

            <div className="px-5">
              <DetailRow label="Starts" value={starts.toLocaleString()} />
              <DetailRow
                label="Completes"
                value={completes.toLocaleString()}
              />
              <DetailRow
                label="Screenouts"
                value={screenouts.toLocaleString()}
              />
              <DetailRow
                label="Quota Full"
                value={quotaFull.toLocaleString()}
              />
              <DetailRow
                label="Quality Rejects"
                value={qualityRejects.toLocaleString()}
              />
              <DetailRow label="Spend" value={usd(spend)} />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-white" />
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}