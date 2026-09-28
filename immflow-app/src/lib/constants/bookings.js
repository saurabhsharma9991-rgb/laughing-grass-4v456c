/** Interpreter + psychological booking constants */

export const BOOKING_TYPES = ["interpreter", "psychological"];

export const BOOKING_STATUSES = [
  "pending_payment",
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "declined",
  "refunded",
];

export const BOOKING_MODALITIES = [
  "remote",
  "in_person",
  "phone",
  "video",
  "telehealth",
];

export const INTERPRETER_SERVICE_TYPES = [
  "Attorney-client meeting",
  "Immigration interview",
  "USCIS-related appointment",
  "Immigration court",
  "Legal proceeding",
  "Medical interpretation",
  "Phone interpretation",
  "Video interpretation",
  "In-person interpretation",
  "Other",
];

export const PSYCH_SERVICE_TYPES = [
  "Immigration psychological evaluation",
  "Hardship evaluation",
  "Asylum-related psychological evaluation",
  "Trauma evaluation",
  "VAWA-related evaluation",
  "U-visa-related evaluation",
  "Cancellation of removal evaluation",
  "Other immigration-related evaluation",
];

export const PROVIDER_BOOKING_TRANSITIONS = {
  pending_payment: [],
  requested: ["confirmed", "declined"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  declined: [],
};

export const BOOKING_DISCLAIMER =
  "ImmFlow connects you with independent professionals. Interpreters and licensed clinicians remain solely responsible for their services. ImmFlow does not provide clinical care, legal advice, or interpreting services.";

export function formatBookingMoney(cents, currency = "usd") {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(cents / 100);
}

function dollarsToCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function firstAmountDollars(text) {
  const match = String(text ?? "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return dollarsToCents(match[1]) != null ? Number(match[1]) : null;
}

/**
 * Hourly rate in cents for a booking modality.
 * Structured profile rates win. Display strings like
 * "$150/hr remote · $200/hr in-person" use the matching amount,
 * never every digit glued together.
 */
export function quoteHourlyCents(provider, modality = "remote") {
  const profile =
    provider?.profileData && typeof provider.profileData === "object"
      ? provider.profileData
      : {};
  const inPerson = modality === "in_person";
  const structured = inPerson
    ? profile.hourlyRateInPerson ?? profile.hourlyRate
    : profile.hourlyRateRemote ?? profile.hourlyRate;
  const structuredCents = dollarsToCents(structured);
  if (structuredCents) return structuredCents;

  const rate = String(provider?.rate || "");
  const matched = inPerson
    ? rate.match(/\$?\s*(\d+(?:\.\d+)?)[^$\n]{0,40}in[-\s]?person/i) ||
      rate.match(/in[-\s]?person[^$\n]{0,40}\$?\s*(\d+(?:\.\d+)?)/i)
    : rate.match(/\$?\s*(\d+(?:\.\d+)?)[^$\n]{0,40}(?:remote|phone|video)/i) ||
      rate.match(/(?:remote|phone|video)[^$\n]{0,20}\$?\s*(\d+(?:\.\d+)?)/i);
  if (matched) return dollarsToCents(matched[1]);

  const first = firstAmountDollars(rate);
  return first ? dollarsToCents(first) : null;
}

/** Interpreter sessions are hourly. Psychological evaluations use the listed flat fee. */
export function quoteBookingCents(
  provider,
  { bookingType = "interpreter", modality = "remote", durationMinutes = 60 } = {}
) {
  const rateCents = quoteHourlyCents(provider, modality);
  if (!rateCents) return null;
  if (bookingType === "psychological") return rateCents;
  const duration = Number(durationMinutes);
  if (!Number.isFinite(duration) || duration <= 0) return rateCents;
  return Math.round((rateCents * duration) / 60);
}
