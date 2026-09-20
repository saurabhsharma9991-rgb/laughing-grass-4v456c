"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { confirmDialog, toastError, toastSuccess } from "@/lib/client/alerts";

export default function AdminCategoriesPanel({ canCreate, canEdit, canDelete }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    sortOrder: 0,
    isActive: true,
    profileSchema: JSON.stringify(
      { version: 1, workflow: "contact", fields: [] },
      null,
      2
    ),
  });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      icon: "",
      sortOrder: 0,
      isActive: true,
      profileSchema: JSON.stringify(
        { version: 1, workflow: "contact", fields: [] },
        null,
        2
      ),
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/categories", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess(editingId ? "Category updated." : "Category created.");
        resetForm();
        load();
      }
    } catch {
      toastError("Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      icon: c.icon || "",
      sortOrder: c.sortOrder || 0,
      isActive: c.isActive,
      profileSchema: JSON.stringify(
        c.profileSchema || { version: 1, workflow: "contact", fields: [] },
        null,
        2
      ),
    });
  };

  const remove = async (id) => {
    const ok = await confirmDialog({
      title: "Delete category",
      message: "Delete this category? Only allowed if it has no providers.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await authFetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess("Category deleted.");
        load();
      }
    } catch {
      toastError("Failed to delete category.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {(canCreate || canEdit) && (
        <form onSubmit={save} className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 space-y-3">
          <h2 className="font-syne text-sm font-bold text-text">
            {editingId ? "Edit category" : "Add category"}
          </h2>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="w-full text-sm p-2.5 border rounded-lg"
          />
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="Slug (optional — auto from name)"
            className="w-full text-sm p-2.5 border rounded-lg font-mono"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            rows={3}
            className="w-full text-sm p-2.5 border rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="Icon key"
              className="text-sm p-2.5 border rounded-lg"
            />
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              placeholder="Sort order"
              className="text-sm p-2.5 border rounded-lg"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active (visible on marketplace)
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1">
              Dynamic profile schema (JSON)
            </span>
            <textarea
              value={form.profileSchema}
              onChange={(e) =>
                setForm({ ...form, profileSchema: e.target.value })
              }
              rows={10}
              spellCheck={false}
              className="w-full text-xs font-mono p-2.5 border rounded-lg"
            />
            <span className="block text-[10px] text-muted mt-1">
              Workflow: contact, order, booking, or directory. Field types:
              text, textarea, number, boolean, date, select, multiselect,
              language_pairs.
            </span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || (editingId ? !canEdit : !canCreate)}
              className="bg-green text-white text-sm py-2 px-4 rounded-lg border-none cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-sm text-muted bg-transparent border-none cursor-pointer">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted text-sm">Loading…</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b bg-bg/50 text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Active</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-[rgba(0,0,0,0.06)]">
                  <td className="p-3">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-[10px] text-muted">{c.description}</div>
                  </td>
                  <td className="p-3 font-mono text-[11px]">{c.slug}</td>
                  <td className="p-3">{c.isActive ? "Yes" : "No"}</td>
                  <td className="p-3 text-right space-x-2">
                    {canEdit && (
                      <button type="button" onClick={() => startEdit(c)} className="text-green bg-transparent border-none cursor-pointer font-semibold">
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" onClick={() => remove(c.id)} className="text-red bg-transparent border-none cursor-pointer font-semibold">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
