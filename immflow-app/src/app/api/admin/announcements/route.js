import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { handleApiError, apiError } from "@/lib/api/response";

export async function POST(req) {
  try {
    requireAdmin(req);
    const { subject, content } = await req.json();

    if (!subject?.trim() || !content?.trim()) {
      return apiError("subject and content are required.", 400, "VALIDATION_ERROR");
    }

    if (!process.env.EMAIL_API_KEY) {
      return apiError(
        "Email service is not configured. Set EMAIL_API_KEY to enable broadcasts.",
        503,
        "EMAIL_NOT_CONFIGURED"
      );
    }

    return apiError(
      "Broadcast delivery is not wired yet. Email provider credentials are present but sending is pending implementation.",
      501,
      "BROADCAST_NOT_IMPLEMENTED"
    );
  } catch (error) {
    return handleApiError(error, "Failed to send announcement.");
  }
}
