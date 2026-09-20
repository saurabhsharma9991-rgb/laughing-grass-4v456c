/** Translation marketplace constants */

export const TRANSLATION_ORDER_STATUSES = [
  "pending_payment",
  "pending",
  "accepted",
  "in_progress",
  "quality_review",
  "completed",
  "delivered",
  "cancelled",
  "refunded",
];

export const TRANSLATION_TYPES = ["standard", "certified"];
export const TURNAROUND_OPTIONS = ["regular", "rush"];
export const FILE_KINDS = ["source", "delivery", "certification"];

export const DOCUMENT_TYPES = [
  "Birth certificate",
  "Marriage certificate",
  "Divorce decree",
  "Passport / ID",
  "Academic transcript",
  "Diploma / degree",
  "Medical record",
  "Court document",
  "Affidavit / letter",
  "Other immigration document",
];

export const COMMON_LANGUAGES = [
  "Afrikaans",
  "Albanian",
  "Amharic",
  "Arabic",
  "Armenian",
  "Belorussian",
  "Bengali",
  "Bosnian",
  "Bulgarian",
  "Burmese",
  "Cantonese",
  "Catalan",
  "Chinese (Mandarin) Simplified",
  "Chinese (Mandarin) Traditional",
  "Croatian",
  "Czech",
  "Danish",
  "Dari",
  "Dendi",
  "Dutch",
  "English",
  "Farsi",
  "Finnish",
  "French",
  "French (Canadian)",
  "Georgian",
  "German",
  "Greek",
  "Gujarati",
  "Haitian Creole",
  "Hausa",
  "Hebrew",
  "Hindi",
  "Hmong",
  "Hungarian",
  "Icelandic",
  "Indonesian",
  "Irish (Gaelic)",
  "Italian",
  "Japanese",
  "Kamil",
  "Kannada",
  "Kazakh",
  "Khmer (Cambodian)",
  "Kinyarwanda",
  "Korean",
  "Kurdish",
  "Lao",
  "Latin",
  "Latvian",
  "Lithuanian",
  "Macedonian",
  "Malay",
  "Malayalam",
  "Marathi",
  "Mongolian",
  "Nepali",
  "Norwegian",
  "Oromo",
  "Pashto",
  "Persian",
  "Polish",
  "Portuguese (Brazil)",
  "Portuguese (Portugal)",
  "Punjabi",
  "Romanian",
  "Rundi",
  "Russian",
  "Serbian",
  "Sindhi",
  "Sinhalese",
  "Slovak",
  "Slovenian",
  "Somali",
  "Spanish",
  "Swahili",
  "Swedish",
  "Tagalog",
  "Tajik",
  "Tamil",
  "Telugu",
  "Thai",
  "Tigrinya",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Uzbek",
  "Vietnamese",
];

export const TRANSLATOR_TYPES = [
  "Certified Translator",
  "Professional Translator",
  "Translation Agency",
];

/** Status transitions allowed for providers (after payment). */
export const PROVIDER_STATUS_FLOW = {
  pending: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["quality_review"],
  quality_review: ["completed"],
  completed: ["delivered"],
};

export const ADMIN_STATUS_FLOW = TRANSLATION_ORDER_STATUSES;

/** Base quote in cents before provider overrides. */
export function quoteTranslationCents({
  translationType = "standard",
  turnaround = "regular",
  providerBaseCents = null,
} = {}) {
  let cents = providerBaseCents != null ? Number(providerBaseCents) : 4900; // $49 default
  if (translationType === "certified") cents = Math.round(cents * 1.45);
  if (turnaround === "rush") cents = Math.round(cents * 1.35);
  return Math.max(1500, cents);
}

export function formatMoney(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format((cents || 0) / 100);
}

/**
 * Default certification disclaimer — never claim blanket USCIS certification.
 */
export function defaultCertificationNote(translationType) {
  if (translationType !== "certified") return null;
  return (
    "Provider will include a translator’s certification/attestation statement " +
    "describing their qualifications and that the translation is complete and accurate. " +
    "ImmFlow does not claim that translations are automatically “USCIS certified.” " +
    "Confirm attestation wording with the provider for your filing."
  );
}
