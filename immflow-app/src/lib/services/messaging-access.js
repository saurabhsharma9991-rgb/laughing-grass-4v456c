import { prisma } from "@/lib/db";

const CLOSED_ORDER_STATUSES = ["cancelled", "refunded"];
const CLOSED_BOOKING_STATUSES = ["cancelled", "refunded", "declined"];

/**
 * Service providers (translation, interpreter, psychological, …) can only be messaged
 * by a client who has paid for one of their services. Attorneys stay open.
 */
export async function paidMessagingStatus(clientUserId, professionalUserId) {
  const professional = await prisma.user.findUnique({
    where: { id: Number(professionalUserId) },
    select: {
      id: true,
      role: true,
      attorney: { select: { id: true } },
      providers: {
        select: { id: true, category: { select: { slug: true } } },
      },
    },
  });
  if (!professional) {
    return { requiresPayment: false, hasPaid: false };
  }

  const serviceProviderIds = (professional.providers || [])
    .filter((p) => p.category?.slug && p.category.slug !== "attorney")
    .map((p) => p.id);

  if (professional.attorney || serviceProviderIds.length === 0) {
    return { requiresPayment: false, hasPaid: false };
  }

  const [order, booking] = await Promise.all([
    prisma.translationOrder.findFirst({
      where: {
        clientId: Number(clientUserId),
        providerId: { in: serviceProviderIds },
        paidAt: { not: null },
        status: { notIn: CLOSED_ORDER_STATUSES },
      },
      select: { id: true },
    }),
    prisma.serviceBooking.findFirst({
      where: {
        clientId: Number(clientUserId),
        providerId: { in: serviceProviderIds },
        paidAt: { not: null },
        status: { notIn: CLOSED_BOOKING_STATUSES },
      },
      select: { id: true },
    }),
  ]);

  return {
    requiresPayment: true,
    hasPaid: Boolean(order || booking),
    providerIds: serviceProviderIds,
  };
}

export const PAYMENT_REQUIRED_MESSAGE =
  "You can message this professional after you book their service and complete payment.";
