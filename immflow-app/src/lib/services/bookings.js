import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import {
  BOOKING_TYPES,
  BOOKING_STATUSES,
  BOOKING_MODALITIES,
  PROVIDER_BOOKING_TRANSITIONS,
  formatBookingMoney,
} from "@/lib/constants/bookings";
import { notifyBookingUpdate } from "@/lib/email/notify";

const bookingInclude = {
  client: { select: { id: true, email: true, displayName: true } },
  provider: {
    select: {
      id: true,
      displayName: true,
      userId: true,
      verificationStatus: true,
      rate: true,
      category: { select: { slug: true, name: true } },
    },
  },
};

export function formatBooking(b) {
  return {
    id: b.id,
    clientId: b.clientId,
    providerId: b.providerId,
    bookingType: b.bookingType,
    status: b.status,
    language: b.language,
    sourceLanguage: b.sourceLanguage,
    targetLanguage: b.targetLanguage,
    serviceType: b.serviceType,
    modality: b.modality,
    scheduledAt: b.scheduledAt,
    durationMinutes: b.durationMinutes,
    location: b.location,
    priceCents: b.priceCents,
    priceLabel: formatBookingMoney(b.priceCents, b.currency),
    currency: b.currency,
    paidAt: b.paidAt,
    paymentRequired: Boolean(b.priceCents && !b.paidAt),
    clientNotes: b.clientNotes,
    providerNotes: b.providerNotes,
    disclaimerAck: b.disclaimerAck,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    client: b.client
      ? {
          id: b.client.id,
          email: b.client.email,
          displayName: b.client.displayName,
        }
      : undefined,
    provider: b.provider
      ? {
          id: b.provider.id,
          displayName: b.provider.displayName,
          userId: b.provider.userId,
          verificationStatus: b.provider.verificationStatus,
          rate: b.provider.rate,
          categorySlug: b.provider.category?.slug,
          categoryName: b.provider.category?.name,
        }
      : null,
  };
}

async function resolveProvider(providerId, bookingType) {
  if (!providerId) return null;
  const expectedSlug =
    bookingType === "interpreter" ? "interpreter" : "psychological";
  const p = await prisma.provider.findUnique({
    where: { id: Number(providerId) },
    include: { category: true },
  });
  if (!p || p.category?.slug !== expectedSlug) {
    throw new AuthError(
      `Provider must be a verified ${expectedSlug} professional.`,
      400,
      "INVALID_PROVIDER"
    );
  }
  if (p.verificationStatus !== "verified" || !p.isActive) {
    throw new AuthError("Only verified providers can be booked.", 400, "PROVIDER_NOT_VERIFIED");
  }
  return p;
}

export async function assignProviderToBooking({
  bookingId,
  providerId,
  session,
  isAdmin = false,
}) {
  const booking = await assertBookingAccess(bookingId, session, { admin: isAdmin });
  if (!isAdmin && booking.clientId !== session.userId) {
    throw new AuthError(
      "Only the client or an admin can assign a provider.",
      403,
      "FORBIDDEN"
    );
  }
  if (!["requested"].includes(booking.status) && !isAdmin) {
    throw new AuthError(
      "This booking can no longer be reassigned.",
      409,
      "INVALID_STATE"
    );
  }
  const provider = await resolveProvider(providerId, booking.bookingType);
  const updated = await prisma.serviceBooking.update({
    where: { id: booking.id },
    data: { providerId: provider.id },
    include: bookingInclude,
  });
  void notifyBookingUpdate(updated.id, "assigned");
  return formatBooking(updated);
}

