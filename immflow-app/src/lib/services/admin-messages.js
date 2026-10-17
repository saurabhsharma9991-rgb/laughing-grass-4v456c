import { prisma } from "@/lib/db";

const participantSelect = {
  id: true,
  email: true,
  role: true,
  displayName: true,
  attorney: { select: { name: true } },
  providers: {
    select: { displayName: true, category: { select: { slug: true, name: true } } },
  },
};

function participantLabel(user) {
  if (!user) return null;
  const services = (user.providers || [])
    .map((p) => p.category?.slug)
    .filter((slug) => slug && slug !== "attorney");
  let kind = "client";
  if (user.role === "admin") kind = "admin";
  else if (user.attorney || user.role === "attorney") kind = "attorney";
  else if (services.length) kind = "provider";
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    kind,
    services,
    name:
      user.attorney?.name ||
      user.providers?.[0]?.displayName ||
      user.displayName ||
      user.email.split("@")[0],
  };
}

function pairKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** Every conversation on the platform, newest first. */
export async function listAdminConversations({ flaggedOnly = false, kind = "all", q = "" } = {}) {
  const messages = await prisma.message.findMany({
    orderBy: { sentAt: "desc" },
    take: 5000,
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      content: true,
      sentAt: true,
      flagged: true,
      sender: { select: participantSelect },
      receiver: { select: participantSelect },
    },
  });

  const map = new Map();
  for (const m of messages) {
    const key = pairKey(m.senderId, m.receiverId);
    let convo = map.get(key);
    if (!convo) {
      const a = participantLabel(m.sender);
      const b = participantLabel(m.receiver);
      convo = {
        key,
        participants: [a, b].filter(Boolean).sort((x, y) => x.id - y.id),
        lastMessage: m.content,
        lastSentAt: m.sentAt,
        messageCount: 0,
        flaggedCount: 0,
      };
      map.set(key, convo);
    }
    convo.messageCount += 1;
    if (m.flagged) convo.flaggedCount += 1;
  }

  const needle = String(q || "").trim().toLowerCase();
  return Array.from(map.values()).filter((c) => {
    if (flaggedOnly && c.flaggedCount === 0) return false;
    if (kind !== "all" && !c.participants.some((p) => p.kind === kind)) return false;
    if (
      needle &&
      !c.participants.some(
        (p) =>
          p.name.toLowerCase().includes(needle) || p.email.toLowerCase().includes(needle)
      )
    ) {
      return false;
    }
    return true;
  });
}

/** Full read-only thread between two users. */
export async function getAdminThread(userA, userB) {
  const a = Number(userA);
  const b = Number(userB);
  const [messages, users] = await Promise.all([
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: a, receiverId: b },
          { senderId: b, receiverId: a },
        ],
      },
      orderBy: { sentAt: "asc" },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        sentAt: true,
        flagged: true,
        flagReason: true,
      },
    }),
    prisma.user.findMany({ where: { id: { in: [a, b] } }, select: participantSelect }),
  ]);
  return {
    participants: users.map(participantLabel),
    messages,
  };
}
