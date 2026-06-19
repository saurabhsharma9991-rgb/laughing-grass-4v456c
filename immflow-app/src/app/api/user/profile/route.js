import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateAttorneyProfile } from "@/lib/validators/attorney";
import { getAttorneyByUserId, updateAttorneyProfile } from "@/lib/services/attorneys";
import { prisma } from "@/lib/db";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const profile = await getAttorneyByUserId(session.userId);
    if (!profile) return apiError("Attorney profile not found.", 404, "NOT_FOUND");
    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error, "Failed to fetch profile.");
  }
}

export async function PATCH(req) {
  try {
    const session = requireAuth(req);
    const body = await req.json();
    const validation = validateAttorneyProfile(body);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
    }

    const attorney = await prisma.attorney.findUnique({
      where: { userId: session.userId },
    });
    if (!attorney) return apiError("Attorney profile not found.", 404, "NOT_FOUND");

    const { isVerified, stars, reviewsCount, photoUrl, availabilitySlots, ...selfData } = validation.data;
    const patch = { ...selfData };
    if (photoUrl !== undefined) {
      if (photoUrl && photoUrl.length > 600_000) {
        return apiError("Photo is too large. Use an image under 400KB.", 400, "VALIDATION_ERROR");
      }
      patch.photoUrl = photoUrl || null;
    }
    if (availabilitySlots !== undefined) patch.availabilitySlots = availabilitySlots;
    const updated = await updateAttorneyProfile(attorney.id, patch);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error, "Failed to update profile.");
  }
}
