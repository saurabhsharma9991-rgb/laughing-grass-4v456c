import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import {
  TRANSLATION_ORDER_STATUSES,
  TRANSLATION_TYPES,
  TURNAROUND_OPTIONS,
  FILE_KINDS,
  PROVIDER_STATUS_FLOW,
  quoteTranslationCents,
  defaultCertificationNote,
  formatMoney,
} from "@/lib/constants/translation";
import {
  saveTranslationOrderFile,
  deleteUploadedFile,
} from "@/lib/uploads/disk";
import { notifyTranslationOrderUpdate } from "@/lib/email/notify";

function formatFile(f) {
  return {
    id: f.id,
    kind: f.kind,
    originalName: f.originalName,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    uploadedById: f.uploadedById,
    createdAt: f.createdAt,
  };
}

export function formatOrder(order) {
  return {
    id: order.id,
    clientId: order.clientId,
    providerId: order.providerId,
    sourceLanguage: order.sourceLanguage,
    targetLanguage: order.targetLanguage,
    documentType: order.documentType,
    translationType: order.translationType,
    turnaround: order.turnaround,
    status: order.status,
    priceCents: order.priceCents,
    priceLabel: order.priceCents != null ? formatMoney(order.priceCents, order.currency) : null,
    currency: order.currency,
    certificationNote: order.certificationNote,
    clientNotes: order.clientNotes,
    providerNotes: order.providerNotes,
    paidAt: order.paidAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    client: order.client
      ? {
          id: order.client.id,
          email: order.client.email,
          displayName: order.client.displayName,
        }
      : undefined,
    provider: order.provider
      ? {
          id: order.provider.id,
          displayName: order.provider.displayName,
          userId: order.provider.userId,
          verificationStatus: order.provider.verificationStatus,
          rate: order.provider.rate,
        }
      : null,
    files: Array.isArray(order.files) ? order.files.map(formatFile) : [],
  };
}

const orderInclude = {
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
};

async function getTranslatorProvider(providerId) {
  if (!providerId) return null;
  const p = await prisma.provider.findUnique({
    where: { id: Number(providerId) },
    include: { category: true },
  });
  if (!p || p.category?.slug !== "translation") {
    throw new AuthError("Provider must be a verified translation provider.", 400, "INVALID_PROVIDER");
  }
  if (p.verificationStatus !== "verified" || !p.isActive) {
    throw new AuthError("Only verified translators can be assigned.", 400, "PROVIDER_NOT_VERIFIED");
  }
  return p;
}

function parseProviderBaseCents(provider) {
  const pd = provider?.profileData || {};
  if (pd.basePriceCents != null) return Number(pd.basePriceCents);
  if (pd.priceCents != null) return Number(pd.priceCents);
  // Parse "$49" style rate strings
  if (provider?.rate) {
    const n = Number(String(provider.rate).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 100);
  }
  return null;
}

export async function createTranslationOrder(clientId, data) {
  const sourceLanguage = String(data.sourceLanguage || "").trim();
  const targetLanguage = String(data.targetLanguage || "").trim();
  const documentType = String(data.documentType || "").trim();
  const translationType = String(data.translationType || "standard").toLowerCase();
  const turnaround = String(data.turnaround || "regular").toLowerCase();

  if (!sourceLanguage || !targetLanguage) {
    throw new AuthError("Source and target languages are required.", 400, "VALIDATION");
  }
  if (sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
    throw new AuthError("Source and target languages must differ.", 400, "VALIDATION");
  }
  if (!documentType) {
    throw new AuthError("Document type is required.", 400, "VALIDATION");
  }
  if (!TRANSLATION_TYPES.includes(translationType)) {
    throw new AuthError("Invalid translation type.", 400, "VALIDATION");
  }
  if (!TURNAROUND_OPTIONS.includes(turnaround)) {
    throw new AuthError("Invalid turnaround option.", 400, "VALIDATION");
  }

  const provider = data.providerId
    ? await getTranslatorProvider(data.providerId)
    : null;

  if (provider && translationType === "certified") {
    const pd = provider.profileData || {};
    if (pd.offersCertified === false) {
      throw new AuthError(
        "This provider does not offer certified translations.",
        400,
        "NO_CERTIFIED"
      );
    }
  }

  const priceCents = quoteTranslationCents({
    translationType,
    turnaround,
    providerBaseCents: parseProviderBaseCents(provider),
  });

  const certificationNote =
    translationType === "certified"
      ? String(data.certificationNote || "").trim() ||
        (provider?.profileData?.certificationNote) ||
        defaultCertificationNote("certified")
      : null;

  const order = await prisma.translationOrder.create({
    data: {
      clientId,
      providerId: provider?.id || null,
      sourceLanguage,
      targetLanguage,
      documentType,
      translationType,
      turnaround,
      status: "pending_payment",
      priceCents,
      currency: "usd",
      certificationNote,
      clientNotes: data.clientNotes ? String(data.clientNotes).slice(0, 4000) : null,
    },
    include: orderInclude,
  });

  void notifyTranslationOrderUpdate(order.id, order.status);
  return formatOrder(order);
}

