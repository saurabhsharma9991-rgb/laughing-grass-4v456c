import { apiSuccess, handleApiError } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/guards";
import {
  listContactInquiries,
  setContactInquiryStatus,
} from "@/lib/services/contact-inquiries";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "messages", "view");
    const status = new URL(req.url).searchParams.get("status") || "all";
    return apiSuccess(await listContactInquiries({ status }));
  } catch (error) {
    return handleApiError(error, "Failed to load contact messages.");
  }
}

export async function PATCH(req) {
  try {
    await requireAdminPermission(req, "messages", "view");
    const body = await req.json();
    return apiSuccess(await setContactInquiryStatus(body.id, body.status));
  } catch (error) {
    return handleApiError(error, "Failed to update contact message.");
  }
}
