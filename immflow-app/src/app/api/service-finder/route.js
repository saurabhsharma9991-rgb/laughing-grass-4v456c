import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { findServices } from "@/lib/services/service-finder-ai";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/** POST { query } → category + filters + ranked provider matches */
export async function POST(req) {
  try {
    const limit = rateLimit(`service-finder:${clientIp(req)}`, {
      limit: 12,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      return apiError(
        "Too many searches. Please try again in a minute.",
        429,
        "RATE_LIMITED"
      );
    }
    const body = await req.json();
    const query = body?.query;
    if (!query || typeof query !== "string") {
      return apiError("query is required.", 400, "VALIDATION_ERROR");
    }
    if (query.length > 800) {
      return apiError("query is too long.", 400, "VALIDATION_ERROR");
    }

    const result = await findServices(query.trim());
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Failed to parse service intent.");
  }
}
