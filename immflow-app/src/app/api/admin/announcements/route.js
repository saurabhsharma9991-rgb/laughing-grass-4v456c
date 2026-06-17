import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";

export async function POST(req) {
  try {
    requireAdmin(req);
    const { subject, content } = await req.json();

    if (!subject?.trim() || !content?.trim()) {
      return apiError("subject and content are required.", 400, "VALIDATION_ERROR");
    }

    const recipientCount = await prisma.user.count({
      where: { role: { not: "admin" } },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[SIMULATED EMAIL]", { subject, recipientCount, content });
    }

    return apiSuccess({
      success: true,
      message: `Announcement queued for ${recipientCount} recipients.`,
      recipientCount,
    });
  } catch (error) {
    return handleApiError(error, "Failed to send announcement.");
  }
}
