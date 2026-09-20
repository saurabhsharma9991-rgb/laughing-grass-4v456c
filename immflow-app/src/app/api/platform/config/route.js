import { apiSuccess, handleApiError } from "@/lib/api/response";
import { getPlatformSettings } from "@/lib/services/platform-settings";
import { getSubscriptionPrice } from "@/lib/services/billing";

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    let subscriptionPrice = null;
    try {
      subscriptionPrice = await getSubscriptionPrice();
    } catch (error) {
      console.error("[platform-config] Failed to load Stripe subscription price:", error.message);
    }
    return apiSuccess({
      testMode: settings.testMode,
      features: settings.features,
      freeListingLimit: settings.freeListingLimit,
      subscriptionPrice,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load platform config.");
  }
}
