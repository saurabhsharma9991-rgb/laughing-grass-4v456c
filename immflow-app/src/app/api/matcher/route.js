import { requireAuth, AuthError } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { listAttorneys } from "@/lib/services/attorneys";
import { matchAttorneys } from "@/lib/services/matcher-ai";
import { assertFeatureAccess } from "@/lib/services/platform-settings";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req) {
  try {
    const limited = rateLimit(`matcher:${clientIp(req)}`, {
      limit: 8,
      windowMs: 60_000,
    });
    if (!limited.allowed) {
      return apiError(
        "Too many matcher requests. Please try again in a minute.",
        429,
        "RATE_LIMITED"
      );
    }
    const session = requireAuth(req);
    const access = await assertFeatureAccess(session.userId, "ai_matcher");
    if (!access.allowed) {
      throw new AuthError(
        "AI Matcher requires ImmFlow Pro.",
        403,
        "PRO_UPGRADE_REQUIRED"
      );
    }

    const body = await req.json();
    const { query = "", needType = "", caseType = "" } = body || {};

    const attorneys = await listAttorneys({ verifiedOnly: true });
    const result = await matchAttorneys(attorneys, { query, needType, caseType });

    return apiSuccess({
      matches: result.matches,
      source: result.source,
      attorneyCount: attorneys.length,
    });
  } catch (error) {
    return handleApiError(error, "Failed to run matcher.");
  }
}
