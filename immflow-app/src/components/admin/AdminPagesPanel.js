"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { confirmDialog, toastError, toastSuccess } from "@/lib/client/alerts";
import { FOOTER_COLUMNS } from "@/lib/constants/cms-pages";
import { createEmptyDocument, serializePageDocument } from "@/lib/utils/cms-page-document";
import PageBlockEditor from "@/components/admin/PageBlockEditor";

const emptyForm = () => ({
  title: "",
  slug: "",
  excerpt: "",
  body: serializePageDocument(createEmptyDocument({ mode: "blocks" })),
  footerColumn: "company",
  showInFooter: true,
  showInNav: false,
  footerSort: 50,
  navSort: 50,
  isPublished: true,
  translations: {
    es: { title: "", excerpt: "", body: "" },
    hi: { title: "", excerpt: "", body: "" },
    ru: { title: "", excerpt: "", body: "" },
    zh: { title: "", excerpt: "", body: "" },
  },
});

export default function AdminPagesPanel({ canCreate, canEdit, canDelete }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/pages")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPages(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || form.title,
      };
      delete payload.translations;
      const res = await authFetch("/api/admin/pages", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess(editingId ? "Page updated." : "Page created.");
        resetForm();
        load();
      }
    } catch {
      toastError("Failed to save page.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (page) => {
    setEditingId(page.id);
    setForm({
      title: page.title || "",
      slug: page.slug || "",
      excerpt: page.excerpt || "",
      body: page.body || serializePageDocument(createEmptyDocument()),
      footerColumn: page.footerColumn || "company",
      showInFooter: Boolean(page.showInFooter),
      showInNav: Boolean(page.showInNav),
      footerSort: page.footerSort ?? 50,
      navSort: page.navSort ?? 50,
      isPublished: Boolean(page.isPublished),
      translations: {
        es: { title: "", excerpt: "", body: "", ...(page.translations?.es || {}) },
        hi: { title: "", excerpt: "", body: "", ...(page.translations?.hi || {}) },
        ru: { title: "", excerpt: "", body: "", ...(page.translations?.ru || {}) },
        zh: { title: "", excerpt: "", body: "", ...(page.translations?.zh || {}) },
      },
    });
  };

  const remove = async (id) => {
    const ok = await confirmDialog({
      title: "Delete page",
      message: "Delete this page? It will be removed from the footer and menu immediately.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await authFetch(`/api/admin/pages?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess("Page deleted.");
        if (editingId === id) resetForm();
        load();
      }
    } catch {
      toastError("Failed to delete page.");
    }
  };

  const canSave = (editingId && canEdit) || (!editingId && canCreate);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-syne text-lg font-bold text-text">
              {editingId ? "Edit page" : "New page"}
            </h2>
            <p className="text-xs text-muted mt-1">
              Build pages from pre-made sections, or switch to free-hand HTML for full control.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-muted hover:text-text bg-transparent border-none cursor-pointer"
            >
              Cancel edit
            </button>
          )}
        </div>

        {(canCreate || canEdit) && (
          <form onSubmit={save} className="space-y-4">
            <p className="text-[11px] text-muted leading-relaxed">
              Write the page in English. Other languages are translated automatically for visitors.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-muted">
                    Title
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setField("title", e.target.value)}
                      className="mt-1 w-full text-sm border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-muted">
                    URL slug
                    <input
                      value={form.slug}
                      onChange={(e) => setField("slug", e.target.value)}
                      placeholder="about"
                      className="mt-1 w-full text-sm border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2 font-mono"
                    />
                    <span className="text-[11px] text-muted font-normal mt-1 block">
                      Public URL: /pages/{form.slug || "your-slug"}
                    </span>
                  </label>
                </div>
                <label className="block text-xs font-semibold text-muted">
                  Short excerpt
                  <input
                    value={form.excerpt}
                    onChange={(e) => setField("excerpt", e.target.value)}
                    className="mt-1 w-full text-sm border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2"
                  />
                </label>

                <div>
                  <div className="text-xs font-semibold text-muted mb-2">Page content</div>
                  <PageBlockEditor
                    value={form.body}
                    onChange={(body) => setField("body", body)}
                  />
                </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <label className="block text-xs font-semibold text-muted">
                Footer column
                <select
                  value={form.footerColumn || "company"}
                  onChange={(e) => setField("footerColumn", e.target.value)}
                  className="mt-1 w-full text-sm border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2 bg-white"
                >
                  {FOOTER_COLUMNS.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-muted">
                Footer sort
                <input
                  type="number"
                  value={form.footerSort}
                  onChange={(e) => setField("footerSort", Number(e.target.value))}
                  className="mt-1 w-full text-sm border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2"
                />
              </label>
              <label className="block text-xs font-semibold text-muted">
                Nav sort
                <input
                  type="number"
                  value={form.navSort}
                  onChange={(e) => setField("navSort", Number(e.target.value))}
                  className="mt-1 w-full text-sm border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-text pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showInFooter}
                  onChange={(e) => setField("showInFooter", e.target.checked)}
                />
                Show in footer
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showInNav}
                  onChange={(e) => setField("showInNav", e.target.checked)}
                />
                Show in top menu
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setField("isPublished", e.target.checked)}
                />
                Published
              </label>
            </div>

            {canSave && (
              <button
                type="submit"
                disabled={saving}
                className="bg-green hover:bg-green-dark text-white text-sm font-medium py-2.5 px-5 rounded-lg border-none cursor-pointer disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Update page" : "Create page"}
              </button>
            )}
          </form>
        )}
      </div>

      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 shadow-sm">
        <h2 className="font-syne text-lg font-bold text-text mb-4">All pages</h2>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : pages.length === 0 ? (
          <p className="text-sm text-muted">
            No pages yet. Create About, Terms, Pricing, or any custom page with sections.
          </p>
        ) : (
          <ul className="space-y-3">
            {pages.map((page) => (
              <li
                key={page.id}
                className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-text truncate">{page.title}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    /pages/{page.slug}
                    {page.isPublished ? " · published" : " · draft"}
                    {page.showInFooter ? ` · footer (${page.footerColumn || "company"})` : ""}
                    {page.showInNav ? " · menu" : ""}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a
                    href={page.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-green hover:underline no-underline py-1.5 px-2"
                  >
                    View
                  </a>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => startEdit(page)}
                      className="text-xs bg-bg border border-[rgba(0,0,0,0.1)] rounded-md px-2.5 py-1.5 cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => remove(page.id)}
                      className="text-xs text-red bg-transparent border border-red/30 rounded-md px-2.5 py-1.5 cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
