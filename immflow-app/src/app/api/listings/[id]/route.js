import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateUpdateListing } from "@/lib/validators/listings";
import { updateListing } from "@/lib/services/listings";

export async function PATCH(req, { params }) {
  try {
    const session = requireAuth(req);
    const listingId = parseInt(params.id, 10);
    if (Number.isNaN(listingId)) {
      return apiError("Invalid listing id.", 400, "VALIDATION_ERROR");
    }

    const body = await req.json();
    const validation = validateUpdateListing(body);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
    }

    const listing = await updateListing(listingId, validation.data, {
      userId: session.userId,
    });
    return apiSuccess(listing);
  } catch (error) {
    return handleApiError(error, "Failed to update listing.");
  }
}
