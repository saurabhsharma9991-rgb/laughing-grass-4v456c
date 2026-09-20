import { requireAuth } from "@/lib/auth/guards";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { isValidLocale } from "@/lib/constants/marketplace";

export async function PATCH(req) {
  try {
    const session = requireAuth(req);
    const { locale } = await req.json();
    if (!isValidLocale(locale)) {
      return apiError("Unsupported language.", 400, "INVALID_LOCALE");
    }
    await prisma.user.update({
      where: { id: session.userId },
      data: { preferredLocale: locale },
    });
    return apiSuccess({ locale });
  } catch (error) {
    return handleApiError(error, "Failed to save language preference.");
  }
}
