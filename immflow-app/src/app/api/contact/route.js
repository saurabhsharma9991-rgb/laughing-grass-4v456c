import { apiSuccess, handleApiError } from "@/lib/api/response";
import { enforceAuthRateLimit } from "@/lib/auth/rate-limit-auth";
import { extractAuthToken, verifyToken } from "@/lib/auth/jwt";
import { createContactInquiry } from "@/lib/services/contact-inquiries";

function optionalUserId(req) {
  try {
    const token = extractAuthToken(req);
    return token ? verifyToken(token)?.userId || null : null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const limited = enforceAuthRateLimit(req, "contact", { limit: 5, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const body = await req.json();
    if (body?.website) return apiSuccess({ success: true }, 201);
    await createContactInquiry(body, { userId: optionalUserId(req) });
    return apiSuccess({ success: true }, 201);
  } catch (error) {
    return handleApiError(error, "Could not send your message.");
  }
}
