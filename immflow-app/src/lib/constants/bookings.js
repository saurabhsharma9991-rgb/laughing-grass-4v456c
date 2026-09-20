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
