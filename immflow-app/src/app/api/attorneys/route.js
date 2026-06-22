import { apiSuccess, handleApiError } from "@/lib/api/response";
import { searchAttorneys } from "@/lib/services/attorney-search";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const attorneys = await searchAttorneys({
      q: searchParams.get("q") || "",
      location: searchParams.get("location") || "",
      specialty: searchParams.get("specialty") || "",
      language: searchParams.get("language") || "",
      availability: searchParams.get("availability") || "",
      minRate: searchParams.get("minRate") || "",
      maxRate: searchParams.get("maxRate") || "",
      sort: searchParams.get("sort") || "relevance",
    });
    return apiSuccess(attorneys);
  } catch (error) {
    return handleApiError(error, "Failed to fetch attorneys.");
  }
}
