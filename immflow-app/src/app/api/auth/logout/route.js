import { apiSuccess, handleApiError } from "@/lib/api/response";
import { clearSessionCookie } from "@/lib/auth/session-cookie";

export async function POST() {
  try {
    const response = apiSuccess({ success: true, message: "Logged out." });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error, "Failed to log out.");
  }
}
