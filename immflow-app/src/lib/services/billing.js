import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/auth-tokens";
import { AuthError } from "@/lib/auth/guards.js";

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
    success_url: `${base}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/dashboard?billing=cancelled`,
    allow_promotion_codes: true,
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

export async function syncSubscriptionFromCheckoutSession(userId, sessionId) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");
  if (!sessionId) throw new Error("session_id is required.");

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const sessionUserId = session.metadata?.immflowUserId
    ? parseInt(session.metadata.immflowUserId, 10)
    : null;

  if (sessionUserId !== userId) {
    throw new Error("Checkout session does not belong to this user.");
  }

  if (session.status !== "complete" || session.mode !== "subscription") {
    throw new Error("Checkout session is not complete.");
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  return activateProFromStripe({
    userId,
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : session.customer?.id,
    stripeSubscriptionId: subscriptionId,
    planLabel: "Pro (Stripe)",
  });
}

export async function fetchStripeBillingSummary() {
  const stripe = getStripe();
  if (!stripe) {
    return {
      configured: false,
      activeSubscriptions: 0,
      mrrCents: 0,
      recentPayments: [],
    };
  }

  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    limit: 100,
    expand: ["data.items.data.price"],
  });

  let mrrCents = 0;
  for (const sub of subscriptions.data) {
    for (const item of sub.items?.data || []) {
      const unit = item.price?.unit_amount || 0;
      mrrCents += unit * (item.quantity || 1);
    }
  }

  const charges = await stripe.charges.list({ limit: 8 });

  return {
    configured: true,
    activeSubscriptions: subscriptions.data.length,
    mrrCents,
    mrrUsd: (mrrCents / 100).toFixed(2),
    recentPayments: charges.data.map((c) => ({
      id: c.id,
      amount: (c.amount / 100).toFixed(2),
      currency: c.currency?.toUpperCase(),
      created: new Date(c.created * 1000).toISOString(),
      paid: c.paid,
      email: c.billing_details?.email || null,
    })),
  };
}

/** One-time Checkout for a translation order (mode: payment). */
export async function createTranslationOrderCheckout({ userId, order }) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }
  if (!order?.priceCents || order.priceCents < 50) {
    throw new Error("Order price is invalid.");
  }
  if (order.status !== "pending_payment") {
    throw new Error("Order is not awaiting payment.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeCustomerId: true },
  });
  if (!user) throw new Error("User not found.");

  const customerId = await getOrCreateStripeCustomer(user);
  const base = appBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (order.currency || "usd").toLowerCase(),
          unit_amount: order.priceCents,
          product_data: {
            name: `Translation: ${order.sourceLanguage} → ${order.targetLanguage}`,
            description: `${order.documentType} · ${order.translationType} · ${order.turnaround}`,
          },
        },
      },
    ],
    success_url: `${base}/dashboard?tab=orders&order=${order.id}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/dashboard?tab=orders&order=${order.id}&paid=0`,
    metadata: {
      immflowUserId: String(user.id),
      immflowOrderId: String(order.id),
      immflowPaymentType: "translation_order",
    },
    payment_intent_data: {
      metadata: {
        immflowUserId: String(user.id),
        immflowOrderId: String(order.id),
        immflowPaymentType: "translation_order",
      },
    },
  });

  return { url: session.url, sessionId: session.id };
}

/** Dev/fallback: mark order paid without Stripe when Stripe is not configured. */
export function isStripePaymentConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function canSimulatePayments() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_SIMULATED_PAYMENTS === "true"
  );
}

export function isMatchingTranslationCheckout(order, session) {
  return Boolean(
    order &&
      session?.mode === "payment" &&
      session.payment_status === "paid" &&
      Number(session.metadata?.immflowOrderId) === Number(order.id) &&
      Number(session.metadata?.immflowUserId) === Number(order.clientId) &&
      session.metadata?.immflowPaymentType === "translation_order" &&
      Number(session.amount_total) === Number(order.priceCents) &&
      String(session.currency || "").toLowerCase() ===
        String(order.currency || "usd").toLowerCase()
  );
}

