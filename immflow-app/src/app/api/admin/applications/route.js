import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import {
  listAllApplicationsForAdmin,
  updateApplicationStatusAsAdmin,
  deleteApplicationAsAdmin,
} from "@/lib/services/applications";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "applications", "view");
    const params = new URL(req.url).searchParams;
    const applications = await listAllApplicationsForAdmin({
      status: params.get("status") || "all",
      listingId: params.get("listingId"),
    });
    return apiSuccess(applications);
  } catch (error) {
    return handleApiError(error, "Failed to fetch applications.");
  }
}

export async function PATCH(req) {
  try {
    await requireAdminPermission(req, "applications", "edit");
    const { id, status } = await req.json();
    if (!id || !status) return apiError("id and status are required.", 400, "VALIDATION_ERROR");

    const result = await updateApplicationStatusAsAdmin(parseInt(id, 10), status);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Failed to update application.");
  }
}

export async function DELETE(req) {
  try {
    await requireAdminPermission(req, "applications", "delete");
    const idStr = new URL(req.url).searchParams.get("id");
    if (!idStr) return apiError("Missing query parameter: id", 400, "VALIDATION_ERROR");

    const result = await deleteApplicationAsAdmin(parseInt(idStr, 10));
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Failed to delete application.");
  }
}
