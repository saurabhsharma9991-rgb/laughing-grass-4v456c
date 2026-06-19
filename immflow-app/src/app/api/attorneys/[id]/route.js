import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { getAttorneyPublicProfile } from "@/lib/services/reviews";

export async function GET(req, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return apiError("Invalid attorney id.", 400, "VALIDATION_ERROR");

    const profile = await getAttorneyPublicProfile(id);
    if (!profile) return apiError("Attorney not found.", 404, "NOT_FOUND");

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error, "Failed to load attorney profile.");
  }
}
