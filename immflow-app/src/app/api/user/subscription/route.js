import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { getPlatformSettings } from "@/lib/services/platform-settings";
import {
  applyLaunchPromo,
  cancelUserSubscription,
  enforceSubscriptionExpiry,
} from "@/lib/services/subscription";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    await enforceSubscriptionExpiry(session.userId);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        isPro: true,
        subscriptionPlan: true,
        promoUsed: true,
        subscriptionExpires: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) return apiError("User not found.", 404, "NOT_FOUND");
    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error, "Failed to fetch subscription.");
  }
}

export async function POST(req) {
  try {
    const session = requireAuth(req);
    const settings = await getPlatformSettings();
    const { promoCode, activateStripe } = await req.json();

    if (promoCode) {
      const user = await applyLaunchPromo(session.userId, promoCode);
      return apiSuccess({ success: true, user });
    }

    if (activateStripe) {
      if (!settings.testMode) {
        return apiError(
          "Test Stripe simulation is only available when test mode is enabled.",
          403,
          "TEST_MODE_REQUIRED"
        );
      }

      const user = await prisma.user.update({
        where: { id: session.userId },
        data: {
          isPro: true,
          subscriptionPlan: "Pro (Test Stripe)",
          promoUsed: null,
          subscriptionExpires: null,
        },
        select: {
          id: true,
          email: true,
          isPro: true,
          subscriptionPlan: true,
          promoUsed: true,
          subscriptionExpires: true,
        },
      });

      return apiSuccess({ success: true, user, testMode: true });
    }

    return apiError("Invalid request parameters.", 400, "VALIDATION_ERROR");
  } catch (error) {
    if (error.message === "Invalid promo code." || error.message.includes("promo code")) {
      return apiError(error.message, 400, "INVALID_PROMO");
    }
    return handleApiError(error, "Failed to update subscription.");
  }
}

export async function DELETE(req) {
  try {
    const session = requireAuth(req);
    const user = await cancelUserSubscription(session.userId);
    return apiSuccess({ success: true, user });
  } catch (error) {
    return handleApiError(error, "Failed to cancel subscription.");
  }
}
