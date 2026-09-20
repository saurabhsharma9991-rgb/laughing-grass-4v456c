import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import {
  assertOrderAccess,
  formatOrder,
  updateOrderStatus,
  assignProviderToOrder,
  markOrderPaid,
  setCheckoutSessionId,
} from "@/lib/services/translation-orders";
import {
  createTranslationOrderCheckout,
  isStripePaymentConfigured,
  canSimulatePayments,
  verifyTranslationOrderCheckout,
} from "@/lib/services/billing";

export async function GET(req, { params }) {
  try {
    const session = requireAuth(req);
    const { id } = await params;
    const order = await assertOrderAccess(id, session);
    return apiSuccess(formatOrder(order));
  } catch (error) {
    return handleApiError(error, "Failed to load order.");
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    if (body.action === "assign_provider") {
      const order = await assignProviderToOrder(id, body.providerId, session);
      return apiSuccess(order);
    }

    if (body.action === "checkout") {
      const raw = await assertOrderAccess(id, session);
      if (raw.clientId !== session.userId) {
        return apiError("Only the client can pay for this order.", 403, "FORBIDDEN");
      }
      const formatted = formatOrder(raw);

      if (!isStripePaymentConfigured()) {
        if (!canSimulatePayments()) {
          return apiError(
            "Stripe checkout is not configured.",
            503,
            "PAYMENTS_NOT_CONFIGURED"
          );
        }
        const paid = await markOrderPaid({
          orderId: Number(id),
          paymentSource: "simulation",
        });
        return apiSuccess({ ...paid, checkoutSimulated: true });
      }

      const { url, sessionId } = await createTranslationOrderCheckout({
        userId: session.userId,
        order: formatted,
      });
      await setCheckoutSessionId(id, sessionId);
      return apiSuccess({ url, sessionId });
    }

    if (body.action === "confirm_payment") {
      const verified = await verifyTranslationOrderCheckout({
        userId: session.userId,
        orderId: Number(id),
        sessionId: body.sessionId,
      });
      const paid = await markOrderPaid({
        orderId: verified.order.id,
        stripeCheckoutSessionId: verified.session.id,
        stripePaymentIntentId: verified.paymentIntentId,
        paymentSource: "stripe",
      });
      return apiSuccess(paid);
    }

    if (body.status) {
      const order = await updateOrderStatus({
        orderId: id,
        session,
        nextStatus: body.status,
        providerNotes: body.providerNotes,
      });
      return apiSuccess(order);
    }

    return apiError("No valid action.", 400, "BAD_REQUEST");
  } catch (error) {
    return handleApiError(error, "Failed to update order.");
  }
}
