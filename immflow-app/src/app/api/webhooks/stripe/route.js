import { NextResponse } from "next/server";
import { getStripe, activateProFromStripe, deactivateProFromStripe, resolveUserIdFromStripeEvent } from "@/lib/services/billing";
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
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid" ||
          subscription.status === "past_due"
        ) {
          // Keep Pro until deleted unless explicitly canceled at period end — downgrade on delete event
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

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe webhook] handler error:", error);
    return NextResponse.json(
      { error: { message: "Webhook handler failed.", code: "WEBHOOK_HANDLER_ERROR" } },
      { status: 500 }
    );
  }
}
