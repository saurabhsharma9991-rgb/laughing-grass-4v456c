import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateAttorneyProfile } from "@/lib/validators/attorney";
import { updateAttorneyProfile } from "@/lib/services/attorneys";
import { notifySignupRejected, notifySignupApproved } from "@/lib/email/notify";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "attorneys", "view");
    const attorneys = await prisma.attorney.findMany({
      include: {
        user: {
          select: {
            email: true,
            isPro: true,
            subscriptionPlan: true,
            signupStatus: true,
            rejectionReason: true,
            emailVerified: true,
          },
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
    await requireAdminPermission(req, "attorneys", "edit");
    const body = await req.json();
    const { id, isVerified, isPro, signupAction, rejectionReason, ...profileFields } = body;

    if (!id) return apiError("id is required.", 400, "VALIDATION_ERROR");

    const attorneyId = parseInt(id, 10);
    const existing = await prisma.attorney.findUnique({
      where: { id: attorneyId },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });
    if (!existing) return apiError("Attorney not found.", 404, "NOT_FOUND");

    if (signupAction === "approve") {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { signupStatus: "approved", rejectionReason: null },
      });
      await prisma.attorney.update({
        where: { id: attorneyId },
        data: { isVerified: true },
      });
      await prisma.provider.updateMany({
        where: { userId: existing.userId },
        data: { verificationStatus: "verified", rejectionReason: null },
      });
      void notifySignupApproved({ email: existing.user.email, name: existing.name });
    }

    if (signupAction === "reject") {
      const reason =
        rejectionReason?.trim() ||
        "We could not verify your bar credentials against our records.";
      await prisma.user.update({
        where: { id: existing.userId },
        data: { signupStatus: "rejected", rejectionReason: reason },
      });
      await prisma.attorney.update({
        where: { id: attorneyId },
        data: { isVerified: false },
      });
      await prisma.provider.updateMany({
        where: { userId: existing.userId },
        data: { verificationStatus: "rejected", rejectionReason: reason },
      });
      void notifySignupRejected({
        email: existing.user.email,
        name: existing.name,
        reason,
      });
    }

    if (isPro !== undefined) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          isPro: Boolean(isPro),
          subscriptionPlan: Boolean(isPro) ? "Pro (Admin)" : "Free",
          ...(Boolean(isPro) ? {} : { promoUsed: null, subscriptionExpires: null }),
        },
      });
    }

    if (isVerified !== undefined) {
      await prisma.attorney.update({
        where: { id: attorneyId },
        data: { isVerified: Boolean(isVerified) },
      });
      await prisma.provider.updateMany({
        where: { userId: existing.userId },
        data: {
          verificationStatus: Boolean(isVerified) ? "verified" : "pending",
          rejectionReason: null,
        },
      });
    }

    if (profileFields.name) {
      const validation = validateAttorneyProfile({
        ...profileFields,
        name: profileFields.name || "Attorney",
      });
      if (!validation.valid) {
        const firstError = Object.values(validation.errors)[0];
        return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
      }

      const data = { ...validation.data };
      if (isVerified !== undefined) data.isVerified = Boolean(isVerified);
      await updateAttorneyProfile(attorneyId, data);
    }

    const attorney = await prisma.attorney.findUnique({
      where: { id: attorneyId },
      include: {
        user: {
          select: {
            email: true,
            isPro: true,
            subscriptionPlan: true,
            signupStatus: true,
            rejectionReason: true,
            emailVerified: true,
          },
        },
      },
    });

    return apiSuccess({ success: true, attorney });
  } catch (error) {
    return handleApiError(error, "Failed to update attorney.");
  }
}

export async function PUT(req) {
  try {
    await requireAdminPermission(req, "attorneys", "edit");
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
    await requireAdminPermission(req, "attorneys", "delete");
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
