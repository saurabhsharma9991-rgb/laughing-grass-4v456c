import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { validateSignupBody } from "@/lib/validators/auth";
import { loginUser, registerUser } from "@/lib/services/auth";

export async function POST(req) {
  try {
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

    return apiSuccess(
      {
        user: login.user,
        access_token: login.access_token,
        message: "Account created successfully. Welcome to ImmFlow.",
      },
      201
    );
  } catch (error) {
    return handleApiError(error, "An error occurred during signup.");
  }
}
