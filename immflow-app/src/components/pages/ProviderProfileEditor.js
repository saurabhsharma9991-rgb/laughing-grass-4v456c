"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { resizeImageFile } from "@/lib/client/resize-image";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import DynamicProfileFields from "@/components/DynamicProfileFields";

const emptyCredential = {
  label: "",
  organization: "",
  credentialNumber: "",
  expiresAt: "",
};

export default function ProviderProfileEditor() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [credentialsDirty, setCredentialsDirty] = useState(false);

  useEffect(() => {
    authFetch("/api/providers/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return toastError(data.error.message);
        setProfile(data);
        setForm({
          displayName: data.displayName || "",
          bio: data.bio || "",
          location: data.location || "",
          experienceYears: data.experienceYears ?? "",
          rate: data.rate || "",
          availability: data.availability || "",
          remoteAvailable: data.remoteAvailable !== false,
          inPersonAvailable: Boolean(data.inPersonAvailable),
          languages: (data.languages || []).join(", "),
          languagePairs:
            data.languagePairs?.length > 0
              ? data.languagePairs.map((p) => ({
                  source: p.source,
                  target: p.target,
                }))
              : [{ source: "", target: "" }],
          availabilitySlots: Array.isArray(data.availabilitySlots)
            ? data.availabilitySlots.join(", ")
            : "",
          photoUrl: data.photoUrl || "",
          profileData: data.profileData || {},
          credentials: (data.credentials || []).map((c) => ({
            id: c.id,
            label: c.label,
            organization: c.organization || "",
            credentialNumber: c.credentialNumber || "",
            expiresAt: c.expiresAt
              ? new Date(c.expiresAt).toISOString().slice(0, 10)
              : "",
            status: c.status,
          })),
        });
      })
      .catch(() => toastError("Failed to load provider profile."));
  }, []);

  if (!form || !profile) {
    return <div className="py-8 text-sm text-muted">Loading provider profile…</div>;
  }

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/providers/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          credentials: credentialsDirty ? form.credentials : undefined,
          languages: form.languages
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          availabilitySlots: form.availabilitySlots
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          languagePairs: form.languagePairs,
        }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        setProfile(data);
        setCredentialsDirty(false);
        toastSuccess(
          form.credentials.length
            ? "Profile saved. Credential changes await admin verification."
            : "Profile saved."
        );
      }
    } catch {
      toastError("Failed to save provider profile.");
    } finally {
      setSaving(false);
    }
  };

  const setPair = (index, key, value) => {
    const languagePairs = [...form.languagePairs];
    languagePairs[index] = { ...languagePairs[index], [key]: value };
    setForm({ ...form, languagePairs });
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div>
        <h2 className="font-syne text-lg font-bold text-text">Provider profile</h2>
        <p className="text-xs text-muted mt-1">
          {profile.categoryName} · Verification: {profile.verificationStatus}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {form.photoUrl ? (
          <img
            src={form.photoUrl}
            alt=""
            className="w-20 h-20 rounded-full object-cover border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-bg grid place-items-center font-bold">
            {profile.initials}
          </div>
        )}
        <label className="text-xs font-semibold text-green cursor-pointer">
          Upload photo/logo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const photoUrl = await resizeImageFile(file);
                setForm({ ...form, photoUrl });
              } catch {
                toastError("Could not process image.");
              }
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          ["displayName", "Name / company"],
          ["location", "Location"],
          ["experienceYears", "Years of experience", "number"],
          ["rate", "Pricing / rate"],
          ["availability", "Availability summary"],
        ].map(([key, label, type = "text"]) => (
          <label key={key} className="text-xs">
            <span className="font-medium text-muted">{label}</span>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="mt-1 w-full text-sm p-2.5 border rounded-lg"
            />
          </label>
        ))}
        <label className="text-xs sm:col-span-2">
          <span className="font-medium text-muted">About</span>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="mt-1 w-full text-sm p-2.5 border rounded-lg"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="font-medium text-muted">
            Service languages (comma separated)
          </span>
          <input
            value={form.languages}
            onChange={(e) => setForm({ ...form, languages: e.target.value })}
            className="mt-1 w-full text-sm p-2.5 border rounded-lg"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="font-medium text-muted">
            Available dates/times (comma separated ISO dates)
          </span>
          <input
            value={form.availabilitySlots}
            onChange={(e) =>
              setForm({ ...form, availabilitySlots: e.target.value })
            }
            className="mt-1 w-full text-sm p-2.5 border rounded-lg"
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.remoteAvailable}
            onChange={(e) =>
              setForm({ ...form, remoteAvailable: e.target.checked })
            }
          />
          Remote available
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.inPersonAvailable}
            onChange={(e) =>
              setForm({ ...form, inPersonAvailable: e.target.checked })
            }
          />
          In-person available
        </label>
      </div>

      <div>
        <div className="text-xs font-semibold text-muted mb-2">Language pairs</div>
        <div className="space-y-2">
          {form.languagePairs.map((pair, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                value={pair.source}
                onChange={(e) => setPair(index, "source", e.target.value)}
                placeholder="Source"
                className="text-sm p-2.5 border rounded-lg"
              />
              <input
                value={pair.target}
                onChange={(e) => setPair(index, "target", e.target.value)}
                placeholder="Target"
                className="text-sm p-2.5 border rounded-lg"
              />
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    languagePairs: form.languagePairs.filter((_, i) => i !== index),
                  })
                }
                className="text-red text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setForm({
              ...form,
              languagePairs: [...form.languagePairs, { source: "", target: "" }],
            })
          }
          className="text-xs text-green font-semibold mt-2"
        >
          Add language pair
        </button>
      </div>

      <div>
        <div className="text-xs font-semibold text-muted mb-2">
          Category-specific details
        </div>
        <DynamicProfileFields
          schema={profile.profileSchema}
          values={form.profileData}
          onChange={(profileData) => setForm({ ...form, profileData })}
        />
      </div>

      <div>
        <div className="text-xs font-semibold text-muted mb-2">Credentials</div>
        <div className="space-y-2">
          {form.credentials.map((credential, index) => (
            <div
              key={credential.id || index}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 border rounded-lg p-2"
            >
              {["label", "organization", "credentialNumber"].map((key) => (
                <input
                  key={key}
                  value={credential[key]}
                  placeholder={
                    key === "credentialNumber"
                      ? "Credential number"
                      : key[0].toUpperCase() + key.slice(1)
                  }
                  onChange={(e) => {
                    const credentials = [...form.credentials];
                    credentials[index] = {
                      ...credential,
                      [key]: e.target.value,
                    };
                    setForm({ ...form, credentials });
                    setCredentialsDirty(true);
                  }}
                  className="text-xs p-2 border rounded"
                />
              ))}
              <input
                type="date"
                value={credential.expiresAt || ""}
                onChange={(e) => {
                  const credentials = [...form.credentials];
                  credentials[index] = {
                    ...credential,
                    expiresAt: e.target.value,
                  };
                  setForm({ ...form, credentials });
                  setCredentialsDirty(true);
                }}
                className="text-xs p-2 border rounded"
              />
              {credential.status && (
                <span className="text-[10px] text-muted">
                  Current status: {credential.status}
                </span>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            {
              setForm({
                ...form,
                credentials: [...form.credentials, { ...emptyCredential }],
              });
              setCredentialsDirty(true);
            }
          }
          className="text-xs text-green font-semibold mt-2"
        >
          Add credential
        </button>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-green text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save provider profile"}
      </button>
    </form>
  );
}
