import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateEmail } from "@/lib/validators/auth";
import { generateToken } from "@/lib/auth-tokens";
import {
  sendEmail,
  buildPasswordResetUrl,
  passwordResetEmailHtml,
  isEmailConfigured,
  EmailNotConfiguredError,
} from "@/lib/email/send";
import { enforceAuthRateLimit } from "@/lib/auth/rate-limit-auth";
import { logEvent } from "@/lib/logger";

export async function POST(req) {
  try {
    const limited = enforceAuthRateLimit(req, "forgot-password");
    if (limited) return limited;
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

      if (isEmailConfigured()) {
        const resetUrl = buildPasswordResetUrl(resetToken);
        await sendEmail({
          to: user.email,
          subject: "Reset your ImmFlow password",
          html: passwordResetEmailHtml({ resetUrl, userEmail: user.email }),
          text: `Reset your ImmFlow password: ${resetUrl}\n\nThis link expires in 1 hour.`,
        });
        logEvent("email", "password_reset_sent", { userId: user.id });
      } else if (process.env.NODE_ENV !== "production") {
        console.info("[dev] Password reset link:", buildPasswordResetUrl(resetToken));
      }
    }

    return apiSuccess({
      success: true,
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    if (error instanceof EmailNotConfiguredError) {
      return apiError(error.message, 503, error.code);
    }
    return handleApiError(error, "Failed to process password reset request.");
  }
}
