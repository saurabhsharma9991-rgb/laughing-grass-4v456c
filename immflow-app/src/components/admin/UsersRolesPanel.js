"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { ADMIN_RESOURCES, emptyPermissions } from "@/lib/constants/admin-permissions";

function PermissionMatrix({ permissions, onChange, readOnly = false }) {
  const toggle = (resource, action) => {
    if (readOnly) return;
    onChange({
      ...permissions,
      [resource]: {
        ...permissions[resource],
        [action]: !permissions[resource]?.[action],
      },
    });
  };

  const toggleResource = (resource, checked) => {
    if (readOnly) return;
    const next = { ...permissions, [resource]: { ...permissions[resource] } };
    for (const action of ADMIN_RESOURCES[resource].actions) {
      next[resource][action] = checked;
    }
    onChange(next);
  };

  return (
    <div className="overflow-x-auto border border-[rgba(0,0,0,0.09)] rounded-lg">
      <table className="w-full text-xs border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-bg/80 text-muted text-left">
            <th className="p-2.5 pl-3 font-semibold">Resource</th>
            {["view", "create", "edit", "delete"].map((action) => (
              <th key={action} className="p-2.5 text-center font-semibold capitalize w-16">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(ADMIN_RESOURCES).map(([key, meta]) => (
            <tr key={key} className="border-t border-[rgba(0,0,0,0.07)]">
              <td className="p-2.5 pl-3">
                <div className="font-semibold text-text">{meta.label}</div>
                <div className="text-[10px] text-muted-high mt-0.5">{meta.description}</div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const allOn = meta.actions.every((a) => permissions[key]?.[a]);
                      toggleResource(key, !allOn);
                    }}
                    className="mt-1 text-[10px] text-green bg-transparent border-none cursor-pointer hover:underline p-0"
                  >
                    Toggle all
                  </button>
                )}
              </td>
              {["view", "create", "edit", "delete"].map((action) => (
                <td key={action} className="p-2.5 text-center">
                  {meta.actions.includes(action) ? (
                    <input
                      type="checkbox"
                      checked={Boolean(permissions[key]?.[action])}
                      disabled={readOnly}
                      onChange={() => toggle(key, action)}
                      className="w-3.5 h-3.5 accent-green cursor-pointer disabled:cursor-not-allowed"
                    />
                  ) : (
                    <span className="text-muted-high">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserFormModal({ user, roles, onClose, onSave, saving, canEdit }) {
  const [email, setEmail] = useState(user?.email || "");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [password, setPassword] = useState("");
  const [adminRoleId, setAdminRoleId] = useState(user?.adminRoleId || roles[0]?.id || "");

  const isNew = !user?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { email, displayName, adminRoleId: Number(adminRoleId) };
    if (password) payload.password = password;
    if (isNew && !password) {
      alert("Password is required for new users.");
      return;
    }
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-syne text-lg font-bold text-text mb-4">
          {isNew ? "Add admin user" : "Edit admin user"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!canEdit}
              className="w-full text-sm p-2.5 border rounded-lg disabled:bg-bg"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text block mb-1">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!canEdit}
              placeholder="Optional"
              className="w-full text-sm p-2.5 border rounded-lg disabled:bg-bg"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text block mb-1">
              {isNew ? "Password" : "New password (leave blank to keep)"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isNew}
              disabled={!canEdit}
              className="w-full text-sm p-2.5 border rounded-lg disabled:bg-bg"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text block mb-1">Role</label>
            <select
              value={adminRoleId}
              onChange={(e) => setAdminRoleId(e.target.value)}
              disabled={!canEdit}
              className="w-full text-sm p-2.5 border rounded-lg disabled:bg-bg"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.isSystem ? " (system)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg cursor-pointer bg-white"
            >
              Cancel
            </button>
            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-green text-white rounded-lg border-none cursor-pointer disabled:opacity-60"
              >
                {saving ? "Saving…" : isNew ? "Create user" : "Save changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleFormModal({ role, onClose, onSave, saving, canEdit }) {
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [permissions, setPermissions] = useState(role?.permissions || emptyPermissions());
  const isNew = !role?.id;
  const isSystem = role?.isSystem;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, description, permissions });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-8">
        <h3 className="font-syne text-lg font-bold text-text mb-1">
          {isNew ? "Create role" : `Edit role: ${role.name}`}
        </h3>
        {isSystem && (
          <p className="text-xs text-amber mb-4">
            System role — name and description can be edited; permissions are fixed.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text block mb-1">Role name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                className="w-full text-sm p-2.5 border rounded-lg disabled:bg-bg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text block mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                placeholder="Optional"
                className="w-full text-sm p-2.5 border rounded-lg disabled:bg-bg"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text block mb-2">Permissions</label>
            <PermissionMatrix
              permissions={permissions}
              onChange={setPermissions}
              readOnly={!canEdit || isSystem}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg cursor-pointer bg-white"
            >
              Cancel
            </button>
            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-green text-white rounded-lg border-none cursor-pointer disabled:opacity-60"
              >
                {saving ? "Saving…" : isNew ? "Create role" : "Save role"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersRolesPanel({ can, currentUserId }) {
  const [subTab, setSubTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [showNewUser, setShowNewUser] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);

  const canUsers = {
    view: can("users", "view"),
    create: can("users", "create"),
    edit: can("users", "edit"),
    delete: can("users", "delete"),
  };
  const canRoles = {
    view: can("roles", "view"),
    create: can("roles", "create"),
    edit: can("roles", "edit"),
    delete: can("roles", "delete"),
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetches = [];
      if (canUsers.view) fetches.push(authFetch("/api/admin/users").then((r) => r.json()));
      else fetches.push(Promise.resolve([]));
      if (canRoles.view) fetches.push(authFetch("/api/admin/roles").then((r) => r.json()));
      else fetches.push(Promise.resolve([]));

      const [usersData, rolesData] = await Promise.all(fetches);
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(rolesData)) setRoles(rolesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [canUsers.view, canRoles.view]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canUsers.view && canRoles.view) setSubTab("roles");
  }, [canUsers.view, canRoles.view]);

  const saveUser = async (payload) => {
    setSaving(true);
    try {
      const isNew = showNewUser;
      const url = isNew ? "/api/admin/users" : `/api/admin/users/${editingUser.id}`;
      const res = await authFetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.user) {
        setEditingUser(null);
        setShowNewUser(false);
        load();
      } else {
        alert(data.error?.message || "Failed to save user.");
      }
    } catch {
      alert("Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Remove this admin user? They will lose all admin access.")) return;
    try {
      const res = await authFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error?.message || "Failed to delete user.");
    } catch {
      alert("Failed to delete user.");
    }
  };

  const saveRole = async (payload) => {
    setSaving(true);
    try {
      const isNew = showNewRole;
      const url = isNew ? "/api/admin/roles" : `/api/admin/roles/${editingRole.id}`;
      const res = await authFetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.role) {
        setEditingRole(null);
        setShowNewRole(false);
        load();
      } else {
        alert(data.error?.message || "Failed to save role.");
      }
    } catch {
      alert("Failed to save role.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (id) => {
    if (!confirm("Delete this role? It must have no assigned users.")) return;
    try {
      const res = await authFetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error?.message || "Failed to delete role.");
    } catch {
      alert("Failed to delete role.");
    }
  };

  if (!canUsers.view && !canRoles.view) {
    return (
      <div className="text-center py-16 text-muted">
        You do not have permission to manage users or roles.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-syne text-2xl font-extrabold text-text">Users &amp; roles</h1>
          <p className="text-sm text-muted mt-1">
            Add employee accounts and control what each role can view, create, edit, and delete.
          </p>
        </div>
        <div className="flex gap-2">
          {canUsers.view && canRoles.view && (
            <>
              <button
                type="button"
                onClick={() => setSubTab("users")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer ${
                  subTab === "users" ? "bg-green text-white" : "bg-bg text-muted"
                }`}
              >
                Users
              </button>
              <button
                type="button"
                onClick={() => setSubTab("roles")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer ${
                  subTab === "roles" ? "bg-green text-white" : "bg-bg text-muted"
                }`}
              >
                Roles
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted">Loading…</div>
      ) : subTab === "users" && canUsers.view ? (
        <div>
          {canUsers.create && (
            <button
              type="button"
              onClick={() => setShowNewUser(true)}
              className="mb-4 bg-green text-white text-sm py-2 px-4 rounded-lg border-none cursor-pointer font-semibold"
            >
              + Add admin user
            </button>
          )}
          <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-bg/50 text-muted text-left border-b">
                  <th className="p-3 pl-4 font-semibold">User</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Access</th>
                  <th className="p-3 pr-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[rgba(0,0,0,0.07)]">
                    <td className="p-3 pl-4">
                      <div className="font-semibold text-text">{u.displayName || u.email}</div>
                      <div className="text-[10px] text-muted">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-bg text-[11px] font-medium">
                        {u.adminRole?.name || (u.isSuperAdmin ? "Super admin" : "—")}
                      </span>
                    </td>
                    <td className="p-3 text-muted-high">
                      {u.isSuperAdmin ? "Full access" : "Role-based"}
                    </td>
                    <td className="p-3 pr-4 text-right space-x-2">
                      {canUsers.edit && (
                        <button
                          type="button"
                          onClick={() => setEditingUser(u)}
                          className="text-green bg-transparent border-none cursor-pointer text-[11px] font-semibold"
                        >
                          Edit
                        </button>
                      )}
                      {canUsers.delete && u.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => deleteUser(u.id)}
                          className="text-red bg-transparent border-none cursor-pointer text-[11px] font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-10 text-muted text-sm">No admin users yet.</div>
            )}
          </div>
        </div>
      ) : canRoles.view ? (
        <div>
          {canRoles.create && (
            <button
              type="button"
              onClick={() => setShowNewRole(true)}
              className="mb-4 bg-green text-white text-sm py-2 px-4 rounded-lg border-none cursor-pointer font-semibold"
            >
              + Create role
            </button>
          )}
          <div className="grid gap-4">
            {roles.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4 flex flex-wrap items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-syne font-bold text-text">{r.name}</h3>
                    {r.isSystem && (
                      <span className="text-[10px] bg-amber-light text-amber px-1.5 py-0.5 rounded font-semibold">
                        System
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted mt-1">{r.description}</p>
                  )}
                  <p className="text-[10px] text-muted-high mt-2">
                    {r.userCount ?? 0} user{(r.userCount ?? 0) !== 1 ? "s" : ""} assigned
                  </p>
                </div>
                <div className="flex gap-2">
                  {(canRoles.edit || canRoles.view) && (
                    <button
                      type="button"
                      onClick={() => setEditingRole(r)}
                      className="text-sm text-green bg-transparent border border-green py-1.5 px-3 rounded-lg cursor-pointer font-semibold"
                    >
                      {canRoles.edit ? "Edit" : "View"}
                    </button>
                  )}
                  {canRoles.delete && !r.isSystem && (r.userCount ?? 0) === 0 && (
                    <button
                      type="button"
                      onClick={() => deleteRole(r.id)}
                      className="text-sm text-red bg-transparent border border-red py-1.5 px-3 rounded-lg cursor-pointer font-semibold"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(showNewUser || editingUser) && (
        <UserFormModal
          user={editingUser}
          roles={roles}
          onClose={() => {
            setShowNewUser(false);
            setEditingUser(null);
          }}
          onSave={saveUser}
          saving={saving}
          canEdit={showNewUser ? canUsers.create : canUsers.edit}
        />
      )}
      {(showNewRole || editingRole) && (
        <RoleFormModal
          role={editingRole}
          onClose={() => {
            setShowNewRole(false);
            setEditingRole(null);
          }}
          onSave={saveRole}
          saving={saving}
          canEdit={showNewRole ? canRoles.create : canRoles.edit}
        />
      )}
    </div>
  );
}
