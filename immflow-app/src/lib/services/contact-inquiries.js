import { prisma } from "@/lib/db";
import { notifyAllAdmins } from "@/lib/email/notify";

export const CONTACT_TOPICS = ["general", "account", "billing", "listing", "order", "verification", "other"];
const CONTACT_STATUSES = ["new", "resolved"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message, code = "VALIDATION_ERROR") {
  const err = new Error(message);
  err.status = 400;
  err.code = code;
  return err;
}

export function validateContactInquiry(body = {}) {
  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
  const topic = CONTACT_TOPICS.includes(body.topic) ? body.topic : "general";
  const subject = String(body.subject || "").trim().slice(0, 200) || null;
  const message = String(body.message || "").trim();

  if (!name) throw badRequest("Please enter your name.");
  if (!EMAIL_RE.test(email)) throw badRequest("Please enter a valid email address.");
  if (message.length < 10) throw badRequest("Please write a message of at least 10 characters.");
  if (message.length > 5000) throw badRequest("Message is too long (5,000 characters max).");

  return { name, email, topic, subject, message };
}

export async function createContactInquiry(body, { userId = null } = {}) {
  const data = validateContactInquiry(body);
  const inquiry = await prisma.contactInquiry.create({
    data: { ...data, userId: userId ? Number(userId) : null },
  });

  notifyAllAdmins({
    subject: `Contact form: ${data.subject || data.topic}`,
    text: [
      `New contact form message.`,
      ``,
      `From: ${data.name} <${data.email}>`,
      `Topic: ${data.topic}`,
      data.subject ? `Subject: ${data.subject}` : null,
      ``,
      data.message,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    event: "admin_contact_inquiry",
    meta: { inquiryId: inquiry.id },
  }).catch(() => {});

  return inquiry;
}

export async function listContactInquiries({ status = "all" } = {}) {
  return prisma.contactInquiry.findMany({
    where: CONTACT_STATUSES.includes(status) ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function setContactInquiryStatus(id, status) {
  if (!CONTACT_STATUSES.includes(status)) throw badRequest("Invalid status.");
  return prisma.contactInquiry.update({ where: { id: Number(id) }, data: { status } });
}
