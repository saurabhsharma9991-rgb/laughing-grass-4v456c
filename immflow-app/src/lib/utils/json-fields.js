export function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export function stringifyJsonArray(arr) {
  return JSON.stringify(Array.isArray(arr) ? arr : []);
}
