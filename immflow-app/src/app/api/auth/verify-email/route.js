import { apiSuccess, apiSuccessWithSession, handleApiError, apiError } from "@/lib/api/response";
import { verifyUserEmail } from "@/lib/services/auth";
import { notifyWelcomeAfterVerification } from "@/lib/email/notify";
import { isEmailConfigured } from "@/lib/email/send";
import { logEvent } from "@/lib/logger";

export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) return apiError("Verification token is required.", 400, "VALIDATION_ERROR");

    const result = await verifyUserEmail(token);

    if (!result.alreadyVerified && isEmailConfigured()) {
      const name = result.user.user_metadata?.full_name || result.user.email.split("@")[0];
      void notifyWelcomeAfterVerification({ email: result.user.email, name });
    }

    logEvent("auth", "email_verified", { userId: result.user.id, alreadyVerified: result.alreadyVerified });

    return apiSuccessWithSession(
      {
        user: result.user,
        access_token: result.access_token,
        message: result.alreadyVerified
          ? "Your email is already verified. You are now logged in."
          : "Email verified successfully. Welcome to ImmFlow!",
      },
      result.access_token
    );
  } catch (error) {
    return handleApiError(error, "Failed to verify email.");
  }
}
