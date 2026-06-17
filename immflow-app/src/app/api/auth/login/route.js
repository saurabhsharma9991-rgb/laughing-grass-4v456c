import { apiError, apiSuccessWithSession, handleApiError } from "@/lib/api/response";
import { validateEmail, validatePassword } from "@/lib/validators/auth";
import { loginUser } from "@/lib/services/auth";
import { enforceAuthRateLimit } from "@/lib/auth/rate-limit-auth";

export async function POST(req) {
  try {
    const limited = enforceAuthRateLimit(req, "login");
    if (limited) return limited;
    const body = await req.json();
    const emailErr = validateEmail(body?.email);
    if (emailErr) return apiError(emailErr, 400, "VALIDATION_ERROR");
    const passErr = validatePassword(body?.password);
    if (passErr) return apiError(passErr, 400, "VALIDATION_ERROR");

    const result = await loginUser(body.email, body.password);
    return apiSuccessWithSession(result, result.access_token);
  } catch (error) {
    return handleApiError(error, "An error occurred during login.");
  }
}
