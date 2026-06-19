import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validatePassword } from "@/lib/validators/auth";

export async function POST(req) {
  try {
    const { token, password } = await req.json();
    if (!token) return apiError("Token is required.", 400, "VALIDATION_ERROR");
    const passErr = validatePassword(password);
    if (passErr) return apiError(passErr, 400, "VALIDATION_ERROR");

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
    });

    if (!user) {
      return apiError("Invalid or expired reset link. Please request a new one.", 400, "INVALID_TOKEN");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return apiSuccess({
      success: true,
      message: "Password updated successfully. You can now log in.",
    });
  } catch (error) {
    return handleApiError(error, "Failed to reset password.");
  }
}
