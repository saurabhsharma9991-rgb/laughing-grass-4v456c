"use client";

import React, { useState } from "react";
import Tag from "./Tag";

/** Comma-separated tag input with pill preview — used for specialties, languages, listing tags. */
export default function TagInput({ label, value = [], onChange, placeholder, hint }) {
  const [input, setInput] = useState("");

  const tags = Array.isArray(value) ? value : [];

  const addTag = (raw) => {
    const next = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !tags.includes(t));
    if (next.length) onChange([...tags, ...next]);
    setInput("");
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div>
      {label && (
        <div className="text-[13px] font-semibold text-text mb-1">{label}</div>
      )}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => removeTag(t)}
            className="inline-flex items-center gap-1 bg-bg border border-[rgba(0,0,0,0.09)] rounded-full px-2.5 py-1 text-[11px] text-text hover:border-red hover:text-red cursor-pointer transition-all"
            title="Click to remove"
          >
            {t} <span className="text-muted-high">×</span>
          </button>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (input.trim()) addTag(input);
          }
        }}
        onBlur={() => {
          if (input.trim()) addTag(input);
        }}
        placeholder={placeholder || "Type a tag and press Enter"}
        className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
      />
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}

/** Read-only tag preview for CMS / profile preview panels */
export function TagPreview({ tags = [] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Tag key={t}>{t}</Tag>
      ))}
    </div>
  );
}
