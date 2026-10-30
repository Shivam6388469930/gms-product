// "use client";

// import { useEffect, useRef, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";

// import { apiJSON } from "@/lib/auth-client";

// import {
//   AUDIENCES,
//   COUNTRIES,
//   type AdvancedTargeting,
//   type AudienceType,
//   type Estimate,
//   type ProjectDTO,
//   type SurveyTargeting,
// } from "@/lib/project-config";

// import {
//   ErrorAlert,
//   Field,
//   SubmitButton,
//   inputClass,
//   labelClass,
// } from "@/components/Ui";

// import { SelectField } from "@/components/Selectfield";
// import { EstimateCard } from "@/components/Estimatecard";
// import { SurveyCreationStepper } from "@/components/SurveyCreationStepper";

// /* =========================================================
//    TYPES
// ========================================================= */

// type LocationKey =
//   | "region"
//   | "division"
//   | "state"
//   | "csa"
//   | "cbsa"
//   | "county"
//   | "dma"
//   | "zipcode";

// type AdvancedRule = AdvancedTargeting & {
//   id: string;
// };

// /* =========================================================
//    QUOTA TYPES
// ========================================================= */

// type QuotaCellDraft = {
//   id: string;
//   name: string;
//   targetPct: number;
//   status: "open" | "paused";
// };

// type QuotaDimensionDraft = {
//   id: string;
//   name: string;
//   category: "gender" | "age" | "region" | "income" | "custom";
//   isInterlocked: boolean;
//   cells: QuotaCellDraft[];
// };

// type OverquotaConfig = {
//   bufferPercent: number;
//   action: "terminate" | "redirect" | "hold";
//   redirectUrl: string;
// };

// /* =========================================================
//    OPTIONS
// ========================================================= */

// // Add any categories that appear above "Fashion and Accessories"
// // in the PureSpectrum list (they were scrolled out of view).
// const CATEGORIES = [
//   "Fashion and Accessories",
//   "Financial Services",
//   "Food",
//   "Healthcare",
//   "Home and Garden",
//   "Home Care",
//   "Lifestyles and Hobbies",
//   "Media and Entertainment",
//   "Office Supplies",
//   "Personal Care and Beauty",
//   "Pet Care",
//   "Shopping and Retail",
//   "Technology and Computing",
//   "Toys and Games",
//   "Travel",
//   "Exciting New",
//   "Augment Survey",
// ];

// const GENDER_OPTIONS = ["Male", "Female"];

// const HISPANIC_OPTIONS = ["Hispanic", "Non-Hispanic"];

// const RELATIONSHIP_OPTIONS = [
//   "Single",
//   "Married",
//   "Divorced",
//   "Widowed",
//   "Living with partner",
// ];

// const CHILDREN_OPTIONS = ["Yes", "No"];

// const EMPLOYMENT_OPTIONS = [
//   "Employed full-time",
//   "Employed part-time",
//   "Self-employed",
//   "Unemployed",
//   "Student",
//   "Retired",
// ];

// const EDUCATION_OPTIONS = [
//   "Less than high school",
//   "High school",
//   "Some college",
//   "Associate degree",
//   "Bachelor's degree",
//   "Graduate degree",
// ];

// const DEVICE_OPTIONS = ["Desktop", "Mobile", "Tablet"];

// /* =========================================================
//    HELPERS
// ========================================================= */

// function createDefaultLocation() {
//   return {
//     region: [],
//     division: [],
//     state: [],
//     csa: [],
//     cbsa: [],
//     county: [],
//     dma: [],
//     zipcode: [],
//   };
// }

// function splitValues(value: string): string[] {
//   return value
//     .split(",")
//     .map((item) => item.trim())
//     .filter(Boolean);
// }

// function createRule(): AdvancedRule {
//   return {
//     id: `${Date.now()}-${Math.random()}`,
//     field: "",
//     operator: "",
//     value: "",
//     values: [],
//   };
// }

// function buildRange(from: string, to: string): string {
//   if (!from && !to) return "All";
//   return `${from || "0"}-${to || "max"}`;
// }

// function buildMulti(selected: string[], all: string[]): string {
//   if (selected.length === all.length) return "All";
//   return selected.join(", ");
// }

// /* =========================================================
//    RANGE FIELD (Age / Income)
// ========================================================= */

// function RangeField({
//   label,
//   from,
//   to,
//   onFromChange,
//   onToChange,
//   min,
//   max,
//   prefix,
//   disabled,
// }: {
//   label: string;
//   from: string;
//   to: string;
//   onFromChange: (v: string) => void;
//   onToChange: (v: string) => void;
//   min?: number;
//   max?: number;
//   prefix?: string;
//   disabled?: boolean;
// }) {
//   const box = `${inputClass} ${prefix ? "pl-7" : ""}`;

//   return (
//     <div>
//       <span className={`${labelClass} mb-1.5 block`}>{label}</span>

//       <div className="flex items-center gap-2">
//         <div className="relative flex-1">
//           {prefix && (
//             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
//               {prefix}
//             </span>
//           )}
//           <input
//             type="number"
//             min={min}
//             max={max}
//             placeholder="From"
//             value={from}
//             onChange={(e) => onFromChange(e.target.value)}
//             disabled={disabled}
//             className={box}
//           />
//         </div>

//         <span className="text-sm text-zinc-500">to</span>

//         <div className="relative flex-1">
//           {prefix && (
//             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
//               {prefix}
//             </span>
//           )}
//           <input
//             type="number"
//             min={min}
//             max={max}
//             placeholder="To"
//             value={to}
//             onChange={(e) => onToChange(e.target.value)}
//             disabled={disabled}
//             className={box}
//           />
//         </div>
//       </div>

//       <p className="mt-1 text-xs text-zinc-500">
//         Leave both empty for &quot;All&quot;.
//       </p>
//     </div>
//   );
// }

// /* =========================================================
//    MULTI SELECT (checkbox dropdown)
// ========================================================= */

// function MultiSelect({
//   label,
//   options,
//   selected,
//   onChange,
//   disabled,
// }: {
//   label: string;
//   options: string[];
//   selected: string[];
//   onChange: (next: string[]) => void;
//   disabled?: boolean;
// }) {
//   const [open, setOpen] = useState(false);
//   const allSelected = selected.length === options.length;

//   function toggle(option: string) {
//     onChange(
//       selected.includes(option)
//         ? selected.filter((s) => s !== option)
//         : [...selected, option]
//     );
//   }

//   return (
//     <div className="relative">
//       <span className={`${labelClass} mb-1.5 block`}>{label}</span>

//       <button
//         type="button"
//         disabled={disabled}
//         onClick={() => setOpen((o) => !o)}
//         className={`${inputClass} flex items-center justify-between text-left`}
//       >
//         <span className="truncate">
//           {allSelected
//             ? "All"
//             : selected.length === 0
//             ? "None selected"
//             : selected.join(", ")}
//         </span>
//         <span className="ml-2 text-xs">▾</span>
//       </button>

//       {open && (
//         <>
//           {/* click-away layer */}
//           <div
//             className="fixed inset-0 z-10"
//             onClick={() => setOpen(false)}
//           />

//           <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
//             <label className="flex cursor-pointer items-center gap-2 border-b border-zinc-200 px-2 py-2 text-sm font-medium dark:border-zinc-800">
//               <input
//                 type="checkbox"
//                 checked={allSelected}
//                 onChange={() =>
//                   onChange(allSelected ? [] : [...options])
//                 }
//               />
//               {allSelected ? "Deselect All" : "Select All"}
//             </label>

//             {options.map((option) => (
//               <label
//                 key={option}
//                 className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selected.includes(option)}
//                   onChange={() => toggle(option)}
//                 />
//                 {option}
//               </label>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// /* =========================================================
//    PAGE
// ========================================================= */

// export default function NewProjectPage() {
//   const router = useRouter();

//   /* =======================================================
//      CINT MODE & BASIC PROJECT
//   ======================================================= */

//   const [mode, setMode] = useState<"cint" | "advanced">("advanced");
//   const [projectName, setProjectName] = useState("Template_Genpop");
//   const [projectManager, setProjectManager] = useState("Ratan Bhan");
//   const [fieldingAssistant, setFieldingAssistant] = useState(true);

//   const [surveyTitle, setSurveyTitle] = useState("");

//   const [country, setCountry] = useState("US");

//   const [audienceType, setAudienceType] =
//     useState<AudienceType>("consumer");

//   const [audienceDescription, setAudienceDescription] =
//     useState("");

//   /* =======================================================
//      FEASIBILITY
//   ======================================================= */

//   const [sampleSize, setSampleSize] = useState("500");

//   const [loi, setLoi] = useState("10");

//   const [ir, setIr] = useState("30");


//   /* =======================================================
//      TARGETING
//   ======================================================= */

//   const [language, setLanguage] = useState("English");

//   const [category, setCategory] = useState("");

//   const [gender, setGender] = useState<string[]>(GENDER_OPTIONS);

//   const [hispanicOrigin, setHispanicOrigin] =
//     useState<string[]>(HISPANIC_OPTIONS);

//   const [relationship, setRelationship] =
//     useState<string[]>(RELATIONSHIP_OPTIONS);

//   const [children, setChildren] =
//     useState<string[]>(CHILDREN_OPTIONS);

//   const [employment, setEmployment] =
//     useState<string[]>(EMPLOYMENT_OPTIONS);

//   const [education, setEducation] =
//     useState<string[]>(EDUCATION_OPTIONS);

//   const [device, setDevice] = useState<string[]>(DEVICE_OPTIONS);

//   const [ageFrom, setAgeFrom] = useState("");
//   const [ageTo, setAgeTo] = useState("");

//   const [incomeFrom, setIncomeFrom] = useState("");
//   const [incomeTo, setIncomeTo] = useState("");

//   /* =======================================================
//      LOCATION TARGETING
//   ======================================================= */

//   const [location, setLocation] = useState(
//     createDefaultLocation()
//   );

//   /* =======================================================
//      ADVANCED TARGETING
//   ======================================================= */

//   const [advancedRules, setAdvancedRules] =
//     useState<AdvancedRule[]>([]);

//   /* =======================================================
//      QUOTA BUILDER
//   ======================================================= */

//   const [quotaDimensions, setQuotaDimensions] = useState<QuotaDimensionDraft[]>([]);

//   const [overquotaConfig, setOverquotaConfig] = useState<OverquotaConfig>({
//     bufferPercent: 5,
//     action: "terminate",
//     redirectUrl: "",
//   });

//   // Ref to track the next unique ID
//   const quotaIdRef = useRef(0);
//   function nextId() {
//     quotaIdRef.current += 1;
//     return `q${quotaIdRef.current}`;
//   }

//   /* --- Quota Dimension helpers --- */
//   function addDimension() {
//     const id = nextId();
//     setQuotaDimensions((prev) => [
//       ...prev,
//       {
//         id,
//         name: "New Dimension",
//         category: "custom",
//         isInterlocked: false,
//         cells: [
//           { id: nextId(), name: "Cell 1", targetPct: 50, status: "open" },
//           { id: nextId(), name: "Cell 2", targetPct: 50, status: "open" },
//         ],
//       },
//     ]);
//   }

//   function removeDimension(dimId: string) {
//     setQuotaDimensions((prev) => prev.filter((d) => d.id !== dimId));
//   }

//   function updateDimension<K extends keyof QuotaDimensionDraft>(
//     dimId: string,
//     key: K,
//     value: QuotaDimensionDraft[K]
//   ) {
//     setQuotaDimensions((prev) =>
//       prev.map((d) => (d.id === dimId ? { ...d, [key]: value } : d))
//     );
//   }

