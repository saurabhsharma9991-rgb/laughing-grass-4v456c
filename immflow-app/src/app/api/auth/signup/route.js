import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { validateSignupBody } from "@/lib/validators/auth";
import { registerUser } from "@/lib/services/auth";
import { appBaseUrl } from "@/lib/auth-tokens";

export async function POST(req) {
  try {
    const body = await req.json();
    const validation = validateSignupBody(body);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
    }

    const { user, verificationToken } = await registerUser({
      email: body.email,
      password: body.password,
      data: body.data,
    });

    const response = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        user_metadata: {
          full_name: body.data?.full_name || user.email.split("@")[0],
          bar_number: body.data?.bar_number || null,
          bar_state: body.data?.bar_state || null,
        },
      },
      message: "Account created! Please check your email to confirm, then log in.",
    };

    if (process.env.NODE_ENV !== "production") {
      response.verificationUrl = `${appBaseUrl()}/?verify=${verificationToken}`;
    }

    return apiSuccess(response, 201);
  } catch (error) {
    return handleApiError(error, "An error occurred during signup.");
  }
}
