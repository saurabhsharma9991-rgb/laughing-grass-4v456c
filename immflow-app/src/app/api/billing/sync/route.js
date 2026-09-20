import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { isStripeConfigured, syncSubscriptionFromCheckoutSession } from "@/lib/services/billing";
import { formatUserResponse } from "@/lib/services/auth";
import { prisma } from "@/lib/db";

export async function POST(req) {
  try {
    const session = requireAuth(req);

    if (!isStripeConfigured()) {
      return apiError("Stripe billing is not configured.", 503, "BILLING_NOT_CONFIGURED");
    }

    const { sessionId } = await req.json();
    if (!sessionId?.trim()) {
      return apiError("sessionId is required.", 400, "VALIDATION_ERROR");
    }

    await syncSubscriptionFromCheckoutSession(session.userId, sessionId.trim());

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { attorney: true },
    });

    return apiSuccess({
      success: true,
      user: formatUserResponse(user, user.attorney),
    });
  } catch (error) {
    return handleApiError(error, "Failed to sync subscription.");
  }
}