//   /* Preset quick-fill for common categories */
//   function applyPreset(dimId: string, preset: QuotaDimensionDraft["category"]) {
//     const presets: Record<string, { name: string; cells: Omit<QuotaCellDraft, "id">[] }> = {
//       gender: {
//         name: "Gender",
//         cells: [
//           { name: "Male", targetPct: 50, status: "open" },
//           { name: "Female", targetPct: 50, status: "open" },
//         ],
//       },
//       age: {
//         name: "Age Groups",
//         cells: [
//           { name: "18-34", targetPct: 35, status: "open" },
//           { name: "35-54", targetPct: 40, status: "open" },
//           { name: "55+", targetPct: 25, status: "open" },
//         ],
//       },
//       region: {
//         name: "Region",
//         cells: [
//           { name: "Northeast", targetPct: 25, status: "open" },
//           { name: "South", targetPct: 25, status: "open" },
//           { name: "Midwest", targetPct: 25, status: "open" },
//           { name: "West", targetPct: 25, status: "open" },
//         ],
//       },
//       income: {
//         name: "Household Income",
//         cells: [
//           { name: "<$35K", targetPct: 33, status: "open" },
//           { name: "$35K-$75K", targetPct: 34, status: "open" },
//           { name: "$75K+", targetPct: 33, status: "open" },
//         ],
//       },
//       custom: {
//         name: "Custom Dimension",
//         cells: [
//           { name: "Cell 1", targetPct: 50, status: "open" },
//           { name: "Cell 2", targetPct: 50, status: "open" },
//         ],
//       },
//     };

//     const p = presets[preset];
//     setQuotaDimensions((prev) =>
//       prev.map((d) =>
//         d.id === dimId
//           ? {
//               ...d,
//               name: p.name,
//               category: preset,
//               cells: p.cells.map((c) => ({ ...c, id: nextId() })),
//             }
//           : d
//       )
//     );
//   }

//   /* --- Cell helpers --- */
//   function addCell(dimId: string) {
//     const id = nextId();
//     setQuotaDimensions((prev) =>
//       prev.map((d) =>
//         d.id === dimId
//           ? { ...d, cells: [...d.cells, { id, name: `Cell ${d.cells.length + 1}`, targetPct: 0, status: "open" }] }
//           : d
//       )
//     );
//   }

//   function removeCell(dimId: string, cellId: string) {
//     setQuotaDimensions((prev) =>
//       prev.map((d) =>
//         d.id === dimId ? { ...d, cells: d.cells.filter((c) => c.id !== cellId) } : d
//       )
//     );
//   }

//   function updateCell<K extends keyof QuotaCellDraft>(
//     dimId: string,
//     cellId: string,
//     key: K,
//     value: QuotaCellDraft[K]
//   ) {
//     setQuotaDimensions((prev) =>
//       prev.map((d) =>
//         d.id === dimId
//           ? {
//               ...d,
//               cells: d.cells.map((c) =>
//                 c.id === cellId ? { ...c, [key]: value } : c
//               ),
//             }
//           : d
//       )
//     );
//   }

//   /* Check if total pct = 100 for a dimension */
//   function dimPctTotal(dim: QuotaDimensionDraft) {
//     return dim.cells.reduce((s, c) => s + (Number(c.targetPct) || 0), 0);
//   }

//   /* =======================================================
//      UI
//   ======================================================= */

//   const [estimate, setEstimate] =
//     useState<Estimate | null>(null);

//   const [estimating, setEstimating] =
//     useState(false);

//   const [saving, setSaving] = useState(false);

//   const [error, setError] = useState("");

//   /* =======================================================
//      LOCATION HANDLER
//   ======================================================= */

//   function updateLocation(
//     field: LocationKey,
//     value: string
//   ) {
//     setLocation((previous) => ({
//       ...previous,
//       [field]: splitValues(value),
//     }));
//   }

//   function locationValue(field: LocationKey) {
//     return location[field].join(", ");
//   }

//   /* =======================================================
//      ADVANCED TARGETING
//   ======================================================= */

//   function addAdvancedRule() {
//     setAdvancedRules((previous) => [
//       ...previous,
//       createRule(),
//     ]);
//   }

//   function removeAdvancedRule(id: string) {
//     setAdvancedRules((previous) =>
//       previous.filter((rule) => rule.id !== id)
//     );
//   }

//   function updateAdvancedRule(
//     id: string,
//     field: keyof AdvancedRule,
//     value: string
//   ) {
//     setAdvancedRules((previous) =>
//       previous.map((rule) => {
//         if (rule.id !== id) return rule;

//         if (field === "values") {
//           return {
//             ...rule,
//             values: splitValues(value),
//           };
//         }

//         return {
//           ...rule,
//           [field]: value,
//         };
//       })
//     );
//   }

//   /* =======================================================
//      LIVE FEASIBILITY ESTIMATE
//   ======================================================= */

//   useEffect(() => {
//     const n = Number(sampleSize);
//     const l = Number(loi);
//     const r = Number(ir);

//     if (
//       !Number.isInteger(n) ||
//       n < 1||
//       n > 100000 ||
//       !Number.isInteger(l) ||
//       l < 1 ||
//       l > 60 ||
//       !Number.isFinite(r) ||
//       r < 1 ||
//       r > 100
//     ) {
//       setEstimate(null);
//       setEstimating(false);

//       return;
//     }

//     setEstimating(true);

//     const timer = setTimeout(async () => {
//       try {
//         const { ok, status, data } =
//           await apiJSON<{
//             estimate: Estimate;
//             message?: string;
//           }>("/api/projects/estimate", "POST", {
//             country,
//             audienceType,
//             sampleSize: n,
//             loi: l,
//             ir: r,
//           });

//         if (status === 401) {
//           router.replace("/login");
//           return;
//         }

//         if (!ok) {
//           setEstimate(null);
//           return;
//         }

//         setEstimate(data.estimate ?? null);
//       } catch (error) {
//         console.error(
//           "Estimate request failed:",
//           error
//         );

//         setEstimate(null);
//       } finally {
//         setEstimating(false);
//       }
//     }, 400);

//     return () => clearTimeout(timer);
//   }, [
//     country,
//     audienceType,
//     sampleSize,
//     loi,
//     ir,
//     router,
//   ]);

//   /* =======================================================
//      CREATE PROJECT
//   ======================================================= */

//   async function handleSubmit(
//     e: React.FormEvent<HTMLFormElement>
//   ) {
//     e.preventDefault();

//     setError("");

//     const trimmedTitle = surveyTitle.trim();

//     const trimmedDescription =
//       audienceDescription.trim() || `${projectName} - Cint Target Screener Study managed by ${projectManager}`;

//     const n = Number(sampleSize);
//     const l = Number(loi) || 10;
//     const r = Number(ir) || 35;

//     /* =====================================================
//        BASIC VALIDATION
//     ===================================================== */

//     if (trimmedTitle.length < 2) {
//       setError(
//         "Survey name must be at least 2 characters."
//       );
//       return;
//     }

//     if (trimmedTitle.length > 120) {
//       setError(
//         "Survey title cannot exceed 120 characters."
//       );
//       return;
//     }

//     if (!country) {
//       setError("Please select a country.");
//       return;
//     }

//     if (!audienceType) {
//       setError("Please select an audience.");
//       return;
//     }

//     if (
//       !Number.isInteger(n) ||
//       n < 10 ||
//       n > 100000
//     ) {
//       setError(
//         "Sample size must be between 10 and 100,000."
//       );
//       return;
//     }

//     if (
//       !Number.isInteger(l) ||
//       l < 1 ||
//       l > 60
//     ) {
//       setError(
//         "LOI must be between 1 and 60 minutes."
//       );
//       return;
//     }

//     if (
//       !Number.isFinite(r) ||
//       r < 1 ||
//       r > 100
//     ) {
//       setError(
//         "Expected IR must be between 1% and 100%."
//       );
//       return;
//     }

//     /* =====================================================
//        DEMOGRAPHIC VALIDATION
//     ===================================================== */

//     if (ageFrom && ageTo && Number(ageFrom) > Number(ageTo)) {
//       setError("Age 'From' cannot be greater than 'To'.");
//       return;
//     }

//     if (
//       incomeFrom &&
//       incomeTo &&
//       Number(incomeFrom) > Number(incomeTo)
//     ) {
//       setError("Income 'From' cannot be greater than 'To'.");
//       return;
//     }

//     if (
//       [
//         gender,
//         hispanicOrigin,
//         relationship,
//         children,
//         employment,
//         education,
//         device,
//       ].some((list) => list.length === 0)
//     ) {
//       setError(
//         "Select at least one option in every demographic filter."
//       );
//       return;
//     }

//     /* =====================================================
//        VALIDATE QUOTAS
//     ===================================================== */

//     for (const dim of quotaDimensions) {
//       if (dim.cells.length === 0) {
//         setError(`Quota dimension "${dim.name}" must have at least one cell.`);
//         return;
//       }
//       const total = dimPctTotal(dim);
//       if (total !== 100) {
//         setError(
//           `Quota dimension "${dim.name}" cell percentages must sum to 100% (currently ${total}%).`
//         );
//         return;
//       }
//     }

//     const quotaNesting = quotaDimensions.map((dim) => ({
//       id: dim.id,
//       name: dim.name,
//       category: dim.category,
//       isInterlocked: dim.isInterlocked,
//       cells: dim.cells.map((cell) => ({
//         id: cell.id,
//         name: cell.name,
//         targetPct: Number(cell.targetPct) || 0,
//         targetCount: Math.round((Number(cell.targetPct) / 100) * Number(sampleSize)),
//         currentCompletes: 0,
//         status: cell.status,
//       })),
//     }));

//     /* =====================================================
//        BUILD ADVANCED TARGETING
//     ===================================================== */

//     const advancedTargeting =
//       advancedRules
//         .map((rule) => {
//           const result: AdvancedTargeting = {};

//           if (rule.field?.trim()) {
//             result.field = rule.field.trim();
//           }

//           if (rule.operator?.trim()) {
//             result.operator =
//               rule.operator.trim();
//           }

//           if (
//             typeof rule.value === "string" &&
//             rule.value.trim()
//           ) {
//             result.value = rule.value.trim();
//           }

//           if (
//             Array.isArray(rule.values) &&
//             rule.values.length > 0
//           ) {
//             result.values = rule.values;
//           }

//           return result;
//         })
//         .filter(
//           (rule) =>
//             Object.keys(rule).length > 0
//         );

//     /* =====================================================
//        BUILD TARGETING
//     ===================================================== */

//     const targeting: SurveyTargeting = {
//       country: country as any,

//       language: language.trim() || "English",

//       category: category.trim(),

//       gender: buildMulti(gender, GENDER_OPTIONS),

//       age: buildRange(ageFrom, ageTo),

//       income: buildRange(incomeFrom, incomeTo),

//       hispanicOrigin: buildMulti(
//         hispanicOrigin,
//         HISPANIC_OPTIONS
//       ),

//       relationship: buildMulti(
//         relationship,
//         RELATIONSHIP_OPTIONS
//       ),

//       children: buildMulti(children, CHILDREN_OPTIONS),

//       employment: buildMulti(
//         employment,
//         EMPLOYMENT_OPTIONS
//       ),

//       education: buildMulti(
//         education,
//         EDUCATION_OPTIONS
//       ),

//       device: buildMulti(device, DEVICE_OPTIONS),

//       advancedTargeting,

//       location,

//       quotaNesting,
//     };

//     // Include quotas and overquotaConfig in the top-level payload
//     const quotasPayload = quotaDimensions.map((dim) => ({
//       id: dim.id,
//       name: dim.name,
//       category: dim.category,
//       isInterlocked: dim.isInterlocked,
//       cells: dim.cells.map((cell) => ({
//         id: cell.id,
//         name: cell.name,
//         targetPct: Number(cell.targetPct) || 0,
//         targetCount: Math.round((Number(cell.targetPct) / 100) * Number(sampleSize)),
//         currentCompletes: 0,
//         status: cell.status,
//       })),
//     }));

//     /* =====================================================
//        SAVE
//     ===================================================== */

//     setSaving(true);

//     try {
//       const { ok, status, data } =
//         await apiJSON<{
//           project: ProjectDTO;
//           message?: string;
//         }>("/api/projects", "POST", {
//           surveyTitle: trimmedTitle,

//           country,

//           audienceType,

//           audienceDescription:
//             trimmedDescription,

//           sampleSize: n,

//           loi: l,

//           ir: r,

//           targeting,

//           quotas: quotasPayload,

//           overquotaConfig,
//         });

//       /* ===================================================
//          AUTH
//       =================================================== */

//       if (status === 401) {
//         router.replace("/login");
//         return;
//       }

