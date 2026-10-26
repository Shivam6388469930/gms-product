"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiJSON } from "@/lib/auth-client";
import {
  AUDIENCES,
  COUNTRIES,
  type AudienceType,
} from "@/lib/project-config";
import { ErrorAlert, Spinner } from "@/components/Ui";
import {
  Truck,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  DollarSign,
  ShieldCheck,
  Globe,
  Trash2,
  Edit2,
  Layers,
} from "lucide-react";

type Supplier = {
  _id: string;
  supplierName: string;
  supplierCode: string;
  country: string;
  audienceType: AudienceType;
  audienceDescription: string;
  availableSample: number;
  baseCpi: number;
  historicalIr: number;
  averageLoi: number;
  qualityScore: number;
  active: boolean;
};

type SupplierForm = Omit<Supplier, "_id" | "availableSample" | "baseCpi" | "historicalIr" | "averageLoi" | "qualityScore"> & {
  availableSample: string;
  baseCpi: string;
  historicalIr: string;
  averageLoi: string;
  qualityScore: string;
};

const emptyForm: SupplierForm = {
  supplierName: "",
  supplierCode: "",
  country: "US",
  audienceType: "consumer",
  audienceDescription: "",
  availableSample: "50000",
  baseCpi: "2.25",
  historicalIr: "45",
  averageLoi: "12",
  qualityScore: "95",
  active: true,
};

function toForm(supplier: Supplier): SupplierForm {
  return {
    ...supplier,
    availableSample: String(supplier.availableSample),
    baseCpi: String(supplier.baseCpi),
    historicalIr: String(supplier.historicalIr),
    averageLoi: String(supplier.averageLoi),
    qualityScore: String(supplier.qualityScore),
  };
}

