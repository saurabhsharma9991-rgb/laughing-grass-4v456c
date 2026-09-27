import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import {
  listCmsPages,
  createCmsPage,
  updateCmsPage,
  deleteCmsPage,
} from "@/lib/services/cms-pages";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "cms", "view");
    const pages = await listCmsPages({ publishedOnly: false });
    return apiSuccess(pages);
  } catch (error) {
    return handleApiError(error, "Failed to fetch pages.");
  }
}

export async function POST(req) {
  try {
    await requireAdminPermission(req, "cms", "create");
    const body = await req.json();
    const page = await createCmsPage(body);
    return apiSuccess({ success: true, page }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create page.");
  }
}

export async function PATCH(req) {
  try {
    await requireAdminPermission(req, "cms", "edit");
    const body = await req.json();
    if (!body.id) return apiError("id is required.", 400, "VALIDATION_ERROR");
    const page = await updateCmsPage(body.id, body);
    return apiSuccess({ success: true, page });
  } catch (error) {
    return handleApiError(error, "Failed to update page.");
  }
}

export async function DELETE(req) {
  try {
    await requireAdminPermission(req, "cms", "delete");
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return apiError("Missing query parameter: id", 400, "VALIDATION_ERROR");
    const result = await deleteCmsPage(id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Failed to delete page.");
  }
}
