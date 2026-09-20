import { prisma } from "@/lib/db";
import { PROMO_CODE_TEST } from "@/lib/constants/platform-features";
import { deactivateProFromStripe, getStripe } from "@/lib/services/billing";

const PROMO_MONTHS = 3;

export async function enforceSubscriptionExpiry(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isPro: true,
      subscriptionExpires: true,
      stripeSubscriptionId: true,
      promoUsed: true,
    },
  });

  if (!user?.isPro || !user.subscriptionExpires) return user;

  if (user.subscriptionExpires > new Date()) return user;

  if (user.stripeSubscriptionId) return user;

  await deactivateProFromStripe(userId);
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isPro: true,
      subscriptionExpires: true,
      stripeSubscriptionId: true,
      promoUsed: true,
    },
  });
}

export function buildPromoExpiry() {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + PROMO_MONTHS);
  return expiresAt;
}

export async function applyLaunchPromo(userId, promoCode) {
  const normalized = promoCode?.trim().toUpperCase();
  if (normalized !== PROMO_CODE_TEST) {
    throw new Error("Invalid promo code.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { promoUsed: true, isPro: true },
  });
  if (!user) throw new Error("User not found.");
  if (user.promoUsed === PROMO_CODE_TEST) {
    throw new Error("This promo code has already been used on your account.");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      isPro: true,
      subscriptionPlan: "Pro (Promo)",
      promoUsed: PROMO_CODE_TEST,
      subscriptionExpires: buildPromoExpiry(),
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
}

export async function cancelUserSubscription(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });
  if (!user) throw new Error("User not found.");

  if (user.stripeSubscriptionId) {
    const stripe = getStripe();
    if (stripe) {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    }
  }

  return deactivateProFromStripe(userId);
}
