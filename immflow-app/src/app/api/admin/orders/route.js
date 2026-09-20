import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/guards";
import {
  listTranslationOrders,
  updateOrderStatus,
  assignProviderToOrder,
  formatOrder,
  assertOrderAccess,
} from "@/lib/services/translation-orders";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "orders", "view");
    const params = new URL(req.url).searchParams;
    const orders = await listTranslationOrders({
      includeAll: true,
      status: params.get("status") || undefined,
    });
    return apiSuccess(orders);
  } catch (error) {
    return handleApiError(error, "Failed to list orders.");
  }
}

export async function PATCH(req) {
  try {
    const { session } = await requireAdminPermission(req, "orders", "edit");
    const body = await req.json();
    const id = body.id;

    if (!id) {
      return apiError("id required", 400, "VALIDATION");
    }

    if (body.action === "assign_provider") {
      const order = await assignProviderToOrder(id, body.providerId, session, { isAdmin: true });
      return apiSuccess(order);
    }

    if (body.status) {
      const order = await updateOrderStatus({
        orderId: id,
        session,
        nextStatus: body.status,
        providerNotes: body.providerNotes,
        providerIdAssign: body.providerId,
        isAdmin: true,
      });
      return apiSuccess(order);
    }

    // Soft cancel / notes only
    if (body.providerNotes != null || body.clientNotes != null) {
      const order = await assertOrderAccess(id, session, { admin: true });
      const { prisma } = await import("@/lib/db");
      const updated = await prisma.translationOrder.update({
        where: { id: order.id },
        data: {
          ...(body.providerNotes != null ? { providerNotes: String(body.providerNotes) } : {}),
          ...(body.clientNotes != null ? { clientNotes: String(body.clientNotes) } : {}),
        },
        include: {
          client: { select: { id: true, email: true, displayName: true } },
          provider: {
            select: {
              id: true,
              displayName: true,
              userId: true,
              verificationStatus: true,
              rate: true,
              profileData: true,
            },
          },
          files: { orderBy: { createdAt: "asc" } },
        },
      });
      return apiSuccess(formatOrder(updated));
    }

    return apiError("No valid update.", 400, "BAD_REQUEST");
  } catch (error) {
    return handleApiError(error, "Failed to update order.");
  }
}
