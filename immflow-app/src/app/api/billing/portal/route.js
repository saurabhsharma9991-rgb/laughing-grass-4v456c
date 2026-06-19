import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { createBillingPortalSession, isStripeConfigured } from "@/lib/services/billing";

export async function POST(req) {
  try {
    const session = requireAuth(req);

    if (!isStripeConfigured()) {
      return apiError("Stripe billing is not configured.", 503, "BILLING_NOT_CONFIGURED");
    }

    const url = await createBillingPortalSession(session.userId);
    if (!url) {
      return apiError("Failed to open billing portal.", 500, "PORTAL_FAILED");
    }

    return apiSuccess({ success: true, url });
  } catch (error) {
    return handleApiError(error, "Failed to open billing portal.");
  }
}
