import { prisma } from "@/lib/db";
import { notifyReceiverOfMessage } from "@/lib/email/notify";
import { requireAuth } from "@/lib/auth/guards";
import { AuthError } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { assertFeatureAccess, getPlatformSettings } from "@/lib/services/platform-settings";
import { userCanAccess } from "@/lib/utils/feature-access";
import { hasPaidTranslationRelationship } from "@/lib/services/translation-orders";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const settings = await getPlatformSettings();
    const contactIdStr = new URL(req.url).searchParams.get("userId");

    if (contactIdStr) {
      const contactId = parseInt(contactIdStr, 10);
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.userId, receiverId: contactId },
            { senderId: contactId, receiverId: session.userId },
          ],
        },
        orderBy: { sentAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              role: true,
              isPro: true,
              displayName: true,
              attorney: { select: { name: true, initials: true } },
            },
          },
          receiver: {
            select: {
              id: true,
              email: true,
              role: true,
              isPro: true,
              displayName: true,
              attorney: { select: { name: true, initials: true } },
            },
          },
        },
      });

      return apiSuccess(messages);
    }

    const allMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: session.userId }, { receiverId: session.userId }],
      },
      orderBy: { sentAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            isPro: true,
            displayName: true,
            attorney: { select: { name: true, initials: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            role: true,
            isPro: true,
            displayName: true,
            attorney: { select: { name: true, initials: true } },
          },
        },
      },
    });

    const conversationMap = new Map();
    for (const msg of allMessages) {
      const contactUser = msg.senderId === session.userId ? msg.receiver : msg.sender;
      if (!contactUser || contactUser.id === session.userId) continue;
      if (!conversationMap.has(contactUser.id)) {
        conversationMap.set(contactUser.id, {
          contact: {
            id: contactUser.id,
            email: contactUser.email,
            role: contactUser.role,
            isPro: contactUser.isPro,
            name:
              contactUser.attorney?.name ||
              contactUser.displayName ||
              contactUser.email.split("@")[0],
            initials: contactUser.attorney?.initials || "??",
            priorityClient:
              contactUser.role === "public" &&
              userCanAccess(settings.features, "priority_contact", contactUser.isPro),
          },
          lastMessage: msg.content,
          sentAt: msg.sentAt,
        });
      }
    }

    return apiSuccess(Array.from(conversationMap.values()));
  } catch (error) {
    return handleApiError(error, "Failed to fetch messages.");
  }
}

export async function POST(req) {
  try {
    const session = requireAuth(req);
    const { receiverId, content } = await req.json();

    if (!receiverId || !content?.trim()) {
      return apiError("receiverId and message content are required.", 400, "VALIDATION_ERROR");
    }

    const parsedReceiverId = parseInt(receiverId, 10);
    if (Number.isNaN(parsedReceiverId)) {
      return apiError("Invalid receiver.", 400, "VALIDATION_ERROR");
    }
    if (parsedReceiverId === session.userId) {
      return apiError("You cannot message yourself.", 400, "VALIDATION_ERROR");
    }

    const receiver = await prisma.user.findUnique({
      where: { id: parsedReceiverId },
      select: { id: true, role: true },
    });
    if (!receiver) {
      return apiError("Recipient not found.", 404, "NOT_FOUND");
    }

    const sender = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, isPro: true, displayName: true, email: true },
    });
    const professionalRoles = new Set(["attorney", "provider"]);
    const isClientIntake =
      (sender?.role === "public" && professionalRoles.has(receiver.role)) ||
      (receiver.role === "public" && professionalRoles.has(sender?.role));
    const priorityAccess = await assertFeatureAccess(session.userId, "priority_contact");
    const priorityClient =
      sender?.role === "public" && Boolean(priorityAccess.allowed);

    // Translation providers: chat only after a paid order (payment-first flow).
    if (isClientIntake && sender?.role !== "admin") {
      const clientId =
        sender?.role === "public" ? session.userId : parsedReceiverId;
      const providerUserId =
        sender?.role === "public" ? parsedReceiverId : session.userId;
      const rel = await hasPaidTranslationRelationship(clientId, providerUserId);
      if (rel.isTranslationProvider && !rel.hasPaid) {
        throw new AuthError(
          "Message this translator after you create a translation order and complete payment.",
          403,
          "PAYMENT_REQUIRED"
        );
      }
    }

    if (!isClientIntake) {
      const messaging = await assertFeatureAccess(session.userId, "direct_messaging");
      if (!messaging.allowed) {
        throw new AuthError(
          "Professional peer messaging is not available on your plan. Upgrade to Pro to send messages.",
          403,
          "PRO_UPGRADE_REQUIRED"
        );
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.userId,
        receiverId: parsedReceiverId,
        content: content.trim().slice(0, 10000),
      },
      include: {
        sender: {
          select: { email: true, attorney: { select: { name: true, initials: true } } },
        },
      },
    });

    void notifyReceiverOfMessage({
      receiverId: message.receiverId,
      senderId: message.senderId,
      content: message.content,
      priorityClient,
    });

    return apiSuccess(message, 201);
  } catch (error) {
    return handleApiError(error, "Failed to send message.");
  }
}
