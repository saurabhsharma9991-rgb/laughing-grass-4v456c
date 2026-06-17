import { requireAdmin } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { updatePlatformSettings, getPlatformSettings } from "@/lib/services/platform-settings";

export async function GET(req) {
  try {
    requireAdmin(req);
    const settings = await getPlatformSettings();
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error, "Failed to load platform settings.");
  }
}

export async function PATCH(req) {
  try {
    requireAdmin(req);
    const body = await req.json();

    if (body.features && typeof body.features !== "object") {
      return apiError("features must be an object.", 400, "VALIDATION_ERROR");
    }

    const settings = await updatePlatformSettings({
      testMode: body.testMode,
      features: body.features,
      freeListingLimit: body.freeListingLimit,
    });

    return apiSuccess({ success: true, ...settings });
  } catch (error) {
    return handleApiError(error, "Failed to update platform settings.");
  }
}
