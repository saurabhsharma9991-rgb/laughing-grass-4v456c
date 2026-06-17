import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/guards";
import { AuthError } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { assertFeatureAccess } from "@/lib/services/platform-settings";

export async function GET(req) {
  try {
    const session = requireAuth(req);
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
            select: { email: true, attorney: { select: { name: true, initials: true } } },
          },
          receiver: {
            select: { email: true, attorney: { select: { name: true, initials: true } } },
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
            attorney: { select: { name: true, initials: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
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
            name: contactUser.attorney?.name || contactUser.email.split("@")[0],
            initials: contactUser.attorney?.initials || "??",
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

    const messaging = await assertFeatureAccess(session.userId, "direct_messaging");
    if (!messaging.allowed) {
      throw new AuthError(
        "Direct messaging is not available on your plan. Upgrade to Pro to send messages.",
        403,
        "PRO_UPGRADE_REQUIRED"
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.userId,
        receiverId: parseInt(receiverId, 10),
        content: content.trim(),
      },
      include: {
        sender: {
          select: { email: true, attorney: { select: { name: true, initials: true } } },
        },
      },
    });

    return apiSuccess(message, 201);
  } catch (error) {
    return handleApiError(error, "Failed to send message.");
  }
}
