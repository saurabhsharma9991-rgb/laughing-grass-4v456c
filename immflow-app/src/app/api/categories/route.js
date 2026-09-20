import { apiSuccess, handleApiError } from "@/lib/api/response";
import { listCategories, getCategoryBySlug } from "@/lib/services/categories";

/** Public: active service categories for marketplace nav/home. */
export async function GET(req) {
  try {
    const slug = new URL(req.url).searchParams.get("slug");
    if (slug) {
      const category = await getCategoryBySlug(slug);
      if (!category || !category.isActive) {
        return apiSuccess(null);
      }
      return apiSuccess(category);
    }
    const categories = await listCategories({ activeOnly: true });
    return apiSuccess(categories);
  } catch (error) {
    return handleApiError(error, "Failed to fetch categories.");
  }
}
