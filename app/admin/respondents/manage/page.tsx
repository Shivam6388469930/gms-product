"use client";

import React, { FormEvent, useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from "lucide-react";

type Status = "Active" | "Inactive" | "Blocked" | "Suspended";

interface Supplier {
  _id: string;
  supplierName: string;
  supplierCode: string;
  supplierEmail?: string;
  country?: string;
  audienceType?: string;
  active?: boolean;
}

interface Panel {
  _id: string;
  name: string;
  category?: string;
  country?: string;
  status?: string;
}

interface Respondent {
  _id: string;
  respondentId: string;
  externalId?: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  state?: string;
  city?: string;
  gender?: string;
  age?: number;
  employment?: string;
  industry?: string;
  jobTitle?: string;
  education?: string;
  incomeRange?: string;
  supplierCode?: string;
  supplier?: Supplier | null;
  panel?: Panel | null;
  panelId?: string;
  panels?: string[];
  status: Status;
  qualityScore: number;
  fraudRiskScore: number;
  totalSurveys: number;
  completedSurveys: number;
  screenouts: number;
  quotaFull: number;
  qualityRejects: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  createdAt: string;
  lastActiveAt?: string;
}

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "US",
  state: "",
  city: "",
  gender: "Unspecified",
  age: "",
  employment: "",
  industry: "",
  jobTitle: "",
  education: "",
  incomeRange: "",
  supplierId: "",
  panelId: "",
  status: "Active" as Status,
};

