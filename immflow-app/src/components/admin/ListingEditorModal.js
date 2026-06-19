"use client";

import React, { useState, useEffect } from "react";
import TagInput from "../TagInput";
import { ListingPreviewCard } from "./CmsPreview";
import { LISTING_TYPES } from "@/lib/constants/listing-types";
import { parseJsonArray } from "@/lib/utils/json-fields";

const BADGES = ["New", "Urgent", "Open", "Featured"];
const STATUSES = ["open", "filled", "closed"];

export default function ListingEditorModal({ listing, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (listing) {
      setForm({
        title: listing.title || "",
        org: listing.org || "",
        location: listing.location || "",
        type: listing.type || "One-time",
        badge: listing.badge || "New",
        pay: listing.pay || "",
        description: listing.description || "",
        status: listing.status || "open",
        tags: parseJsonArray(listing.tags),
      });
    }
  }, [listing]);

  if (!listing) return null;

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[rgba(0,0,0,0.09)] px-6 py-4 flex justify-between items-center z-10">
          <h2 className="font-syne text-lg font-bold text-text">Edit listing</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-text text-xl bg-transparent border-none cursor-pointer">×</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text block mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent focus:outline-none focus:border-green"
              />
            </div>
            {[
              ["Organization / firm", "org"],
              ["Location", "location"],
              ["Compensation", "pay"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs font-semibold text-text block mb-1">{label}</label>
                <input
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent focus:outline-none focus:border-green"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text block mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent"
                >
                  {LISTING_TYPES.map(({ label, value }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text block mb-1">Badge</label>
                <select
                  value={form.badge}
                  onChange={(e) => set("badge", e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent"
                >
                  {BADGES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <TagInput
              label="Tags"
              value={form.tags}
              onChange={(v) => set("tags", v)}
              placeholder="EOIR, Spanish required, Remote…"
              hint="Skills, requirements, case types — same as live site cards"
            />

            <div>
              <label className="text-xs font-semibold text-text block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent min-h-[88px] focus:outline-none focus:border-green"
              />
            </div>
          </div>

          <ListingPreviewCard listing={form} />
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[rgba(0,0,0,0.09)] px-6 py-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg border border-[rgba(0,0,0,0.15)] text-sm cursor-pointer bg-transparent">Cancel</button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave({ id: listing.id, ...form })}
            className="bg-green hover:bg-green-dark text-white py-2 px-5 rounded-lg border-none text-sm font-semibold cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

function emptyForm() {
  return {
    title: "",
    org: "",
    location: "",
    type: "One-time",
    badge: "New",
    pay: "",
    description: "",
    status: "open",
    tags: [],
  };
}