export async function listTranslationOrders({
  clientId,
  providerUserId,
  status,
  includeAll = false,
} = {}) {
  const where = {};
  if (!includeAll) {
    if (clientId) where.clientId = clientId;
    else if (providerUserId) {
      where.provider = { userId: providerUserId };
    }
  }
  if (status && status !== "all") where.status = status;

  const orders = await prisma.translationOrder.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return orders.map(formatOrder);
}

export async function getTranslationOrderById(id) {
  const order = await prisma.translationOrder.findUnique({
    where: { id: Number(id) },
    include: orderInclude,
  });
  return order ? formatOrder(order) : null;
}

export async function assertOrderAccess(orderId, session, { admin = false } = {}) {
  const order = await prisma.translationOrder.findUnique({
    where: { id: Number(orderId) },
    include: { provider: true, files: true, client: { select: { id: true, email: true, displayName: true } } },
  });
  if (!order) throw new AuthError("Order not found.", 404, "NOT_FOUND");

  if (admin) return order;

  const isClient = order.clientId === session.userId;
  const isProvider = order.provider?.userId === session.userId;
  if (!isClient && !isProvider) {
    throw new AuthError("Not authorized for this order.", 403, "FORBIDDEN");
  }
  return order;
}

export async function markOrderPaid({
  orderId,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
  paymentSource,
}) {
  const order = await prisma.translationOrder.findUnique({ where: { id: Number(orderId) } });
  if (!order) throw new AuthError("Order not found.", 404, "NOT_FOUND");
  if (order.paidAt) {
    return formatOrder(
      await prisma.translationOrder.findUnique({
        where: { id: order.id },
        include: orderInclude,
      })
    );
  }
  if (order.status !== "pending_payment") {
    throw new AuthError(
      "Only an order awaiting payment can be marked paid.",
      409,
      "ORDER_NOT_PAYABLE"
    );
  }
  if (!["stripe", "simulation"].includes(paymentSource)) {
    throw new AuthError("Verified payment source required.", 400, "PAYMENT_PROOF_REQUIRED");
  }
  if (paymentSource === "stripe" && !stripeCheckoutSessionId) {
    throw new AuthError("Stripe session required.", 400, "PAYMENT_PROOF_REQUIRED");
  }

  const updated = await prisma.translationOrder.update({
    where: { id: order.id },
    data: {
      status: "pending",
      paidAt: new Date(),
      stripeCheckoutSessionId: stripeCheckoutSessionId || order.stripeCheckoutSessionId,
      stripePaymentIntentId: stripePaymentIntentId || order.stripePaymentIntentId,
    },
    include: orderInclude,
  });
  void notifyTranslationOrderUpdate(updated.id, "paid");
  return formatOrder(updated);
}

export async function updateOrderStatus({
  orderId,
  session,
  nextStatus,
  providerNotes,
  providerIdAssign,
  isAdmin = false,
}) {
  const order = await assertOrderAccess(orderId, session, { admin: isAdmin });

  if (!TRANSLATION_ORDER_STATUSES.includes(nextStatus)) {
    throw new AuthError("Invalid status.", 400, "VALIDATION");
  }

  const isProvider = order.provider?.userId === session.userId;
  const isClient = order.clientId === session.userId;

  if (
    ["cancelled", "refunded"].includes(order.status) &&
    !["cancelled", "refunded"].includes(nextStatus)
  ) {
    throw new AuthError(
      "Cancelled orders cannot be revived.",
      409,
      "TERMINAL_STATE"
    );
  }

  if (!isAdmin) {
    if (isClient && nextStatus === "cancelled" && ["pending_payment", "pending"].includes(order.status)) {
      // ok
    } else if (isProvider) {
      const allowed = PROVIDER_STATUS_FLOW[order.status] || [];
      if (!allowed.includes(nextStatus)) {
        throw new AuthError(
          `Cannot move from ${order.status} to ${nextStatus}.`,
          400,
          "INVALID_TRANSITION"
        );
      }
      if (nextStatus === "delivered") {
        const hasDelivery = (order.files || []).some((f) => f.kind === "delivery");
        if (!hasDelivery) {
          throw new AuthError(
            "Upload the translated document before marking delivered.",
            400,
            "MISSING_DELIVERY"
          );
        }
        if (order.translationType === "certified") {
          const hasCert = (order.files || []).some((f) => f.kind === "certification");
          if (!hasCert) {
            throw new AuthError(
              "Upload certification/attestation document before delivering certified orders.",
              400,
              "MISSING_CERT"
            );
          }
        }
      }
    } else {
      throw new AuthError("Not authorized to update status.", 403, "FORBIDDEN");
    }
  }

  const data = { status: nextStatus };
  if (providerNotes != null) data.providerNotes = String(providerNotes).slice(0, 4000);
  if (nextStatus === "delivered") data.deliveredAt = new Date();
  if (providerIdAssign && isAdmin) {
    await getTranslatorProvider(providerIdAssign);
    data.providerId = Number(providerIdAssign);
  }

  const updated = await prisma.translationOrder.update({
    where: { id: order.id },
    data,
    include: orderInclude,
  });
  void notifyTranslationOrderUpdate(updated.id, nextStatus);
  return formatOrder(updated);
}