function formatNumber(value: number, decimals = 0): string {
  return (value || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadSuppliers = useCallback(async () => {
    const { ok, status, data } = await apiJSON<{ suppliers: Supplier[] }>(
      "/api/suppliers"
    );
    if (status === 401) {
      router.replace("/login");
      return;
    }
    if (!ok) {
      setError(data.message || "Couldn't load suppliers.");
      return;
    }
    setSuppliers(data.suppliers);
  }, [router]);

  useEffect(() => {
    let mounted = true;

    apiJSON<{ suppliers: Supplier[] }>("/api/suppliers").then(
      ({ ok, status, data }) => {
        if (!mounted) return;
        if (status === 401) {
          router.replace("/login");
          return;
        }
        if (!ok) {
          setError(data.message || "Couldn't load suppliers.");
          return;
        }
        setSuppliers(data.suppliers);
      }
    );

    return () => {
      mounted = false;
    };
  }, [router]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(false);
  }

  function updateField<K extends keyof SupplierForm>(
    field: K,
    value: SupplierForm[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      availableSample: Number(form.availableSample),
      baseCpi: Number(form.baseCpi),
      historicalIr: Number(form.historicalIr),
      averageLoi: Number(form.averageLoi),
      qualityScore: Number(form.qualityScore),
    };
    const { ok, status, data } = await apiJSON<{ supplier: Supplier }>(
      editingId ? `/api/suppliers/${editingId}` : "/api/suppliers",
      editingId ? "PATCH" : "POST",
      payload
    );
    setSaving(false);

    if (status === 401) {
      router.replace("/login");
      return;
    }
    if (!ok) {
      setError(data.message || "Couldn't save supplier.");
      return;
    }

    const successMessage = editingId ? "Supplier updated." : "Supplier created.";
    resetForm();
    setMessage(successMessage);
    await loadSuppliers();
  }

  async function deleteSupplier(supplier: Supplier) {
    if (!window.confirm(`Delete ${supplier.supplierName}? This cannot be undone.`)) {
      return;
    }

    setDeletingId(supplier._id);
    setError("");
    setMessage("");
    const { ok, status, data } = await apiJSON(
      `/api/suppliers/${supplier._id}`,
      "DELETE"
    );
    setDeletingId(null);

    if (status === 401) {
      router.replace("/login");
      return;
    }
    if (!ok) {
      setError(data.message || "Couldn't delete supplier.");
      return;
    }

    if (editingId === supplier._id) resetForm();
    setMessage("Supplier deleted.");
    await loadSuppliers();
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition";
  const labelClass = "block text-xs font-semibold text-zinc-300 space-y-1.5";

  const totalSample = suppliers?.reduce((sum, s) => sum + s.availableSample, 0) || 0;
  const activeCount = suppliers?.filter((s) => s.active).length || 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Truck size={13} />
            <span>Sample Supply Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Integrated Supplier Partners
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Configure partner sample networks, manage audience availability by geography, benchmark CPI rates, and review quality scores.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm && !editingId) {
              setShowForm(false);
            } else {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
        >
          <PlusCircle size={16} />
          <span>{showForm ? "Close Form" : "+ Add Supplier Partner"}</span>
        </button>
      </div>

      <div className="space-y-3">
        <ErrorAlert message={error} />
        {message && (
          <p role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            {message}
          </p>
        )}
      </div>

      {/* Metric Counters */}
      {suppliers && suppliers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Supply Nodes</div>
            <div className="text-2xl font-bold text-white mt-1">{suppliers.length}</div>
            <div className="text-xs text-emerald-400 mt-1">{activeCount} actively routing live sample</div>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Aggregate Available Sample</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{formatNumber(totalSample)}</div>
            <div className="text-xs text-zinc-400 mt-1">Across consumer, B2B and healthcare</div>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur">
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Average Quality Score</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
              {(suppliers.reduce((s, x) => s + x.qualityScore, 0) / suppliers.length).toFixed(1)} / 100
            </div>
            <div className="text-xs text-zinc-400 mt-1">Scored via GMS FraudShield</div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal / Section */}
      {(showForm || editingId) && (
        <section className="rounded-3xl border border-indigo-500/30 bg-zinc-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                {editingId ? "Edit Supplier Partner" : "Register New Supplier Partner"}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Define audience feasibility parameters, baseline CPI pricing, and quality benchmarks.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>
              <span>Supplier Name</span>
              <input required maxLength={120} value={form.supplierName} onChange={(event) => updateField("supplierName", event.target.value)} className={inputClass} placeholder="e.g. Apex Global Sample" />
            </label>
            <label className={labelClass}>
              <span>Supplier Code / ID</span>
              <input required maxLength={80} value={form.supplierCode} onChange={(event) => updateField("supplierCode", event.target.value)} className={inputClass} placeholder="SUP_APEX" />
            </label>
            <label className={labelClass}>
              <span>Geography Market</span>
              <select value={form.country} onChange={(event) => updateField("country", event.target.value)} className={inputClass}>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>{country.name} ({country.code})</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span>Target Audience Type</span>
              <select
                value={form.audienceType}
                onChange={(event) => {
                  const audience = AUDIENCES.find(
                    (option) => option.value === event.target.value
                  );
                  if (audience) updateField("audienceType", audience.value);
                }}
                className={inputClass}
              >
                {AUDIENCES.map((audience) => (
                  <option key={audience.value} value={audience.value}>{audience.label}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span>Available Sample Pool</span>
              <input required type="number" min="0" step="1" value={form.availableSample} onChange={(event) => updateField("availableSample", event.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span>Base CPI ($ USD)</span>
              <input required type="number" min="0" step="0.01" value={form.baseCpi} onChange={(event) => updateField("baseCpi", event.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span>Historical IR (%)</span>
              <input required type="number" min="0" max="100" step="0.1" value={form.historicalIr} onChange={(event) => updateField("historicalIr", event.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span>Average LOI (minutes)</span>
              <input required type="number" min="0" step="0.1" value={form.averageLoi} onChange={(event) => updateField("averageLoi", event.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span>Quality Score (0-100)</span>
              <input required type="number" min="0" max="100" step="0.1" value={form.qualityScore} onChange={(event) => updateField("qualityScore", event.target.value)} className={inputClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
              <span>Audience Description & Capabilities</span>
              <textarea maxLength={500} rows={2} value={form.audienceDescription} onChange={(event) => updateField("audienceDescription", event.target.value)} className={inputClass} placeholder="Describe targeting capabilities, niche panels, and verification standards..." />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0" />
              <span>Enable for automated live sample routing</span>
            </label>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-60"
              >
                {saving && <Spinner className="h-4 w-4" />}
                <span>{saving ? "Saving..." : editingId ? "Save Changes" : "Create Supplier"}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Suppliers Table */}
      <section className="space-y-4">
        {suppliers === null && !error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Spinner className="h-6 w-6 text-indigo-500 animate-spin" />
            <span className="text-xs text-zinc-400">Loading supplier network records...</span>
          </div>
        ) : suppliers === null ? null : suppliers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
            <p className="text-sm font-bold text-white">No supplier partners registered yet</p>
            <p className="text-xs text-zinc-400">Add your first supplier using the button above.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur divide-y divide-zinc-800/80 shadow-xl">
            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-[1.5fr_1fr_100px_90px_100px_80px_100px] items-center gap-4 px-6 py-3 bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <div>Partner</div>
              <div>Market & Audience</div>
              <div>Sample Pool</div>
              <div>Base CPI</div>
              <div>Quality Score</div>
              <div>Routing</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Table Rows */}
            {suppliers.map((supplier) => (
              <div
                key={supplier._id}
                className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_100px_90px_100px_80px_100px] items-center gap-4 px-6 py-4 hover:bg-zinc-800/40 transition group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">{supplier.supplierName}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">{supplier.supplierCode}</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xs text-zinc-300">
                    {COUNTRIES.find((c) => c.code === supplier.country)?.name || supplier.country}
                  </div>
                  <div className="text-[10px] text-zinc-500 capitalize">{supplier.audienceType}</div>
                </div>

                <div className="text-xs font-mono font-bold text-white">
                  {formatNumber(supplier.availableSample)}
                </div>

                <div className="text-xs font-mono text-zinc-300">
                  ${formatNumber(supplier.baseCpi, 2)}
                </div>

                <div>
                  <div className="text-xs font-bold text-indigo-400 font-mono">
                    {formatNumber(supplier.qualityScore, 1)}%
                  </div>
                  <div className="h-1 w-16 bg-zinc-800 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, supplier.qualityScore)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      supplier.active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {supplier.active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    {supplier.active ? "Active" : "Disabled"}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(supplier._id);
                      setForm(toForm(supplier));
                      setShowForm(true);
                      setError("");
                      setMessage("");
                    }}
                    className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                    title="Edit supplier"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === supplier._id}
                    onClick={() => void deleteSupplier(supplier)}
                    className="p-1.5 rounded-lg border border-zinc-800 hover:bg-rose-950/40 hover:border-rose-800 text-zinc-400 hover:text-rose-400 transition"
                    title="Delete supplier"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
