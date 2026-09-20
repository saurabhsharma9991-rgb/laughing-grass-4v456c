import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/services/categories";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "categories", "view");
    const categories = await listCategories();
    return apiSuccess(categories);
  } catch (error) {
    return handleApiError(error, "Failed to fetch categories.");
  }
}

export async function POST(req) {
  try {
    await requireAdminPermission(req, "categories", "create");
    const body = await req.json();
    const category = await createCategory(body);
    return apiSuccess({ success: true, category }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create category.");
  }
}

export async function PATCH(req) {
  try {
    await requireAdminPermission(req, "categories", "edit");
    const body = await req.json();
    if (!body.id) return apiError("id is required.", 400, "VALIDATION_ERROR");
    const category = await updateCategory(body.id, body);
    return apiSuccess({ success: true, category });
  } catch (error) {
    return handleApiError(error, "Failed to update category.");
  }
}

export async function DELETE(req) {
  try {
    await requireAdminPermission(req, "categories", "delete");
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return apiError("Missing query parameter: id", 400, "VALIDATION_ERROR");
    const result = await deleteCategory(id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Failed to delete category.");
  }
}
