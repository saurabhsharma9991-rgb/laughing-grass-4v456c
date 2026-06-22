"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError } from "@/lib/client/alerts";
import { resizeImageFile } from "@/lib/client/resize-image";
import TagInput from "../TagInput";
import AttorneyCard from "../AttorneyCard";
import Avatar from "../Avatar";

const AVAILABILITY_OPTIONS = [
  "Available now",
  "Avail. in 3 days",
  "Avail. in 5 days",
  "2 wk wait",
];

export default function ProfileEditor({ user, setUser }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newSlotDate, setNewSlotDate] = useState("");

  useEffect(() => {
    authFetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setForm({
            name: data.name || "",
            location: data.location || "",
            experienceYears: data.experienceYears ?? "",
            rate: data.rate || "",
            availability: data.availability || data.avail || "Available now",
            bio: data.bio || "",
            barNumber: data.barNumber || "",
            stateBar: data.stateBar || "",
            specialties: data.specialties || [],
            languages: data.languages || [],
            photoUrl: data.photoUrl || "",
            availabilitySlots: Array.isArray(data.availabilitySlots) ? data.availabilitySlots : [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-muted text-sm">Loading your profile…</div>;
  }
  if (!form) {
    return <div className="text-center py-12 text-muted text-sm">Profile not found.</div>;
  }

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Please choose a JPEG or PNG image.");
      return;
    }
    if (file.size > 5_000_000) {
      toastError("Please choose an image under 5MB.");
      return;
    }
    try {
      const dataUrl = await resizeImageFile(file);
      if (dataUrl.length > 500_000) {
        toastError("Image is still too large after compression. Try a smaller photo.");
        return;
      }
      set("photoUrl", dataUrl);
    } catch {
      toastError("Could not process that image. Try a different file.");
    }
  };

  const addSlot = () => {
    if (!newSlotDate) return;
    if (form.availabilitySlots.some((s) => (s.date || s) === newSlotDate)) return;
    set("availabilitySlots", [...form.availabilitySlots, { date: newSlotDate, note: "Available" }]);
    setNewSlotDate("");
  };

  const removeSlot = (date) => {
    set(
      "availabilitySlots",
      form.availabilitySlots.filter((s) => (s.date || s) !== date)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await authFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        toastError(data.error.message || "Failed to save.");
      } else {
        setMessage("Profile saved successfully.");
        if (setUser) {
          setUser({
            ...user,
            user_metadata: {
              ...user.user_metadata,
              full_name: data.name,
              bar_number: data.barNumber,
              bar_state: data.stateBar,
            },
          });
        }
      }
    } catch {
      setMessage("Connection error.");
    } finally {
      setSaving(false);
    }
  };

  const previewCard = {
    id: 0,
    initials: form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    bg: "#E1F5EE",
    fg: "#085041",
    photoUrl: form.photoUrl,
    name: form.name,
    location: form.location,
    exp: `${form.experienceYears || 0} yrs`,
    tags: [...form.specialties, ...form.languages],
    avail: form.availability,
    dot: "#0F6E56",
    stars: "5.0",
    reviews: 0,
    rate: form.rate,
  };

  return (
    <div>
      <h2 className="font-syne text-lg font-bold text-text border-b border-[rgba(0,0,0,0.09)] pb-2.5 mb-6">
        Edit your public profile
      </h2>
      <p className="text-xs text-muted mb-6">
        These details appear on your public profile, Find Attorneys, Network, and AI Matcher results.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text block mb-2">Profile photo</label>
            <div className="flex items-center gap-4">
              <Avatar
                initials={previewCard.initials}
                photoUrl={form.photoUrl}
                size="lg"
              />
              <div>
                <input type="file" accept="image/*" onChange={handlePhoto} className="text-xs" />
                {form.photoUrl && (
                  <button
                    type="button"
                    onClick={() => set("photoUrl", "")}
                    className="block mt-1 text-xs text-red bg-transparent border-none cursor-pointer"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {[
            ["Full name", "name"],
            ["Location", "location"],
            ["Rate", "rate"],
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

          <div>
            <label className="text-xs font-semibold text-text block mb-1">Years of experience</label>
            <input
              type="number"
              min="0"
              value={form.experienceYears}
              onChange={(e) => set("experienceYears", e.target.value)}
              className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent focus:outline-none focus:border-green"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text block mb-1">General availability</label>
            <select
              value={form.availability}
              onChange={(e) => set("availability", e.target.value)}
              className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent"
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text block mb-1">Availability calendar</label>
            <p className="text-[10px] text-muted mb-2">Add dates when you are available for hearings or coverage.</p>
            <div className="flex gap-2 mb-2">
              <input
                type="date"
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
                className="text-sm py-2 px-3 border rounded-lg flex-1"
              />
              <button
                type="button"
                onClick={addSlot}
                className="text-xs bg-green text-white px-3 rounded-lg border-none cursor-pointer font-semibold"
              >
                Add date
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.availabilitySlots.map((slot) => {
                const d = slot.date || slot;
                return (
                  <span
                    key={d}
                    className="text-xs bg-bg border px-2 py-1 rounded-lg flex items-center gap-1"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => removeSlot(d)}
                      className="text-red bg-transparent border-none cursor-pointer text-sm leading-none"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <TagInput
            label="Specialties"
            value={form.specialties}
            onChange={(v) => set("specialties", v)}
            placeholder="Removal defense, Asylum, H-1B…"
          />
          <TagInput
            label="Languages"
            value={form.languages}
            onChange={(v) => set("languages", v)}
            placeholder="Spanish, Mandarin…"
          />

          <div>
            <label className="text-xs font-semibold text-text block mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent min-h-[72px] focus:outline-none focus:border-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 opacity-70">
            <div>
              <label className="text-xs text-muted block mb-1">Bar number (read-only)</label>
              <input value={form.barNumber} disabled className="w-full text-sm py-2 px-3 border rounded-lg bg-bg" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">State bar (read-only)</label>
              <input value={form.stateBar} disabled className="w-full text-sm py-2 px-3 border rounded-lg bg-bg" />
            </div>
          </div>

          {message && (
            <div className={`text-xs p-2.5 rounded-lg ${message.includes("success") ? "bg-green-light text-green-dark" : "bg-red-light text-red"}`}>
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-green hover:bg-green-dark text-white py-2.5 px-6 rounded-lg border-none text-sm font-semibold cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
            How you appear on the directory
          </div>
          <AttorneyCard a={previewCard} />
        </div>
      </div>
    </div>
  );
}
