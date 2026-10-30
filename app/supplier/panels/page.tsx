// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import {
//   Layers,
//   Plus,
//   Search,
//   Users,
//   ShieldCheck,
//   TrendingUp,
//   Clock,
//   Sparkles,
//   X,
//   Check,
//   RefreshCw,
//   Trash2,
//   Edit3,
//   Database,
//   SlidersHorizontal,
//   AlertCircle,
//   ExternalLink,
// } from "lucide-react";
// import { useSupplier } from "@/lib/supplier-store";
// import { SupplierPanel } from "@/lib/supplier-data";

// export default function SupplierPanelsPage() {
//   const {
//     panels,
//     createNewPanel,
//     updatePanel,
//     deletePanel,
//     syncPanelQuota,
//     resetPanelsToMock,
//     refreshData,
//     isLiveBackend,
//     dataSource,
//     isSyncing,
//     lastSyncedAt,
//   } = useSupplier();

//   const [search, setSearch] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState<string>("All");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editingPanel, setEditingPanel] = useState<SupplierPanel | null>(null);
//   const [syncingPanelId, setSyncingPanelId] = useState<string | null>(null);
//   const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

//   // Form state
//   const [name, setName] = useState("");
//   const [category, setCategory] = useState<SupplierPanel["category"]>("Consumer");
//   const [country, setCountry] = useState("US");
//   const [activeMembers, setActiveMembers] = useState("25000");
//   const [responseRate, setResponseRate] = useState("55");
//   const [avgCompletionTime, setAvgCompletionTime] = useState("12");
//   const [qualityIndex, setQualityIndex] = useState("94.5");
//   const [status, setStatus] = useState<SupplierPanel["status"]>("Active");

//   const categories = [
//     "All",
//     "Consumer",
//     "B2B Tech",
//     "Healthcare HCP",
//     "Gen Z & Youth",
//     "Finance & Banking",
//   ];

//   const filtered = panels.filter((p) => {
//     const matchesSearch =
//       p.name.toLowerCase().includes(search.toLowerCase()) ||
//       p.category.toLowerCase().includes(search.toLowerCase()) ||
//       p.country.toLowerCase().includes(search.toLowerCase());
//     const matchesCategory =
//       selectedCategory === "All" || p.category === selectedCategory;
//     return matchesSearch && matchesCategory;
//   });

//   const totalMembers = panels.reduce((sum, p) => sum + (p.activeMembers || 0), 0);
//   const avgQuality = panels.length > 0
//     ? Math.round(
//         (panels.reduce((sum, p) => sum + (p.qualityIndex || 90), 0) /
//           panels.length) *
//           10
//       ) / 10
//     : 93.2;

//   const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
//     setNotification({ type, msg });
//     setTimeout(() => setNotification(null), 4000);
//   };

//   const openCreateModal = () => {
//     setEditingPanel(null);
//     setName("");
//     setCategory("Consumer");
//     setCountry("US");
//     setActiveMembers("25000");
//     setResponseRate("55");
//     setAvgCompletionTime("12");
//     setQualityIndex("94.5");
//     setStatus("Active");
//     setModalOpen(true);
//   };

//   const openEditModal = (p: SupplierPanel) => {
//     setEditingPanel(p);
//     setName(p.name);
//     setCategory(p.category);
//     setCountry(p.country);
//     setActiveMembers(String(p.activeMembers));
//     setResponseRate(String(p.responseRate));
//     setAvgCompletionTime(String(p.avgCompletionTime));
//     setQualityIndex(String(p.qualityIndex));
//     setStatus(p.status);
//     setModalOpen(true);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!name.trim()) return;

