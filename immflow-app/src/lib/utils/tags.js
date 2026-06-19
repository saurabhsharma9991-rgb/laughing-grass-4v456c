/** Availability dot color — navy mirage for available, amber/red for delays. */
export function getAvailabilityDot(availability = "") {
  const text = availability.toLowerCase();
  if (text.includes("available now") || text === "available") {
    return "#35577D"; // steel blue — immediately available
  }
  if (text.includes("wk") || text.includes("week") || text.includes("wait")) {
    return "#A32D2D"; // red — longer wait
  }
  if (text.includes("day") || text.includes("avail")) {
    return "#BA7517"; // amber — short wait
  }
  return "#35577D";
}

export function parseTagsInput(value) {
  if (Array.isArray(value)) {
    return value.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}
