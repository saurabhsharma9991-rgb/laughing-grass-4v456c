import { apiError, apiSuccessWithSession, handleApiError } from "@/lib/api/response";
import { validateSignupBody } from "@/lib/validators/auth";
import { loginUser, registerUser } from "@/lib/services/auth";
import { enforceAuthRateLimit } from "@/lib/auth/rate-limit-auth";
import {
  sendEmail,
  welcomeEmailHtml,
  isEmailConfigured,
  EmailNotConfiguredError,
} from "@/lib/email/send";
import { appBaseUrl } from "@/lib/auth-tokens";
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

    await registerUser({
      email: body.email,
      password: body.password,
      data: body.data,
    });

    const login = await loginUser(body.email, body.password);
    const fullName = body.data?.full_name?.trim() || body.email.split("@")[0];

    if (isEmailConfigured()) {
      try {
        await sendEmail({
          to: body.email.trim().toLowerCase(),
          subject: "Welcome to ImmFlow",
          html: welcomeEmailHtml({
            name: fullName,
            dashboardUrl: `${appBaseUrl()}/dashboard`,
          }),
          text: `Welcome to ImmFlow, ${fullName}! Open your dashboard: ${appBaseUrl()}/dashboard`,
        });
        logEvent("email", "welcome_sent", { email: body.email });
      } catch (err) {
        if (!(err instanceof EmailNotConfiguredError)) {
          logEvent("email", "welcome_failed", { error: err.message });
        }
      }
    }

    return apiSuccessWithSession(
      {
        user: login.user,
        access_token: login.access_token,
        message: "Account created successfully. Welcome to ImmFlow.",
      },
      login.access_token,
      201
    );
  } catch (error) {
    return handleApiError(error, "An error occurred during signup.");
  }
}
