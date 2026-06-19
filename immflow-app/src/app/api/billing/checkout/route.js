import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { createCheckoutSession, isStripeConfigured } from "@/lib/services/billing";

export async function POST(req) {
  try {
    const session = requireAuth(req);

    if (!isStripeConfigured()) {
      return apiError(
        "Stripe billing is not configured. Contact support@myimmflow.com to upgrade.",
        503,
        "BILLING_NOT_CONFIGURED"
      );
    }

    const checkout = await createCheckoutSession(session.userId);
    if (!checkout.url) {
      return apiError("Failed to create checkout session.", 500, "CHECKOUT_FAILED");
    }

    return apiSuccess({ success: true, url: checkout.url, sessionId: checkout.sessionId });
  } catch (error) {
    return handleApiError(error, "Failed to start checkout.");
  }
}
