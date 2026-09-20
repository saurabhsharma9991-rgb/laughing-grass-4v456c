import { apiSuccess, handleApiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { createBooking, listBookings } from "@/lib/services/bookings";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const params = new URL(req.url).searchParams;
    const scope = params.get("scope") || "mine";
    const bookingType = params.get("type") || undefined;
    const status = params.get("status") || undefined;

    const bookings =
      scope === "provider"
        ? await listBookings({
            providerUserId: session.userId,
            bookingType,
            status,
          })
        : await listBookings({
            clientId: session.userId,
            bookingType,
            status,
          });

    return apiSuccess(bookings);
  } catch (error) {
    return handleApiError(error, "Failed to list bookings.");
  }
}

export async function POST(req) {
  try {
    const session = requireAuth(req);
    const body = await req.json();
    const booking = await createBooking(session.userId, body);
    return apiSuccess(booking, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create booking.");
  }
}
