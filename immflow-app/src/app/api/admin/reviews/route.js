import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { listAllReviewsForAdmin, deleteReview } from "@/lib/services/reviews";
import {
  listAllProviderReviewsForAdmin,
  deleteProviderReview,
} from "@/lib/services/provider-reviews";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "reviews", "view");
    const [attorneyReviews, providerReviews] = await Promise.all([
      listAllReviewsForAdmin(),
      listAllProviderReviewsForAdmin(),
    ]);
    return apiSuccess(
      [...attorneyReviews, ...providerReviews].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch reviews.");
  }
}

export async function DELETE(req) {
  try {
    await requireAdminPermission(req, "reviews", "delete");
    const idStr = new URL(req.url).searchParams.get("id");
    const type = new URL(req.url).searchParams.get("type") || "attorney";
    if (!idStr) return apiError("Missing query parameter: id", 400, "VALIDATION_ERROR");

    const result =
      type === "provider"
        ? await deleteProviderReview(parseInt(idStr, 10))
        : await deleteReview(parseInt(idStr, 10));
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Failed to delete review.");
  }
}
