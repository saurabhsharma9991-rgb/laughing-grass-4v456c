import { NextResponse } from "next/server";
import {
  getStripe,
  activateProFromStripe,
  deactivateProFromStripe,
  resolveUserIdFromStripeEvent,
} from "@/lib/services/billing";
import {
  markOrderPaid,
  findOrderByCheckoutSession,
  markOrderRefundedByPaymentIntent,
} from "@/lib/services/translation-orders";
import {
  findBookingByCheckoutSession,
  markBookingPaid,
  markBookingRefundedByPaymentIntent,
} from "@/lib/services/bookings";
import { notifySubscriptionRenewal } from "@/lib/email/notify";
import { logEvent } from "@/lib/logger";

export async function POST(req) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: { message: "Stripe webhooks are not configured.", code: "WEBHOOK_NOT_CONFIGURED" } },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: { message: "Missing stripe-signature header.", code: "MISSING_SIGNATURE" } },
      { status: 400 }
    );
  }

  let event;
  const rawBody = await req.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err.message);
    return NextResponse.json(
      { error: { message: "Invalid webhook signature.", code: "INVALID_SIGNATURE" } },
      { status: 400 }
    );
  }

  try {
    logEvent("stripe", "webhook_received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (
          session.mode === "payment" &&
          session.metadata?.immflowPaymentType === "translation_order"
        ) {
          const orderId = parseInt(session.metadata.immflowOrderId, 10);
          const order = await findOrderByCheckoutSession(session.id);
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

          const validPayment =
            order &&
            session.payment_status === "paid" &&
            Number(session.amount_total) === Number(order.priceCents) &&
            String(session.currency || "").toLowerCase() ===
              String(order.currency || "usd").toLowerCase() &&
            Number(session.metadata?.immflowOrderId) === Number(order.id) &&
            Number(session.metadata?.immflowUserId) === Number(order.clientId);

          if (validPayment) {
            await markOrderPaid({
              orderId: order.id,
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              paymentSource: "stripe",
            });
            logEvent("stripe", "translation_order_paid", {
              orderId: order.id,
              sessionId: session.id,
            });
          } else {
            logEvent("stripe", "translation_order_payment_rejected", {
              orderId: orderId || null,
              sessionId: session.id,
            });
          }
          break;
        }

        if (
          session.mode === "payment" &&
          session.metadata?.immflowPaymentType === "service_booking"
        ) {
          const booking = await findBookingByCheckoutSession(session.id);
          const validPayment =
            booking &&
            session.payment_status === "paid" &&
            Number(session.metadata?.immflowBookingId) === Number(booking.id) &&
            Number(session.metadata?.immflowUserId) === Number(booking.clientId) &&
            Number(session.amount_total) === Number(booking.priceCents) &&
            String(session.currency || "").toLowerCase() ===
              String(booking.currency || "usd").toLowerCase();
          if (validPayment) {
            await markBookingPaid({
              bookingId: booking.id,
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent?.id,
              paymentSource: "stripe",
            });
            logEvent("stripe", "service_booking_paid", {
              bookingId: booking.id,
              sessionId: session.id,
            });
          } else {
            logEvent("stripe", "service_booking_payment_rejected", {
              sessionId: session.id,
            });
          }
          break;
        }

        if (session.mode !== "subscription") break;

        const userId = await resolveUserIdFromStripeEvent(session);
        if (!userId) break;

        await activateProFromStripe({
          userId,
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : session.customer?.id,
          stripeSubscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id,
        });
        logEvent("stripe", "pro_activated", { userId, source: "checkout" });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId = await resolveUserIdFromStripeEvent(subscription);
        if (!userId) break;

        if (subscription.status === "active" || subscription.status === "trialing") {
          await activateProFromStripe({
            userId,
            stripeCustomerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer?.id,
            stripeSubscriptionId: subscription.id,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = await resolveUserIdFromStripeEvent(subscription);
        if (userId) {
          await deactivateProFromStripe(userId);
          logEvent("stripe", "pro_deactivated", { userId, source: "subscription_deleted" });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (paymentIntentId) {
          const [order, booking] = await Promise.all([
            markOrderRefundedByPaymentIntent(paymentIntentId),
            markBookingRefundedByPaymentIntent(paymentIntentId),
          ]);
          logEvent("stripe", "marketplace_payment_refunded", {
            paymentIntentId,
            orderId: order?.id || null,
            bookingId: booking?.id || null,
          });
        }
        break;
      }

      case "invoice.upcoming": {
        const invoice = event.data.object;
        const userId = await resolveUserIdFromStripeEvent(invoice);
        if (!userId) break;

        const renewalDate = invoice.period_end
          ? new Date(invoice.period_end * 1000).toLocaleDateString("en-US", { dateStyle: "long" })
          : "soon";
        const amount =
          invoice.amount_due != null
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: (invoice.currency || "usd").toUpperCase(),
              }).format(invoice.amount_due / 100)
            : null;

        await notifySubscriptionRenewal({ userId, renewalDate, amount });
        logEvent("stripe", "renewal_reminder_sent", { userId });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json(
      { error: { message: "Webhook handler failed.", code: "WEBHOOK_HANDLER_ERROR" } },
      { status: 500 }
    );
  }
}
