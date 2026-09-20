import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { getProviderPublicProfile } from "@/lib/services/provider-reviews";

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const providerId = parseInt(id, 10);
    if (Number.isNaN(providerId)) return apiError("Invalid id.", 400, "VALIDATION_ERROR");

    const profile = await getProviderPublicProfile(providerId);
    if (!profile) return apiError("Provider not found.", 404, "NOT_FOUND");
    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error, "Failed to load provider.");
  }
}