export async function assignProviderToOrder(orderId, providerId, session, { isAdmin = false } = {}) {
  const order = await assertOrderAccess(orderId, session, { admin: isAdmin });
  if (!isAdmin && order.clientId !== session.userId) {
    throw new AuthError("Only the client or admin can assign a provider.", 403, "FORBIDDEN");
  }
  if (!["pending_payment", "pending"].includes(order.status) && !isAdmin) {
    throw new AuthError("Cannot reassign at this stage.", 400, "INVALID_STATE");
  }
  const provider = await getTranslatorProvider(providerId);
  const updated = await prisma.translationOrder.update({
    where: { id: order.id },
    data: {
      providerId: provider.id,
      priceCents: quoteTranslationCents({
        translationType: order.translationType,
        turnaround: order.turnaround,
        providerBaseCents: parseProviderBaseCents(provider),
      }),
    },
    include: orderInclude,
  });
  void notifyTranslationOrderUpdate(updated.id, "assigned");
  return formatOrder(updated);
}

export async function attachOrderFile({
  orderId,
  session,
  kind,
  originalName,
  mimeType,
  buffer,
  isAdmin = false,
}) {
  if (!FILE_KINDS.includes(kind)) {
    throw new AuthError("Invalid file kind.", 400, "VALIDATION");
  }

  const order = await assertOrderAccess(orderId, session, { admin: isAdmin });
  const isClient = order.clientId === session.userId;
  const isProvider = order.provider?.userId === session.userId;

  if (!isAdmin) {
    if (kind === "source" && !isClient) {
      throw new AuthError("Only the client can upload source documents.", 403, "FORBIDDEN");
    }
    if ((kind === "delivery" || kind === "certification") && !isProvider) {
      throw new AuthError("Only the assigned translator can upload delivery files.", 403, "FORBIDDEN");
    }
  }

  const saved = await saveTranslationOrderFile({
    orderId: order.id,
    originalName,
    mimeType,
    buffer,
  });

  const file = await prisma.translationOrderFile.create({
    data: {
      orderId: order.id,
      kind,
      originalName: saved.originalName,
      storedName: saved.storedName,
      relativePath: saved.relativePath,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      uploadedById: session.userId,
    },
  });

  return formatFile(file);
}

export async function getOrderFileForDownload(orderId, fileId, session, { isAdmin = false } = {}) {
  const order = await assertOrderAccess(orderId, session, { admin: isAdmin });
  const file = (order.files || []).find((f) => f.id === Number(fileId));
  if (!file) {
    // reload files if needed
    const row = await prisma.translationOrderFile.findFirst({
      where: { id: Number(fileId), orderId: order.id },
    });
    if (!row) throw new AuthError("File not found.", 404, "NOT_FOUND");
    return row;
  }
  return prisma.translationOrderFile.findUnique({ where: { id: Number(fileId) } });
}

export async function deleteOrderFile(orderId, fileId, session, { isAdmin = false } = {}) {
  await assertOrderAccess(orderId, session, { admin: isAdmin });
  const row = await prisma.translationOrderFile.findFirst({
    where: { id: Number(fileId), orderId: Number(orderId) },
  });
  if (!row) throw new AuthError("File not found.", 404, "NOT_FOUND");
  if (!isAdmin && row.uploadedById !== session.userId) {
    throw new AuthError("Not authorized to delete this file.", 403, "FORBIDDEN");
  }
  await deleteUploadedFile(row.relativePath);
  await prisma.translationOrderFile.delete({ where: { id: row.id } });
  return { ok: true };
}

export async function setCheckoutSessionId(orderId, sessionId) {
  return prisma.translationOrder.update({
    where: { id: Number(orderId) },
    data: { stripeCheckoutSessionId: sessionId },
  });
}

export async function findOrderByCheckoutSession(sessionId) {
  if (!sessionId) return null;
  return prisma.translationOrder.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: orderInclude,
  });
}

export async function markOrderRefundedByPaymentIntent(paymentIntentId) {
  if (!paymentIntentId) return null;
  const order = await prisma.translationOrder.findFirst({
    where: { stripePaymentIntentId: String(paymentIntentId), paidAt: { not: null } },
  });
  if (!order || ["cancelled", "refunded"].includes(order.status)) return order;
  const updated = await prisma.translationOrder.update({
    where: { id: order.id },
    data: { status: "refunded" },
    include: orderInclude,
  });
  void notifyTranslationOrderUpdate(updated.id, "refunded");
  return formatOrder(updated);
}
