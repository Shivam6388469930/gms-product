"use client";

import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Globe,
  DollarSign,
  Mail,
} from "lucide-react";

interface Supplier {
  _id: string;

  supplierName: string;
  supplierCode: string;
  supplierEmail: string;

  country: string;

  audienceType: string;
  audienceDescription: string;

  availableSample: number;
  baseCpi: number;
  historicalIr: number;
  averageLoi: number;
  qualityScore: number;

  active: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const audienceTypes = [
  "consumer",
  "b2b",
  "healthcare",
];

const audienceColors: Record<
  string,
  {
    bg: string;
    text: string;
  }
> = {
  consumer: {
    bg: "rgba(99,102,241,0.12)",
    text: "#818cf8",
  },

  b2b: {
    bg: "rgba(245,158,11,0.12)",
    text: "#fbbf24",
  },

  healthcare: {
    bg: "rgba(34,197,94,0.12)",
    text: "#4ade80",
  },
};

const emptyForm = {
  supplierName: "",
  supplierCode: "",
  supplierEmail: "",

  country: "",

  audienceType: "consumer",
  audienceDescription: "",

  availableSample: 0,
  baseCpi: 0,
  historicalIr: 0,
  averageLoi: 0,
  qualityScore: 0,
};

export default function SupplierManagement() {
  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  const [search, setSearch] =
    useState("");

  const [countryFilter, setCountryFilter] =
    useState("");

  const [audienceFilter, setAudienceFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [editing, setEditing] =
    useState<Supplier | null>(null);

  const [formData, setFormData] =
    useState(emptyForm);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /**
   * -----------------------------------------
   * Fetch suppliers
   * -----------------------------------------
   */

  const fetchSuppliers =
    useCallback(async () => {
      setLoading(true);

      try {
        const params =
          new URLSearchParams({
            page:
              pagination.page.toString(),

            limit:
              pagination.limit.toString(),
          });

        if (search) {
          params.set(
            "search",
            search
          );
        }

        if (countryFilter) {
          params.set(
            "country",
            countryFilter
          );
        }

        if (audienceFilter) {
          params.set(
            "audienceType",
            audienceFilter
          );
        }

        const res = await fetch(
          `/api/admin/suppliers?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
              "Failed to fetch suppliers"
          );
        }

        setSuppliers(
          data.suppliers || []
        );

        if (data.pagination) {
          setPagination(
            data.pagination
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch suppliers"
        );
      } finally {
        setLoading(false);
      }
    }, [
      pagination.page,
      pagination.limit,
      search,
      countryFilter,
      audienceFilter,
    ]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  /**
   * -----------------------------------------
   * Open create
   * -----------------------------------------
   */

  const openCreate = () => {
    setEditing(null);

    setFormData({
      ...emptyForm,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  /**
   * -----------------------------------------
   * Open edit
   * -----------------------------------------
   */

  const openEdit = (
    supplier: Supplier
  ) => {
    setEditing(supplier);

    setFormData({
      supplierName:
        supplier.supplierName,

      supplierCode:
        supplier.supplierCode,

      supplierEmail:
        supplier.supplierEmail || "",

      country:
        supplier.country,

      audienceType:
        supplier.audienceType,

      audienceDescription:
        supplier.audienceDescription ||
        "",

      availableSample:
        supplier.availableSample,

      baseCpi:
        supplier.baseCpi,

      historicalIr:
        supplier.historicalIr,

      averageLoi:
        supplier.averageLoi,

      qualityScore:
        supplier.qualityScore,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  /**
   * -----------------------------------------
   * Save supplier
   * -----------------------------------------
   */

  const handleSave =
    async () => {
      setError("");
      setSuccess("");

      if (
        !formData.supplierName.trim()
      ) {
        setError(
          "Supplier name is required"
        );
        return;
      }

      if (
        !formData.supplierCode.trim()
      ) {
        setError(
          "Supplier code is required"
        );
        return;
      }

      if (
        !formData.supplierEmail.trim()
      ) {
        setError(
          "Supplier email is required"
        );
        return;
      }

      setSaving(true);

      try {
        const url = editing
          ? `/api/admin/suppliers/${editing._id}`
          : "/api/admin/suppliers";

        const method = editing
          ? "PATCH"
          : "POST";

        const res = await fetch(
          url,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              formData
            ),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
              "Failed to save supplier"
          );
        }

        /**
         * New supplier response
         */
        if (!editing) {
          setSuccess(
            `Supplier created successfully. Login email: ${data.login?.email}`
          );
        } else {
          setSuccess(
            "Supplier updated successfully."
          );
        }

        setShowModal(false);

        await fetchSuppliers();
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to save supplier"
        );
      } finally {
        setSaving(false);
      }
    };

  /**
   * -----------------------------------------
   * Delete supplier
   * -----------------------------------------
   */

  const handleDelete =
    async (id: string) => {
      if (
        !confirm(
          "Are you sure you want to delete this supplier?"
        )
      ) {
        return;
      }

      try {
        const res =
          await fetch(
            `/api/admin/suppliers/${id}`,
            {
              method: "DELETE",
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
              "Failed to delete supplier"
          );
        }

        await fetchSuppliers();
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to delete supplier"
        );
      }
    };

  /**
   * -----------------------------------------
   * Toggle active
   * -----------------------------------------
   */

  const handleToggleActive =
    async (
      supplier: Supplier
    ) => {
      try {
        const res =
          await fetch(
            `/api/admin/suppliers/${supplier._id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                active:
                  !supplier.active,
              }),
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
              "Failed to update supplier"
          );
        }

        await fetchSuppliers();
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to update supplier"
        );
      }
    };