function parseRateCents(provider) {
  if (!provider?.rate) return null;
  const n = Number(String(provider.rate).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export async function createBooking(clientId, data) {
  const bookingType = String(data.bookingType || "").toLowerCase();
  if (!BOOKING_TYPES.includes(bookingType)) {
    throw new AuthError("Invalid booking type.", 400, "VALIDATION");
  }
  if (!data.disclaimerAck) {
    throw new AuthError(
      "Please acknowledge that ImmFlow only connects you with professionals.",
      400,
      "DISCLAIMER_REQUIRED"
    );
  }

  const modality = String(data.modality || "remote").toLowerCase();
  if (!BOOKING_MODALITIES.includes(modality)) {
    throw new AuthError("Invalid modality.", 400, "VALIDATION");
  }

  const provider = data.providerId
    ? await resolveProvider(data.providerId, bookingType)
    : null;
  if (!provider) {
    throw new AuthError(
      "Select a verified provider before requesting a booking.",
      400,
      "PROVIDER_REQUIRED"
    );
  }

  let scheduledAt = null;
  if (data.scheduledAt) {
    scheduledAt = new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new AuthError("Invalid date/time.", 400, "VALIDATION");
    }
  }

  let durationMinutes = data.durationMinutes
    ? Math.max(15, Math.min(480, Number(data.durationMinutes)))
    : bookingType === "interpreter"
      ? 60
      : null;
  const minimumBooking = Number(provider.profileData?.minimumBooking || 0);
  if (
    bookingType === "interpreter" &&
    Number.isFinite(minimumBooking) &&
    minimumBooking > durationMinutes
  ) {
    durationMinutes = minimumBooking;
  }

  if (modality === "in_person" && !provider.inPersonAvailable) {
    throw new AuthError(
      "This provider is not available in person.",
      400,
      "MODALITY_UNAVAILABLE"
    );
  }
  if (modality !== "in_person" && !provider.remoteAvailable) {
    throw new AuthError(
      "This provider is not available remotely.",
      400,
      "MODALITY_UNAVAILABLE"
    );
  }
  if (scheduledAt && Array.isArray(provider.availabilitySlots)) {
    const requestedDate = scheduledAt.toISOString().slice(0, 10);
    const hasDate = provider.availabilitySlots.some(
      (slot) => String(slot).slice(0, 10) === requestedDate
    );
    if (provider.availabilitySlots.length > 0 && !hasDate) {
      throw new AuthError(
        "The selected provider is not available on that date.",
        409,
        "TIME_UNAVAILABLE"
      );
    }
  }

  let priceCents = null;
  const hourly = parseRateCents(provider);
  if (hourly && durationMinutes) {
    priceCents = Math.round((hourly * durationMinutes) / 60);
  } else if (hourly) {
    priceCents = hourly;
  }

  const booking = await prisma.serviceBooking.create({
    data: {
      clientId,
      providerId: provider?.id || null,
      bookingType,
      status: priceCents ? "pending_payment" : "requested",
      language: data.language ? String(data.language).slice(0, 80) : null,
      sourceLanguage: data.sourceLanguage
        ? String(data.sourceLanguage).slice(0, 80)
        : null,
      targetLanguage: data.targetLanguage
        ? String(data.targetLanguage).slice(0, 80)
        : null,
      serviceType: data.serviceType ? String(data.serviceType).slice(0, 160) : null,
      modality,
      scheduledAt,
      durationMinutes,
      location: data.location ? String(data.location).slice(0, 180) : null,
      priceCents,
      clientNotes: data.clientNotes ? String(data.clientNotes).slice(0, 4000) : null,
      disclaimerAck: true,
    },
    include: bookingInclude,
  });

  void notifyBookingUpdate(booking.id, booking.status);
  return formatBooking(booking);
}

export async function listBookings({
  clientId,
  providerUserId,
  bookingType,
  status,
  includeAll = false,
} = {}) {
  const where = {};
  if (!includeAll) {
    if (clientId) where.clientId = clientId;
    else if (providerUserId) where.provider = { userId: providerUserId };
  }
  if (bookingType && bookingType !== "all") where.bookingType = bookingType;
  if (status && status !== "all") where.status = status;

  const rows = await prisma.serviceBooking.findMany({
    where,
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(formatBooking);
}

export async function assertBookingAccess(id, session, { admin = false } = {}) {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: Number(id) },
    include: bookingInclude,
  });
  if (!booking) throw new AuthError("Booking not found.", 404, "NOT_FOUND");
  if (admin) return booking;
  const isClient = booking.clientId === session.userId;
  const isProvider = booking.provider?.userId === session.userId;
  if (!isClient && !isProvider) {
    throw new AuthError("Not authorized for this booking.", 403, "FORBIDDEN");
  }
  return booking;
}

