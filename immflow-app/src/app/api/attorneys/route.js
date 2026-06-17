import { apiSuccess, handleApiError } from "@/lib/api/response";
import { listAttorneys } from "@/lib/services/attorneys";

export async function GET() {
  try {
    const attorneys = await listAttorneys();
    return apiSuccess(attorneys);
  } catch (error) {
    return handleApiError(error, "Failed to fetch attorneys.");
  }
}