  const inputStyle: React.CSSProperties =
    {
      width: "100%",
      padding: "10px 14px",
      borderRadius: 10,

      border:
        "1px solid rgba(255,255,255,0.08)",

      background:
        "rgba(255,255,255,0.04)",

      color: "#fff",

      fontSize: 14,

      outline: "none",

      boxSizing: "border-box",
    };

  const fields = [
    {
      key: "supplierName",
      label: "Supplier Name",
      type: "text",
      span: 2,
    },

    {
      key: "supplierEmail",
      label:
        "Supplier Email / Login Email",
      type: "email",
      span: 2,
    },

    {
      key: "supplierCode",
      label: "Supplier Code",
      type: "text",
      span: 1,
    },

    {
      key: "country",
      label: "Country",
      type: "text",
      span: 1,
    },

    {
      key: "availableSample",
      label: "Available Sample",
      type: "number",
      span: 1,
    },

    {
      key: "baseCpi",
      label: "Base CPI ($)",
      type: "number",
      span: 1,
    },

    {
      key: "historicalIr",
      label: "Historical IR (%)",
      type: "number",
      span: 1,
    },

    {
      key: "averageLoi",
      label: "Average LOI (min)",
      type: "number",
      span: 1,
    },

    {
      key: "qualityScore",
      label:
        "Quality Score (0-100)",
      type: "number",
      span: 1,
    },
  ] as const;

