import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateEmail } from "@/lib/validators/auth";
import { resendVerificationEmail } from "@/lib/services/auth";
import { enforceAuthRateLimit } from "@/lib/auth/rate-limit-auth";
import { isEmailConfigured, buildVerificationUrl } from "@/lib/email/send";
import { sendVerificationEmail } from "@/lib/email/notify";
import { logEvent } from "@/lib/logger";

export async function POST(req) {
  try {
    const limited = enforceAuthRateLimit(req, "resend-verification");
    if (limited) return limited;

    const { email } = await req.json();
    const emailErr = validateEmail(email);
    if (emailErr) return apiError(emailErr, 400, "VALIDATION_ERROR");

    const result = await resendVerificationEmail(email);

    if (result.sent) {
      if (isEmailConfigured()) {
        await sendVerificationEmail({
          email: result.user.email,
          name: result.fullName,
          verificationToken: result.verificationToken,
        });
        logEvent("email", "verification_resent", { userId: result.user.id });
      } else if (process.env.NODE_ENV !== "production") {
        console.info("[dev] Email verification link:", buildVerificationUrl(result.verificationToken));
      }
    }

    return apiSuccess({
      success: true,
      message:
        "If an unverified account exists for that email, a new verification link has been sent.",
    });
  } catch (error) {
    return handleApiError(error, "Failed to resend verification email.");
  }
}
