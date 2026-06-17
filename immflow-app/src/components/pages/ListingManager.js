"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/client/auth-storage";

function ApplicationsPanel({ listingId, onClose, onUpdated }) {
  const [apps, setApps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState(null);

  const load = () => {
    setLoading(true);
    authFetch(`/api/applications?listingId=${listingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setApps(data);
      })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    load();
  }, [listingId]);

  const setStatus = async (appId, status) => {
    setActing(appId);
    try {
      const res = await authFetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.error) alert(data.error.message);
      else {
        load();
        onUpdated?.();
      }
    } catch {
      alert("Failed to update application.");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-syne font-bold text-text">Applications</h3>
          <button type="button" onClick={onClose} className="text-muted bg-transparent border-none cursor-pointer text-lg">
            ×
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : apps.length === 0 ? (
          <p className="text-sm text-muted">No applications yet.</p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {apps.map((app) => (
              <div key={app.id} className="border border-[rgba(0,0,0,0.09)] rounded-lg p-4">
                <div className="flex justify-between gap-2">
                  <div>
                    {app.applicant.attorneyId ? (
                      <Link
                        href={`/attorneys/${app.applicant.attorneyId}`}
                        className="font-semibold text-sm text-green hover:underline"
                      >
                        {app.applicant.name}
                      </Link>
                    ) : (
                      <div className="font-semibold text-sm">{app.applicant.name}</div>
                    )}
                    <div className="text-xs text-muted mt-0.5">
                      {app.applicant.location} · {app.applicant.rate} · ★ {app.applicant.stars}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase h-fit ${
                      app.status === "accepted"
                        ? "bg-green-light text-green-dark"
                        : app.status === "rejected"
                        ? "bg-red-light text-red"
                        : "bg-bg text-muted"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                {app.message && (
                  <p className="text-xs text-muted mt-2 italic">&ldquo;{app.message}&rdquo;</p>
                )}
                {app.status === "applied" || app.status === "reviewed" ? (
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      disabled={acting === app.id}
                      onClick={() => setStatus(app.id, "accepted")}
                      className="text-[11px] font-semibold bg-green text-white py-1.5 px-3 rounded-lg border-none cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={acting === app.id}
                      onClick={() => setStatus(app.id, "reviewed")}
                      className="text-[11px] font-semibold border border-[rgba(0,0,0,0.15)] py-1.5 px-3 rounded-lg cursor-pointer bg-white"
                    >
                      Mark reviewed
                    </button>
                    <button
                      type="button"
                      disabled={acting === app.id}
                      onClick={() => setStatus(app.id, "rejected")}
                      className="text-[11px] font-semibold text-red border border-red/40 py-1.5 px-3 rounded-lg cursor-pointer bg-white"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const LISTING_TYPES = ["One-time", "Full-time", "Contract", "Hearing coverage", "Outsource"];

export default function ListingManager({ user }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewAppsFor, setViewAppsFor] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/user/listings");
      const data = await res.json();
      if (Array.isArray(data)) setListings(data);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);

  const startEdit = (listing) => {
    setEditingId(listing.id);
    setForm({
      title: listing.title,
      org: listing.org || "",
      location: listing.location || "",
      pay: listing.pay || "",
      type: listing.type || "One-time",
      description: "",
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/listings/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error.message || "Failed to save listing.");
      } else {
        setEditingId(null);
        load();
      }
    } catch {
      alert("Failed to save listing.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id, status) => {
    if (!confirm(`Mark this listing as "${status}"?`)) return;
    try {
      const res = await authFetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.error) alert(data.error.message);
      else load();
    } catch {
      alert("Failed to update listing status.");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted text-sm">Loading your listings…</div>;
  }

  if (!listings.length) {
    return (
      <p className="text-sm text-muted py-6">
        You have no listings yet. Use <strong>Post a listing</strong> from the dashboard overview.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((l) => (
        <div
          key={l.id}
          className="border border-[rgba(0,0,0,0.09)] rounded-xl p-4 bg-white shadow-sm"
        >
          {editingId === l.id ? (
            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-2 text-sm border rounded-lg"
                placeholder="Title"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={form.org}
                  onChange={(e) => setForm({ ...form, org: e.target.value })}
                  className="p-2 text-sm border rounded-lg"
                  placeholder="Organization"
                />
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="p-2 text-sm border rounded-lg"
                  placeholder="Location"
                />
                <input
                  value={form.pay}
                  onChange={(e) => setForm({ ...form, pay: e.target.value })}
                  className="p-2 text-sm border rounded-lg"
                  placeholder="Pay"
                />
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="p-2 text-sm border rounded-lg bg-white"
                >
                  {LISTING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  className="bg-green text-white text-xs font-semibold py-2 px-4 rounded-lg border-none cursor-pointer"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-muted bg-transparent border-none cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between gap-3 items-start">
                <div>
                  <div className="font-semibold text-text text-sm">{l.title}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {l.org} · {l.location} · {l.type}
                  </div>
                  <div className="text-[11px] text-muted-high mt-1">
                    {l.applicants} applicant{l.applicants !== 1 ? "s" : ""} · Posted {l.posted}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                    l.status === "open"
                      ? "bg-green-light text-green-dark"
                      : l.status === "filled"
                      ? "bg-amber-light text-amber"
                      : "bg-bg text-muted"
                  }`}
                >
                  {l.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setViewAppsFor(l.id)}
                  className="text-[11px] font-semibold text-white bg-green py-1.5 px-3 rounded-lg border-none cursor-pointer"
                >
                  {l.applicants > 0 ? `Review applications (${l.applicants})` : "View applications"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(l)}
                  className="text-[11px] font-semibold text-green bg-transparent border border-green/40 py-1.5 px-3 rounded-lg cursor-pointer"
                >
                  Edit
                </button>
                {l.status === "open" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStatus(l.id, "filled")}
                      className="text-[11px] font-semibold text-amber bg-transparent border border-amber/40 py-1.5 px-3 rounded-lg cursor-pointer"
                    >
                      Mark filled
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(l.id, "closed")}
                      className="text-[11px] font-semibold text-muted bg-transparent border border-[rgba(0,0,0,0.15)] py-1.5 px-3 rounded-lg cursor-pointer"
                    >
                      Close
                    </button>
                  </>
                )}
                {l.status !== "open" && (
                  <button
                    type="button"
                    onClick={() => setStatus(l.id, "open")}
                    className="text-[11px] font-semibold text-green bg-transparent border border-green/40 py-1.5 px-3 rounded-lg cursor-pointer"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {viewAppsFor && (
        <ApplicationsPanel
          listingId={viewAppsFor}
          onClose={() => setViewAppsFor(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
