"use client";

import React, { useEffect, useState } from "react";
import {
  Shield,
  Plus,
  Save,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

interface Permission {
  resource: string;
  actions: string[];
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

const RESOURCES = [
  "users",
  "suppliers",
  "projects",
  "invoices",
  "audit_logs",
  "roles",
  "settings",
  "reports",
  "surveys",
];

const ACTIONS = ["create", "read", "update", "delete"];

const actionColors: Record<string, string> = {
  create: "#22c55e",
  read: "#6366f1",
  update: "#f59e0b",
  delete: "#ef4444",
};

export default function PermissionMatrix() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [editedPermissions, setEditedPermissions] = useState<
    Record<string, Permission[]>
  >({});
  const [successMessage, setSuccessMessage] = useState("");

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      setRoles(data.roles || []);
      const perms: Record<string, Permission[]> = {};
      (data.roles || []).forEach((r: Role) => {
        perms[r._id] = r.permissions || [];
      });
      setEditedPermissions(perms);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const hasPermission = (roleId: string, resource: string, action: string) => {
    const perms = editedPermissions[roleId] || [];
    const rp = perms.find((p) => p.resource === resource);
    return rp?.actions?.includes(action) || false;
  };

  const togglePermission = (roleId: string, resource: string, action: string) => {
    setEditedPermissions((prev) => {
      const perms = [...(prev[roleId] || [])];
      const idx = perms.findIndex((p) => p.resource === resource);

      if (idx >= 0) {
        const actions = [...perms[idx].actions];
        const aIdx = actions.indexOf(action);
        if (aIdx >= 0) {
          actions.splice(aIdx, 1);
        } else {
          actions.push(action);
        }
        perms[idx] = { ...perms[idx], actions };
        if (actions.length === 0) {
          perms.splice(idx, 1);
        }
      } else {
        perms.push({ resource, actions: [action] });
      }

      return { ...prev, [roleId]: perms };
    });
  };

  const toggleAllForResource = (roleId: string, resource: string) => {
    const allChecked = ACTIONS.every((a) => hasPermission(roleId, resource, a));
    setEditedPermissions((prev) => {
      const perms = [...(prev[roleId] || [])].filter((p) => p.resource !== resource);
      if (!allChecked) {
        perms.push({ resource, actions: [...ACTIONS] });
      }
      return { ...prev, [roleId]: perms };
    });
  };

  const toggleAllForAction = (roleId: string, action: string) => {
    const allChecked = RESOURCES.every((r) => hasPermission(roleId, r, action));
    setEditedPermissions((prev) => {
      const perms = [...(prev[roleId] || [])];
      RESOURCES.forEach((resource) => {
        const idx = perms.findIndex((p) => p.resource === resource);
        if (idx >= 0) {
          let actions = [...perms[idx].actions];
          if (allChecked) {
            actions = actions.filter((a) => a !== action);
          } else if (!actions.includes(action)) {
            actions.push(action);
          }
          if (actions.length === 0) {
            perms.splice(idx, 1);
          } else {
            perms[idx] = { ...perms[idx], actions };
          }
        } else if (!allChecked) {
          perms.push({ resource, actions: [action] });
        }
      });
      return { ...prev, [roleId]: perms };
    });
  };

  const saveRole = async (role: Role) => {
    setSaving(true);
    try {
      await fetch("/api/admin/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: role._id,
          name: role.name,
          description: role.description,
          permissions: editedPermissions[role._id] || [],
        }),
      });
      setSuccessMessage(`Permissions for "${role.name}" saved successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchRoles();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const createRole = async () => {
    if (!newRole.name.trim()) return;
    try {
      await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });
      setShowCreateModal(false);
      setNewRole({ name: "", description: "" });
      fetchRoles();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await fetch(`/api/admin/roles?id=${id}`, { method: "DELETE" });
      fetchRoles();
    } catch (e) {
      console.error(e);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(99,102,241,0.2)",
            borderTop: "3px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Success Toast */}
      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: 90,
            right: 32,
            background: "rgba(34,197,94,0.15)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 12,
            padding: "12px 20px",
            color: "#4ade80",
            fontSize: 14,
            fontWeight: 500,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <Check size={16} /> {successMessage}
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }`}</style>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
            Permission Matrix
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 4 }}>
            Configure role-based access controls across all resources
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <Plus size={18} />
          Create Role
        </button>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: 12,
          padding: "14px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#818cf8",
          fontSize: 13,
        }}
      >
        <Info size={16} />
        Click on any cell to toggle permission. Use the column/row headers to toggle all at once.
        Don&apos;t forget to save after making changes.
      </div>

      {/* Role Cards with Permission Matrices */}
      {roles.length === 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "60px 32px",
            textAlign: "center",
          }}
        >
          <Shield size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>
            No roles defined yet. Create your first role to get started.
          </p>
        </div>
      ) : (
        roles.map((role) => {
          const isExpanded = expandedRole === role._id;
          const permCount = (editedPermissions[role._id] || []).reduce(
            (acc, p) => acc + p.actions.length,
            0
          );

          return (
            <div
              key={role._id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: isExpanded
                  ? "1px solid rgba(99,102,241,0.2)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                marginBottom: 16,
                overflow: "hidden",
                transition: "border-color 0.2s ease",
              }}
            >
              {/* Role Header */}
              <div
                onClick={() => setExpandedRole(isExpanded ? null : role._id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 24px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Shield size={20} color="#818cf8" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 16,
                          textTransform: "capitalize",
                        }}
                      >
                        {role.name}
                      </span>
                      {role.isSystem && (
                        <span
                          style={{
                            background: "rgba(245,158,11,0.12)",
                            color: "#fbbf24",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          SYSTEM
                        </span>
                      )}
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                      {role.description || "No description"} · {permCount} permissions
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!role.isSystem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRole(role._id);
                      }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: "1px solid rgba(239,68,68,0.2)",
                        background: "rgba(239,68,68,0.06)",
                        color: "#f87171",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp size={20} color="rgba(255,255,255,0.4)" />
                  ) : (
                    <ChevronDown size={20} color="rgba(255,255,255,0.4)" />
                  )}
                </div>
              </div>

              {/* Permission Matrix */}
              {isExpanded && (
                <div style={{ padding: "0 24px 24px" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "12px 14px",
                              color: "rgba(255,255,255,0.4)",
                              fontWeight: 500,
                              fontSize: 12,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                              minWidth: 140,
                            }}
                          >
                            Resource
                          </th>
                          {ACTIONS.map((action) => (
                            <th
                              key={action}
                              onClick={() => toggleAllForAction(role._id, action)}
                              style={{
                                textAlign: "center",
                                padding: "12px 14px",
                                color: actionColors[action],
                                fontWeight: 600,
                                fontSize: 12,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                cursor: "pointer",
                                minWidth: 80,
                              }}
                            >
                              {action}
                            </th>
                          ))}
                          <th
                            style={{
                              textAlign: "center",
                              padding: "12px 14px",
                              color: "rgba(255,255,255,0.3)",
                              fontWeight: 500,
                              fontSize: 12,
                              textTransform: "uppercase",
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                              cursor: "pointer",
                            }}
                          >
                            All
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {RESOURCES.map((resource) => (
                          <tr
                            key={resource}
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                          >
                            <td
                              style={{
                                padding: "12px 14px",
                                color: "rgba(255,255,255,0.8)",
                                fontSize: 14,
                                textTransform: "capitalize",
                                fontWeight: 500,
                              }}
                            >
                              {resource.replace("_", " ")}
                            </td>
                            {ACTIONS.map((action) => {
                              const checked = hasPermission(role._id, resource, action);
                              return (
                                <td
                                  key={action}
                                  onClick={() => togglePermission(role._id, resource, action)}
                                  style={{
                                    textAlign: "center",
                                    padding: "12px 14px",
                                    cursor: "pointer",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: 6,
                                      border: checked
                                        ? `2px solid ${actionColors[action]}`
                                        : "2px solid rgba(255,255,255,0.1)",
                                      background: checked
                                        ? `${actionColors[action]}20`
                                        : "transparent",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      margin: "0 auto",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    {checked && (
                                      <Check size={14} color={actionColors[action]} />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td
                              onClick={() => toggleAllForResource(role._id, resource)}
                              style={{
                                textAlign: "center",
                                padding: "12px 14px",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  border: ACTIONS.every((a) =>
                                    hasPermission(role._id, resource, a)
                                  )
                                    ? "2px solid #8b5cf6"
                                    : "2px solid rgba(255,255,255,0.1)",
                                  background: ACTIONS.every((a) =>
                                    hasPermission(role._id, resource, a)
                                  )
                                    ? "rgba(139,92,246,0.2)"
                                    : "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  margin: "0 auto",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {ACTIONS.every((a) =>
                                  hasPermission(role._id, resource, a)
                                ) && <Check size={14} color="#8b5cf6" />}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Save Button */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 16,
                    }}
                  >
                    <button
                      onClick={() => saveRole(role)}
                      disabled={saving}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 24px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      <Save size={16} />
                      {saving ? "Saving..." : "Save Permissions"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 32,
              width: 460,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 600, margin: 0 }}>
                Create New Role
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 6 }}>
                Role Name
              </label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="e.g., editor, analyst, support"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Brief description of this role's purpose..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <button
              onClick={createRole}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Create Role
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
