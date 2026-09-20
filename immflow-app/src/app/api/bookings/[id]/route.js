import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import {
  assertBookingAccess,
  formatBooking,
  updateBookingStatus,
  setBookingCheckoutSessionId,
  markBookingPaid,
} from "@/lib/services/bookings";
import {
  canSimulatePayments,
  createBookingCheckout,
  isStripePaymentConfigured,
  verifyBookingCheckout,
} from "@/lib/services/billing";

export async function GET(req, { params }) {
  try {
    const session = requireAuth(req);
    const { id } = await params;
    const booking = await assertBookingAccess(id, session);
    return apiSuccess(formatBooking(booking));
  } catch (error) {
    return handleApiError(error, "Failed to load booking.");
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    if (body.action === "checkout") {
      const raw = await assertBookingAccess(id, session);
      if (raw.clientId !== session.userId) {
        return apiError("Only the client can pay.", 403, "FORBIDDEN");
      }
      const booking = formatBooking(raw);
      if (!isStripePaymentConfigured()) {
        if (!canSimulatePayments()) {
          return apiError(
            "Stripe checkout is not configured.",
            503,
            "PAYMENTS_NOT_CONFIGURED"
          );
        }
        return apiSuccess({
          ...(await markBookingPaid({
            bookingId: id,
            paymentSource: "simulation",
          })),
          checkoutSimulated: true,
        });
      }
      const checkout = await createBookingCheckout({
        userId: session.userId,
        booking,
      });
      await setBookingCheckoutSessionId(id, checkout.sessionId);
      return apiSuccess(checkout);
    }

    if (body.action === "confirm_payment") {
      const verified = await verifyBookingCheckout({
        userId: session.userId,
        bookingId: id,
        sessionId: body.sessionId,
      });
      return apiSuccess(
        await markBookingPaid({
          bookingId: id,
          stripeCheckoutSessionId: verified.session.id,
          stripePaymentIntentId: verified.paymentIntentId,
          paymentSource: "stripe",
        })
      );
    }

    if (!body.status) {
      return apiError("status is required.", 400, "VALIDATION");
    }

    const booking = await updateBookingStatus({
      bookingId: id,
      session,
      nextStatus: body.status,
      providerNotes: body.providerNotes,
    });
    return apiSuccess(booking);
  } catch (error) {
    return handleApiError(error, "Failed to update booking.");
  }
}
