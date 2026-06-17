import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/auth-tokens";

let stripeClient = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PRICE_ID?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim()
  );
}

export async function getOrCreateStripeCustomer(user) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { immflowUserId: String(user.id) },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(userId) {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  if (!stripe || !priceId) {
    throw new Error("Stripe checkout is not configured.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeCustomerId: true },
  });
  if (!user) throw new Error("User not found.");

  const customerId = await getOrCreateStripeCustomer(user);
  const base = appBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/dashboard?billing=success`,
    cancel_url: `${base}/dashboard?billing=cancelled`,
    metadata: { immflowUserId: String(user.id) },
    subscription_data: {
      metadata: { immflowUserId: String(user.id) },
    },
  });

  return { url: session.url, sessionId: session.id };
}

export async function activateProFromStripe({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  planLabel = "Pro (Stripe)",
}) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isPro: true,
      subscriptionPlan: planLabel,
      stripeCustomerId: stripeCustomerId || undefined,
      stripeSubscriptionId: stripeSubscriptionId || undefined,
      promoUsed: null,
      subscriptionExpires: null,
    },
    select: {
      id: true,
      email: true,
      isPro: true,
      subscriptionPlan: true,
      subscriptionExpires: true,
    },
  });
}

export async function deactivateProFromStripe(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isPro: false,
      subscriptionPlan: "Free",
      stripeSubscriptionId: null,
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
}

export async function resolveUserIdFromStripeEvent(object) {
  const metaUserId = object?.metadata?.immflowUserId;
  if (metaUserId) return parseInt(metaUserId, 10);

  const customerId =
    typeof object?.customer === "string" ? object.customer : object?.customer?.id;

  if (customerId) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (user) return user.id;
  }

  return null;
}

export async function createBillingPortalSession(userId) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeCustomerId: true },
  });
  if (!user) throw new Error("User not found.");

  const customerId = await getOrCreateStripeCustomer(user);
  const base = appBaseUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${base}/dashboard`,
  });

  return session.url;
}
