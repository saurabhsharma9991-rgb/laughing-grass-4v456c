import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { getPlatformSettings } from "@/lib/services/platform-settings";
import { PROMO_CODE_TEST } from "@/lib/constants/platform-features";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        isPro: true,
        subscriptionPlan: true,
        promoUsed: true,
        subscriptionExpires: true,
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

    if (!settings.testMode) {
      return apiError(
        "Self-serve billing is not available yet. Contact support@myimmflow.com to upgrade.",
        501,
        "BILLING_NOT_AVAILABLE"
      );
    }

    const { promoCode, activateStripe } = await req.json();
    let updateData = null;

    if (promoCode) {
      if (promoCode.trim().toUpperCase() !== PROMO_CODE_TEST) {
        return apiError("Invalid promo code.", 400, "INVALID_PROMO");
      }
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);
      updateData = {
        isPro: true,
        subscriptionPlan: "Pro (Test promo)",
        promoUsed: PROMO_CODE_TEST,
        subscriptionExpires: expiresAt,
      };
    } else if (activateStripe) {
      updateData = {
        isPro: true,
        subscriptionPlan: "Pro (Test Stripe)",
        promoUsed: null,
        subscriptionExpires: null,
      };
    } else {
      return apiError("Invalid request parameters.", 400, "VALIDATION_ERROR");
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
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
  } catch (error) {
    return handleApiError(error, "Failed to update subscription.");
  }
}

export async function DELETE(req) {
  try {
    const session = requireAuth(req);
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        isPro: false,
        subscriptionPlan: "Free",
        promoUsed: null,
        subscriptionExpires: null,
      },
      select: {
        id: true,
        email: true,
        isPro: true,
        subscriptionPlan: true,
      },
    });

    return apiSuccess({ success: true, user });
  } catch (error) {
    return handleApiError(error, "Failed to cancel subscription.");
  }
}
