import { requireAuth } from "@/lib/auth/guards";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import {
  getProviderForUser,
  updateProviderSelf,
} from "@/lib/services/providers";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const provider = await getProviderForUser(session.userId);
    if (!provider) return apiError("Provider profile not found.", 404, "NOT_FOUND");
    return apiSuccess(provider);
  } catch (error) {
    return handleApiError(error, "Failed to load provider profile.");
  }
}

export async function PATCH(req) {
  try {
    const session = requireAuth(req);
    const body = await req.json();
    const provider = await updateProviderSelf(session.userId, body);
    return apiSuccess(provider);
  } catch (error) {
    return handleApiError(error, "Failed to update provider profile.");
  }
}
