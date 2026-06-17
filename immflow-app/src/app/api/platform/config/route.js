import { apiSuccess, handleApiError } from "@/lib/api/response";
import { getPlatformSettings } from "@/lib/services/platform-settings";

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return apiSuccess({
      testMode: settings.testMode,
      features: settings.features,
      freeListingLimit: settings.freeListingLimit,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load platform config.");
  }
}
