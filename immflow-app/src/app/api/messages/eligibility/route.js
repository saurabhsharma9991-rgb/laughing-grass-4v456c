import { requireAuth } from "@/lib/auth/guards";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import {
  paidMessagingStatus,
  PAYMENT_REQUIRED_MESSAGE,
} from "@/lib/services/messaging-access";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const userId = Number(new URL(req.url).searchParams.get("userId"));
    if (!Number.isFinite(userId) || userId <= 0) {
      return apiError("userId is required.", 400, "VALIDATION_ERROR");
    }
    if (session.role === "admin") {
      return apiSuccess({ allowed: true, requiresPayment: false });
    }
    const access = await paidMessagingStatus(session.userId, userId);
    const allowed = !access.requiresPayment || access.hasPaid;
    return apiSuccess({
      allowed,
      requiresPayment: access.requiresPayment,
      message: allowed ? null : PAYMENT_REQUIRED_MESSAGE,
    });
  } catch (error) {
    return handleApiError(error, "Failed to check messaging access.");
  }
}