  return (
    <div>
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              margin: 0,
            }}
          >
            Supplier Management
          </h1>

          <p
            style={{
              color:
                "rgba(255,255,255,0.45)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Manage supply sources,
            capacity, pricing and
            supplier accounts
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background:
              "linear-gradient(135deg, #06b6d4, #0ea5e9)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 10,
            background:
              "rgba(239,68,68,0.10)",
            border:
              "1px solid rgba(239,68,68,0.25)",
            color: "#f87171",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 10,
            background:
              "rgba(34,197,94,0.10)",
            border:
              "1px solid rgba(34,197,94,0.25)",
            color: "#4ade80",
            fontSize: 14,
          }}
        >
          {success}
        </div>
      )}

      {/* FILTERS */}

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,

            background:
              "rgba(255,255,255,0.04)",

            border:
              "1px solid rgba(255,255,255,0.06)",

            borderRadius: 10,

            padding: "8px 14px",

            flex: 1,

            maxWidth: 400,
          }}
        >
          <Search
            size={16}
            color="rgba(255,255,255,0.4)"
          />

          <input
            type="text"
            placeholder="Search by name, code or email..."
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              );

              setPagination(
                (p) => ({
                  ...p,
                  page: 1,
                })
              );
            }}
            style={{
              background:
                "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 14,
              width: "100%",
            }}
          />
        </div>

        <input
          type="text"
          placeholder="Country filter..."
          value={countryFilter}
          onChange={(e) => {
            setCountryFilter(
              e.target.value
            );

            setPagination(
              (p) => ({
                ...p,
                page: 1,
              })
            );
          }}
          style={{
            ...inputStyle,
            width: 160,
          }}
        />

        <select
          value={audienceFilter}
          onChange={(e) => {
            setAudienceFilter(
              e.target.value
            );

            setPagination(
              (p) => ({
                ...p,
                page: 1,
              })
            );
          }}
          style={{
            background:
              "rgba(255,255,255,0.04)",

            border:
              "1px solid rgba(255,255,255,0.06)",

            borderRadius: 10,

            padding: "8px 14px",

            color: "#fff",

            fontSize: 14,

            cursor: "pointer",

            outline: "none",
          }}
        >
          <option value="">
            All Audiences
          </option>

          {audienceTypes.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {type
                  .charAt(0)
                  .toUpperCase() +
                  type.slice(1)}
              </option>
            )
          )}
        </select>
      </div>

      {/* TABLE */}

      <div
        style={{
          background:
            "rgba(255,255,255,0.03)",

          border:
            "1px solid rgba(255,255,255,0.06)",

          borderRadius: 16,

          overflow: "hidden",
        }}
      >
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                {[
                  "Supplier",
                  "Email",
                  "Code",
                  "Country",
                  "Audience",
                  "Sample",
                  "CPI ($)",
                  "IR (%)",
                  "Quality",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      textAlign: "left",
                      padding:
                        "14px 12px",

                      color:
                        "rgba(255,255,255,0.4)",

                      fontWeight: 500,

                      fontSize: 12,

                      textTransform:
                        "uppercase",

                      letterSpacing:
                        "0.05em",

                      borderBottom:
                        "1px solid rgba(255,255,255,0.06)",

                      background:
                        "rgba(255,255,255,0.02)",

                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      textAlign:
                        "center",
                      padding: 40,
                      color:
                        "rgba(255,255,255,0.3)",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : suppliers.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      textAlign:
                        "center",
                      padding: 40,
                      color:
                        "rgba(255,255,255,0.3)",
                    }}
                  >
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map(
                  (supplier) => {
                    const audienceColor =
                      audienceColors[
                        supplier
                          .audienceType
                      ] ||
                      audienceColors.consumer;

                    return (
                      <tr
                        key={
                          supplier._id
                        }
                        style={{
                          borderBottom:
                            "1px solid rgba(255,255,255,0.03)",
                        }}
                      >
                        {/* SUPPLIER */}

                        <td
                          style={{
                            padding: 12,
                            color: "#fff",
                            fontWeight: 500,
                          }}
                        >
                          {
                            supplier.supplierName
                          }
                        </td>

                        {/* EMAIL */}

                        <td
                          style={{
                            padding: 12,
                            color:
                              "rgba(255,255,255,0.6)",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 6,
                            }}
                          >
                            <Mail
                              size={13}
                              color="rgba(255,255,255,0.35)"
                            />

                            <span>
                              {
                                supplier.supplierEmail
                              }
                            </span>
                          </div>
                        </td>

                        {/* CODE */}

                        <td
                          style={{
                            padding: 12,
                            color:
                              "rgba(255,255,255,0.5)",
                            fontFamily:
                              "monospace",
                          }}
                        >
                          {
                            supplier.supplierCode
                          }
                        </td>

                        {/* COUNTRY */}

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 6,
                            }}
                          >
                            <Globe
                              size={14}
                              color="rgba(255,255,255,0.4)"
                            />

                            <span
                              style={{
                                color:
                                  "rgba(255,255,255,0.7)",
                              }}
                            >
                              {
                                supplier.country
                              }
                            </span>
                          </div>
                        </td>

                        {/* AUDIENCE */}

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          <span
                            style={{
                              background:
                                audienceColor.bg,

                              color:
                                audienceColor.text,

                              padding:
                                "4px 10px",

                              borderRadius: 6,

                              fontSize: 12,

                              fontWeight: 600,

                              textTransform:
                                "capitalize",
                            }}
                          >
                            {
                              supplier.audienceType
                            }
                          </span>
                        </td>

                        {/* SAMPLE */}

                        <td
                          style={{
                            padding: 12,
                            color:
                              "rgba(255,255,255,0.7)",
                          }}
                        >
                          {supplier.availableSample?.toLocaleString()}
                        </td>

                        {/* CPI */}

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 4,
                            }}
                          >
                            <DollarSign
                              size={13}
                              color="#fbbf24"
                            />

                            <span
                              style={{
                                color:
                                  "#fbbf24",
                              }}
                            >
                              {supplier.baseCpi?.toFixed(
                                2
                              )}
                            </span>
                          </div>
                        </td>

                        {/* IR */}

                        <td
                          style={{
                            padding: 12,
                            color:
                              "rgba(255,255,255,0.6)",
                          }}
                        >
                          {
                            supplier.historicalIr
                          }
                          %
                        </td>

                        {/* QUALITY */}

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                background:
                                  "rgba(255,255,255,0.06)",
                                overflow:
                                  "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${supplier.qualityScore}%`,
                                  height:
                                    "100%",
                                  borderRadius: 3,

                                  background:
                                    supplier.qualityScore >=
                                    70
                                      ? "#22c55e"
                                      : supplier.qualityScore >=
                                        40
                                      ? "#f59e0b"
                                      : "#ef4444",
                                }}
                              />
                            </div>

                            <span
                              style={{
                                color:
                                  "rgba(255,255,255,0.5)",
                                fontSize: 12,
                              }}
                            >
                              {
                                supplier.qualityScore
                              }
                            </span>
                          </div>
                        </td>

                        {/* STATUS */}

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          <button
                            onClick={() =>
                              handleToggleActive(
                                supplier
                              )
                            }
                            style={{
                              background:
                                "none",
                              border:
                                "none",
                              cursor:
                                "pointer",
                              color:
                                supplier.active
                                  ? "#22c55e"
                                  : "rgba(255,255,255,0.2)",
                              display:
                                "flex",
                              alignItems:
                                "center",
                            }}
                          >
                            {supplier.active ? (
                              <ToggleRight
                                size={24}
                              />
                            ) : (
                              <ToggleLeft
                                size={24}
                              />
                            )}
                          </button>
                        </td>

                        {/* ACTIONS */}

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              gap: 6,
                            }}
                          >
                            <button
                              onClick={() =>
                                openEdit(
                                  supplier
                                )
                              }
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border:
                                  "1px solid rgba(255,255,255,0.08)",
                                background:
                                  "rgba(255,255,255,0.04)",
                                color:
                                  "#818cf8",
                                cursor:
                                  "pointer",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                              }}
                            >
                              <Edit3
                                size={14}
                              />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  supplier._id
                                )
                              }
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border:
                                  "1px solid rgba(239,68,68,0.2)",
                                background:
                                  "rgba(239,68,68,0.06)",
                                color:
                                  "#f87171",
                                cursor:
                                  "pointer",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                              }}
                            >
                              <Trash2
                                size={14}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {pagination.totalPages >
          1 && (
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              padding:
                "12px 16px",
              borderTop:
                "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              style={{
                color:
                  "rgba(255,255,255,0.4)",
                fontSize: 13,
              }}
            >
              Page{" "}
              {pagination.page}{" "}
              of{" "}
              {
                pagination.totalPages
              }{" "}
              ({pagination.total}{" "}
              total)
            </span>

            <div
              style={{
                display: "flex",
                gap: 8,
              }}
            >
              <button
                onClick={() =>
                  setPagination(
                    (p) => ({
                      ...p,
                      page:
                        p.page - 1,
                    })
                  )
                }
                disabled={
                  pagination.page ===
                  1
                }
                style={{
                  padding:
                    "6px 12px",
                  borderRadius: 8,
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  background:
                    "rgba(255,255,255,0.04)",
                  color:
                    pagination.page ===
                    1
                      ? "rgba(255,255,255,0.2)"
                      : "#fff",
                  cursor:
                    pagination.page ===
                    1
                      ? "not-allowed"
                      : "pointer",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 4,
                  fontSize: 13,
                }}
              >
                <ChevronLeft
                  size={14}
                />
                Prev
              </button>

              <button
                onClick={() =>
                  setPagination(
                    (p) => ({
                      ...p,
                      page:
                        p.page + 1,
                    })
                  )
                }
                disabled={
                  pagination.page >=
                  pagination.totalPages
                }
                style={{
                  padding:
                    "6px 12px",
                  borderRadius: 8,
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  background:
                    "rgba(255,255,255,0.04)",
                  color:
                    pagination.page >=
                    pagination.totalPages
                      ? "rgba(255,255,255,0.2)"
                      : "#fff",
                  cursor:
                    pagination.page >=
                    pagination.totalPages
                      ? "not-allowed"
                      : "pointer",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 4,
                  fontSize: 13,
                }}
              >
                Next
                <ChevronRight
                  size={14}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.6)",
            backdropFilter:
              "blur(8px)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() =>
            !saving &&
            setShowModal(false)
          }
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              background:
                "#1a1a2e",

              border:
                "1px solid rgba(255,255,255,0.08)",

              borderRadius: 16,

              padding: 32,

              width: "100%",

              maxWidth: 520,

              maxHeight: "85vh",

              overflow: "auto",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: 24,
              }}
            >
              <div>
                <h2
                  style={{
                    color: "#fff",
                    fontSize: 20,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {editing
                    ? "Edit Supplier"
                    : "Add New Supplier"}
                </h2>

                {!editing && (
                  <p
                    style={{
                      color:
                        "rgba(255,255,255,0.4)",
                      fontSize: 12,
                      margin:
                        "6px 0 0",
                    }}
                  >
                    A supplier login
                    account will be
                    created automatically.
                  </p>
                )}
              </div>

              <button
                onClick={() =>
                  !saving &&
                  setShowModal(
                    false
                  )
                }
                style={{
                  background:
                    "none",
                  border:
                    "none",
                  color:
                    "rgba(255,255,255,0.4)",
                  cursor:
                    "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 16,
              }}
            >
              {fields.map(
                (field) => (
                  <div
                    key={
                      field.key
                    }
                    style={{
                      gridColumn:
                        field.span ===
                        2
                          ? "span 2"
                          : "span 1",
                    }}
                  >
                    <label
                      style={{
                        display:
                          "block",
                        color:
                          "rgba(255,255,255,0.6)",
                        fontSize: 13,
                        marginBottom:
                          6,
                      }}
                    >
                      {
                        field.label
                      }
                    </label>

                    <input
                      type={
                        field.type
                      }
                      value={
                        formData[
                          field.key
                        ]
                      }
                      min={
                        field.type ===
                        "number"
                          ? 0
                          : undefined
                      }
                      max={
                        field.key ===
                        "qualityScore" ||
                        field.key ===
                        "historicalIr"
                          ? 100
                          : undefined
                      }
                      onChange={(
                        event
                      ) => {
                        const value =
                          event
                            .target
                            .value;

                        setFormData(
                          (previous) => ({
                            ...previous,

                            [field.key]:
                              field.type ===
                              "number"
                                ? Number(
                                    value
                                  ) ||
                                  0
                                : value,
                          })
                        );
                      }}
                      style={
                        inputStyle
                      }
                    />

                    {/* LOGIN PASSWORD INFO */}

                    {field.key ===
                      "supplierEmail" &&
                      !editing && (
                        <p
                          style={{
                            color:
                              "rgba(255,255,255,0.35)",
                            fontSize: 11,
                            marginTop: 5,
                          }}
                        >
                          Initial supplier
                          password will be
                          the same as this
                          email.
                        </p>
                      )}
                  </div>
                )
              )}

              {/* AUDIENCE */}

              <div>
                <label
                  style={{
                    display:
                      "block",
                    color:
                      "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    marginBottom:
                      6,
                  }}
                >
                  Audience Type
                </label>

                <select
                  value={
                    formData.audienceType
                  }
                  onChange={(
                    event
                  ) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        audienceType:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  style={
                    inputStyle
                  }
                >
                  {audienceTypes.map(
                    (type) => (
                      <option
                        key={
                          type
                        }
                        value={
                          type
                        }
                      >
                        {type
                          .charAt(
                            0
                          )
                          .toUpperCase() +
                          type.slice(
                            1
                          )}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* DESCRIPTION */}

              <div
                style={{
                  gridColumn:
                    "span 2",
                }}
              >
                <label
                  style={{
                    display:
                      "block",
                    color:
                      "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    marginBottom:
                      6,
                  }}
                >
                  Audience
                  Description
                </label>

                <textarea
                  value={
                    formData.audienceDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        audienceDescription:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize:
                      "vertical",
                  }}
                />
              </div>
            </div>

            {/* SAVE */}

            <button
              onClick={
                handleSave
              }
              disabled={saving}
              style={{
                width: "100%",

                marginTop: 20,

                padding: "12px",

                borderRadius: 10,

                border: "none",

                background:
                  saving
                    ? "rgba(6,182,212,0.4)"
                    : "linear-gradient(135deg, #06b6d4, #0ea5e9)",

                color: "#fff",

                fontWeight: 600,

                fontSize: 14,

                cursor:
                  saving
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : editing
                ? "Save Changes"
                : "Create Supplier & Login"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}