export async function updateBookingStatus({
  bookingId,
  session,
  nextStatus,
  providerNotes,
  isAdmin = false,
}) {
  const booking = await assertBookingAccess(bookingId, session, { admin: isAdmin });
  if (!BOOKING_STATUSES.includes(nextStatus)) {
    throw new AuthError("Invalid status.", 400, "VALIDATION");
  }

  const isProvider = booking.provider?.userId === session.userId;
  const isClient = booking.clientId === session.userId;

  if (
    ["cancelled", "refunded"].includes(booking.status) &&
    !["cancelled", "refunded"].includes(nextStatus)
  ) {
    throw new AuthError(
      "Cancelled or refunded bookings cannot be revived.",
      409,
      "TERMINAL_STATE"
    );
  }

  if (!isAdmin) {
    if (
      isClient &&
      nextStatus === "cancelled" &&
      ["pending_payment", "requested", "confirmed"].includes(booking.status)
    ) {
      // ok
    } else if (isProvider) {
      const allowed = PROVIDER_BOOKING_TRANSITIONS[booking.status] || [];
      if (!allowed.includes(nextStatus)) {
        throw new AuthError(
          `Cannot move from ${booking.status} to ${nextStatus}.`,
          400,
          "INVALID_TRANSITION"
        );
      }
    } else {
      throw new AuthError("Not authorized to update status.", 403, "FORBIDDEN");
    }
  }

  const updated = await prisma.serviceBooking.update({
    where: { id: booking.id },
    data: {
      status: nextStatus,
      ...(providerNotes != null
        ? { providerNotes: String(providerNotes).slice(0, 4000) }
        : {}),
    },
    include: bookingInclude,
  });
  void notifyBookingUpdate(updated.id, nextStatus);
  return formatBooking(updated);
}

export async function setBookingCheckoutSessionId(bookingId, sessionId) {
  return prisma.serviceBooking.update({
    where: { id: Number(bookingId) },
    data: { stripeCheckoutSessionId: sessionId },
  });
}

export async function findBookingByCheckoutSession(sessionId) {
  if (!sessionId) return null;
  return prisma.serviceBooking.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: bookingInclude,
  });
}

export async function markBookingRefundedByPaymentIntent(paymentIntentId) {
  if (!paymentIntentId) return null;
  const booking = await prisma.serviceBooking.findFirst({
    where: { stripePaymentIntentId: String(paymentIntentId), paidAt: { not: null } },
  });
  if (!booking || ["cancelled", "refunded"].includes(booking.status)) return booking;
  const updated = await prisma.serviceBooking.update({
    where: { id: booking.id },
    data: { status: "refunded" },
    include: bookingInclude,
  });
  void notifyBookingUpdate(updated.id, "refunded");
  return formatBooking(updated);
}

export async function markBookingPaid({
  bookingId,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
  paymentSource,
}) {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: Number(bookingId) },
  });
  if (!booking) throw new AuthError("Booking not found.", 404, "NOT_FOUND");
  if (booking.paidAt) {
    return formatBooking(
      await prisma.serviceBooking.findUnique({
        where: { id: booking.id },
        include: bookingInclude,
      })
    );
  }
  if (booking.status !== "pending_payment") {
    throw new AuthError("Booking is not awaiting payment.", 409, "NOT_PAYABLE");
  }
  if (!["stripe", "simulation"].includes(paymentSource)) {
    throw new AuthError("Verified payment source required.", 400, "PAYMENT_PROOF_REQUIRED");
  }
  const updated = await prisma.serviceBooking.update({
    where: { id: booking.id },
    data: {
      status: "requested",
      paidAt: new Date(),
      stripeCheckoutSessionId:
        stripeCheckoutSessionId || booking.stripeCheckoutSessionId,
      stripePaymentIntentId:
        stripePaymentIntentId || booking.stripePaymentIntentId,
    },
    include: bookingInclude,
  });
  void notifyBookingUpdate(updated.id, "paid");
  return formatBooking(updated);
}
