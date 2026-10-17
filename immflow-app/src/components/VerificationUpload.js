"use client";

import React from "react";

const MAX_VERIFICATION_BYTES = 15 * 1024 * 1024;
const VERIFICATION_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

export const DOCUMENT_REQUIRED_SLUGS = new Set(["attorney", "psychological"]);

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function VerificationUpload({ label, required, value, onChange, onError }) {
  return (
    <div className="mt-2">
      <div className="text-xs font-medium text-muted mb-1">
        {label}{" "}
        <span className={required ? "text-red" : "text-muted-high"}>
          {required ? "(required)" : "(optional)"}
        </span>
      </div>
      <input
        type="file"
        accept={VERIFICATION_ACCEPT}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) {
            onChange(null);
            return;
          }
          if (file.size > MAX_VERIFICATION_BYTES) {
            onError?.("Verification document must be 15 MB or smaller.");
            e.target.value = "";
            onChange(null);
            return;
          }
          const data_base64 = await readFileAsBase64(file);
          onChange({ name: file.name, mime_type: file.type || "", data_base64 });
        }}
        className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-green-light file:text-green-dark file:font-semibold"
      />
      {value?.name && <div className="text-[11px] text-green-dark mt-1">{value.name}</div>}
      <p className="text-[10px] text-muted mt-1">
        License, bar card, or certificate. PDF, Word, or image up to 15 MB. Only ImmFlow admins can
        see it.
      </p>
    </div>
  );
}
