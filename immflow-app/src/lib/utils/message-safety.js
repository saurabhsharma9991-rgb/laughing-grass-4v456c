const PHONE_CANDIDATE = /(?:\+|00)?\d[\d\s().\-]{6,}\d/g;
const SPELLED_DIGITS =
  /\b(?:zero|one|two|three|four|five|six|seven|eight|nine)(?:[\s\-.,]+(?:zero|one|two|three|four|five|six|seven|eight|nine)){6,}\b/i;
const DATE_LIKE = /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/;

/** True when the text looks like it contains a phone number. */
export function containsPhoneNumber(text) {
  const value = String(text || "");
  if (SPELLED_DIGITS.test(value)) return true;
  for (const match of value.matchAll(PHONE_CANDIDATE)) {
    const raw = match[0].trim();
    if (DATE_LIKE.test(raw)) continue;
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 15) return true;
  }
  return false;
}

/** Admin review flag for a message body, or null when nothing looks shared. */
export function messageFlagFor(content) {
  if (containsPhoneNumber(content)) {
    return { flagged: true, flagReason: "phone_number" };
  }
  return { flagged: false, flagReason: null };
}
