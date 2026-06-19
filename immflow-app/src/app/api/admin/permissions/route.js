import { requireAdmin } from "@/lib/auth/guards";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { ADMIN_RESOURCES } from "@/lib/constants/admin-permissions";

export async function GET(req) {
  try {
    await requireAdmin(req);
    return apiSuccess({ resources: ADMIN_RESOURCES });
  } catch (error) {
    return handleApiError(error, "Failed to load permission schema.");
  }
}
