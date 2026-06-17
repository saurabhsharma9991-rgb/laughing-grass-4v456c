import { apiSuccess, handleApiError } from "@/lib/api/response";
import { getPlatformStats } from "@/lib/services/applications";

export async function GET() {
  try {
    const stats = await getPlatformStats();
    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error, "Failed to fetch platform stats.");
  }
}