//       /* ===================================================
//          API ERROR
//       =================================================== */

//       if (!ok) {
//         setError(
//           data?.message ||
//             "Couldn't create the survey."
//         );

//         return;
//       }

//       /* ===================================================
//          SUCCESS
//       =================================================== */

//       if (!data?.project?._id) {
//         setError(
//           "Survey was created, but the project ID was not returned."
//         );

//         return;
//       }

//       router.push(
//         `/project-details/${data.project._id}`
//       );
//     } catch (error) {
//       console.error(
//         "Create survey error:",
//         error
//       );

//       setError(
//         "Something went wrong while creating the survey."
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   /* =========================================================
//      UI
//   ========================================================= */

//   return (
//     <>
//       {/* Top Bar Switcher between Cint Quick Mode and Advanced Targeting */}
//       <div className="flex items-center justify-between mb-6">
//         <Link
//           href="/project"
//           className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5"
//         >
//           ← Back to Surveys
//         </Link>

//         <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs">
//           {/* <button
//             type="button"
//             onClick={() => setMode("cint")}
//             className={`px-3 py-1.5 rounded-lg transition font-medium ${
//               mode === "cint"
//                 ? "bg-[#642582] text-white shadow-sm"
//                 : "text-zinc-400 hover:text-white"
//             }`}
//           >
//             Cint Quick Screener
//           </button> */}
//           <button
//             type="button"
//             onClick={() => setMode("advanced")}
//             className={`px-3 py-1.5 rounded-lg transition font-medium ${
//               mode === "advanced"
//                 ? "bg-zinc-800 text-white shadow-sm"
//                 : "text-zinc-400 hover:text-white"
//             }`}
//           >
//             Advanced Full Builder
//           </button>
//         </div>
//       </div>

//       {mode === "cint" ? (
//         <div className="max-w-xl mx-auto py-4">
//           <h1 className="text-2xl font-bold tracking-tight text-white text-center mb-6">
//             Create Target Screener Survey
//           </h1>

//           <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-7 sm:p-8 shadow-2xl space-y-5 text-left">
//             <ErrorAlert message={error} />

//             <form onSubmit={handleSubmit} className="space-y-5" noValidate>
//               {/* Name* */}
//               <div className="space-y-1.5">
//                 <label className="text-xs font-semibold text-zinc-300">
//                   Name<span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   placeholder="e.g. TRN-SW-22297 || Females - MX 2"
//                   value={surveyTitle}
//                   onChange={(e) => setSurveyTitle(e.target.value)}
//                   disabled={saving}
//                   className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
//                 />
//               </div>

//               {/* Project* */}
//               <div className="space-y-1.5">
//                 <label className="text-xs font-semibold text-zinc-300">
//                   Project<span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     required
//                     placeholder="Search for a project or create a new one"
//                     value={projectName}
//                     onChange={(e) => setProjectName(e.target.value)}
//                     disabled={saving}
//                     className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 pr-9 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
//                   />
//                   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
//                     🔍
//                   </div>
//                 </div>
//               </div>

//               {/* Project Manager */}
//               <div className="space-y-1.5">
//                 <label className="text-xs font-semibold text-zinc-300">
//                   Project Manager
//                 </label>
//                 <select
//                   value={projectManager}
//                   onChange={(e) => setProjectManager(e.target.value)}
//                   disabled={saving}
//                   className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
//                 >
//                   <option value="Ratan Bhan">Ratan Bhan</option>
//                   <option value="Client Admin">Client Admin</option>
//                   <option value="Operations Lead">Operations Lead</option>
//                 </select>
//               </div>

//               {/* Number of Completes* */}
//               <div className="space-y-1.5">
//                 <label className="text-xs font-semibold text-zinc-300">
//                   Number of Completes<span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   min={10}
//                   max={100000}
//                   required
//                   value={sampleSize}
//                   onChange={(e) => setSampleSize(e.target.value)}
//                   disabled={saving}
//                   className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
//                 />
//               </div>

//               {/* Country - Language* */}
//               <div className="space-y-1.5">
//                 <label className="text-xs font-semibold text-zinc-300">
//                   Country - Language<span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   value={country}
//                   onChange={(e) => setCountry(e.target.value)}
//                   disabled={saving}
//                   className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
//                 >
//                   {COUNTRIES.map((c) => (
//                     <option key={c.code} value={c.code}>
//                       {c.name} - English
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Target Audience */}
//               <div className="space-y-1.5">
//                 <label className="text-xs font-semibold text-zinc-300">
//                   Target Audience
//                 </label>
//                 <select
//                   value={audienceType}
//                   onChange={(e) => setAudienceType(e.target.value as any)}
//                   disabled={saving}
//                   className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
//                 >
//                   <option value="consumer">Consumer (General Population)</option>
//                   <option value="b2b">B2B Business Decision Makers</option>
//                   <option value="healthcare">Healthcare & Medical Professionals</option>
//                 </select>
//               </div>

//               {/* Fielding Assistant */}
//               <div className="pt-2">
//                 <div className="flex items-start justify-between gap-3">
//                   <div className="space-y-0.5">
//                     <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
//                       <span>⚙️</span>
//                       <span>Fielding Assistant</span>
//                     </div>
//                     <p className="text-[11px] text-zinc-400 leading-relaxed">
//                       Reduce manual adjustments and optimize the fielding process. Settings will automatically adjust to ensure your survey completes successfully.{" "}
//                       <span className="text-purple-400 hover:underline cursor-pointer">Learn More</span>
//                     </p>
//                   </div>

//                   <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
//                     <input
//                       type="checkbox"
//                       checked={fieldingAssistant}
//                       onChange={(e) => setFieldingAssistant(e.target.checked)}
//                       className="sr-only peer"
//                     />
//                     <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#642582]" />
//                   </label>
//                 </div>
//               </div>

//               {/* Submit CTA (Purple Cint Button) */}
//               <button
//                 type="submit"
//                 disabled={saving}
//                 className="w-full mt-4 py-2.5 rounded-lg bg-[#642582] hover:bg-[#7b2c9f] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
//               >
//                 {saving ? "Creating Survey & Initializing Quotas..." : "Create Survey"}
//               </button>

//               <div className="text-center pt-2">
//                 <span className="text-[11px] text-zinc-500">
//                   Looking for more information on how to create a survey? Check out our{" "}
//                   <span className="text-purple-400 hover:underline cursor-pointer">support documentation</span>.
//                 </span>
//               </div>
//             </form>
//           </div>
//         </div>
//       ) : (
//         <>
//           {/* Survey Creation Stepper */}
//           <SurveyCreationStepper projectId="" currentStep="build" />

//           <h1 className="mb-8 mt-3 text-2xl font-semibold tracking-tight text-white">
//             Advanced Survey Builder
//           </h1>

//           <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
//             <form
//               onSubmit={handleSubmit}
//               className="space-y-8"
//               noValidate
//             >

//           {/* =================================================
//               BASIC INFORMATION
//           ================================================= */}

//           <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
//             <div className="mb-5">
//               <h2 className="text-lg text-black font-semibold">
//                 Basic Information
//               </h2>

//               <p className="mt-1 text-sm text-zinc-500">
//                 Configure the basic details of your survey.
//               </p>
//             </div>

//             <div className="space-y-5">

//               <Field
//                 label="Survey title"
//                 placeholder="Q4 brand tracker"
//                 maxLength={120}
//                 value={surveyTitle}
//                 onChange={(e) =>
//                   setSurveyTitle(e.target.value)
//                 }
//                 disabled={saving}
//               />

//               <div className="grid gap-5 sm:grid-cols-2">

//                 <SelectField
//                   label="Country"
//                   value={country}
//                   onChange={(e) =>
//                     setCountry(e.target.value)
//                   }
//                   options={COUNTRIES.map((c) => ({
//                     value: c.code,
//                     label: c.name,
//                   }))}
//                   disabled={saving}
//                 />

//                 <SelectField
//                   label="Audience"
//                   value={audienceType}
//                   onChange={(e) =>
//                     setAudienceType(
//                       e.target.value as AudienceType
//                     )
//                   }
//                   options={AUDIENCES}
//                   disabled={saving}
//                 />

//               </div>

//               <div>
//                 <label
//                   htmlFor="audience-description"
//                   className={`${labelClass} mb-1.5`}
//                 >
//                   Audience details
//                 </label>

//                 <textarea
//                   id="audience-description"
//                   rows={4}
//                   maxLength={500}
//                   disabled={saving}
//                   placeholder="Describe the target audience..."
//                   value={audienceDescription}
//                   onChange={(e) =>
//                     setAudienceDescription(
//                       e.target.value
//                     )
//                   }
//                   className={inputClass}
//                 />

//                 <div className="mt-1 text-right text-xs text-zinc-400">
//                   {audienceDescription.length}/500
//                 </div>
//               </div>

//             </div>
//           </section>

//           {/* =================================================
//               SAMPLE / FEASIBILITY
//           ================================================= */}

//           <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

//             <div className="mb-5">
//               <h2 className="text-lg text-black font-semibold">
//                 Sample & Feasibility
//               </h2>

//               <p className="mt-1 text-sm text-zinc-500">
//                 Define the required sample and survey expectations.
//               </p>
//             </div>

//             <div className="grid gap-5 sm:grid-cols-3">

//               <Field
//                 label="Sample size (N)"
//                 type="number"
//                 min={1}
//                 max={100000}
//                 value={sampleSize}
//                 onChange={(e) =>
//                   setSampleSize(e.target.value)
//                 }
//                 disabled={saving}
//               />

//               <Field
//                 label="LOI (minutes)"
//                 type="number"
//                 min={1}
//                 max={60}
//                 value={loi}
//                 onChange={(e) =>
//                   setLoi(e.target.value)
//                 }
//                 disabled={saving}
//               />

//               <Field
//                 label="Expected IR (%)"
//                 type="number"
//                 min={1}
//                 max={100}
//                 value={ir}
//                 onChange={(e) =>
//                   setIr(e.target.value)
//                 }
//                 disabled={saving}
//               />

//             </div>
//           </section>

//           {/* =================================================
//               DEMOGRAPHIC TARGETING
//           ================================================= */}

//           <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

//             <div className="mb-5">
//               <h2 className="text-lg text-black font-semibold">
//                 Demographic Targeting
//               </h2>

//               <p className="mt-1 text-sm text-zinc-500">
//                 Define who should qualify for this survey.
//               </p>
//             </div>

//             <div className="grid gap-5 sm:grid-cols-2">

//               <Field
//                 label="Language"
//                 placeholder="English"
//                 value={language}
//                 onChange={(e) =>
//                   setLanguage(e.target.value)
//                 }
//                 disabled={saving}
//               />

//               <SelectField
//                 label="Category"
//                 value={category}
//                 onChange={(e) =>
//                   setCategory(e.target.value)
//                 }
//                 options={[
//                   { value: "", label: "Select Category" },
//                   ...CATEGORIES.map((c) => ({
//                     value: c,
//                     label: c,
//                   })),
//                 ]}
//                 disabled={saving}
//               />

//               <MultiSelect
//                 label="Gender"
//                 options={GENDER_OPTIONS}
//                 selected={gender}
//                 onChange={setGender}
//                 disabled={saving}
//               />

//               <RangeField
//                 label="Age"
//                 from={ageFrom}
//                 to={ageTo}
//                 onFromChange={setAgeFrom}
//                 onToChange={setAgeTo}
//                 min={13}
//                 max={99}
//                 disabled={saving}
//               />

//               <RangeField
//                 label="Income"
//                 from={incomeFrom}
//                 to={incomeTo}
//                 onFromChange={setIncomeFrom}
//                 onToChange={setIncomeTo}
//                 min={0}
//                 prefix="$"
//                 disabled={saving}
//               />

//               <MultiSelect
//                 label="Hispanic Origin"
//                 options={HISPANIC_OPTIONS}
//                 selected={hispanicOrigin}
//                 onChange={setHispanicOrigin}
//                 disabled={saving}
//               />

//               <MultiSelect
//                 label="Relationship"
//                 options={RELATIONSHIP_OPTIONS}
//                 selected={relationship}
//                 onChange={setRelationship}
//                 disabled={saving}
//               />

