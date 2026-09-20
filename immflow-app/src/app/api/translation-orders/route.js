import { apiSuccess, handleApiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import {
  createTranslationOrder,
  listTranslationOrders,
} from "@/lib/services/translation-orders";
import { prisma } from "@/lib/db";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const params = new URL(req.url).searchParams;
    const status = params.get("status") || undefined;
    const scope = params.get("scope") || "mine"; // mine | provider

    let orders;
    if (scope === "provider") {
      orders = await listTranslationOrders({
        providerUserId: session.userId,
        status,
      });
    } else {
      orders = await listTranslationOrders({
        clientId: session.userId,
        status,
      });
    }

    return apiSuccess(orders);
  } catch (error) {
    return handleApiError(error, "Failed to list translation orders.");
  }
}

export async function POST(req) {
  try {
    const session = requireAuth(req);
    const body = await req.json();
    const order = await createTranslationOrder(session.userId, body);
    return apiSuccess(order, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create translation order.");
  }
}
