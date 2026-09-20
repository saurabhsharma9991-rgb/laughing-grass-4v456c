import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { validateSignupBody } from "@/lib/validators/auth";
import { registerUser } from "@/lib/services/auth";
import { enforceAuthRateLimit } from "@/lib/auth/rate-limit-auth";
import { isEmailConfigured, buildVerificationUrl } from "@/lib/email/send";
import { sendVerificationEmail } from "@/lib/email/notify";
import { logEvent } from "@/lib/logger";

export async function POST(req) {
  try {
    const limited = enforceAuthRateLimit(req, "signup");
    if (limited) return limited;

    const body = await req.json();
    const validation = validateSignupBody(body);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
    }

    const { user, verificationToken, fullName } = await registerUser({
      email: body.email,
      password: body.password,
      data: body.data,
      accountType: body.accountType || body.data?.account_type || "attorney",
    });

    if (isEmailConfigured()) {
      await sendVerificationEmail({
        email: user.email,
        name: fullName,
        verificationToken,
        locale: user.preferredLocale || body.data?.locale || "en",
      });
      logEvent("email", "verification_sent", { userId: user.id });
    } else if (process.env.NODE_ENV !== "production") {
      console.info("[dev] Email verification link:", buildVerificationUrl(verificationToken));
    }

    const needsApproval = user.signupStatus === "pending";
    return apiSuccess(
      {
        success: true,
        requiresVerification: true,
        pendingApproval: needsApproval,
        email: user.email,
        message: needsApproval
          ? "Account created. Check your email for a verification link. After verifying, your registration will be reviewed by our team before you can log in."
          : "Account created. Check your email for a verification link before logging in.",
      },
      201
    );
  } catch (error) {
    return handleApiError(error, "An error occurred during signup.");
  }
}
