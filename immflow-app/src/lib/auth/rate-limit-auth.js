import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api/response";

export function enforceAuthRateLimit(req, action, { limit = 15, windowMs = 60_000 } = {}) {
  const key = `${action}:${clientIp(req)}`;
  const result = rateLimit(key, { limit, windowMs });
  if (!result.allowed) {
    return apiError("Too many requests. Please try again in a minute.", 429, "RATE_LIMITED");
  }
  return null;
}
