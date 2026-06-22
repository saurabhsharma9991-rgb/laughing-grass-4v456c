"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import {
  APPLICATION_STATUS,
  LISTING_STATUS,
  applicationStatusLabel,
} from "@/lib/constants/application-status";

const LISTING_TYPES = ["One-time", "Full-time", "Contract", "Hearing coverage", "Outsource"];

function AppStatusBadge({ status }) {
  const meta = APPLICATION_STATUS[status] || APPLICATION_STATUS.applied;
  const tones = {
    green: "bg-green-light text-green-dark",
    amber: "bg-amber-light text-amber",
    red: "bg-red-light text-red",
    blue: "bg-blue-light text-blue",
    muted: "bg-bg text-muted",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${tones[meta.tone]}`}>
      {applicationStatusLabel(status)}
    </span>
  );
}

function ListingApplications({ listingId, onUpdated }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    authFetch(`/api/applications?listingId=${listingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setApps(data);
      })
      .finally(() => setLoading(false));
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  const setAppStatus = async (appId, status) => {
    setActing(appId);
    try {
      const res = await authFetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        load();
        onUpdated?.();
      }
    } catch {
      toastError("Failed to update application.");
    } finally {
      setActing(null);
    }
  };

  if (loading) return <p className="text-xs text-muted py-3">Loading applicants…</p>;
  if (!apps.length) {
    return (
      <p className="text-xs text-muted py-3 border-t border-[rgba(0,0,0,0.07)] mt-3">
        No applications yet. Share your listing on the job board to attract applicants.
      </p>
    );
  }

  return (
    <div className="border-t border-[rgba(0,0,0,0.07)] mt-4 pt-4 space-y-3">
      <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
        Applicants ({apps.length})
      </h4>
      {apps.map((app) => (
        <div key={app.id} className="bg-bg/60 rounded-lg p-3 border border-[rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap justify-between gap-2 items-start">
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
              <div className="text-[11px] text-muted mt-0.5">
                {app.applicant.location} · {app.applicant.rate} · ★ {app.applicant.stars}
              </div>
              {app.appliedLabel && (
                <div className="text-[10px] text-muted-high mt-0.5">Applied {app.appliedLabel}</div>
              )}
            </div>
            <AppStatusBadge status={app.status} />
          </div>
          {app.message && (
            <p className="text-xs text-muted mt-2 italic">&ldquo;{app.message}&rdquo;</p>
          )}
          {(app.status === "applied" || app.status === "reviewed") && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                disabled={acting === app.id}
                onClick={() => setAppStatus(app.id, "accepted")}
                className="text-[11px] font-semibold bg-green text-white py-1.5 px-3 rounded-lg border-none cursor-pointer disabled:opacity-60"
              >
                Accept applicant
              </button>
              <button
                type="button"
                disabled={acting === app.id}
                onClick={() => setAppStatus(app.id, "reviewed")}
                className="text-[11px] font-semibold border border-[rgba(0,0,0,0.15)] py-1.5 px-3 rounded-lg cursor-pointer bg-white"
              >
                Mark reviewed
              </button>
              <button
                type="button"
                disabled={acting === app.id}
                onClick={() => setAppStatus(app.id, "rejected")}
                className="text-[11px] font-semibold text-red border border-red/30 py-1.5 px-3 rounded-lg cursor-pointer bg-white"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ListingManager({ user, setPage }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);

  const filtered = listings.filter((l) => statusFilter === "all" || l.status === statusFilter);

  const stats = {
    total: listings.length,
    open: listings.filter((l) => l.status === "open").length,
    pendingApps: listings.reduce((n, l) => n + (l.applicationStats?.pending || 0), 0),
  };

  const startEdit = (listing) => {
    setEditingId(listing.id);
    setExpandedId(null);
    setForm({
      title: listing.title,
      org: listing.org || "",
      location: listing.location || "",
      pay: listing.pay || "",
      type: listing.type || "One-time",
      description: listing.description || "",
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
      if (data.error) toastError(data.error.message || "Failed to save listing.");
      else {
        setEditingId(null);
        load();
      }
    } catch {
      toastError("Failed to save listing.");
    } finally {
      setSaving(false);
    }
  };

  const updateListingStatus = async (id, status) => {
    try {
      const res = await authFetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else load();
    } catch {
      toastError("Failed to update listing status.");
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted text-sm">Loading your listings…</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div className="grid grid-cols-3 gap-2 flex-1 min-w-[240px]">
          {[
            [stats.total, "Total listings"],
            [stats.open, "Open"],
            [stats.pendingApps, "Pending applications"],
          ].map(([n, label]) => (
            <div key={label} className="bg-bg rounded-lg p-3 text-center">
              <div className="font-syne text-xl font-extrabold text-text">{n}</div>
              <div className="text-[10px] text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPage?.("post")}
          className="bg-green text-white text-sm py-2.5 px-4 rounded-lg border-none cursor-pointer font-semibold shrink-0"
        >
          + Post new listing
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {[
          ["all", "All"],
          ["open", "Open"],
          ["filled", "Filled"],
          ["closed", "Closed"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer border ${
              statusFilter === key
                ? "bg-green text-white border-green"
                : "bg-white text-muted border-[rgba(0,0,0,0.09)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!listings.length ? (
        <div className="text-center py-12 border border-dashed border-[rgba(0,0,0,0.12)] rounded-xl">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm text-muted mb-4">You haven&apos;t posted any listings yet.</p>
          <button
            type="button"
            onClick={() => setPage?.("post")}
            className="bg-green text-white text-sm py-2.5 px-5 rounded-lg border-none cursor-pointer font-semibold"
          >
            Post your first listing
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">No listings in this status.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((l) => {
            const statusMeta = LISTING_STATUS[l.status] || LISTING_STATUS.open;
            const isEditing = editingId === l.id;
            const isExpanded = expandedId === l.id;
            const pending = l.applicationStats?.pending || 0;

            return (
              <div
                key={l.id}
                className="border border-[rgba(0,0,0,0.09)] rounded-xl bg-white shadow-sm overflow-hidden"
              >
                <div className="p-4 md:p-5">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full p-2.5 text-sm border rounded-lg font-semibold"
                        placeholder="Title"
                      />
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="w-full p-2.5 text-sm border rounded-lg"
                        placeholder="Description"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={form.org}
                          onChange={(e) => setForm({ ...form, org: e.target.value })}
                          className="p-2.5 text-sm border rounded-lg"
                          placeholder="Organization"
                        />
                        <input
                          value={form.location}
                          onChange={(e) => setForm({ ...form, location: e.target.value })}
                          className="p-2.5 text-sm border rounded-lg"
                          placeholder="Location"
                        />
                        <input
                          value={form.pay}
                          onChange={(e) => setForm({ ...form, pay: e.target.value })}
                          className="p-2.5 text-sm border rounded-lg"
                          placeholder="Compensation"
                        />
                        <select
                          value={form.type}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                          className="p-2.5 text-sm border rounded-lg bg-white"
                        >
                          {LISTING_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
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
                      <div className="flex flex-wrap justify-between gap-3 items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-text">{l.title}</h3>
                            {pending > 0 && (
                              <span className="text-[10px] bg-amber-light text-amber font-bold px-2 py-0.5 rounded-full">
                                {pending} new
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-1">
                            {l.org} · {l.location} · {l.type} · 💰 {l.pay}
                          </p>
                          {l.description && (
                            <p className="text-xs text-muted-high mt-2 line-clamp-2">{l.description}</p>
                          )}
                          <p className="text-[11px] text-muted-high mt-2">
                            {l.applicants} total applicant{l.applicants !== 1 ? "s" : ""} · Posted {l.posted}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded uppercase ${
                              l.status === "open"
                                ? "bg-green-light text-green-dark"
                                : l.status === "filled"
                                ? "bg-amber-light text-amber"
                                : "bg-bg text-muted border border-[rgba(0,0,0,0.09)]"
                            }`}
                          >
                            {statusMeta.label}
                          </span>
                          <select
                            value={l.status}
                            onChange={(e) => updateListingStatus(l.id, e.target.value)}
                            className="text-[11px] border rounded-lg py-1 px-2 bg-white cursor-pointer"
                          >
                            <option value="open">Mark open</option>
                            <option value="filled">Mark filled</option>
                            <option value="closed">Mark closed</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedId(isExpanded ? null : l.id);
                            setEditingId(null);
                          }}
                          className="text-[11px] font-semibold text-white bg-green py-2 px-3 rounded-lg border-none cursor-pointer"
                        >
                          {isExpanded ? "Hide applicants" : `View applicants (${l.applicationStats?.total ?? l.applicants})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(l)}
                          className="text-[11px] font-semibold text-green border border-green/40 py-2 px-3 rounded-lg cursor-pointer bg-white"
                        >
                          Edit listing
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage?.("jobs")}
                          className="text-[11px] font-semibold text-muted border border-[rgba(0,0,0,0.12)] py-2 px-3 rounded-lg cursor-pointer bg-white"
                        >
                          View on job board
                        </button>
                      </div>

                      {isExpanded && (
                        <ListingApplications listingId={l.id} onUpdated={load} />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
