import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import {
  applyToListing,
  listApplicationsForUser,
  listApplicationsForListing,
} from "@/lib/services/applications";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const listingId = new URL(req.url).searchParams.get("listingId");

    if (listingId) {
      const applications = await listApplicationsForListing(listingId, session.userId);
      return apiSuccess(applications);
    }

    const applications = await listApplicationsForUser(session.userId);
    return apiSuccess({ count: applications.length, applications });
  } catch (error) {
    return handleApiError(error, "Failed to fetch applications.");
  }
}

export async function POST(req) {
  try {
    const session = requireAuth(req);
    const { listingId, message } = await req.json();

    if (!listingId) {
      return apiError("listingId is required.", 400, "VALIDATION_ERROR");
    }

    await applyToListing(session.userId, listingId, message);
    return apiSuccess({ success: true, message: "Application submitted." }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to submit application.");
  }
}