export default function RespondentManagePage() {
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
    suspended: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Respondent | null>(null);
  const [selected, setSelected] = useState<Respondent | null>(null);
  const [credentials, setCredentials] = useState<{
    respondentId: string;
    email: string;
    password: string;
  } | null>(null);

  const [form, setForm] = useState(emptyForm);

  const loadSuppliers = async () => {
    try {
      const res = await fetch("/api/admin/suppliers?limit=100");
      const data = await res.json();

      const list =
        data.suppliers ||
        data.items ||
        data.data ||
        [];

      setSuppliers(list);
    } catch (error) {
      console.error("Failed to load suppliers", error);
    }
  };

  const loadPanels = async (supplierId?: string) => {
    if (!supplierId) {
      setPanels([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/supplier-panels?supplierId=${encodeURIComponent(supplierId)}&limit=100`
      );
      const data = await res.json();

      setPanels(data.panels || data.items || data.data || []);
    } catch (error) {
      console.error("Failed to load panels", error);
      setPanels([]);
    }
  };

  const loadRespondents = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
      });

      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);

      const res = await fetch(
        `/api/admin/respondents/manage?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load respondents");
      }

      setRespondents(data.respondents || []);
      setStats(
        data.stats || {
          total: 0,
          active: 0,
          inactive: 0,
          blocked: 0,
          suspended: 0,
        }
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRespondents();
    loadSuppliers();
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRespondents();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setPanels([]);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = async (item: Respondent) => {
    setEditing(item);

    const supplierId = item.supplier?._id || "";
    setForm({
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      email: item.email || "",
      phone: item.phone || "",
      country: item.country || "US",
      state: item.state || "",
      city: item.city || "",
      gender: item.gender || "Unspecified",
      age: item.age?.toString() || "",
      employment: item.employment || "",
      industry: item.industry || "",
      jobTitle: item.jobTitle || "",
      education: item.education || "",
      incomeRange: item.incomeRange || "",
      supplierId,
      panelId: item.panel?._id || item.panelId || "",
      status: item.status || "Active",
    });

    setShowForm(true);
    await loadPanels(supplierId);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload: Record<string, any> = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
      };

      const url = editing
        ? `/api/admin/respondents/manage/${editing._id}`
        : "/api/admin/respondents/manage";

      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      if (data.credentials) {
        setCredentials(data.credentials);
      }

      setShowForm(false);
      resetForm();
      await loadRespondents();
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (item: Respondent, newStatus: Status) => {
    try {
      const res = await fetch(
        `/api/admin/respondents/manage/${item._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update status");

      await loadRespondents();

      if (selected?._id === item._id) {
        setSelected({ ...selected, status: newStatus });
      }
    } catch (error: any) {
      alert(error.message || "Failed to update status");
    }
  };

  const blockRespondent = async (item: Respondent) => {
    if (!confirm(`Block respondent ${item.respondentId}?`)) return;

    try {
      const res = await fetch(
        `/api/admin/respondents/manage/${item._id}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to block");

      await loadRespondents();
    } catch (error: any) {
      alert(error.message || "Failed to block respondent");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Respondent Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, update, activate, suspend and block respondent accounts.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadRespondents}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={16} />
              Add Respondent
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard title="Total" value={stats.total} icon={<Users size={18} />} />
          <StatCard title="Active" value={stats.active} icon={<UserCheck size={18} />} />
          <StatCard title="Inactive" value={stats.inactive} icon={<ShieldAlert size={18} />} />
          <StatCard title="Blocked" value={stats.blocked} icon={<Ban size={18} />} />
          <StatCard title="Suspended" value={stats.suspended} icon={<ShieldAlert size={18} />} />
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search respondent ID, name, email, phone, supplier code..."
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border bg-white px-4 py-2.5 text-sm"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Respondent</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Panel</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Quality</th>
                  <th className="px-5 py-3">Surveys</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Loader2 className="mx-auto animate-spin" />
                    </td>
                  </tr>
                ) : respondents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No respondents found.
                    </td>
                  </tr>
                ) : (
                  respondents.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {item.name || `${item.firstName} ${item.lastName}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.respondentId}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.email}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {item.supplier?.supplierName || "Unknown Supplier"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.supplier?.supplierCode || item.supplierCode || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {item.panel?.name || "—"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.panel?.category || ""}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {item.city || "—"}
                        {item.state ? `, ${item.state}` : ""}
                        <div className="text-xs text-slate-500">
                          {item.country}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold">
                          {item.qualityScore ?? 0}%
                        </div>
                        <div className="text-xs text-slate-500">
                          Fraud {item.fraudRiskScore ?? 0}%
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div>{item.totalSurveys ?? 0} total</div>
                        <div className="text-xs text-slate-500">
                          {item.completedSurveys ?? 0} completed
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelected(item)}
                            className="rounded-lg p-2 hover:bg-slate-100"
                            title="View"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Pencil size={17} />
                          </button>

                          {item.status !== "Blocked" && (
                            <button
                              onClick={() => blockRespondent(item)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Block"
                            >
                              <Ban size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <Modal
          title={editing ? "Edit Respondent" : "Add Respondent"}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
        >
          <form onSubmit={submitForm} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="First Name" required value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
              <Input label="Last Name" required value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
              <Input label="Email" type="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Input label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
              <Input label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              <Input label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Input label="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
              <Input label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
              <Input label="Employment" value={form.employment} onChange={(v) => setForm({ ...form, employment: v })} />
              <Input label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
              <Input label="Job Title" value={form.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} />
              <Input label="Education" value={form.education} onChange={(v) => setForm({ ...form, education: v })} />
              <Input label="Income Range" value={form.incomeRange} onChange={(v) => setForm({ ...form, incomeRange: v })} />

              <div>
                <label className="mb-1 block text-sm font-medium">Supplier *</label>
                <select
                  required
                  value={form.supplierId}
                  onChange={async (e) => {
                    const supplierId = e.target.value;
                    setForm({ ...form, supplierId, panelId: "" });
                    await loadPanels(supplierId);
                  }}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.supplierName} ({supplier.supplierCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Panel</label>
                <select
                  value={form.panelId}
                  onChange={(e) => setForm({ ...form, panelId: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  disabled={!form.supplierId}
                >
                  <option value="">No panel</option>
                  {panels.map((panel) => (
                    <option key={panel._id} value={panel._id}>
                      {panel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Status })
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            {!editing && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                The respondent login account is created automatically.
                Initial password = respondent email. The account is marked
                <strong> must change password</strong>.
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editing ? "Update Respondent" : "Create Respondent"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal
          title={`Respondent ${selected.respondentId}`}
          onClose={() => setSelected(null)}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Info label="Name" value={selected.name} />
            <Info label="Email" value={selected.email} />
            <Info label="Phone" value={selected.phone || "—"} />
            <Info label="Status" value={selected.status} />
            <Info
              label="Supplier"
              value={
                selected.supplier
                  ? `${selected.supplier.supplierName} (${selected.supplier.supplierCode})`
                  : "Unknown Supplier"
              }
            />
            <Info label="Panel" value={selected.panel?.name || "—"} />
            <Info label="Country" value={selected.country} />
            <Info
              label="Location"
              value={`${selected.city || "—"}${selected.state ? `, ${selected.state}` : ""}`}
            />
            <Info label="Quality Score" value={`${selected.qualityScore}%`} />
            <Info label="Fraud Risk" value={`${selected.fraudRiskScore}%`} />
            <Info label="Total Surveys" value={String(selected.totalSurveys)} />
            <Info label="Completed" value={String(selected.completedSurveys)} />
            <Info label="Screenouts" value={String(selected.screenouts)} />
            <Info label="Quota Full" value={String(selected.quotaFull)} />
            <Info label="Total Earnings" value={`$${selected.totalEarnings}`} />
            <Info label="Pending Earnings" value={`$${selected.pendingEarnings}`} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
            <button
              onClick={() => changeStatus(selected, "Active")}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
            >
              Activate
            </button>
            <button
              onClick={() => changeStatus(selected, "Inactive")}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
            >
              Deactivate
            </button>
            <button
              onClick={() => changeStatus(selected, "Suspended")}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
            >
              Suspend
            </button>
            <button
              onClick={() => changeStatus(selected, "Blocked")}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Block
            </button>
          </div>
        </Modal>
      )}

      {credentials && (
        <Modal
          title="Respondent Account Created"
          onClose={() => setCredentials(null)}
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              Save these credentials. The password is the respondent email.
            </div>

            <Info label="Respondent ID" value={credentials.respondentId} />
            <Info label="Login Email" value={credentials.email} />
            <Info label="Initial Password" value={credentials.password} />

            <button
              onClick={() => setCredentials(null)}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between text-slate-500">
        <span className="text-sm">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const classes =
    status === "Active"
      ? "bg-green-50 text-green-700"
      : status === "Blocked"
        ? "bg-red-50 text-red-700"
        : status === "Suspended"
          ? "bg-orange-50 text-orange-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label} {required && "*"}
      </label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-slate-400"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs font-medium uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900 break-words">
        {value}
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
