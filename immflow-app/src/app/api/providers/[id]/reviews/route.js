import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import {
  createProviderReview,
  getProviderPublicProfile,
} from "@/lib/services/provider-reviews";

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const providerId = parseInt(id, 10);
    if (Number.isNaN(providerId)) return apiError("Invalid id.", 400, "VALIDATION_ERROR");
    const provider = await getProviderPublicProfile(providerId);
    if (!provider) return apiError("Provider not found.", 404, "NOT_FOUND");
    return apiSuccess(provider.reviewsList || []);
  } catch (error) {
    return handleApiError(error, "Failed to load reviews.");
  }
}

export async function POST(req, { params }) {
  try {
    const session = requireAuth(req);
    const { id } = await params;
    const providerId = parseInt(id, 10);
    if (Number.isNaN(providerId)) return apiError("Invalid id.", 400, "VALIDATION_ERROR");

    const body = await req.json();
    const reviews = await createProviderReview(session.userId, providerId, body);
    return apiSuccess({ success: true, reviews }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to submit review.");
  }
}
