import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import {
  sendEmail,
  announcementEmailHtml,
  isEmailConfigured,
  EmailNotConfiguredError,
  EmailDeliveryError,
} from "@/lib/email/send";
import { logEvent } from "@/lib/logger";

export async function POST(req) {
  try {
    await requireAdminPermission(req, "broadcast", "create");
    const { subject, content } = await req.json();

    if (!subject?.trim() || !content?.trim()) {
      return apiError("subject and content are required.", 400, "VALIDATION_ERROR");
    }

    if (!isEmailConfigured()) {
      return apiError(
        "Email service is not configured. Set EMAIL_API_KEY to enable broadcasts.",
        503,
        "EMAIL_NOT_CONFIGURED"
      );
    }

    const users = await prisma.user.findMany({
      where: { role: { not: "admin" } },
      select: { email: true },
    });

    if (!users.length) {
      return apiSuccess({
        success: true,
        sent: 0,
        message: "No recipients found.",
      });
    }

    const html = announcementEmailHtml({ subject: subject.trim(), content: content.trim() });
    let sent = 0;
    const failures = [];

    for (const { email } of users) {
      try {
        await sendEmail({
          to: email,
          subject: subject.trim(),
          html,
          text: content.trim(),
        });
        sent += 1;
      } catch (err) {
        failures.push({ email, message: err.message });
      }
    }

    if (sent === 0 && failures.length) {
      throw new EmailDeliveryError(
        `Failed to send to all recipients. First error: ${failures[0].message}`,
        502
      );
    }

    logEvent("email", "broadcast_complete", { sent, failed: failures.length, total: users.length });

    return apiSuccess({
      success: true,
      sent,
      failed: failures.length,
      total: users.length,
      message: `Broadcast sent to ${sent} of ${users.length} users.`,
    });
  } catch (error) {
    if (error instanceof EmailNotConfiguredError) {
      return apiError(error.message, 503, error.code);
    }
    if (error instanceof EmailDeliveryError) {
      return apiError(error.message, error.status || 502, "EMAIL_DELIVERY_FAILED");
    }
    return handleApiError(error, "Failed to send announcement.");
  }
}
