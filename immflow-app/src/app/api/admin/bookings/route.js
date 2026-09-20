import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/guards";
import {
  listBookings,
  updateBookingStatus,
  assignProviderToBooking,
} from "@/lib/services/bookings";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "bookings", "view");
    const params = new URL(req.url).searchParams;
    const bookings = await listBookings({
      includeAll: true,
      bookingType: params.get("type") || undefined,
      status: params.get("status") || undefined,
    });
    return apiSuccess(bookings);
  } catch (error) {
    return handleApiError(error, "Failed to list bookings.");
  }
}

export async function PATCH(req) {
  try {
    const { session } = await requireAdminPermission(req, "bookings", "edit");
    const body = await req.json();
    if (!body.id) return apiError("id required.", 400, "VALIDATION");

    if (body.status) {
      const booking = await updateBookingStatus({
        bookingId: body.id,
        session,
        nextStatus: body.status,
        providerNotes: body.providerNotes,
        isAdmin: true,
      });
      return apiSuccess(booking);
    }

    if (body.providerId != null) {
      const updated = await assignProviderToBooking({
        bookingId: body.id,
        providerId: body.providerId,
        session,
        isAdmin: true,
      });
      return apiSuccess(updated);
    }

    return apiError("No valid update.", 400, "BAD_REQUEST");
  } catch (error) {
    return handleApiError(error, "Failed to update booking.");
  }
}
