"use client";

import React, { useState, useEffect } from "react";
import TagInput from "../TagInput";
import { AttorneyPreviewCard } from "./CmsPreview";
import { parseJsonArray } from "@/lib/utils/json-fields";

const AVAILABILITY_OPTIONS = [
  "Available now",
  "Avail. in 3 days",
  "Avail. in 5 days",
  "2 wk wait",
  "1 wk wait",
];

export default function AttorneyEditorModal({ attorney, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (attorney) {
      setForm({
        name: attorney.name || "",
        location: attorney.location || "",
        experienceYears: attorney.experienceYears ?? "",
        rate: attorney.rate || "",
        availability: attorney.availability || "Available now",
        bio: attorney.bio || "",
        barNumber: attorney.barNumber || "",
        stateBar: attorney.stateBar || "",
        specialties: parseJsonArray(attorney.specialties),
        languages: parseJsonArray(attorney.languages),
        stars: attorney.stars ?? 5,
        reviewsCount: attorney.reviewsCount ?? 0,
        isVerified: attorney.isVerified ?? false,
      });
    }
  }, [attorney]);

  if (!attorney) return null;

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[rgba(0,0,0,0.09)] px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="font-syne text-lg font-bold text-text">Edit attorney profile</h2>
            <p className="text-xs text-muted">{attorney.user?.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text text-xl bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            {[
              ["Full name", "name", "text"],
              ["Location", "location", "text", "City, State"],
              ["Hourly / flat rate", "rate", "text", "$175/hr or $400 flat"],
              ["Bar number", "barNumber", "text"],
              ["State bar", "stateBar", "text", "CA, NY, TX…"],
            ].map(([label, key, type, ph]) => (
              <div key={key}>
                <label className="text-xs font-semibold text-text block mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={ph || ""}
                  className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent focus:outline-none focus:border-green"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text block mb-1">Experience (yrs)</label>
                <input
                  type="number"
                  min="0"
                  value={form.experienceYears}
                  onChange={(e) => set("experienceYears", e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent focus:outline-none focus:border-green"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text block mb-1">Rating</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.stars}
                  onChange={(e) => set("stars", e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent focus:outline-none focus:border-green"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text block mb-1">Availability</label>
              <select
                value={form.availability}
                onChange={(e) => set("availability", e.target.value)}
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent focus:outline-none focus:border-green"
              >
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <TagInput
              label="Specialties"
              value={form.specialties}
              onChange={(v) => set("specialties", v)}
              placeholder="Removal defense, Asylum, H-1B…"
              hint="Press Enter after each tag"
            />
            <TagInput
              label="Languages"
              value={form.languages}
              onChange={(v) => set("languages", v)}
              placeholder="Spanish, Mandarin, Hindi…"
            />

            <div>
              <label className="text-xs font-semibold text-text block mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={3}
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent focus:outline-none focus:border-green min-h-[72px]"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={(e) => set("isVerified", e.target.checked)}
                className="accent-green"
              />
              Verified attorney (visible on public directory)
            </label>
          </div>

          <AttorneyPreviewCard attorney={form} />
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[rgba(0,0,0,0.09)] px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg border border-[rgba(0,0,0,0.15)] text-sm cursor-pointer bg-transparent"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave({ id: attorney.id, ...form })}
            className="bg-green hover:bg-green-dark text-white py-2 px-5 rounded-lg border-none text-sm font-semibold cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save attorney"}
          </button>
        </div>
      </div>
    </div>
  );
}

function emptyForm() {
  return {
    name: "",
    location: "",
    experienceYears: "",
    rate: "",
    availability: "Available now",
    bio: "",
    barNumber: "",
    stateBar: "",
    specialties: [],
    languages: [],
    stars: 5,
    reviewsCount: 0,
    isVerified: false,
  };
}
