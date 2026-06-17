import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateCreateListing } from "@/lib/validators/listings";
import { listListings, createListing } from "@/lib/services/listings";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const listings = await listListings({
      status: searchParams.get("status") || "open",
      q: searchParams.get("q") || "",
      location: searchParams.get("location") || "",
      language: searchParams.get("language") || "",
      type: searchParams.get("type") || "",
    });
    return apiSuccess(listings);
  } catch (error) {
    return handleApiError(error, "Failed to fetch listings.");
  }
}

export async function POST(req) {
  try {
    const session = requireAuth(req);
    const body = await req.json();
    const validation = validateCreateListing(body);

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
    }

    const listing = await createListing(session.userId, validation.data);
    return apiSuccess(listing, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create listing.");
  }
}
