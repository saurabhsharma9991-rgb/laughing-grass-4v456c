import React from "react";
import Tag from "./Tag";

export default function JobCard({ j, onApply, applying }) {
  // Format tags in case they are stored as JSON string in MySQL database
  let tags = [];
  if (j.tags) {
    try {
      tags = typeof j.tags === "string" ? JSON.parse(j.tags) : j.tags;
    } catch (e) {
      tags = typeof j.tags === "string" ? j.tags.split(",") : [];
    }
  }

  // Map badge types to correct classes
  const getBadgeClasses = (badge) => {
    const b = (badge || "").toLowerCase();
    if (b === "urgent") {
      return "bg-red-light text-red";
    } else if (b === "open") {
      return "bg-blue-light text-blue";
    } else if (b === "featured") {
      return "bg-amber-light text-amber";
    }
    // Default/New
    return "bg-green-light text-green";
  };

  const badgeClasses = getBadgeClasses(j.badge);

  return (
    <div
      className="bg-white border-[0.5px] border-solid border-[rgba(0,0,0,0.09)] rounded-lg p-5 cursor-pointer shadow-sm hover:border-green-medium hover:shadow-md transition-all duration-300"
    >
      <div className="flex justify-between mb-1.5 items-start">
        <div className="text-sm font-medium text-text flex-1 pr-2.5 leading-tight">
          {j.title}
        </div>
        <span
          style={{
            backgroundColor: j.bb,
            color: j.bc,
          }}
          className={`text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
            !j.bb && !j.bc ? badgeClasses : ""
          }`}
        >
          {j.badge || "Open"}
        </span>
      </div>
      <div className="text-xs text-muted mb-2.5">
        🏢 {j.org} · {j.location}
      </div>
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
      {onApply && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onApply(j);
          }}
          disabled={applying}
          className="w-full bg-green hover:bg-green-dark text-white font-semibold text-[11px] py-2 rounded-lg border-none cursor-pointer transition-all disabled:opacity-60"
        >
          {applying ? "Applying…" : "Apply to listing"}
        </button>
      )}
    </div>
  );
}
