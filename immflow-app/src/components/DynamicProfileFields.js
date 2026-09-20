"use client";

import React from "react";

export default function DynamicProfileFields({
  schema,
  values,
  onChange,
  excludeKeys = [],
}) {
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  const excluded = new Set(excludeKeys);
  const set = (key, value) => onChange({ ...values, [key]: value });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields
        .filter((field) => !excluded.has(field.key))
        .map((field) => {
          const value = values?.[field.key];
          const common = {
            id: `profile-${field.key}`,
            required: field.required,
            className:
              "mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white",
          };

          let input;
          if (field.type === "boolean") {
            input = (
              <label className="flex items-center gap-2 mt-2 text-sm">
                <input
                  id={common.id}
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => set(field.key, e.target.checked)}
                />
                Yes
              </label>
            );
          } else if (field.type === "textarea") {
            input = (
              <textarea
                {...common}
                rows={3}
                value={value || ""}
                onChange={(e) => set(field.key, e.target.value)}
              />
            );
          } else if (field.type === "select") {
            input = (
              <select
                {...common}
                value={value || ""}
                onChange={(e) => set(field.key, e.target.value)}
              >
                <option value="">Select…</option>
                {(field.options || []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            );
          } else if (field.type === "multiselect") {
            input = (
              <input
                {...common}
                value={Array.isArray(value) ? value.join(", ") : value || ""}
                placeholder="Comma-separated values"
                onChange={(e) =>
                  set(
                    field.key,
                    e.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
              />
            );
          } else if (field.type === "language_pairs") {
            const pair = Array.isArray(value) ? value[0] || {} : {};
            input = (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  className={common.className}
                  value={pair.source || ""}
                  placeholder="Source"
                  onChange={(e) =>
                    set(field.key, [
                      { source: e.target.value, target: pair.target || "" },
                    ])
                  }
                />
                <input
                  className={common.className}
                  value={pair.target || ""}
                  placeholder="Target"
                  onChange={(e) =>
                    set(field.key, [
                      { source: pair.source || "", target: e.target.value },
                    ])
                  }
                />
              </div>
            );
          } else {
            input = (
              <input
                {...common}
                type={
                  field.type === "number"
                    ? "number"
                    : field.type === "date"
                      ? "date"
                      : "text"
                }
                value={value ?? ""}
                onChange={(e) =>
                  set(
                    field.key,
                    field.type === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : e.target.value
                  )
                }
              />
            );
          }

          return (
            <div
              key={field.key}
              className={field.type === "textarea" ? "sm:col-span-2" : ""}
            >
              <label
                htmlFor={`profile-${field.key}`}
                className="text-xs font-medium text-muted"
              >
                {field.label}
                {field.required ? " *" : ""}
              </label>
              {input}
              {field.help && (
                <p className="text-[10px] text-muted mt-1">{field.help}</p>
              )}
            </div>
          );
        })}
    </div>
  );
}
