import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { formatUserResponse } from "@/lib/services/auth";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { attorney: true },
    });
    if (!user) {
      return apiSuccess({ user: null });
    }
    return apiSuccess({ user: formatUserResponse(user, user.attorney) });
  } catch (error) {
    return handleApiError(error, "Failed to load session.");
  }
}
