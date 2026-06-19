"use client";

import React from "react";
import AttorneyCard from "../AttorneyCard";

/** Live preview of CMS hero + stats while editing in admin. */
export default function CmsPreview({ values }) {
  const get = (key, fallback = "") => values[key] ?? fallback;

  return (
    <div className="sticky top-6 space-y-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Live preview
      </div>

      {/* Hero preview */}
      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-green mb-2">
          {get("home.hero.badge", "Immigration only · Verified attorneys")}
        </div>
        <h2 className="font-syne text-xl font-extrabold text-text whitespace-pre-line leading-tight mb-2">
          {get("home.hero.title", "The network built for\nimmigration attorneys")}
        </h2>
        <p className="text-xs text-muted leading-relaxed mb-4">
          {get("home.hero.subtitle", "Find hearing coverage, outsource cases…")}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="bg-green text-white text-[11px] py-1.5 px-3 rounded-lg">
            {get("home.hero.cta_primary", "Find an attorney")}
          </span>
          <span className="border border-[rgba(0,0,0,0.15)] text-[11px] py-1.5 px-3 rounded-lg text-text">
            {get("home.hero.cta_secondary", "Browse job board")}
          </span>
        </div>
      </div>

      {/* Stats preview */}
      <div className="grid grid-cols-2 gap-2">
        {[
          ["home.stats.attorneys_count", "home.stats.attorneys_label", "1,800+", "Verified attorneys"],
          ["home.stats.listings_count", "home.stats.listings_label", "340+", "Active listings"],
        ].map(([numKey, lblKey, numFb, lblFb]) => (
          <div
            key={numKey}
            className="bg-white border border-[rgba(0,0,0,0.09)] rounded-lg p-3 text-center"
          >
            <div className="font-syne text-lg font-extrabold text-text">
              {get(numKey, numFb)}
            </div>
            <div className="text-[10px] text-muted">{get(lblKey, lblFb)}</div>
          </div>
        ))}
      </div>

      {/* Card preview */}
      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4 shadow-sm">
        <div className="text-[10px] text-muted uppercase mb-2">How it works card</div>
        <div className="text-2xl mb-1">{get("home.card1.icon", "⚖️")}</div>
        <div className="text-sm font-semibold text-text mb-1">
          {get("home.card1.title", "Find an attorney")}
        </div>
        <p className="text-[11px] text-muted leading-relaxed">
          {get("home.card1.desc", "Browse verified immigration attorneys…")}
        </p>
      </div>

      {/* Pricing preview */}
      <div className="bg-green-light border border-green-medium rounded-xl p-4">
        <div className="text-[10px] text-green-dark font-semibold uppercase mb-1">
          {get("home.pricing.badge", "Pricing")}
        </div>
        <div className="font-syne text-base font-bold text-text">
          {get("home.pricing.title", "Simple, transparent pricing")}
        </div>
        <p className="text-[11px] text-muted mt-1">
          {get("home.pricing.subtitle", "Free to start…")}
        </p>
      </div>
    </div>
  );
}

export function AttorneyPreviewCard({ attorney }) {
  if (!attorney?.name) return null;
  const cardData = {
    id: attorney.id || 0,
    initials: attorney.initials || "AT",
    bg: "#E1F5EE",
    fg: "#085041",
    name: attorney.name,
    location: attorney.location || "—",
    exp: `${attorney.experienceYears || 0} yrs`,
    tags: [...(attorney.specialties || []), ...(attorney.languages || [])],
    avail: attorney.availability || "Available now",
    dot: "#0F6E56",
    stars: attorney.stars || "5.0",
    rate: attorney.rate || "$—",
  };
  return (
    <div className="sticky top-6">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
        Card preview
      </div>
      <AttorneyCard a={cardData} />
    </div>
  );
}

export function ListingPreviewCard({ listing }) {
  if (!listing?.title) return null;
  return (
    <div className="sticky top-6">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
        Listing preview
      </div>
      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-lg p-5 shadow-sm">
        <div className="flex justify-between mb-1.5">
          <div className="text-sm font-medium text-text pr-2">{listing.title}</div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-light text-green-dark font-medium">
            {listing.badge || "New"}
          </span>
        </div>
        <div className="text-xs text-muted mb-2">
          🏢 {listing.org || "—"} · {listing.location || "—"}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full border border-green text-green">
            {listing.type || "One-time"}
          </span>
          {(listing.tags || []).map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-full bg-bg text-muted"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="text-xs text-muted">💰 {listing.pay || "DOE"}</div>
      </div>
    </div>
  );
}
