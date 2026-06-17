import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";

const PROMO_CODE = process.env.IMMFLOW_PROMO_CODE || "IMMFLOW2026";

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
    const { promoCode, activateStripe } = await req.json();
    let updateData = null;

    if (promoCode) {
      if (promoCode.trim().toUpperCase() !== PROMO_CODE) {
        return apiError("Invalid promo code.", 400, "INVALID_PROMO");
      }
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);
      updateData = {
        isPro: true,
        subscriptionPlan: "Pro (Promo)",
        promoUsed: PROMO_CODE,
        subscriptionExpires: expiresAt,
      };
    } else if (activateStripe) {
      updateData = {
        isPro: true,
        subscriptionPlan: "Pro (Stripe)",
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

    return apiSuccess({ success: true, user });
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