//               <MultiSelect
//                 label="Children"
//                 options={CHILDREN_OPTIONS}
//                 selected={children}
//                 onChange={setChildren}
//                 disabled={saving}
//               />

//               <MultiSelect
//                 label="Employment"
//                 options={EMPLOYMENT_OPTIONS}
//                 selected={employment}
//                 onChange={setEmployment}
//                 disabled={saving}
//               />

//               <MultiSelect
//                 label="Education"
//                 options={EDUCATION_OPTIONS}
//                 selected={education}
//                 onChange={setEducation}
//                 disabled={saving}
//               />

//               <MultiSelect
//                 label="Device"
//                 options={DEVICE_OPTIONS}
//                 selected={device}
//                 onChange={setDevice}
//                 disabled={saving}
//               />

//             </div>
//           </section>

//           {/* =================================================
//               LOCATION TARGETING
//           ================================================= */}

//           <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

//             <div className="mb-5">
//               <h2 className="text-lg text-black font-semibold">
//                 Geographic Targeting
//               </h2>

//               <p className="mt-1 text-sm text-zinc-500">
//                 Enter multiple values separated by commas.
//               </p>
//             </div>

//             <div className="grid gap-5 sm:grid-cols-2">

//               <Field
//                 label="Region"
//                 placeholder="Northeast, Midwest..."
//                 value={locationValue("region")}
//                 onChange={(e) =>
//                   updateLocation(
//                     "region",
//                     e.target.value
//                   )
//                 }
//                 disabled={saving}
//               />

//               <Field
//                 label="Division"
//                 placeholder="East South Central..."
//                 value={locationValue("division")}
//                 onChange={(e) =>
//                   updateLocation(
//                     "division",
//                     e.target.value
//                   )
//                 }
//                 disabled={saving}
//               />

//               <Field
//                 label="State"
//                 placeholder="California, Texas, New York..."
//                 value={locationValue("state")}
//                 onChange={(e) =>
//                   updateLocation(
//                     "state",
//                     e.target.value
//                   )
//                 }
//                 disabled={saving}
//               />

//               <Field
//                 label="CSA"
//                 placeholder="CSA codes..."
//                 value={locationValue("csa")}
//                 onChange={(e) =>
//                   updateLocation(
//                     "csa",
//                     e.target.value
//                   )
//                 }
//                 disabled={saving}
//               />

//               <Field
//                 label="CBSA"
//                 placeholder="CBSA codes..."
//                 value={locationValue("cbsa")}
//                 onChange={(e) =>
//                   updateLocation(
//                     "cbsa",
//                     e.target.value
//                   )
//                 }
//                 disabled={saving}
//               />

//               <Field
//                 label="County"
//                 placeholder="Los Angeles, Cook..."
//                 value={locationValue("county")}
//                 onChange={(e) =>
//                   updateLocation(
//                     "county",
//                     e.target.value
//                   )
//                 }
//                 disabled={saving}
//               />

//               <Field
//                 label="DMA"
//                 placeholder="DMA codes..."
//                 value={locationValue("dma")}
//                 onChange={(e) =>
//                   updateLocation(
//                     "dma",
//                     e.target.value
//                   )
//                 }
//                 disabled={saving}
//               />

//               <Field
//                 label="ZIP Code"
//                 placeholder="10001, 90210, 60601..."
//                 value={locationValue("zipcode")}
//                 onChange={(e) =>
//                   updateLocation(
//                     "zipcode",
//                     e.target.value
//                   )
//                 }
//                 disabled={saving}
//               />

//             </div>
//           </section>

//           {/* =================================================
//               ADVANCED TARGETING
//           ================================================= */}

//           <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

//             <div className="mb-5 flex items-start justify-between gap-4">

//               <div>
//                 <h2 className="text-lg text-black font-semibold">
//                   Advanced Targeting
//                 </h2>

//                 <p className="mt-1 text-sm text-zinc-500">
//                   Add custom targeting conditions.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={addAdvancedRule}
//                 disabled={saving}
//                 className="
//                   rounded-lg
//                   border
//                   border-zinc-300
//                   px-3
//                   py-2
//                   text-sm
//                   font-medium
//                   hover:bg-zinc-50
//                   dark:border-zinc-700
//                   dark:hover:bg-zinc-900
//                 "
//               >
//                 + Add rule
//               </button>

//             </div>

//             {advancedRules.length === 0 ? (
//               <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
//                 No advanced targeting rules added.
//               </div>
//             ) : (
//               <div className="space-y-4">

//                 {advancedRules.map(
//                   (rule, index) => (
//                     <div
//                       key={rule.id}
//                       className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
//                     >

//                       <div className="mb-4 flex items-center justify-between">

//                         <span className="text-sm font-medium">
//                           Rule {index + 1}
//                         </span>

//                         <button
//                           type="button"
//                           onClick={() =>
//                             removeAdvancedRule(
//                               rule.id
//                             )
//                           }
//                           className="text-sm text-red-500 hover:text-red-600"
//                         >
//                           Remove
//                         </button>

//                       </div>

//                       <div className="grid gap-4 sm:grid-cols-2">

//                         <Field
//                           label="Field"
//                           placeholder="age, gender, income..."
//                           value={
//                             rule.field ?? ""
//                           }
//                           onChange={(e) =>
//                             updateAdvancedRule(
//                               rule.id,
//                               "field",
//                               e.target.value
//                             )
//                           }
//                           disabled={saving}
//                         />

//                         <Field
//                           label="Operator"
//                           placeholder="equals, contains, in..."
//                           value={
//                             rule.operator ?? ""
//                           }
//                           onChange={(e) =>
//                             updateAdvancedRule(
//                               rule.id,
//                               "operator",
//                               e.target.value
//                             )
//                           }
//                           disabled={saving}
//                         />

//                         <Field
//                           label="Value"
//                           placeholder="25-34"
//                           value={
//                             typeof rule.value ===
//                             "string"
//                               ? rule.value
//                               : ""
//                           }
//                           onChange={(e) =>
//                             updateAdvancedRule(
//                               rule.id,
//                               "value",
//                               e.target.value
//                             )
//                           }
//                           disabled={saving}
//                         />

//                         <Field
//                           label="Values"
//                           placeholder="25-34, 35-44, 45-54"
//                           value={
//                             rule.values?.join(
//                               ", "
//                             ) ?? ""
//                           }
//                           onChange={(e) =>
//                             updateAdvancedRule(
//                               rule.id,
//                               "values",
//                               e.target.value
//                             )
//                           }
//                           disabled={saving}
//                         />

//                       </div>

//                     </div>
//                   )
//                 )}

//               </div>
//             )}
//           </section>

//           {/* =================================================
//               QUOTA BUILDER
//           ================================================= */}

//           <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

//             <div className="mb-5 flex items-start justify-between gap-4">
//               <div>
//                 <h2 className="text-lg text-black font-semibold">Quota Management</h2>
//                 <p className="mt-1 text-sm text-zinc-500">
//                   Define demographic or custom quota dimensions. Each dimension's cells must sum to 100%.
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 onClick={addDimension}
//                 disabled={saving}
//                 className="shrink-0 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 transition"
//               >
//                 + Add Dimension
//               </button>
//             </div>

//             {quotaDimensions.length === 0 ? (
//               <div
//                 onClick={addDimension}
//                 className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700 hover:border-zinc-400 transition"
//               >
//                 <svg className="h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
//                 </svg>
//                 <p className="text-sm font-medium text-zinc-500">No quota dimensions yet</p>
//                 <p className="text-xs text-zinc-400">Click to add a dimension, or use a preset like Gender or Age</p>
//                 <div className="mt-3 flex flex-wrap gap-2 justify-center">
//                   {(["gender", "age", "region", "income"] as const).map((preset) => (
//                     <button
//                       key={preset}
//                       type="button"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         const id = nextId();
//                         setQuotaDimensions((prev) => [
//                           ...prev,
//                           { id, name: preset, category: preset, isInterlocked: false, cells: [] },
//                         ]);
//                         setTimeout(() => applyPreset(id, preset), 0);
//                       }}
//                       className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition capitalize"
//                     >
//                       {preset}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-5">
//                 {quotaDimensions.map((dim) => {
//                   const total = dimPctTotal(dim);
//                   const isOver = total > 100;
//                   const isExact = total === 100;
//                   return (
//                     <div key={dim.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

//                       {/* Dimension Header */}
//                       <div className="flex flex-wrap items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">

//                         <input
//                           type="text"
//                           value={dim.name}
//                           onChange={(e) => updateDimension(dim.id, "name", e.target.value)}
//                           disabled={saving}
//                           placeholder="Dimension name"
//                           className="flex-1 min-w-[140px] rounded-lg border border-zinc-300 bg-white dark:bg-zinc-950 dark:border-zinc-700 px-3 py-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
//                         />

//                         <select
//                           value={dim.category}
//                           onChange={(e) => {
//                             const cat = e.target.value as QuotaDimensionDraft["category"];
//                             applyPreset(dim.id, cat);
//                           }}
//                           disabled={saving}
//                           className="rounded-lg border border-zinc-300 bg-white dark:bg-zinc-950 dark:border-zinc-700 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
//                         >
//                           <option value="gender">Gender</option>
//                           <option value="age">Age</option>
//                           <option value="region">Region</option>
//                           <option value="income">Income</option>
//                           <option value="custom">Custom</option>
//                         </select>

//                         <label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer">
//                           <input
//                             type="checkbox"
//                             checked={dim.isInterlocked}
//                             onChange={(e) => updateDimension(dim.id, "isInterlocked", e.target.checked)}
//                             disabled={saving}
//                             className="accent-purple-500"
//                           />
//                           Interlocked
//                         </label>

//                         <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
//                           isExact
//                             ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
//                             : isOver
//                             ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
//                             : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
//                         }`}>
//                           {total}% / 100%
//                         </span>

//                         <button
//                           type="button"
//                           onClick={() => removeDimension(dim.id)}
//                           disabled={saving}
//                           className="text-xs text-red-500 hover:text-red-600 transition"
//                         >
//                           Remove
//                         </button>
//                       </div>

//                       {/* Cells Table */}
//                       <div className="px-4 py-3">
//                         <table className="w-full text-xs">
//                           <thead>
//                             <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
//                               <th className="pb-2 text-left font-medium">Cell Name</th>
//                               <th className="pb-2 text-center font-medium w-24">Target %</th>
//                               <th className="pb-2 text-center font-medium w-24">Count (n={Number(sampleSize) || 0})</th>
//                               <th className="pb-2 text-center font-medium w-20">Status</th>
//                               <th className="pb-2 w-10" />
//                             </tr>
//                           </thead>
//                           <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
//                             {dim.cells.map((cell) => (
//                               <tr key={cell.id}>
//                                 <td className="py-2 pr-3">
//                                   <input
//                                     type="text"
//                                     value={cell.name}
//                                     onChange={(e) => updateCell(dim.id, cell.id, "name", e.target.value)}
//                                     disabled={saving}
//                                     placeholder="Cell name"
//                                     className="w-full rounded border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
//                                   />
//                                 </td>
//                                 <td className="py-2 px-2">
//                                   <input
//                                     type="number"
//                                     min={0}
//                                     max={100}
//                                     value={cell.targetPct}
//                                     onChange={(e) => updateCell(dim.id, cell.id, "targetPct", Number(e.target.value))}
//                                     disabled={saving}
//                                     className="w-full rounded border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs text-center text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
//                                   />
//                                 </td>
//                                 <td className="py-2 px-2 text-center text-zinc-500 dark:text-zinc-400 font-mono">
//                                   {Math.round((Number(cell.targetPct) / 100) * (Number(sampleSize) || 0))}
//                                 </td>
//                                 <td className="py-2 px-2">
//                                   <select
//                                     value={cell.status}
//                                     onChange={(e) => updateCell(dim.id, cell.id, "status", e.target.value as QuotaCellDraft["status"])}
//                                     disabled={saving}
//                                     className="w-full rounded border border-zinc-200 dark:border-zinc-700 bg-transparent px-1 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
//                                   >
//                                     <option value="open">Open</option>
//                                     <option value="paused">Paused</option>
//                                   </select>
//                                 </td>
//                                 <td className="py-2 pl-2 text-center">
//                                   <button
//                                     type="button"
//                                     onClick={() => removeCell(dim.id, cell.id)}
//                                     disabled={saving || dim.cells.length <= 1}
//                                     className="text-zinc-400 hover:text-red-500 disabled:opacity-30 transition"
//                                     title="Remove cell"
//                                   >
//                                     ✕
//                                   </button>
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>

