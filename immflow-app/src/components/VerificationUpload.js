"use client";

import React, { useId, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";

const MAX_VERIFICATION_BYTES = 15 * 1024 * 1024;
const VERIFICATION_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

export const DOCUMENT_REQUIRED_SLUGS = new Set(["attorney", "psychological"]);
export const VERIFICATION_HINT =
  "License, bar card, or certificate. PDF, Word, or image up to 15 MB. Only ImmFlow admins can see it.";

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VerificationUpload({ label, required, value, onChange, onError, showHint = false }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [reading, setReading] = useState(false);

  const pick = async (file) => {
    if (!file) return;
    if (file.size > MAX_VERIFICATION_BYTES) {
      onError?.("Verification document must be 15 MB or smaller.");
      return;
    }
    setReading(true);
    try {
      const data_base64 = await readFileAsBase64(file);
      onChange({ name: file.name, mime_type: file.type || "", size: file.size, data_base64 });
    } catch {
      onError?.("Could not read that file. Please try another one.");
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 transition-colors ${
        value ? "border-green/40 bg-green-light/40" : "border-[rgba(0,0,0,0.12)] bg-white"
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        pick(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
            value ? "bg-green text-white" : "bg-bg text-muted"
          }`}
        >
          <Icon name={value ? "check" : "document"} className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-text leading-tight truncate">
            {label}
            <span
              className={`ml-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                required ? "text-red" : "text-muted-high"
              }`}
            >
              {required ? "Required" : "Optional"}
            </span>
          </div>
          <div className="text-[11px] text-muted truncate mt-0.5">
            {reading
              ? "Reading file…"
              : value
                ? `${value.name}${value.size ? ` · ${formatSize(value.size)}` : ""}`
                : "PDF, Word, or image · up to 15 MB"}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-green-dark bg-green-light hover:bg-green hover:text-white rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
          >
            {value ? "Replace" : "Upload"}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Remove ${label} document`}
              className="text-muted hover:text-red bg-transparent border-none cursor-pointer p-1.5"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={VERIFICATION_ACCEPT}
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {showHint && <p className="text-[10px] text-muted mt-2 leading-relaxed">{VERIFICATION_HINT}</p>}
    </div>
  );
}