//     if (editingPanel) {
//       // Edit
//       await updatePanel(editingPanel.id, {
//         name: name.trim(),
//         category,
//         country,
//         activeMembers: Number(activeMembers) || 10000,
//         responseRate: Number(responseRate) || 50,
//         avgCompletionTime: Number(avgCompletionTime) || 10,
//         qualityIndex: Number(qualityIndex) || 92,
//         status,
//       });
//       showToast(`Updated panel "${name}" in backend database.`);
//     } else {
//       // Create
//       await createNewPanel({
//         name: name.trim(),
//         category,
//         country,
//         activeMembers: Number(activeMembers) || 10000,
//         responseRate: Number(responseRate) || 50,
//         avgCompletionTime: Number(avgCompletionTime) || 10,
//         qualityIndex: Number(qualityIndex) || 94.5,
//         status,
//       });
//       showToast(`Created new panel segment "${name}" in backend.`);
//     }

//     setModalOpen(false);
//   };

//   const handleDelete = async (panel: SupplierPanel) => {
//     if (confirm(`Are you sure you want to remove panel "${panel.name}" from your audience registry?`)) {
//       await deletePanel(panel.id);
//       showToast(`Removed "${panel.name}" from audience registry.`, "info");
//     }
//   };

//   const handleSyncQuota = async (panel: SupplierPanel) => {
//     setSyncingPanelId(panel.id);
//     const res = await syncPanelQuota(panel.id);
//     setSyncingPanelId(null);
//     showToast(res.message);
//   };

//   const handleResetSeed = async () => {
//     if (confirm("Reset audience panels to default platform sample data? This will update MongoDB and local state.")) {
//       await resetPanelsToMock();
//       showToast("Reset panels to default platform sample data in MongoDB.");
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Toast Notification */}
//       {notification && (
//         <div
//           className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur animate-in fade-in slide-in-from-top-2 ${
//             notification.type === "success"
//               ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
//               : notification.type === "error"
//               ? "bg-rose-950/90 border-rose-500/30 text-rose-300"
//               : "bg-indigo-950/90 border-indigo-500/30 text-indigo-300"
//           }`}
//         >
//           <Sparkles size={14} />
//           <span>{notification.msg}</span>
//           <button
//             onClick={() => setNotification(null)}
//             className="ml-2 hover:opacity-75"
//           >
//             <X size={13} />
//           </button>
//         </div>
//       )}

//       {/* Header Banner */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//         <div>
//           <div className="flex items-center gap-2 mb-2 flex-wrap">
//             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
//               <Layers size={13} />
//               <span>Audience Inventory Hub</span>
//             </div>

//             {/* Backend Connection Badge */}
//             <div
//               className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
//                 isLiveBackend
//                   ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
//                   : "bg-amber-500/10 border-amber-500/30 text-amber-400"
//               }`}
//             >
//               <Database size={12} />
//               <span>
//                 {isLiveBackend
//                   ? "Live Backend (MongoDB Connected)"
//                   : "Mock Data Cache (Ready for DB Sync)"}
//               </span>
//             </div>

//             {lastSyncedAt && (
//               <span className="text-[11px] text-zinc-400">
//                 Synced at {lastSyncedAt}
//               </span>
//             )}
//           </div>

//           <h1 className="text-2xl font-bold tracking-tight text-white">
//             Proprietary Panels & Audience Segments
//           </h1>
//           <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
//             Manage your registered respondent panels, response rate health, and capacity allocation for GMS sample matching connected directly to live MongoDB.
//           </p>
//         </div>

//         <div className="flex items-center gap-2 flex-wrap shrink-0">
//           <button
//             onClick={refreshData}
//             disabled={isSyncing}
//             className="text-xs font-medium text-zinc-300 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-1.5 transition disabled:opacity-50"
//             title="Refresh from MongoDB backend"
//           >
//             <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
//             <span>{isSyncing ? "Syncing..." : "Sync Database"}</span>
//           </button>

