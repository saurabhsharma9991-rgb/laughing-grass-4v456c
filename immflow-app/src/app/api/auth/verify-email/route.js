import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";

export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) return apiError("Verification token is required.", 400, "VALIDATION_ERROR");

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) {
      return apiError("Invalid or expired verification link.", 400, "INVALID_TOKEN");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });

    return apiSuccess({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    return handleApiError(error, "Failed to verify email.");
  }
}