//                         <button
//                           type="button"
//                           onClick={() => addCell(dim.id)}
//                           disabled={saving}
//                           className="mt-3 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
//                         >
//                           + Add cell
//                         </button>
//                       </div>
//                     </div>
//                   );
//                 })}

//                 {/* Quick Add Preset Buttons */}
//                 <div className="flex flex-wrap gap-2 pt-1">
//                   <span className="text-xs text-zinc-400 self-center">Quick add:</span>
//                   {(["gender", "age", "region", "income"] as const).map((preset) => (
//                     <button
//                       key={preset}
//                       type="button"
//                       onClick={() => {
//                         const id = nextId();
//                         setQuotaDimensions((prev) => [
//                           ...prev,
//                           { id, name: preset, category: preset, isInterlocked: false, cells: [] },
//                         ]);
//                         setTimeout(() => applyPreset(id, preset), 0);
//                       }}
//                       disabled={saving}
//                       className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition capitalize disabled:opacity-50"
//                     >
//                       {preset}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Overquota Config */}
//             {quotaDimensions.length > 0 && (
//               <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
//                 <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">Overquota Configuration</h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                   <div>
//                     <label className={`${labelClass} mb-1 block`}>Buffer %</label>
//                     <input
//                       type="number"
//                       min={0}
//                       max={50}
//                       value={overquotaConfig.bufferPercent}
//                       onChange={(e) => setOverquotaConfig((c) => ({ ...c, bufferPercent: Number(e.target.value) }))}
//                       disabled={saving}
//                       className={inputClass}
//                     />
//                     <p className="mt-1 text-xs text-zinc-400">Extra % above target before capping</p>
//                   </div>
//                   <div>
//                     <label className={`${labelClass} mb-1 block`}>Overquota Action</label>
//                     <select
//                       value={overquotaConfig.action}
//                       onChange={(e) => setOverquotaConfig((c) => ({ ...c, action: e.target.value as OverquotaConfig["action"] }))}
//                       disabled={saving}
//                       className={inputClass}
//                     >
//                       <option value="terminate">Terminate</option>
//                       <option value="redirect">Redirect to URL</option>
//                       <option value="hold">Hold in Queue</option>
//                     </select>
//                   </div>
//                   {overquotaConfig.action === "redirect" && (
//                     <div>
//                       <label className={`${labelClass} mb-1 block`}>Redirect URL</label>
//                       <input
//                         type="url"
//                         value={overquotaConfig.redirectUrl}
//                         onChange={(e) => setOverquotaConfig((c) => ({ ...c, redirectUrl: e.target.value }))}
//                         disabled={saving}
//                         placeholder="https://..."
//                         className={inputClass}
//                       />
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </section>

//           {/* =================================================
//               ERROR
//           ================================================= */}

//           <ErrorAlert message={error} />

//           {/* =================================================
//               SUBMIT
//           ================================================= */}

//           <div className="max-w-[220px]">
//             <SubmitButton
//               loading={saving}
//               loadingText="Creating"
//             >
//               Create survey
//             </SubmitButton>
//           </div>

//           {/* =================================================
//               INFO
//           ================================================= */}

//           <p className="text-xs text-zinc-500 dark:text-zinc-400">
//             Surveys are saved as drafts. You can configure
//             additional survey setup and routing after creation.
//             Nothing is charged or launched until you press
//             Launch.
//           </p>
//         </form>

//         {/* ===================================================
//             LIVE ESTIMATE
//         =================================================== */}

//         <div className="lg:sticky lg:top-8 lg:self-start">
//           <EstimateCard
//             estimate={estimate}
//             loading={estimating}
//           />
//         </div>

//       </div>
//         </>
//       )}
//     </>
//   );
// }


"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiJSON } from "@/lib/auth-client";

import {
  AUDIENCES,
  COUNTRIES,
  type AdvancedTargeting,
  type AudienceType,
  type Estimate,
  type ProjectDTO,
  type SurveyTargeting,
} from "@/lib/project-config";

import {
  ErrorAlert,
  Field,
  SubmitButton,
  inputClass,
  labelClass,
} from "@/components/Ui";

import { SelectField } from "@/components/Selectfield";
import { EstimateCard } from "@/components/Estimatecard";


/* =========================================================
   TYPES
========================================================= */

type LocationKey =
  | "region"
  | "division"
  | "state"
  | "csa"
  | "cbsa"
  | "county"
  | "dma"
  | "zipcode";

type AdvancedRule = AdvancedTargeting & {
  id: string;
};

/* =========================================================
   QUOTA TYPES
========================================================= */

type QuotaCellDraft = {
  id: string;
  name: string;
  targetPct: number;
  status: "open" | "paused";
};

type QuotaDimensionDraft = {
  id: string;
  name: string;
  category: "gender" | "age" | "region" | "income" | "custom";
  isInterlocked: boolean;
  cells: QuotaCellDraft[];
};

type OverquotaConfig = {
  bufferPercent: number;
  action: "terminate" | "redirect" | "hold";
  redirectUrl: string;
};

/* =========================================================
   OPTIONS
========================================================= */

// Add any categories that appear above "Fashion and Accessories"
// in the PureSpectrum list (they were scrolled out of view).
const CATEGORIES = [
  "Fashion and Accessories",
  "Financial Services",
  "Food",
  "Healthcare",
  "Home and Garden",
  "Home Care",
  "Lifestyles and Hobbies",
  "Media and Entertainment",
  "Office Supplies",
  "Personal Care and Beauty",
  "Pet Care",
  "Shopping and Retail",
  "Technology and Computing",
  "Toys and Games",
  "Travel",
  "Exciting New",
  "Augment Survey",
];

const GENDER_OPTIONS = ["Male", "Female"];

const HISPANIC_OPTIONS = ["Hispanic", "Non-Hispanic"];

const RELATIONSHIP_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Living with partner",
];

const CHILDREN_OPTIONS = ["Yes", "No"];

const EMPLOYMENT_OPTIONS = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Unemployed",
  "Student",
  "Retired",
];

const EDUCATION_OPTIONS = [
  "Less than high school",
  "High school",
  "Some college",
  "Associate degree",
  "Bachelor's degree",
  "Graduate degree",
];

const DEVICE_OPTIONS = ["Desktop", "Mobile", "Tablet"];

/* =========================================================
   HELPERS
========================================================= */

function createDefaultLocation() {
  return {
    region: [],
    division: [],
    state: [],
    csa: [],
    cbsa: [],
    county: [],
    dma: [],
    zipcode: [],
  };
}

function splitValues(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createRule(): AdvancedRule {
  return {
    id: `${Date.now()}-${Math.random()}`,
    field: "",
    operator: "",
    value: "",
    values: [],
  };
}

function buildRange(from: string, to: string): string {
  if (!from && !to) return "All";
  return `${from || "0"}-${to || "max"}`;
}

function buildMulti(selected: string[], all: string[]): string {
  if (selected.length === all.length) return "All";
  return selected.join(", ");
}

/* =========================================================
   RANGE FIELD (Age / Income)
========================================================= */

function RangeField({
  label,
  from,
  to,
  onFromChange,
  onToChange,
  min,
  max,
  prefix,
  disabled,
}: {
  label: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  min?: number;
  max?: number;
  prefix?: string;
  disabled?: boolean;
}) {
  const box = `${inputClass} ${prefix ? "pl-7" : ""}`;

  return (
    <div>
      <span className={`${labelClass} mb-1.5 block`}>{label}</span>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              {prefix}
            </span>
          )}
          <input
            type="number"
            min={min}
            max={max}
            placeholder="From"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            disabled={disabled}
            className={box}
          />
        </div>

        <span className="text-sm text-zinc-500">to</span>

        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              {prefix}
            </span>
          )}
          <input
            type="number"
            min={min}
            max={max}
            placeholder="To"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            disabled={disabled}
            className={box}
          />
        </div>
      </div>

      <p className="mt-1 text-xs text-zinc-500">
        Leave both empty for &quot;All&quot;.
      </p>
    </div>
  );
}

