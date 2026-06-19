import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { updateApplicationStatus } from "@/lib/services/applications";

export async function PATCH(req, { params }) {
  try {
    const session = requireAuth(req);
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return apiError("Invalid application id.", 400, "VALIDATION_ERROR");

    const { status } = await req.json();
    if (!status) return apiError("status is required.", 400, "VALIDATION_ERROR");

    const result = await updateApplicationStatus(id, session.userId, status);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Failed to update application.");
  }
}