//           <button
//             onClick={openCreateModal}
//             className="text-xs font-semibold text-white px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition shrink-0"
//           >
//             <Plus size={15} />
//             Register New Panel
//           </button>
//         </div>
//       </div>

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur">
//           <div className="flex items-center justify-between text-zinc-400">
//             <span className="text-xs font-medium">Total Active Panelists</span>
//             <Users size={16} className="text-indigo-400" />
//           </div>
//           <div className="text-2xl font-bold text-white mt-1">
//             {totalMembers.toLocaleString()}
//           </div>
//           <span className="text-[11px] text-zinc-400 mt-0.5 block">
//             Across {panels.length} proprietary audience pools
//           </span>
//         </div>

//         <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur">
//           <div className="flex items-center justify-between text-zinc-400">
//             <span className="text-xs font-medium">Panel Segments Configured</span>
//             <Layers size={16} className="text-cyan-400" />
//           </div>
//           <div className="text-2xl font-bold text-indigo-400 mt-1">
//             {panels.length}
//           </div>
//           <span className="text-[11px] text-zinc-400 mt-0.5 block">
//             {panels.filter((p) => p.status === "Active").length} actively routing
//           </span>
//         </div>

//         <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur">
//           <div className="flex items-center justify-between text-zinc-400">
//             <span className="text-xs font-medium">Average Panel Quality Index</span>
//             <ShieldCheck size={16} className="text-emerald-400" />
//           </div>
//           <div className="text-2xl font-bold text-emerald-400 mt-1">
//             {avgQuality} / 100
//           </div>
//           <span className="text-[11px] text-zinc-400 mt-0.5 block">
//             Fraud detection & duplicate screening active
//           </span>
//         </div>
//       </div>

//       {/* Search and Category Filter Toolbar */}
//       <div className="space-y-3">
//         <div className="flex flex-col sm:flex-row sm:items-center gap-3">
//           <div className="relative flex-1">
//             <Search
//               size={15}
//               className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
//             />
//             <input
//               type="text"
//               placeholder="Search panel name, audience classification, or target geography..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
//             />
//           </div>
//         </div>

//         {/* Category Pills */}
//         <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
//           {categories.map((cat) => (
//             <button
//               key={cat}
//               onClick={() => setSelectedCategory(cat)}
//               className={`text-xs px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
//                 selectedCategory === cat
//                   ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
//                   : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
//               }`}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Panels Cards Grid */}
//       {filtered.length === 0 ? (
//         <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30">
//           <Layers size={36} className="mx-auto text-zinc-400 mb-3" />
//           <h3 className="text-base font-semibold text-white">No panels found</h3>
//           <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
//             {search || selectedCategory !== "All"
//               ? "Try adjusting your search terms or filter selection."
//               : "Register your first respondent panel to start receiving matched study volume."}
//           </p>
//           <button
//             onClick={openCreateModal}
//             className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
//           >
//             <Plus size={14} />
//             Register Panel
//           </button>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {filtered.map((panel) => (
//             <div
//               key={panel.id}
//               className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700/80 p-5 transition space-y-4 flex flex-col justify-between group"
//             >
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
//                     {panel.category}
//                   </span>
//                   <div className="flex items-center gap-1.5">
//                     <span
//                       className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
//                         panel.status === "Active"
//                           ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
//                           : panel.status === "Recruiting"
//                           ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
//                           : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
//                       }`}
//                     >
//                       {panel.status}
//                     </span>
//                     <button
//                       onClick={() => openEditModal(panel)}
//                       className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
//                       title="Edit Panel"
//                     >
//                       <Edit3 size={12} />
//                     </button>
//                     <button
//                       onClick={() => handleDelete(panel)}
//                       className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
//                       title="Delete Panel"
//                     >
//                       <Trash2 size={12} />
//                     </button>
//                   </div>
//                 </div>