export function isMatchingBookingCheckout(booking, session) {
  return Boolean(
    booking &&
      session?.mode === "payment" &&
      session.payment_status === "paid" &&
      Number(session.metadata?.immflowBookingId) === Number(booking.id) &&
      Number(session.metadata?.immflowUserId) === Number(booking.clientId) &&
      session.metadata?.immflowPaymentType === "service_booking" &&
      Number(session.amount_total) === Number(booking.priceCents) &&
      String(session.currency || "").toLowerCase() ===
        String(booking.currency || "usd").toLowerCase()
  );
}

/**
 * Verify one-time translation payment with Stripe. A success URL is not proof
 * of payment; the Checkout Session must be paid and match the stored order.
 */
export async function verifyTranslationOrderCheckout({
  userId,
  orderId,
  sessionId,
}) {
  const stripe = getStripe();
  if (!stripe) {
    throw new AuthError("Stripe checkout is not configured.", 503, "PAYMENTS_NOT_CONFIGURED");
  }
  if (!sessionId) {
    throw new AuthError("Checkout session is required.", 400, "MISSING_SESSION");
  }

  const order = await prisma.translationOrder.findUnique({
    where: { id: Number(orderId) },
  });
  if (!order || order.clientId !== Number(userId)) {
    throw new AuthError("Order not found.", 404, "NOT_FOUND");
  }
  if (
    order.stripeCheckoutSessionId &&
    order.stripeCheckoutSessionId !== sessionId
  ) {
    throw new AuthError("Checkout session does not match this order.", 400, "SESSION_MISMATCH");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!isMatchingTranslationCheckout(order, session)) {
    throw new AuthError(
      "Stripe has not confirmed the expected payment for this order.",
      402,
      "PAYMENT_NOT_CONFIRMED"
    );
  }

  return {
    order,
    session,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
  };
}

export async function createBookingCheckout({ userId, booking }) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");
  if (!booking?.priceCents || booking.priceCents < 50) {
    throw new AuthError("Booking price is invalid.", 400, "INVALID_PRICE");
  }
  if (booking.status !== "pending_payment") {
    throw new AuthError("Booking is not awaiting payment.", 409, "NOT_PAYABLE");
  }
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, email: true, stripeCustomerId: true },
  });
  if (!user) throw new AuthError("User not found.", 404, "NOT_FOUND");
  const customerId = await getOrCreateStripeCustomer(user);
  const base = appBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (booking.currency || "usd").toLowerCase(),
          unit_amount: booking.priceCents,
          product_data: {
            name: `${booking.bookingType} service booking`,
            description: `${booking.serviceType || "Professional service"} · ${booking.durationMinutes || ""} minutes`,
          },
        },
      },
    ],
    success_url: `${base}/dashboard?tab=bookings&booking=${booking.id}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/dashboard?tab=bookings&booking=${booking.id}&paid=0`,
    metadata: {
      immflowUserId: String(user.id),
      immflowBookingId: String(booking.id),
      immflowPaymentType: "service_booking",
    },
    payment_intent_data: {
      metadata: {
        immflowUserId: String(user.id),
        immflowBookingId: String(booking.id),
        immflowPaymentType: "service_booking",
      },
    },
  });
  return { url: session.url, sessionId: session.id };
}

export async function verifyBookingCheckout({ userId, bookingId, sessionId }) {
  const stripe = getStripe();
  if (!stripe) {
    throw new AuthError("Stripe checkout is not configured.", 503, "PAYMENTS_NOT_CONFIGURED");
  }
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: Number(bookingId) },
  });
  if (!booking || booking.clientId !== Number(userId)) {
    throw new AuthError("Booking not found.", 404, "NOT_FOUND");
  }
  if (
    !sessionId ||
    (booking.stripeCheckoutSessionId &&
      booking.stripeCheckoutSessionId !== sessionId)
  ) {
    throw new AuthError("Checkout session does not match.", 400, "SESSION_MISMATCH");
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!isMatchingBookingCheckout(booking, session)) {
    throw new AuthError("Stripe has not confirmed this payment.", 402, "PAYMENT_NOT_CONFIRMED");
  }
  return {
    booking,
    session,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
  };
}
