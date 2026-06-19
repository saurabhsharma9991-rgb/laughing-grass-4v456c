import React from "react";
import Tag from "./Tag";
import {
  APPLICATION_STATUS,
  LISTING_STATUS,
  applicationStatusLabel,
} from "@/lib/constants/application-status";

function StatusPill({ label, tone = "muted" }) {
  const tones = {
    green: "bg-green-light text-green-dark",
    amber: "bg-amber-light text-amber",
    red: "bg-red-light text-red",
    blue: "bg-blue-light text-blue",
    muted: "bg-bg text-muted border border-[rgba(0,0,0,0.09)]",
  };
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${tones[tone] || tones.muted}`}>
      {label}
    </span>
  );
}

export default function JobCard({ j, onApply, applying, onManageListing }) {
  let tags = [];
  if (j.tags) {
    try {
      tags = typeof j.tags === "string" ? JSON.parse(j.tags) : j.tags;
    } catch {
      tags = typeof j.tags === "string" ? j.tags.split(",") : [];
    }
  }

  const getBadgeClasses = (badge) => {
    const b = (badge || "").toLowerCase();
    if (b === "urgent") return "bg-red-light text-red";
    if (b === "open") return "bg-blue-light text-blue";
    if (b === "featured") return "bg-amber-light text-amber";
    return "bg-green-light text-green";
  };

  const badgeClasses = getBadgeClasses(j.badge);
  const listingStatus = LISTING_STATUS[j.status] || LISTING_STATUS.open;
  const myApp = j.myApplication;
  const appMeta = myApp ? APPLICATION_STATUS[myApp.status] : null;

  const renderAction = () => {
    if (j.isOwnListing) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onManageListing?.(j);
          }}
          className="w-full bg-bg hover:bg-bg/80 text-text font-semibold text-[11px] py-2 rounded-lg border border-[rgba(0,0,0,0.12)] cursor-pointer transition-all"
        >
          Manage your listing →
        </button>
      );
    }

    if (myApp) {
      return (
        <div className="w-full text-center py-2 px-3 rounded-lg bg-bg border border-[rgba(0,0,0,0.09)]">
          <div className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
            Your application
          </div>
          <StatusPill label={applicationStatusLabel(myApp.status)} tone={appMeta?.tone || "muted"} />
        </div>
      );
    }

    if (j.status !== "open") {
      return (
        <div className="w-full text-center py-2 text-[11px] text-muted font-medium rounded-lg bg-bg border border-dashed border-[rgba(0,0,0,0.12)]">
          {j.status === "filled" ? "Position filled" : "Listing closed"}
        </div>
      );
    }

    if (!onApply) return null;

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onApply(j);
        }}
        disabled={applying}
        className="w-full bg-green hover:bg-green-dark text-white font-semibold text-[11px] py-2 rounded-lg border-none cursor-pointer transition-all disabled:opacity-60"
      >
        {applying ? "Submitting…" : "Apply to listing"}
      </button>
    );
  };

  return (
    <div className="bg-white border-[0.5px] border-solid border-[rgba(0,0,0,0.09)] rounded-lg p-5 shadow-sm hover:border-green-medium hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="flex justify-between mb-1.5 items-start gap-2">
        <div className="text-sm font-medium text-text flex-1 leading-tight">{j.title}</div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            style={{ backgroundColor: j.bb, color: j.bc }}
            className={`text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
              !j.bb && !j.bc ? badgeClasses : ""
            }`}
          >
            {j.badge || "New"}
          </span>
          {j.status && j.status !== "open" && (
            <StatusPill label={listingStatus.label} tone={listingStatus.tone} />
          )}
        </div>
      </div>
      <div className="text-xs text-muted mb-2.5">🏢 {j.org} · {j.location}</div>
      <div className="flex flex-wrap gap-[5px] mb-2.5">
        <Tag green>{j.type || "One-time"}</Tag>
        {tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      <div className="flex gap-4 text-xs text-muted-high mb-3">
        <span>💰 {j.pay}</span>
        <span>👤 {j.applicants || j.applicantsCount || 0}</span>
        <span>🕐 {j.posted || "Just now"}</span>
      </div>
      <div className="mt-auto">{renderAction()}</div>
    </div>
  );
}