//                 <Link
//                   href={`/supplier/panels/${panel.id}`}
//                   className="text-base font-bold text-white hover:text-indigo-400 tracking-tight transition flex items-center justify-between group-hover:text-indigo-300"
//                 >
//                   <span>{panel.name}</span>
//                   <ExternalLink size={13} className="text-zinc-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition" />
//                 </Link>
//                 <div className="text-xs text-zinc-400">
//                   Target Region:{" "}
//                   <strong className="text-zinc-200">{panel.country}</strong>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/60 text-xs">
//                 <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
//                   <span className="text-zinc-400 block text-[10px]">
//                     Active Members
//                   </span>
//                   <span className="font-bold text-white text-sm font-mono">
//                     {panel.activeMembers.toLocaleString()}
//                   </span>
//                 </div>
//                 <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
//                   <span className="text-zinc-400 block text-[10px]">
//                     Response Rate
//                   </span>
//                   <span className="font-bold text-emerald-400 text-sm font-mono">
//                     {panel.responseRate}%
//                   </span>
//                 </div>
//                 <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
//                   <span className="text-zinc-400 block text-[10px]">
//                     Avg Speed (LOI)
//                   </span>
//                   <span className="font-semibold text-zinc-200 text-xs font-mono">
//                     {panel.avgCompletionTime} mins
//                   </span>
//                 </div>
//                 <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
//                   <span className="text-zinc-400 block text-[10px]">
//                     Quality Index
//                   </span>
//                   <span className="font-semibold text-cyan-400 text-xs font-mono">
//                     {panel.qualityIndex}/100
//                   </span>
//                 </div>
//               </div>

//               <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/40">
//                 <Link
//                   href={`/supplier/panels/${panel.id}`}
//                   className="text-zinc-400 hover:text-white inline-flex items-center gap-1 font-medium"
//                 >
//                   <Users size={11} className="text-indigo-400" />
//                   <span>View Respondents →</span>
//                 </Link>
//                 <button
//                   onClick={() => handleSyncQuota(panel)}
//                   disabled={syncingPanelId === panel.id}
//                   className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition"
//                 >
//                   <RefreshCw
//                     size={10}
//                     className={syncingPanelId === panel.id ? "animate-spin" : ""}
//                   />
//                   <span>
//                     {syncingPanelId === panel.id ? "Syncing..." : "Sync Feed"}
//                   </span>
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Modal: Create / Edit Panel */}
//       {modalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
//           <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
//             <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
//               <h3 className="text-sm font-bold text-white flex items-center gap-2">
//                 <Layers size={16} className="text-indigo-400" />
//                 <span>{editingPanel ? "Edit Panel Segment" : "Register Panel Segment"}</span>
//               </h3>
//               <button
//                 onClick={() => setModalOpen(false)}
//                 className="p-1 rounded text-zinc-400 hover:text-white"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit} className="space-y-3 text-xs">
//               <div>
//                 <label className="block text-zinc-400 mb-1">Panel Name</label>
//                 <input
//                   required
//                   placeholder="e.g. Nordic Financial Advisors Panel"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="block text-zinc-400 mb-1">Audience Category</label>
//                   <select
//                     value={category}
//                     onChange={(e) => setCategory(e.target.value as any)}
//                     className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
//                   >
//                     <option value="Consumer">Consumer</option>
//                     <option value="B2B Tech">B2B Tech</option>
//                     <option value="Healthcare HCP">Healthcare HCP</option>
//                     <option value="Gen Z & Youth">Gen Z & Youth</option>
//                     <option value="Finance & Banking">Finance & Banking</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-zinc-400 mb-1">Country / Market</label>
//                   <input
//                     required
//                     value={country}
//                     onChange={(e) => setCountry(e.target.value)}
//                     className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="block text-zinc-400 mb-1">Active Members</label>
//                   <input
//                     type="number"
//                     value={activeMembers}
//                     onChange={(e) => setActiveMembers(e.target.value)}
//                     className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-zinc-400 mb-1">Response Rate (%)</label>
//                   <input
//                     type="number"
//                     value={responseRate}
//                     onChange={(e) => setResponseRate(e.target.value)}
//                     className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="block text-zinc-400 mb-1">Avg Speed (LOI mins)</label>
//                   <input
//                     type="number"
//                     value={avgCompletionTime}
//                     onChange={(e) => setAvgCompletionTime(e.target.value)}
//                     className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-zinc-400 mb-1">Status</label>
//                   <select
//                     value={status}
//                     onChange={(e) => setStatus(e.target.value as any)}
//                     className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
//                   >
//                     <option value="Active">Active</option>
//                     <option value="Recruiting">Recruiting</option>
//                     <option value="Maintenance">Maintenance</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="flex gap-2 pt-2">
//                 <button
//                   type="button"
//                   onClick={() => setModalOpen(false)}
//                   className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25"
//                 >
//                   {editingPanel ? "Update Panel" : "Save Panel to Backend"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  Users,
  ShieldCheck,
  X,
  RefreshCw,
  Trash2,
  Edit3,
  Database,
  ExternalLink,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { useSupplier } from "@/lib/supplier-store";
