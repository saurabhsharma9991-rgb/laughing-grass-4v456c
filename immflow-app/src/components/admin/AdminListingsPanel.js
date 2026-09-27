"use client";

import React, { useMemo, useState } from "react";

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

function statusTone(status) {
  if (status === "filled") return "bg-blue-light text-blue";
  if (status === "closed") return "bg-bg text-muted border border-[rgba(0,0,0,0.1)]";
  return "bg-green-light text-green-dark";
}

function badgeTone(badge) {
  const b = (badge || "").toLowerCase();
  if (b === "urgent") return "bg-red-light text-red";
  if (b === "open") return "bg-blue-light text-blue";
  if (b === "featured") return "bg-amber-light text-amber";
  return "bg-bg text-muted border border-[rgba(0,0,0,0.1)]";
}

function parseTags(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return typeof raw === "string" ? raw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  }
}

export default function AdminListingsPanel({
  listings = [],
  loading,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (status !== "all" && (l.status || "open") !== status) return false;
      if (type !== "all" && (l.type || "") !== type) return false;
      if (!q) return true;
      const hay = `${l.title || ""} ${l.org || ""} ${l.location || ""} ${l.type || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [listings, query, status, type]);

  const types = useMemo(() => {
    const set = new Set(listings.map((l) => l.type).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [listings]);

  if (loading) {
    return <div className="text-center py-16 text-muted text-sm">Loading listings…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
        <div>
          <h1 className="font-syne text-2xl font-extrabold text-text">Listings</h1>
          <p className="text-sm text-muted mt-1">
            Moderate job board posts. {filtered.length} shown
            {filtered.length !== listings.length ? ` of ${listings.length}` : ""}.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, org, location…"
            className="text-sm py-2.5 px-3 border border-[rgba(0,0,0,0.12)] rounded-lg bg-white"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm py-2.5 px-3 border border-[rgba(0,0,0,0.12)] rounded-lg bg-white"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="filled">Filled</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-sm py-2.5 px-3 border border-[rgba(0,0,0,0.12)] rounded-lg bg-white"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All types" : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-10 text-center text-sm text-muted">
          No listings match your filters.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((l) => {
              const tags = parseTags(l.tags).slice(0, 4);
              return (
                <article
                  key={l.id}
                  className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-text leading-snug">{l.title}</h3>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={badgeTone(l.badge)}>{l.badge || "New"}</Badge>
                      <Badge className={statusTone(l.status || "open")}>
                        {l.status || "open"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted mb-2">
                    {l.org || "Independent"} · {l.location || "—"}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {l.type && <Badge className="bg-green-light text-green-dark">{l.type}</Badge>}
                    {tags.map((t) => (
                      <Badge key={t} className="bg-bg text-muted border border-[rgba(0,0,0,0.08)]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted mb-3">
                    <span>{l.pay || "DOE"}</span>
                    <span>{l.applicants ?? l.applicantsCount ?? 0} applicants</span>
                    <span>{l.posted || "—"}</span>
                  </div>
                  <div className="flex gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(l)}
                        className="flex-1 text-xs font-semibold py-2 rounded-lg bg-green text-white border-none cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(l.id)}
                        className="text-xs font-semibold py-2 px-3 rounded-lg bg-white text-red border border-red/40 cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-[rgba(0,0,0,0.09)] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-bg/60 text-muted border-b border-[rgba(0,0,0,0.08)]">
                    <th className="py-3 px-4 font-semibold">Listing</th>
                    <th className="py-3 px-3 font-semibold">Type</th>
                    <th className="py-3 px-3 font-semibold">Pay</th>
                    <th className="py-3 px-3 font-semibold text-center">Apps</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-[rgba(0,0,0,0.06)] hover:bg-bg/40 align-top"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text text-sm leading-snug max-w-md">
                          {l.title}
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {l.org || "Independent"} · {l.location || "—"}
                        </div>
                        <div className="text-[10px] text-muted-high mt-1">{l.posted || ""}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge className="bg-green-light text-green-dark">{l.type || "—"}</Badge>
                        {l.badge && (
                          <div className="mt-1">
                            <Badge className={badgeTone(l.badge)}>{l.badge}</Badge>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-muted whitespace-nowrap">{l.pay || "DOE"}</td>
                      <td className="py-3 px-3 text-center font-semibold text-text">
                        {l.applicants ?? l.applicantsCount ?? 0}
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={statusTone(l.status || "open")}>
                          {l.status || "open"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(l)}
                              className="text-[11px] font-semibold py-1.5 px-3 rounded-lg bg-green text-white border-none cursor-pointer hover:bg-green-dark"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(l.id)}
                              className="text-[11px] font-semibold py-1.5 px-3 rounded-lg bg-transparent text-red border border-red/35 cursor-pointer hover:bg-red-light"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
