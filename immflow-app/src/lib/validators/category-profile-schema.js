import { AuthError } from "@/lib/auth/guards.js";

const FIELD_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "boolean",
  "date",
  "select",
  "multiselect",
  "language_pairs",
]);

function humanize(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeProfileSchema(input) {
  const source =
    typeof input === "string"
      ? (() => {
          try {
            return JSON.parse(input);
          } catch {
            throw new AuthError(
              "Profile schema must be valid JSON.",
              400,
              "INVALID_PROFILE_SCHEMA"
            );
          }
        })()
      : input;

  if (!source || typeof source !== "object" || !Array.isArray(source.fields)) {
    throw new AuthError(
      "Profile schema must be an object with a fields array.",
      400,
      "INVALID_PROFILE_SCHEMA"
    );
  }
  if (source.fields.length > 40) {
    throw new AuthError(
      "Profile schema supports at most 40 fields.",
      400,
      "INVALID_PROFILE_SCHEMA"
    );
  }

  const keys = new Set();
  const fields = source.fields.map((raw) => {
    const item = typeof raw === "string" ? { key: raw } : raw;
    if (!item || typeof item !== "object") {
      throw new AuthError(
        "Each profile field must be a string or object.",
        400,
        "INVALID_PROFILE_SCHEMA"
      );
    }
    const key = String(item.key || "")
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 60);
    if (!key || keys.has(key)) {
      throw new AuthError(
        "Profile field keys must be unique and alphanumeric.",
        400,
        "INVALID_PROFILE_SCHEMA"
      );
    }
    keys.add(key);
    const type = FIELD_TYPES.has(item.type) ? item.type : "text";
    const options = Array.isArray(item.options)
      ? item.options.map((v) => String(v).slice(0, 100)).slice(0, 50)
      : [];
    return {
      key,
      label: String(item.label || humanize(key)).slice(0, 120),
      type,
      required: Boolean(item.required),
      options,
      help: item.help ? String(item.help).slice(0, 500) : "",
      verificationSensitive: Boolean(item.verificationSensitive),
    };
  });

  return {
    version: 1,
    workflow: ["directory", "contact", "order", "booking"].includes(source.workflow)
      ? source.workflow
      : "contact",
    fields,
  };
}

export function validateProfileData(schema, input, { partial = false } = {}) {
  const normalized = normalizeProfileSchema(schema || { fields: [] });
  const value = input && typeof input === "object" ? input : {};
  const output = {};

  for (const field of normalized.fields) {
    const raw = value[field.key];
    if (!partial && field.required && (raw === undefined || raw === null || raw === "")) {
      throw new AuthError(
        `${field.label} is required.`,
        400,
        "PROFILE_FIELD_REQUIRED"
      );
    }
    if (raw === undefined) continue;
    if (field.type === "boolean") output[field.key] = Boolean(raw);
    else if (field.type === "number") {
      const number = Number(raw);
      if (!Number.isFinite(number)) {
        throw new AuthError(`${field.label} must be a number.`, 400, "INVALID_PROFILE_FIELD");
      }
      output[field.key] = number;
    } else if (field.type === "multiselect") {
      output[field.key] = Array.isArray(raw)
        ? raw.map((v) => String(v).slice(0, 100)).slice(0, 50)
        : [];
    } else if (field.type === "language_pairs") {
      output[field.key] = Array.isArray(raw)
        ? raw
            .map((pair) => ({
              source: String(pair?.source || "").slice(0, 80),
              target: String(pair?.target || "").slice(0, 80),
            }))
            .filter((pair) => pair.source && pair.target)
            .slice(0, 30)
        : [];
    } else {
      output[field.key] = String(raw ?? "").slice(0, 4000);
    }
  }
  return output;
}