import { SupplierPanel } from "@/lib/supplier-data";

type PanelStatus = "active" | "inactive" | "paused" | "archived";
type PanelCategory =
  | "Consumer"
  | "B2B Tech"
  | "Healthcare HCP"
  | "Gen Z & Youth"
  | "Finance & Banking";

type PanelForm = {
  name: string;
  description: string;
  category: PanelCategory;
  country: string;
  languages: string;
  genders: string;
  ageMin: string;
  ageMax: string;
  states: string;
  cities: string;
  education: string;
  employment: string;
  occupations: string;
  income: string;
  maritalStatus: string;
  industries: string;
  status: PanelStatus;
};

const categories: Array<"All" | PanelCategory> = [
  "All",
  "Consumer",
  "B2B Tech",
  "Healthcare HCP",
  "Gen Z & Youth",
  "Finance & Banking",
];

const emptyForm: PanelForm = {
  name: "",
  description: "",
  category: "Consumer",
  country: "India",
  languages: "English, Hindi",
  genders: "Male, Female",
  ageMin: "18",
  ageMax: "65",
  states: "",
  cities: "",
  education: "",
  employment: "",
  occupations: "",
  income: "",
  maritalStatus: "",
  industries: "",
  status: "active",
};

const toArray = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function SupplierPanelsPage() {
  const {
    panels,
    createNewPanel,
    updatePanel,
    deletePanel,
    refreshData,
    isLiveBackend,
    isSyncing,
    lastSyncedAt,
  } = useSupplier();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<"All" | PanelCategory>("All");
  const [selectedStatus, setSelectedStatus] = useState<"All" | PanelStatus>(
    "All"
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<SupplierPanel | null>(null);
  const [form, setForm] = useState<PanelForm>(emptyForm);

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    msg: string;
  } | null>(null);

  const showToast = (
    msg: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setNotification({ type, msg });
    window.setTimeout(() => setNotification(null), 4000);
  };

  const updateField = <K extends keyof PanelForm>(
    key: K,
    value: PanelForm[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreateModal = () => {
    setEditingPanel(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (panel: SupplierPanel) => {
    const p = panel as SupplierPanel & {
      description?: string;
      languages?: string[];
      genders?: string[];
      ageRange?: { min?: number; max?: number };
      states?: string[];
      cities?: string[];
      education?: string[];
      employment?: string[];
      occupations?: string[];
      income?: string[];
      maritalStatus?: string[];
      industries?: string[];
      countries?: string[];
    };

    setEditingPanel(panel);

    setForm({
      name: p.name || "",
      description: p.description || "",
      category: (p.category as PanelCategory) || "Consumer",
      country: p.country || p.countries?.[0] || "India",
      languages: (p.languages || []).join(", "),
      genders: (p.genders || []).join(", "),
      ageMin: String(p.ageRange?.min ?? 18),
      ageMax: String(p.ageRange?.max ?? 65),
      states: (p.states || []).join(", "),
      cities: (p.cities || []).join(", "),
      education: (p.education || []).join(", "),
      employment: (p.employment || []).join(", "),
      occupations: (p.occupations || []).join(", "),
      income: (p.income || []).join(", "),
      maritalStatus: (p.maritalStatus || []).join(", "),
      industries: (p.industries || []).join(", "),
      status: ((p.status || "active").toString().toLowerCase() as PanelStatus),
    });

    setModalOpen(true);
  };

  const filteredPanels = useMemo(() => {
    const query = search.trim().toLowerCase();

    return panels.filter((panel) => {
      const p = panel as SupplierPanel & {
        description?: string;
        countries?: string[];
      };

      const searchableText = [
        p.name,
        p.category,
        p.country,
        ...(p.countries || []),
        p.description || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);
      const matchesCategory =
        selectedCategory === "All" || p.category === selectedCategory;

      const panelStatus = String(p.status || "active").toLowerCase();
      const matchesStatus =
        selectedStatus === "All" || panelStatus === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [panels, search, selectedCategory, selectedStatus]);

  const totalRespondents = panels.reduce((sum, panel) => {
    const p = panel as SupplierPanel & {
      respondentCount?: number;
      activeRespondentCount?: number;
      activeMembers?: number;
    };

    return (
      sum +
      Number(
        p.activeRespondentCount ??
          p.respondentCount ??
          p.activeMembers ??
          0
      )
    );
  }, 0);

  const averageQuality = useMemo(() => {
    if (!panels.length) return 0;

    const total = panels.reduce((sum, panel) => {
      const p = panel as SupplierPanel & {
        qualityScore?: number;
        qualityIndex?: number;
      };

      return sum + Number(p.qualityScore ?? p.qualityIndex ?? 0);
    }, 0);

    return Math.round((total / panels.length) * 10) / 10;
  }, [panels]);

  const activePanels = panels.filter(
    (panel) => String(panel.status).toLowerCase() === "active"
  ).length;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      showToast("Panel name is required.", "error");
      return;
    }

    const minAge = Number(form.ageMin);
    const maxAge = Number(form.ageMax);

    if (
      !Number.isFinite(minAge) ||
      !Number.isFinite(maxAge) ||
      minAge < 0 ||
      maxAge < minAge
    ) {
      showToast("Please enter a valid age range.", "error");
      return;
    }

    /*
     * IMPORTANT:
     * supplierId is intentionally NOT sent from the frontend.
     * The backend gets the current supplier from getCurrentUser().
     */
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,

      country: form.country.trim(),
      countries: form.country.trim() ? [form.country.trim()] : [],

      languages: toArray(form.languages),
      genders: toArray(form.genders),

      ageRange: {
        min: minAge,
        max: maxAge,
      },

      states: toArray(form.states),
      cities: toArray(form.cities),
      education: toArray(form.education),
      employment: toArray(form.employment),
      occupations: toArray(form.occupations),
      income: toArray(form.income),
      maritalStatus: toArray(form.maritalStatus),
      industries: toArray(form.industries),

      status: form.status,
    };

    try {
      if (editingPanel) {
        await updatePanel(
          editingPanel.id,
          payload as unknown as Parameters<typeof updatePanel>[1]
        );
        showToast(`Updated panel "${form.name}".`);
      } else {
        await createNewPanel(
          payload as unknown as Parameters<typeof createNewPanel>[0]
        );
        showToast(`Created panel "${form.name}".`);
      }

      setModalOpen(false);
      setEditingPanel(null);
      setForm(emptyForm);

      await refreshData();
    } catch (error) {
      console.error(error);
      showToast(
        editingPanel
          ? "Failed to update panel."
          : "Failed to create panel.",
        "error"
      );
    }
  };

  const handleDelete = async (panel: SupplierPanel) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${panel.name}"?`
    );

    if (!confirmed) return;

    try {
      await deletePanel(panel.id);
      showToast(`Deleted "${panel.name}".`, "info");
      await refreshData();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete panel.", "error");
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "inactive":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case "paused":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "archived":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getPanelNumber = (panel: SupplierPanel) => {
    const p = panel as SupplierPanel & {
      activeRespondentCount?: number;
      respondentCount?: number;
      activeMembers?: number;
    };

    return Number(
      p.activeRespondentCount ?? p.respondentCount ?? p.activeMembers ?? 0
    );
  };

  const getQuality = (panel: SupplierPanel) => {
    const p = panel as SupplierPanel & {
      qualityScore?: number;
      qualityIndex?: number;
    };

    return Number(p.qualityScore ?? p.qualityIndex ?? 0);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur ${
            notification.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
              : notification.type === "error"
              ? "bg-rose-950/90 border-rose-500/30 text-rose-300"
              : "bg-indigo-950/90 border-indigo-500/30 text-indigo-300"
          }`}
        >
          {notification.type === "error" ? (
            <AlertTriangle size={14} />
          ) : (
            <ShieldCheck size={14} />
          )}

          <span>{notification.msg}</span>

          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-75"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
              <Layers size={13} />
              Supplier Panel Management
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isLiveBackend
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              <Database size={12} />
              {isLiveBackend ? "Live MongoDB" : "Local / Mock"}
            </div>

            {lastSyncedAt && (
              <span className="text-[11px] text-zinc-500">
                Last sync: {lastSyncedAt}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Supplier Panels
          </h1>

          <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
            Create and manage respondent panels owned by the currently logged-in
            supplier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={isSyncing}
            className="text-xs font-medium text-zinc-300 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={isSyncing ? "animate-spin" : ""}
            />
            {isSyncing ? "Syncing..." : "Refresh"}
          </button>

          <button
            onClick={openCreateModal}
            className="text-xs font-semibold text-white px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
          >
            <Plus size={15} />
            Register New Panel
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Active Respondents</span>
            <Users size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {totalRespondents.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-500">
            Across {panels.length} panels
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Active Panels</span>
            <UserCheck size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {activePanels}
          </div>
          <span className="text-[11px] text-zinc-500">
            {panels.length} total configured
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Average Quality</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {averageQuality || "—"}
            {averageQuality ? " / 100" : ""}
          </div>
          <span className="text-[11px] text-zinc-500">
            Quality score across panels
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="text"
              placeholder="Search panel name, category, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as "All" | PanelStatus)
            }
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
                selectedCategory === category
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      {filteredPanels.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <Layers size={36} className="mx-auto text-zinc-500 mb-3" />

          <h3 className="text-base font-semibold text-white">
            No panels found
          </h3>

          <p className="text-xs text-zinc-500 mt-1">
            {search || selectedCategory !== "All" || selectedStatus !== "All"
              ? "Try changing your filters."
              : "Create your first supplier respondent panel."}
          </p>

          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
          >
            <Plus size={14} />
            Register Panel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPanels.map((panel) => {
            const p = panel as SupplierPanel & {
              description?: string;
              countries?: string[];
              fraudRate?: number;
              totalInvites?: number;
              totalStarts?: number;
              totalCompletes?: number;
              totalTerminates?: number;
              totalQuotaFull?: number;
              lastRefreshed?: string | Date;
            };

            const respondentCount = getPanelNumber(panel);
            const quality = getQuality(panel);
            const status = String(p.status || "active").toLowerCase();

            return (
              <div
                key={panel.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 p-5 transition space-y-4 flex flex-col"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {panel.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>

                      <button
                        onClick={() => openEditModal(panel)}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                        title="Edit Panel"
                      >
                        <Edit3 size={12} />
                      </button>

                      <button
                        onClick={() => handleDelete(panel)}
                        className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                        title="Delete Panel"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <Link
                    href={`/supplier/panels/${panel.id}`}
                    className="text-base font-bold text-white hover:text-indigo-400 flex items-center justify-between"
                  >
                    <span>{panel.name}</span>
                    <ExternalLink size={13} className="text-zinc-500" />
                  </Link>

                  {p.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div className="text-xs text-zinc-400">
                    Country:{" "}
                    <strong className="text-zinc-200">
                      {p.country || p.countries?.join(", ") || "—"}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/60 text-xs">
                  <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-zinc-500 block text-[10px]">
                      Respondents
                    </span>
                    <span className="font-bold text-white text-sm">
                      {respondentCount.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-zinc-500 block text-[10px]">
                      Quality
                    </span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {quality || "—"}
                      {quality ? "/100" : ""}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-zinc-500 block text-[10px]">
                      Completes
                    </span>
                    <span className="font-semibold text-zinc-200 text-sm">
                      {Number(p.totalCompletes || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-zinc-500 block text-[10px]">
                      Fraud Rate
                    </span>
                    <span className="font-semibold text-cyan-400 text-sm">
                      {Number(p.fraudRate || 0)}%
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-800/40 mt-auto">
                  <Link
                    href={`/supplier/panels/${panel.id}`}
                    className="hover:text-white inline-flex items-center gap-1 font-medium"
                  >
                    <Users size={11} className="text-indigo-400" />
                    View Respondents →
                  </Link>

                  <span>
                    {p.totalInvites
                      ? `${Number(p.totalInvites).toLocaleString()} invites`
                      : "No invites yet"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-indigo-400" />
                  {editingPanel ? "Edit Supplier Panel" : "Register Supplier Panel"}
                </h3>

                <p className="text-[11px] text-zinc-500 mt-1">
                  Supplier ownership is assigned automatically by the backend.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Basic Information */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Basic Information
                </h4>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    Panel Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. India Consumer Panel"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                    placeholder="Describe this respondent panel..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        updateField(
                          "category",
                          e.target.value as PanelCategory
                        )
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {categories
                        .filter(
                          (category): category is PanelCategory =>
                            category !== "All"
                        )
                        .map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Country *
                    </label>
                    <input
                      required
                      value={form.country}
                      onChange={(e) => updateField("country", e.target.value)}
                      placeholder="India"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        updateField(
                          "status",
                          e.target.value as PanelStatus
                        )
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="paused">Paused</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Targeting */}
              <section className="space-y-3 border-t border-zinc-800 pt-5">
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Targeting
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Languages
                    </label>
                    <input
                      value={form.languages}
                      onChange={(e) =>
                        updateField("languages", e.target.value)
                      }
                      placeholder="English, Hindi"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Gender
                    </label>
                    <input
                      value={form.genders}
                      onChange={(e) => updateField("genders", e.target.value)}
                      placeholder="Male, Female"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    Age Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min={0}
                      value={form.ageMin}
                      onChange={(e) => updateField("ageMin", e.target.value)}
                      placeholder="Min age"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />

                    <input
                      type="number"
                      min={0}
                      value={form.ageMax}
                      onChange={(e) => updateField("ageMax", e.target.value)}
                      placeholder="Max age"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(
                    [
                      ["states", "States", "Delhi, Uttar Pradesh"],
                      ["cities", "Cities", "Noida, Delhi"],
                      ["education", "Education", "Graduate, Post Graduate"],
                      ["employment", "Employment", "Full-time, Self-employed"],
                      ["occupations", "Occupations", "Developer, Manager"],
                      ["income", "Income", "3-5 LPA, 5-10 LPA"],
                      ["maritalStatus", "Marital Status", "Single, Married"],
                      ["industries", "Industries", "IT, Finance, Healthcare"],
                    ] as Array<[keyof PanelForm, string, string]>
                  ).map(([key, label, placeholder]) => (
                    <div key={key}>
                      <label className="block text-zinc-400 mb-1">
                        {label}
                      </label>
                      <input
                        value={form[key] as string}
                        onChange={(e) =>
                          updateField(key, e.target.value as never)
                        }
                        placeholder={placeholder}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-zinc-600">
                  For multi-value fields, separate values with commas.
                </p>
              </section>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {editingPanel ? "Update Panel" : "Create Panel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