/* =========================================================
   MULTI SELECT (checkbox dropdown)
========================================================= */

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === options.length;

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  }

  return (
    <div className="relative">
      <span className={`${labelClass} mb-1.5 block`}>{label}</span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span className="truncate">
          {allSelected
            ? "All"
            : selected.length === 0
            ? "None selected"
            : selected.join(", ")}
        </span>
        <span className="ml-2 text-xs">▾</span>
      </button>

      {open && (
        <>
          {/* click-away layer */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
            <label className="flex cursor-pointer items-center gap-2 border-b border-zinc-200 px-2 py-2 text-sm font-medium dark:border-zinc-800">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  onChange(allSelected ? [] : [...options])
                }
              />
              {allSelected ? "Deselect All" : "Select All"}
            </label>

            {options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function NewProjectPage() {
  const router = useRouter();

  /* =======================================================
     CINT MODE & BASIC PROJECT
  ======================================================= */

  const [mode, setMode] = useState<"cint" | "advanced">("advanced");
  const [projectName, setProjectName] = useState("Template_Genpop");
  const [projectManager, setProjectManager] = useState("Ratan Bhan");
  const [fieldingAssistant, setFieldingAssistant] = useState(true);

  const [surveyTitle, setSurveyTitle] = useState("");

  const [country, setCountry] = useState("US");

  const [audienceType, setAudienceType] =
    useState<AudienceType>("consumer");

  const [audienceDescription, setAudienceDescription] =
    useState("");

  /* =======================================================
     FEASIBILITY
  ======================================================= */

  const [sampleSize, setSampleSize] = useState("500");

  const [loi, setLoi] = useState("10");

  const [ir, setIr] = useState("30");


  /* =======================================================
     TARGETING
  ======================================================= */

  const [language, setLanguage] = useState("English");

  const [category, setCategory] = useState("");

  const [gender, setGender] = useState<string[]>(GENDER_OPTIONS);

  const [hispanicOrigin, setHispanicOrigin] =
    useState<string[]>(HISPANIC_OPTIONS);

  const [relationship, setRelationship] =
    useState<string[]>(RELATIONSHIP_OPTIONS);

  const [children, setChildren] =
    useState<string[]>(CHILDREN_OPTIONS);

  const [employment, setEmployment] =
    useState<string[]>(EMPLOYMENT_OPTIONS);

  const [education, setEducation] =
    useState<string[]>(EDUCATION_OPTIONS);

  const [device, setDevice] = useState<string[]>(DEVICE_OPTIONS);

  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");

  const [incomeFrom, setIncomeFrom] = useState("");
  const [incomeTo, setIncomeTo] = useState("");

  /* =======================================================
     LOCATION TARGETING
  ======================================================= */

  const [location, setLocation] = useState(
    createDefaultLocation()
  );

  /* =======================================================
     ADVANCED TARGETING
  ======================================================= */

  const [advancedRules, setAdvancedRules] =
    useState<AdvancedRule[]>([]);

  /* =======================================================
     QUOTA BUILDER
  ======================================================= */

  const [quotaDimensions, setQuotaDimensions] = useState<QuotaDimensionDraft[]>([]);

  const [overquotaConfig, setOverquotaConfig] = useState<OverquotaConfig>({
    bufferPercent: 5,
    action: "terminate",
    redirectUrl: "",
  });

  // Ref to track the next unique ID
  const quotaIdRef = useRef(0);
  function nextId() {
    quotaIdRef.current += 1;
    return `q${quotaIdRef.current}`;
  }

  /* --- Quota Dimension helpers --- */
  function addDimension() {
    const id = nextId();
    setQuotaDimensions((prev) => [
      ...prev,
      {
        id,
        name: "New Dimension",
        category: "custom",
        isInterlocked: false,
        cells: [
          { id: nextId(), name: "Cell 1", targetPct: 50, status: "open" },
          { id: nextId(), name: "Cell 2", targetPct: 50, status: "open" },
        ],
      },
    ]);
  }

  function removeDimension(dimId: string) {
    setQuotaDimensions((prev) => prev.filter((d) => d.id !== dimId));
  }

  function updateDimension<K extends keyof QuotaDimensionDraft>(
    dimId: string,
    key: K,
    value: QuotaDimensionDraft[K]
  ) {
    setQuotaDimensions((prev) =>
      prev.map((d) => (d.id === dimId ? { ...d, [key]: value } : d))
    );
  }

  /* Preset quick-fill for common categories */
  function applyPreset(dimId: string, preset: QuotaDimensionDraft["category"]) {
    const presets: Record<string, { name: string; cells: Omit<QuotaCellDraft, "id">[] }> = {
      gender: {
        name: "Gender",
        cells: [
          { name: "Male", targetPct: 50, status: "open" },
          { name: "Female", targetPct: 50, status: "open" },
        ],
      },
      age: {
        name: "Age Groups",
        cells: [
          { name: "18-34", targetPct: 35, status: "open" },
          { name: "35-54", targetPct: 40, status: "open" },
          { name: "55+", targetPct: 25, status: "open" },
        ],
      },
      region: {
        name: "Region",
        cells: [
          { name: "Northeast", targetPct: 25, status: "open" },
          { name: "South", targetPct: 25, status: "open" },
          { name: "Midwest", targetPct: 25, status: "open" },
          { name: "West", targetPct: 25, status: "open" },
        ],
      },
      income: {
        name: "Household Income",
        cells: [
          { name: "<$35K", targetPct: 33, status: "open" },
          { name: "$35K-$75K", targetPct: 34, status: "open" },
          { name: "$75K+", targetPct: 33, status: "open" },
        ],
      },
      custom: {
        name: "Custom Dimension",
        cells: [
          { name: "Cell 1", targetPct: 50, status: "open" },
          { name: "Cell 2", targetPct: 50, status: "open" },
        ],
      },
    };

    const p = presets[preset];
    setQuotaDimensions((prev) =>
      prev.map((d) =>
        d.id === dimId
          ? {
              ...d,
              name: p.name,
              category: preset,
              cells: p.cells.map((c) => ({ ...c, id: nextId() })),
            }
          : d
      )
    );
  }

  /* --- Cell helpers --- */
  function addCell(dimId: string) {
    const id = nextId();
    setQuotaDimensions((prev) =>
      prev.map((d) =>
        d.id === dimId
          ? { ...d, cells: [...d.cells, { id, name: `Cell ${d.cells.length + 1}`, targetPct: 0, status: "open" }] }
          : d
      )
    );
  }

  function removeCell(dimId: string, cellId: string) {
    setQuotaDimensions((prev) =>
      prev.map((d) =>
        d.id === dimId ? { ...d, cells: d.cells.filter((c) => c.id !== cellId) } : d
      )
    );
  }

  function updateCell<K extends keyof QuotaCellDraft>(
    dimId: string,
    cellId: string,
    key: K,
    value: QuotaCellDraft[K]
  ) {
    setQuotaDimensions((prev) =>
      prev.map((d) =>
        d.id === dimId
          ? {
              ...d,
              cells: d.cells.map((c) =>
                c.id === cellId ? { ...c, [key]: value } : c
              ),
            }
          : d
      )
    );
  }

  /* Check if total pct = 100 for a dimension */
  function dimPctTotal(dim: QuotaDimensionDraft) {
    return dim.cells.reduce((s, c) => s + (Number(c.targetPct) || 0), 0);
  }

  /* =======================================================
     UI
  ======================================================= */

  const [estimate, setEstimate] =
    useState<Estimate | null>(null);

  const [estimating, setEstimating] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOCATION HANDLER
  ======================================================= */

  function updateLocation(
    field: LocationKey,
    value: string
  ) {
    setLocation((previous) => ({
      ...previous,
      [field]: splitValues(value),
    }));
  }

  function locationValue(field: LocationKey) {
    return location[field].join(", ");
  }

  /* =======================================================
     ADVANCED TARGETING
  ======================================================= */

  function addAdvancedRule() {
    setAdvancedRules((previous) => [
      ...previous,
      createRule(),
    ]);
  }

  function removeAdvancedRule(id: string) {
    setAdvancedRules((previous) =>
      previous.filter((rule) => rule.id !== id)
    );
  }

  function updateAdvancedRule(
    id: string,
    field: keyof AdvancedRule,
    value: string
  ) {
    setAdvancedRules((previous) =>
      previous.map((rule) => {
        if (rule.id !== id) return rule;

        if (field === "values") {
          return {
            ...rule,
            values: splitValues(value),
          };
        }

        return {
          ...rule,
          [field]: value,
        };
      })
    );
  }

  /* =======================================================
     LIVE FEASIBILITY ESTIMATE
  ======================================================= */

  useEffect(() => {
    const n = Number(sampleSize);
    const l = Number(loi);
    const r = Number(ir);

    if (
      !Number.isInteger(n) ||
      n < 1||
      n > 100000 ||
      !Number.isInteger(l) ||
      l < 1 ||
      l > 60 ||
      !Number.isFinite(r) ||
      r < 1 ||
      r > 100
    ) {
      setEstimate(null);
      setEstimating(false);

      return;
    }

    setEstimating(true);

    const timer = setTimeout(async () => {
      try {
        const { ok, status, data } =
          await apiJSON<{
            estimate: Estimate;
            message?: string;
          }>("/api/projects/estimate", "POST", {
            country,
            audienceType,
            sampleSize: n,
            loi: l,
            ir: r,
          });

        if (status === 401) {
          router.replace("/login");
          return;
        }

        if (!ok) {
          setEstimate(null);
          return;
        }

        setEstimate(data.estimate ?? null);
      } catch (error) {
        console.error(
          "Estimate request failed:",
          error
        );

        setEstimate(null);
      } finally {
        setEstimating(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    country,
    audienceType,
    sampleSize,
    loi,
    ir,
    router,
  ]);

  /* =======================================================
     CREATE PROJECT
  ======================================================= */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    const trimmedTitle = surveyTitle.trim();

    const trimmedDescription =
      audienceDescription.trim() || `${projectName} - Cint Target Screener Study managed by ${projectManager}`;

    const n = Number(sampleSize);
    const l = Number(loi) || 10;
    const r = Number(ir) || 35;

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (trimmedTitle.length < 2) {
      setError(
        "Survey name must be at least 2 characters."
      );
      return;
    }

    if (trimmedTitle.length > 120) {
      setError(
        "Survey title cannot exceed 120 characters."
      );
      return;
    }

    if (!country) {
      setError("Please select a country.");
      return;
    }

    if (!audienceType) {
      setError("Please select an audience.");
      return;
    }

    if (
      !Number.isInteger(n) ||
      n < 10 ||
      n > 100000
    ) {
      setError(
        "Sample size must be between 10 and 100,000."
      );
      return;
    }

    if (
      !Number.isInteger(l) ||
      l < 1 ||
      l > 60
    ) {
      setError(
        "LOI must be between 1 and 60 minutes."
      );
      return;
    }

    if (
      !Number.isFinite(r) ||
      r < 1 ||
      r > 100
    ) {
      setError(
        "Expected IR must be between 1% and 100%."
      );
      return;
    }

    /* =====================================================
       DEMOGRAPHIC VALIDATION
    ===================================================== */

    if (ageFrom && ageTo && Number(ageFrom) > Number(ageTo)) {
      setError("Age 'From' cannot be greater than 'To'.");
      return;
    }

    if (
      incomeFrom &&
      incomeTo &&
      Number(incomeFrom) > Number(incomeTo)
    ) {
      setError("Income 'From' cannot be greater than 'To'.");
      return;
    }

    if (
      [
        gender,
        hispanicOrigin,
        relationship,
        children,
        employment,
        education,
        device,
      ].some((list) => list.length === 0)
    ) {
      setError(
        "Select at least one option in every demographic filter."
      );
      return;
    }

    /* =====================================================
       VALIDATE QUOTAS
    ===================================================== */

    for (const dim of quotaDimensions) {
      if (dim.cells.length === 0) {
        setError(`Quota dimension "${dim.name}" must have at least one cell.`);
        return;
      }
      const total = dimPctTotal(dim);
      if (total !== 100) {
        setError(
          `Quota dimension "${dim.name}" cell percentages must sum to 100% (currently ${total}%).`
        );
        return;
      }
    }

    const quotaNesting = quotaDimensions.map((dim) => ({
      id: dim.id,
      name: dim.name,
      category: dim.category,
      isInterlocked: dim.isInterlocked,
      cells: dim.cells.map((cell) => ({
        id: cell.id,
        name: cell.name,
        targetPct: Number(cell.targetPct) || 0,
        targetCount: Math.round((Number(cell.targetPct) / 100) * Number(sampleSize)),
        currentCompletes: 0,
        status: cell.status,
      })),
    }));

    /* =====================================================
       BUILD ADVANCED TARGETING
    ===================================================== */

    const advancedTargeting =
      advancedRules
        .map((rule) => {
          const result: AdvancedTargeting = {};

          if (rule.field?.trim()) {
            result.field = rule.field.trim();
          }

          if (rule.operator?.trim()) {
            result.operator =
              rule.operator.trim();
          }

          if (
            typeof rule.value === "string" &&
            rule.value.trim()
          ) {
            result.value = rule.value.trim();
          }

          if (
            Array.isArray(rule.values) &&
            rule.values.length > 0
          ) {
            result.values = rule.values;
          }

          return result;
        })
        .filter(
          (rule) =>
            Object.keys(rule).length > 0
        );

    /* =====================================================
       BUILD TARGETING
    ===================================================== */

    const targeting: SurveyTargeting = {
      country: country as any,

      language: language.trim() || "English",

      category: category.trim(),

      gender: buildMulti(gender, GENDER_OPTIONS),

      age: buildRange(ageFrom, ageTo),

      income: buildRange(incomeFrom, incomeTo),

      hispanicOrigin: buildMulti(
        hispanicOrigin,
        HISPANIC_OPTIONS
      ),

      relationship: buildMulti(
        relationship,
        RELATIONSHIP_OPTIONS
      ),

      children: buildMulti(children, CHILDREN_OPTIONS),

      employment: buildMulti(
        employment,
        EMPLOYMENT_OPTIONS
      ),

      education: buildMulti(
        education,
        EDUCATION_OPTIONS
      ),

      device: buildMulti(device, DEVICE_OPTIONS),

      advancedTargeting,

      location,

      quotaNesting,
    };

    // Include quotas and overquotaConfig in the top-level payload
    const quotasPayload = quotaDimensions.map((dim) => ({
      id: dim.id,
      name: dim.name,
      category: dim.category,
      isInterlocked: dim.isInterlocked,
      cells: dim.cells.map((cell) => ({
        id: cell.id,
        name: cell.name,
        targetPct: Number(cell.targetPct) || 0,
        targetCount: Math.round((Number(cell.targetPct) / 100) * Number(sampleSize)),
        currentCompletes: 0,
        status: cell.status,
      })),
    }));

    /* =====================================================
       SAVE
    ===================================================== */

    setSaving(true);

    try {
      const { ok, status, data } =
        await apiJSON<{
          project: ProjectDTO;
          message?: string;
        }>("/api/projects", "POST", {
          surveyTitle: trimmedTitle,

          country,

          audienceType,

          audienceDescription:
            trimmedDescription,

          sampleSize: n,

          loi: l,

          ir: r,

          targeting,

          quotas: quotasPayload,

          overquotaConfig,
        });

      /* ===================================================
         AUTH
      =================================================== */

      if (status === 401) {
        router.replace("/login");
        return;
      }

      /* ===================================================
         API ERROR
      =================================================== */

      if (!ok) {
        setError(
          data?.message ||
            "Couldn't create the survey."
        );

        return;
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      if (!data?.project?._id) {
        setError(
          "Survey was created, but the project ID was not returned."
        );

        return;
      }

      router.push(
        `/project/${data.project._id}`
      );
    } catch (error) {
      console.error(
        "Create survey error:",
        error
      );

      setError(
        "Something went wrong while creating the survey."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     MULTI-STEP BUILDER NAVIGATION
  ========================================================= */
  type BuilderStep = 1 | 2 | 3 | 4;
  type TargetingTab = "demographic" | "geographic" | "advanced";

  const [currentBuilderStep, setCurrentBuilderStep] = useState<BuilderStep>(1);
  const [targetingTab, setTargetingTab] = useState<TargetingTab>("demographic");

  function validateBasicStep() {
    const title = surveyTitle.trim();
    if (title.length < 2) { setError("Survey name must be at least 2 characters."); return false; }
    if (title.length > 120) { setError("Survey title cannot exceed 120 characters."); return false; }
    if (!country) { setError("Please select a country."); return false; }
    if (!audienceType) { setError("Please select an audience."); return false; }
    setError(""); return true;
  }
  function validateSampleStep() {
    const n = Number(sampleSize), l = Number(loi), r = Number(ir);
    if (!Number.isInteger(n) || n < 10 || n > 100000) { setError("Sample size must be between 10 and 100,000."); return false; }
    if (!Number.isInteger(l) || l < 1 || l > 60) { setError("LOI must be between 1 and 60 minutes."); return false; }
    if (!Number.isFinite(r) || r < 1 || r > 100) { setError("Expected IR must be between 1% and 100%."); return false; }
    setError(""); return true;
  }
  function validateTargetingStep() {
    if (ageFrom && ageTo && Number(ageFrom) > Number(ageTo)) { setError("Age 'From' cannot be greater than 'To'."); return false; }
    if (incomeFrom && incomeTo && Number(incomeFrom) > Number(incomeTo)) { setError("Income 'From' cannot be greater than 'To'."); return false; }
    if ([gender, hispanicOrigin, relationship, children, employment, education, device].some((list) => list.length === 0)) { setError("Select at least one option in every demographic filter."); setTargetingTab("demographic"); return false; }
    setError(""); return true;
  }
  function goToBuilderStep(step: BuilderStep) { if (!saving && step <= currentBuilderStep) { setError(""); setCurrentBuilderStep(step); } }
  function handleBuilderNext() {
    if (currentBuilderStep === 1 && validateBasicStep()) setCurrentBuilderStep(2);
    else if (currentBuilderStep === 2 && validateSampleStep()) setCurrentBuilderStep(3);
    else if (currentBuilderStep === 3 && validateTargetingStep()) setCurrentBuilderStep(4);
  }
  function handleBuilderBack() { if (!saving && currentBuilderStep > 1) { setError(""); setCurrentBuilderStep((currentBuilderStep - 1) as BuilderStep); } }

  function renderBasicSection() { return (


          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-5">
              <h2 className="text-lg text-black font-semibold">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Configure the basic details of your survey.
              </p>
            </div>

            <div className="space-y-5">

              <Field
                label="Survey title"
                placeholder="Q4 brand tracker"
                maxLength={120}
                value={surveyTitle}
                onChange={(e) =>
                  setSurveyTitle(e.target.value)
                }
                disabled={saving}
              />

              <div className="grid gap-5 sm:grid-cols-2">

                <SelectField
                  label="Country"
                  value={country}
                  onChange={(e) =>
                    setCountry(e.target.value)
                  }
                  options={COUNTRIES.map((c) => ({
                    value: c.code,
                    label: c.name,
                  }))}
                  disabled={saving}
                />

                <SelectField
                  label="Audience"
                  value={audienceType}
                  onChange={(e) =>
                    setAudienceType(
                      e.target.value as AudienceType
                    )
                  }
                  options={AUDIENCES}
                  disabled={saving}
                />

              </div>

              <div>
                <label
                  htmlFor="audience-description"
                  className={`${labelClass} mb-1.5`}
                >
                  Audience details
                </label>

                <textarea
                  id="audience-description"
                  rows={4}
                  maxLength={500}
                  disabled={saving}
                  placeholder="Describe the target audience..."
                  value={audienceDescription}
                  onChange={(e) =>
                    setAudienceDescription(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />

                <div className="mt-1 text-right text-xs text-zinc-400">
                  {audienceDescription.length}/500
                </div>
              </div>

            </div>
          </section>

  ); }
  function renderSampleSection() { return (


          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5">
              <h2 className="text-lg text-black font-semibold">
                Sample & Feasibility
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Define the required sample and survey expectations.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">

              <Field
                label="Sample size (N)"
                type="number"
                min={1}
                max={100000}
                value={sampleSize}
                onChange={(e) =>
                  setSampleSize(e.target.value)
                }
                disabled={saving}
              />

              <Field
                label="LOI (minutes)"
                type="number"
                min={1}
                max={60}
                value={loi}
                onChange={(e) =>
                  setLoi(e.target.value)
                }
                disabled={saving}
              />

              <Field
                label="Expected IR (%)"
                type="number"
                min={1}
                max={100}
                value={ir}
                onChange={(e) =>
                  setIr(e.target.value)
                }
                disabled={saving}
              />

            </div>
          </section>

  ); }
  function renderDemographicSection() { return (


          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5">
              <h2 className="text-lg text-black font-semibold">
                Demographic Targeting
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Define who should qualify for this survey.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <Field
                label="Language"
                placeholder="English"
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
                disabled={saving}
              />

              <SelectField
                label="Category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                options={[
                  { value: "", label: "Select Category" },
                  ...CATEGORIES.map((c) => ({
                    value: c,
                    label: c,
                  })),
                ]}
                disabled={saving}
              />

              <MultiSelect
                label="Gender"
                options={GENDER_OPTIONS}
                selected={gender}
                onChange={setGender}
                disabled={saving}
              />

              <RangeField
                label="Age"
                from={ageFrom}
                to={ageTo}
                onFromChange={setAgeFrom}
                onToChange={setAgeTo}
                min={13}
                max={99}
                disabled={saving}
              />

              <RangeField
                label="Income"
                from={incomeFrom}
                to={incomeTo}
                onFromChange={setIncomeFrom}
                onToChange={setIncomeTo}
                min={0}
                prefix="$"
                disabled={saving}
              />

              <MultiSelect
                label="Hispanic Origin"
                options={HISPANIC_OPTIONS}
                selected={hispanicOrigin}
                onChange={setHispanicOrigin}
                disabled={saving}
              />

              <MultiSelect
                label="Relationship"
                options={RELATIONSHIP_OPTIONS}
                selected={relationship}
                onChange={setRelationship}
                disabled={saving}
              />

              <MultiSelect
                label="Children"
                options={CHILDREN_OPTIONS}
                selected={children}
                onChange={setChildren}
                disabled={saving}
              />

              <MultiSelect
                label="Employment"
                options={EMPLOYMENT_OPTIONS}
                selected={employment}
                onChange={setEmployment}
                disabled={saving}
              />

              <MultiSelect
                label="Education"
                options={EDUCATION_OPTIONS}
                selected={education}
                onChange={setEducation}
                disabled={saving}
              />

              <MultiSelect
                label="Device"
                options={DEVICE_OPTIONS}
                selected={device}
                onChange={setDevice}
                disabled={saving}
              />

            </div>
          </section>

  ); }
  function renderGeographicSection() { return (


          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5">
              <h2 className="text-lg text-black font-semibold">
                Geographic Targeting
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Enter multiple values separated by commas.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <Field
                label="Region"
                placeholder="Northeast, Midwest..."
                value={locationValue("region")}
                onChange={(e) =>
                  updateLocation(
                    "region",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="Division"
                placeholder="East South Central..."
                value={locationValue("division")}
                onChange={(e) =>
                  updateLocation(
                    "division",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="State"
                placeholder="California, Texas, New York..."
                value={locationValue("state")}
                onChange={(e) =>
                  updateLocation(
                    "state",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="CSA"
                placeholder="CSA codes..."
                value={locationValue("csa")}
                onChange={(e) =>
                  updateLocation(
                    "csa",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="CBSA"
                placeholder="CBSA codes..."
                value={locationValue("cbsa")}
                onChange={(e) =>
                  updateLocation(
                    "cbsa",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="County"
                placeholder="Los Angeles, Cook..."
                value={locationValue("county")}
                onChange={(e) =>
                  updateLocation(
                    "county",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="DMA"
                placeholder="DMA codes..."
                value={locationValue("dma")}
                onChange={(e) =>
                  updateLocation(
                    "dma",
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <Field
                label="ZIP Code"
                placeholder="10001, 90210, 60601..."
                value={locationValue("zipcode")}
                onChange={(e) =>
                  updateLocation(
                    "zipcode",
                    e.target.value
                  )
                }
                disabled={saving}
              />

            </div>
          </section>

  ); }
  function renderAdvancedSection() { return (


          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5 flex items-start justify-between gap-4">

              <div>
                <h2 className="text-lg text-black font-semibold">
                  Advanced Targeting
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Add custom targeting conditions.
                </p>
              </div>

              <button
                type="button"
                onClick={addAdvancedRule}
                disabled={saving}
                className="
                  rounded-lg
                  border
                  border-zinc-300
                  px-3
                  py-2
                  text-sm
                  font-medium
                  hover:bg-zinc-50
                  dark:border-zinc-700
                  dark:hover:bg-zinc-900
                "
              >
                + Add rule
              </button>

            </div>

            {advancedRules.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                No advanced targeting rules added.
              </div>
            ) : (
              <div className="space-y-4">

                {advancedRules.map(
                  (rule, index) => (
                    <div
                      key={rule.id}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >

                      <div className="mb-4 flex items-center justify-between">

                        <span className="text-sm font-medium">
                          Rule {index + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeAdvancedRule(
                              rule.id
                            )
                          }
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>

                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">

                        <Field
                          label="Field"
                          placeholder="age, gender, income..."
                          value={
                            rule.field ?? ""
                          }
                          onChange={(e) =>
                            updateAdvancedRule(
                              rule.id,
                              "field",
                              e.target.value
                            )
                          }
                          disabled={saving}
                        />

                        <Field
                          label="Operator"
                          placeholder="equals, contains, in..."
                          value={
                            rule.operator ?? ""
                          }
                          onChange={(e) =>
                            updateAdvancedRule(
                              rule.id,
                              "operator",
                              e.target.value
                            )
                          }
                          disabled={saving}
                        />

                        <Field
                          label="Value"
                          placeholder="25-34"
                          value={
                            typeof rule.value ===
                            "string"
                              ? rule.value
                              : ""
                          }
                          onChange={(e) =>
                            updateAdvancedRule(
                              rule.id,
                              "value",
                              e.target.value
                            )
                          }
                          disabled={saving}
                        />

                        <Field
                          label="Values"
                          placeholder="25-34, 35-44, 45-54"
                          value={
                            rule.values?.join(
                              ", "
                            ) ?? ""
                          }
                          onChange={(e) =>
                            updateAdvancedRule(
                              rule.id,
                              "values",
                              e.target.value
                            )
                          }
                          disabled={saving}
                        />

                      </div>

                    </div>
                  )
                )}

              </div>
            )}
          </section>

  ); }
  function renderQuotaSection() { return (


          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg text-black font-semibold">Quota Management</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Define demographic or custom quota dimensions. Each dimension's cells must sum to 100%.
                </p>
              </div>
              <button
                type="button"
                onClick={addDimension}
                disabled={saving}
                className="shrink-0 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 transition"
              >
                + Add Dimension
              </button>
            </div>

            {quotaDimensions.length === 0 ? (
              <div
                onClick={addDimension}
                className="flex cursor-pointer text-black flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700 hover:border-zinc-400 transition"
              >
                <svg className="h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <p className="text-sm font-medium text-zinc-500">No quota dimensions yet</p>
                <p className="text-xs text-zinc-400">Click to add a dimension, or use a preset like Gender or Age</p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {(["gender", "age", "region", "income"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const id = nextId();
                        setQuotaDimensions((prev) => [
                          ...prev,
                          { id, name: preset, category: preset, isInterlocked: false, cells: [] },
                        ]);
                        setTimeout(() => applyPreset(id, preset), 0);
                      }}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition capitalize"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {quotaDimensions.map((dim) => {
                  const total = dimPctTotal(dim);
                  const isOver = total > 100;
                  const isExact = total === 100;
                  return (
                    <div key={dim.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                      {/* Dimension Header */}
                      <div className="flex flex-wrap items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">

                        <input
                          type="text"
                          value={dim.name}
                          onChange={(e) => updateDimension(dim.id, "name", e.target.value)}
                          disabled={saving}
                          placeholder="Dimension name"
                          className="flex-1 min-w-[140px] rounded-lg border border-zinc-300 bg-white dark:bg-zinc-950 dark:border-zinc-700 px-3 py-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />

                        <select
                          value={dim.category}
                          onChange={(e) => {
                            const cat = e.target.value as QuotaDimensionDraft["category"];
                            applyPreset(dim.id, cat);
                          }}
                          disabled={saving}
                          className="rounded-lg border border-zinc-300 bg-white dark:bg-zinc-950 dark:border-zinc-700 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="gender">Gender</option>
                          <option value="age">Age</option>
                          <option value="region">Region</option>
                          <option value="income">Income</option>
                          <option value="custom">Custom</option>
                        </select>

                        <label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dim.isInterlocked}
                            onChange={(e) => updateDimension(dim.id, "isInterlocked", e.target.checked)}
                            disabled={saving}
                            className="accent-purple-500"
                          />
                          Interlocked
                        </label>

                        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isExact
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : isOver
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {total}% / 100%
                        </span>

                        <button
                          type="button"
                          onClick={() => removeDimension(dim.id)}
                          disabled={saving}
                          className="text-xs text-red-500 hover:text-red-600 transition"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Cells Table */}
                      <div className="px-4 py-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                              <th className="pb-2 text-left font-medium">Cell Name</th>
                              <th className="pb-2 text-center font-medium w-24">Target %</th>
                              <th className="pb-2 text-center font-medium w-24">Count (n={Number(sampleSize) || 0})</th>
                              <th className="pb-2 text-center font-medium w-20">Status</th>
                              <th className="pb-2 w-10" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {dim.cells.map((cell) => (
                              <tr key={cell.id}>
                                <td className="py-2 pr-3">
                                  <input
                                    type="text"
                                    value={cell.name}
                                    onChange={(e) => updateCell(dim.id, cell.id, "name", e.target.value)}
                                    disabled={saving}
                                    placeholder="Cell name"
                                    className="w-full rounded border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={cell.targetPct}
                                    onChange={(e) => updateCell(dim.id, cell.id, "targetPct", Number(e.target.value))}
                                    disabled={saving}
                                    className="w-full rounded border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs text-center text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </td>
                                <td className="py-2 px-2 text-center text-zinc-500 dark:text-zinc-400 font-mono">
                                  {Math.round((Number(cell.targetPct) / 100) * (Number(sampleSize) || 0))}
                                </td>
                                <td className="py-2 px-2">
                                  <select
                                    value={cell.status}
                                    onChange={(e) => updateCell(dim.id, cell.id, "status", e.target.value as QuotaCellDraft["status"])}
                                    disabled={saving}
                                    className="w-full rounded border border-zinc-200 dark:border-zinc-700 bg-transparent px-1 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  >
                                    <option value="open">Open</option>
                                    <option value="paused">Paused</option>
                                  </select>
                                </td>
                                <td className="py-2 pl-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeCell(dim.id, cell.id)}
                                    disabled={saving || dim.cells.length <= 1}
                                    className="text-zinc-400 hover:text-red-500 disabled:opacity-30 transition"
                                    title="Remove cell"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <button
                          type="button"
                          onClick={() => addCell(dim.id)}
                          disabled={saving}
                          className="mt-3 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                        >
                          + Add cell
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Quick Add Preset Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-zinc-400 self-center">Quick add:</span>
                  {(["gender", "age", "region", "income"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const id = nextId();
                        setQuotaDimensions((prev) => [
                          ...prev,
                          { id, name: preset, category: preset, isInterlocked: false, cells: [] },
                        ]);
                        setTimeout(() => applyPreset(id, preset), 0);
                      }}
                      disabled={saving}
                      className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition capitalize disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Overquota Config */}
            {quotaDimensions.length > 0 && (
              <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">Overquota Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={`${labelClass} mb-1 block`}>Buffer %</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={overquotaConfig.bufferPercent}
                      onChange={(e) => setOverquotaConfig((c) => ({ ...c, bufferPercent: Number(e.target.value) }))}
                      disabled={saving}
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-zinc-400">Extra % above target before capping</p>
                  </div>
                  <div>
                    <label className={`${labelClass} mb-1 block`}>Overquota Action</label>
                    <select
                      value={overquotaConfig.action}
                      onChange={(e) => setOverquotaConfig((c) => ({ ...c, action: e.target.value as OverquotaConfig["action"] }))}
                      disabled={saving}
                      className={inputClass}
                    >
                      <option value="terminate">Terminate</option>
                      <option value="redirect">Redirect to URL</option>
                      <option value="hold">Hold in Queue</option>
                    </select>
                  </div>
                  {overquotaConfig.action === "redirect" && (
                    <div>
                      <label className={`${labelClass} mb-1 block`}>Redirect URL</label>
                      <input
                        type="url"
                        value={overquotaConfig.redirectUrl}
                        onChange={(e) => setOverquotaConfig((c) => ({ ...c, redirectUrl: e.target.value }))}
                        disabled={saving}
                        placeholder="https://..."
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

  ); }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      {/* Top Bar Switcher between Cint Quick Mode and Advanced Targeting */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/project"
          className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5"
        >
          ← Back to Surveys
        </Link>

        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs">
          {/* <button
            type="button"
            onClick={() => setMode("cint")}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              mode === "cint"
                ? "bg-[#642582] text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Cint Quick Screener
          </button> */}
          <button
            type="button"
            onClick={() => setMode("advanced")}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              mode === "advanced"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Advanced Full Builder
          </button>
        </div>
      </div>

      {mode === "cint" ? (
        <div className="max-w-xl mx-auto py-4">
          <h1 className="text-2xl font-bold tracking-tight text-white text-center mb-6">
            Create Target Screener Survey
          </h1>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-7 sm:p-8 shadow-2xl space-y-5 text-left">
            <ErrorAlert message={error} />

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Name* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRN-SW-22297 || Females - MX 2"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Project* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Project<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Search for a project or create a new one"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 pr-9 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    🔍
                  </div>
                </div>
              </div>

              {/* Project Manager */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Project Manager
                </label>
                <select
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="Ratan Bhan">Ratan Bhan</option>
                  <option value="Client Admin">Client Admin</option>
                  <option value="Operations Lead">Operations Lead</option>
                </select>
              </div>

              {/* Number of Completes* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Number of Completes<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={10}
                  max={100000}
                  required
                  value={sampleSize}
                  onChange={(e) => setSampleSize(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>

              {/* Country - Language* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Country - Language<span className="text-red-500">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} - English
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Audience */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Target Audience
                </label>
                <select
                  value={audienceType}
                  onChange={(e) => setAudienceType(e.target.value as any)}
                  disabled={saving}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="consumer">Consumer (General Population)</option>
                  <option value="b2b">B2B Business Decision Makers</option>
                  <option value="healthcare">Healthcare & Medical Professionals</option>
                </select>
              </div>

              {/* Fielding Assistant */}
              <div className="pt-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <span>⚙️</span>
                      <span>Fielding Assistant</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Reduce manual adjustments and optimize the fielding process. Settings will automatically adjust to ensure your survey completes successfully.{" "}
                      <span className="text-purple-400 hover:underline cursor-pointer">Learn More</span>
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={fieldingAssistant}
                      onChange={(e) => setFieldingAssistant(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#642582]" />
                  </label>
                </div>
              </div>

              {/* Submit CTA (Purple Cint Button) */}
              <button
                type="submit"
                disabled={saving}
                className="w-full mt-4 py-2.5 rounded-lg bg-[#642582] hover:bg-[#7b2c9f] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? "Creating Survey & Initializing Quotas..." : "Create Survey"}
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] text-zinc-500">
                  Looking for more information on how to create a survey? Check out our{" "}
                  <span className="text-purple-400 hover:underline cursor-pointer">support documentation</span>.
                </span>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
       

          <div className="mb-6 mt-4">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Advanced Survey Builder</h1>
            <p className="mt-1 text-sm text-zinc-400">Complete each section in order to configure and create your survey.</p>
          </div>

          <div className="mb-8 overflow-x-auto pb-2">
            <div className="min-w-[760px] rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
              <div className="flex items-start">
                {[
                  { step: 1 as BuilderStep, title: "Basic Information", subtitle: "Survey details" },
                  { step: 2 as BuilderStep, title: "Sample & Feasibility", subtitle: "Sample requirements" },
                  { step: 3 as BuilderStep, title: "Targeting", subtitle: "Audience filters" },
                  { step: 4 as BuilderStep, title: "Quotas", subtitle: "Quota management" },
                ].map((item, index) => {
                  const active = currentBuilderStep === item.step;
                  const completed = currentBuilderStep > item.step;
                  const disabled = item.step > currentBuilderStep;
                  return (
                    <div key={item.step} className="flex min-w-0 flex-1 items-start">
                      <button type="button" onClick={() => goToBuilderStep(item.step)} disabled={disabled || saving} className={`group flex min-w-0 items-center gap-3 text-left ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`} aria-current={active ? "step" : undefined}>
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${active ? "border-purple-500 bg-purple-600 text-white" : completed ? "border-emerald-500 bg-emerald-500/15 text-emerald-400" : "border-zinc-700 bg-zinc-900 text-zinc-500"}`}>{completed ? "✓" : item.step}</span>
                        <span className="min-w-0"><span className={`block truncate text-xs font-semibold ${active ? "text-white" : completed ? "text-zinc-200" : "text-zinc-500"}`}>{item.title}</span><span className="mt-0.5 block truncate text-[10px] text-zinc-600">{item.subtitle}</span></span>
                      </button>
                      {index < 3 && <div className="mx-3 mt-4 h-px flex-1 bg-zinc-800"><div className={`h-px transition-all duration-300 ${currentBuilderStep > item.step ? "w-full bg-emerald-500" : "w-0"}`} /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <ErrorAlert message={error} />

              {currentBuilderStep === 1 && renderBasicSection()}
              {currentBuilderStep === 2 && renderSampleSection()}

              {currentBuilderStep === 3 && (
                <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="border-b border-zinc-200 px-6 pt-6 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-black dark:text-white">Targeting</h2>
                    <p className="mt-1 text-sm text-zinc-500">Define the audience that should qualify for this survey.</p>
                    <div className="mt-5 flex gap-1 overflow-x-auto">
                      {[
                        ["demographic", "Demographic"],
                        ["geographic", "Geographic"],
                        ["advanced", "Advanced"],
                      ].map(([key, label]) => (
                        <button key={key} type="button" onClick={() => setTargetingTab(key as TargetingTab)} disabled={saving} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${targetingTab === key ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent text-zinc-500"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {targetingTab === "demographic" && renderDemographicSection()}
                  {targetingTab === "geographic" && renderGeographicSection()}
                  {targetingTab === "advanced" && renderAdvancedSection()}
                </section>
              )}

              {currentBuilderStep === 4 && (
                <>
                  {renderQuotaSection()}
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/50 dark:bg-purple-950/20">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-200">Ready to create your survey?</p>
                    <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">Review your quota percentages and then click Create survey. Existing quota state, payload, and validation logic are preserved.</p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
                <button type="button" onClick={handleBuilderBack} disabled={currentBuilderStep === 1 || saving} className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">← Back</button>
                {currentBuilderStep < 4 ? (
                  <button type="button" onClick={handleBuilderNext} disabled={saving} className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">Next →</button>
                ) : (
                  <div className="min-w-[180px]"><SubmitButton loading={saving} loadingText="Creating">Create survey</SubmitButton></div>
                )}
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">Surveys are saved as drafts. You can configure additional survey setup and routing after creation. Nothing is charged or launched until you press Launch.</p>
            </form>

            <div className="lg:sticky lg:top-8 lg:self-start"><EstimateCard estimate={estimate} loading={estimating} /></div>
          </div>
        </>
      )}
    </>
  );
}