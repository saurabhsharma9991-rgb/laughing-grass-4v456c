import { apiSuccess, handleApiError } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/guards";
import { getAdminThread, listAdminConversations } from "@/lib/services/admin-messages";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "messages", "view");
    const params = new URL(req.url).searchParams;
    const a = params.get("a");
    const b = params.get("b");
    if (a && b) {
      return apiSuccess(await getAdminThread(a, b));
    }
    const conversations = await listAdminConversations({
      flaggedOnly: params.get("flagged") === "1",
      kind: params.get("kind") || "all",
      q: params.get("q") || "",
    });
    return apiSuccess(conversations);
  } catch (error) {
    return handleApiError(error, "Failed to load messages.");
  }
}
