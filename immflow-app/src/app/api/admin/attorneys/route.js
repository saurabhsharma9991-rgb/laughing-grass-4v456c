import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateAttorneyProfile } from "@/lib/validators/attorney";
import { updateAttorneyProfile } from "@/lib/services/attorneys";

export async function GET(req) {
  try {
    requireAdmin(req);
    const attorneys = await prisma.attorney.findMany({
      include: {
        user: {
          select: { email: true, isPro: true, subscriptionPlan: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return apiSuccess(attorneys);
  } catch (error) {
    return handleApiError(error, "Failed to fetch attorneys.");
  }
}

export async function PATCH(req) {
  try {
    requireAdmin(req);
    const body = await req.json();
    const { id, isVerified, ...profileFields } = body;

    if (!id) return apiError("id is required.", 400, "VALIDATION_ERROR");

    if (Object.keys(profileFields).length > 0) {
      const validation = validateAttorneyProfile({ ...profileFields, name: profileFields.name || "Attorney" });
      if (!validation.valid && profileFields.name) {
        const firstError = Object.values(validation.errors)[0];
        return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
      }

      const data = { ...validation.data };
      if (isVerified !== undefined) data.isVerified = Boolean(isVerified);
      if (profileFields.name) {
        const attorney = await updateAttorneyProfile(parseInt(id, 10), data);
        return apiSuccess({ success: true, attorney });
      }
    }

    if (isVerified !== undefined) {
      const attorney = await prisma.attorney.update({
        where: { id: parseInt(id, 10) },
        data: { isVerified: Boolean(isVerified) },
      });
      return apiSuccess({ success: true, attorney });
    }

    return apiError("No valid fields to update.", 400, "VALIDATION_ERROR");
  } catch (error) {
    return handleApiError(error, "Failed to update attorney.");
  }
}

export async function PUT(req) {
  try {
    requireAdmin(req);
    const body = await req.json();
    const { id, isVerified, ...rest } = body;
    if (!id) return apiError("id is required.", 400, "VALIDATION_ERROR");

    const validation = validateAttorneyProfile(rest);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
    }

    const data = { ...validation.data };
    if (isVerified !== undefined) data.isVerified = Boolean(isVerified);

    const attorney = await updateAttorneyProfile(parseInt(id, 10), data);
    return apiSuccess({ success: true, attorney });
  } catch (error) {
    return handleApiError(error, "Failed to update attorney.");
  }
}

export async function DELETE(req) {
  try {
    requireAdmin(req);
    const idStr = new URL(req.url).searchParams.get("id");
    if (!idStr) return apiError("Missing query parameter: id", 400, "VALIDATION_ERROR");

    const attorney = await prisma.attorney.findUnique({
      where: { id: parseInt(idStr, 10) },
      select: { userId: true },
    });

    if (!attorney) return apiError("Attorney not found.", 404, "NOT_FOUND");

    await prisma.user.delete({ where: { id: attorney.userId } });
    return apiSuccess({ success: true, message: "Attorney account deleted successfully." });
  } catch (error) {
    return handleApiError(error, "Failed to delete attorney.");
  }
}
