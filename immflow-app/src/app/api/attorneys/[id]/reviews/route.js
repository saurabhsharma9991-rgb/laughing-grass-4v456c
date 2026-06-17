import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { createReview } from "@/lib/services/reviews";

export async function POST(req, { params }) {
  try {
    const session = requireAuth(req);
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return apiError("Invalid attorney id.", 400, "VALIDATION_ERROR");

    const body = await req.json();
    const reviews = await createReview(session.userId, id, {
      rating: body.rating,
      comment: body.comment,
    });

    return apiSuccess({ success: true, reviews }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to submit review.");
  }
}
