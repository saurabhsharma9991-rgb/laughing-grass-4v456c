import { apiSuccess, handleApiError } from "@/lib/api/response";
import { listProviders } from "@/lib/services/providers";

/** Public marketplace provider directory (verified + active by default). */
export async function GET(req) {
  try {
    const params = new URL(req.url).searchParams;

    const providers = await listProviders({
      categorySlug: params.get("category") || undefined,
      verifiedOnly: params.get("includeUnverified") !== "1",
      q: params.get("q") || undefined,
      language: params.get("language") || undefined,
      location: params.get("location") || undefined,
      remote: params.get("remote") === "1",
      inPerson: params.get("inPerson") === "1",
      minPrice: params.get("minPrice") || undefined,
      maxPrice: params.get("maxPrice") || undefined,
      minRating: params.get("minRating") || undefined,
      availability: params.get("availability") || undefined,
      certified: params.get("certified") === "1",
      rush: params.get("rush") === "1",
      documentType: params.get("documentType") || undefined,
      turnaround: params.get("turnaround") || undefined,
      serviceType: params.get("serviceType") || undefined,
      professionalType: params.get("professionalType") || undefined,
      licenseState: params.get("licenseState") || undefined,
      sourceLanguage: params.get("source") || undefined,
      targetLanguage: params.get("target") || undefined,
    });
    return apiSuccess(providers.map(({ email, ...p }) => p));
  } catch (error) {
    return handleApiError(error, "Failed to fetch providers.");
  }
}
