import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateEmail } from "@/lib/validators/auth";
import { generateToken } from "@/lib/auth-tokens";

export async function POST(req) {
  try {
    const { email } = await req.json();
    const emailErr = validateEmail(email);
    if (emailErr) return apiError(emailErr, 400, "VALIDATION_ERROR");

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (user) {
      const resetToken = generateToken();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      // Password reset email delivery is configured separately (ZeptoMail, etc.)
    }

    return apiSuccess({
      success: true,
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    return handleApiError(error, "Failed to process password reset request.");
  }
}
