import { requireAdmin } from "@/lib/auth/guards";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { formatAdminUserResponse } from "@/lib/services/admin-rbac";
import { ADMIN_RESOURCES } from "@/lib/constants/admin-permissions";

export async function GET(req) {
  try {
    const { access } = await requireAdmin(req);
    return apiSuccess(formatAdminUserResponse(access.user));
  } catch (error) {
    return handleApiError(error, "Failed to load admin session.");
  }
}

export async function POST(req) {
  try {
    const { access } = await requireAdmin(req);
    return apiSuccess({
      user: formatAdminUserResponse(access.user),
      resources: ADMIN_RESOURCES,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load admin session.");
  }
}
