"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { apiJSON } from "@/lib/auth-client";
import {
  AUDIENCES,
  COUNTRIES,
  type AudienceType,
} from "@/lib/project-config";
import { ErrorAlert, Spinner, primaryButtonClass } from "@/components/Ui";

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
  availableSample: "0",
  baseCpi: "0",
  historicalIr: "0",
  averageLoi: "0",
  qualityScore: "0",
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

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
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
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950";
  const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage supplier panels and their available sample by market and audience.
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <ErrorAlert message={error} />
        {message && (
          <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            {message}
          </p>
        )}
      </div>

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-5 text-lg font-semibold">
          {editingId ? "Edit supplier" : "Add supplier"}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className={labelClass}>
            Supplier name
            <input required maxLength={120} value={form.supplierName} onChange={(event) => updateField("supplierName", event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label className={labelClass}>
            Supplier code
            <input required maxLength={80} value={form.supplierCode} onChange={(event) => updateField("supplierCode", event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label className={labelClass}>
            Country
            <select value={form.country} onChange={(event) => updateField("country", event.target.value)} className={`${inputClass} mt-1.5`}>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>{country.name} ({country.code})</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Audience
            <select
              value={form.audienceType}
              onChange={(event) => {
                const audience = AUDIENCES.find(
                  (option) => option.value === event.target.value
                );
                if (audience) updateField("audienceType", audience.value);
              }}
              className={`${inputClass} mt-1.5`}
            >
              {AUDIENCES.map((audience) => (
                <option key={audience.value} value={audience.value}>{audience.label}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Available sample
            <input required type="number" min="0" step="1" value={form.availableSample} onChange={(event) => updateField("availableSample", event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label className={labelClass}>
            Base CPI
            <input required type="number" min="0" step="0.01" value={form.baseCpi} onChange={(event) => updateField("baseCpi", event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label className={labelClass}>
            Historical IR (%)
            <input required type="number" min="0" max="100" step="0.1" value={form.historicalIr} onChange={(event) => updateField("historicalIr", event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label className={labelClass}>
            Average LOI (minutes)
            <input required type="number" min="0" step="0.1" value={form.averageLoi} onChange={(event) => updateField("averageLoi", event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label className={labelClass}>
            Quality score
            <input required type="number" min="0" max="100" step="0.1" value={form.qualityScore} onChange={(event) => updateField("qualityScore", event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
            Audience description
            <textarea maxLength={500} rows={2} value={form.audienceDescription} onChange={(event) => updateField("audienceDescription", event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
            Active for sample routing
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={saving} className={`${primaryButtonClass} !w-auto`}>
              {saving && <Spinner />}
              {saving ? "Saving..." : editingId ? "Save changes" : "Add supplier"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Supplier records</h2>
        {suppliers === null && !error ? (
          <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
            <Spinner className="h-5 w-5" />
            Loading suppliers...
          </div>
        ) : suppliers === null ? null : suppliers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
            <p className="font-medium">No suppliers yet</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Add your first supplier using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 font-medium">Market / audience</th>
                  <th className="px-4 py-3 font-medium">Sample</th>
                  <th className="px-4 py-3 font-medium">CPI</th>
                  <th className="px-4 py-3 font-medium">Quality</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{supplier.supplierName}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{supplier.supplierCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{COUNTRIES.find((country) => country.code === supplier.country)?.name || supplier.country}</p>
                      <p className="mt-0.5 text-xs capitalize text-zinc-500">{supplier.audienceType}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(supplier.availableSample)}</td>
                    <td className="px-4 py-3 tabular-nums">${formatNumber(supplier.baseCpi, 2)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(supplier.qualityScore, 1)} / 100</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${supplier.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                        {supplier.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setEditingId(supplier._id); setForm(toForm(supplier)); setError(""); setMessage(""); }} className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                          Edit
                        </button>
                        <button type="button" disabled={deletingId === supplier._id} onClick={() => void deleteSupplier(supplier)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950">
                          {deletingId === supplier._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
