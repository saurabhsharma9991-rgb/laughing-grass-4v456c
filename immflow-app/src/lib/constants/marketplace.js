/** Marketplace verification + category constants */

export const VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "expired",
  "suspended",
];

export const CREDENTIAL_STATUSES = ["pending", "verified", "rejected", "expired"];

export const USER_ROLES = {
  public: "public", // seeker / client
  provider: "provider", // generic provider (non-attorney)
  attorney: "attorney", // legacy + attorney providers
  admin: "admin",
};

export const DEFAULT_CATEGORY_SLUGS = {
  attorney: "attorney",
  translation: "translation",
  interpreter: "interpreter",
  psychological: "psychological",
};

export const PLATFORM_LOCALES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
  { code: "zh", label: "Chinese (Simplified)", nativeLabel: "简体中文" },
];

export const DEFAULT_LOCALE = "en";

export function isValidLocale(code) {
  return PLATFORM_LOCALES.some((l) => l.code === code);
}

export function verificationBadgeLabel(categorySlug, status) {
  if (status !== "verified") return null;
  const map = {
    attorney: "Verified Attorney",
    translation: "Verified Certified Translator",
    interpreter: "Verified Interpreter",
    psychological: "Verified Licensed Professional",
  };
  return map[categorySlug] || "Verified Provider";
}
