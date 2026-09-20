import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { listAttorneys } from "@/lib/services/attorneys";
import { matchAttorneys } from "@/lib/services/matcher-ai";
import { getPlatformSettings } from "@/lib/services/platform-settings";
import { prisma } from "@/lib/db";

export async function POST(req) {
  try {
    const session = requireAuth(req);
    const settings = await getPlatformSettings();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isPro: true },
    });

    const flags = settings.featureFlags || {};
    const matcherProOnly = flags.ai_matcher?.free !== true;
    if (matcherProOnly && !user?.isPro) {
      return apiError("AI Matcher requires ImmFlow Pro.", 403, "PRO_REQUIRED");
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
