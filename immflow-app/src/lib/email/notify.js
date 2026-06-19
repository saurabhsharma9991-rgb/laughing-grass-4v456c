import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/auth-tokens";
import { logEvent } from "@/lib/logger";
import {
  sendEmail,
  isEmailConfigured,
  newApplicationEmailHtml,
  applicationStatusEmailHtml,
  newMessageEmailHtml,
  subscriptionRenewalEmailHtml,
  verifyEmailHtml,
  welcomeEmailHtml,
  buildVerificationUrl,
} from "@/lib/email/send";

function displayName(user) {
  return user?.attorney?.name || user?.displayName || user?.email?.split("@")[0] || "there";
}

/** Fire-and-forget email; never throws to callers. */
export async function sendTransactionalEmail({ to, subject, html, text, event, meta = {} }) {
  if (!isEmailConfigured() || !to) return false;
  try {
    await sendEmail({ to, subject, html, text });
    logEvent("email", event, meta);
    return true;
  } catch (err) {
    logEvent("email", `${event}_failed`, { ...meta, error: err.message });
    return false;
  }
}

export async function notifyListingOwnerOfApplication(listingId, applicantId, message) {
  const listing = await prisma.listing.findUnique({
    where: { id: Number(listingId) },
    select: {
      title: true,
      postedBy: {
        select: {
          email: true,
          displayName: true,
          attorney: { select: { name: true } },
        },
      },
    },
  });
  if (!listing?.postedBy?.email) return;

  const applicant = await prisma.user.findUnique({
    where: { id: Number(applicantId) },
    select: {
      email: true,
      displayName: true,
      attorney: { select: { name: true } },
    },
  });

  const dashboardUrl = `${appBaseUrl()}/dashboard`;
  const ownerName = displayName(listing.postedBy);
  const applicantName = displayName(applicant);

  await sendTransactionalEmail({
    to: listing.postedBy.email,
    subject: `New application: ${listing.title}`,
    html: newApplicationEmailHtml({
      ownerName,
      listingTitle: listing.title,
      applicantName,
      message: message?.trim() || null,
      dashboardUrl,
    }),
    text: `${applicantName} applied to "${listing.title}". Review applicants: ${dashboardUrl}`,
    event: "application_submitted_owner",
    meta: { listingId, applicantId },
  });
}

export async function notifyApplicantOfStatus(applicationId, status) {
  const app = await prisma.application.findUnique({
    where: { id: Number(applicationId) },
    include: {
      listing: { select: { title: true } },
      applicant: {
        select: {
          email: true,
          displayName: true,
          attorney: { select: { name: true } },
        },
      },
    },
  });
  if (!app?.applicant?.email) return;

  const dashboardUrl = `${appBaseUrl()}/dashboard`;
  const applicantName = displayName(app.applicant);
  const statusLabel = { reviewed: "Reviewed", accepted: "Accepted", rejected: "Update" }[status] || "Update";

  await sendTransactionalEmail({
    to: app.applicant.email,
    subject: `${statusLabel}: ${app.listing.title}`,
    html: applicationStatusEmailHtml({
      applicantName,
      listingTitle: app.listing.title,
      status,
      dashboardUrl,
    }),
    text: `Your application for "${app.listing.title}" was ${status}. View: ${dashboardUrl}`,
    event: "application_status_applicant",
    meta: { applicationId, status },
  });
}

export async function notifyReceiverOfMessage({ receiverId, senderId, content }) {
  const [receiver, sender] = await Promise.all([
    prisma.user.findUnique({
      where: { id: Number(receiverId) },
      select: {
        email: true,
        displayName: true,
        attorney: { select: { name: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: Number(senderId) },
      select: {
        displayName: true,
        attorney: { select: { name: true } },
        email: true,
      },
    }),
  ]);

  if (!receiver?.email) return;

  const dashboardUrl = `${appBaseUrl()}/dashboard`;
  const recipientName = displayName(receiver);
  const senderName = displayName(sender);

  await sendTransactionalEmail({
    to: receiver.email,
    subject: `New message from ${senderName}`,
    html: newMessageEmailHtml({
      recipientName,
      senderName,
      preview: content,
      dashboardUrl,
    }),
    text: `${senderName} sent you a message on ImmFlow. Open: ${dashboardUrl}`,
    event: "message_received",
    meta: { receiverId, senderId },
  });
}

export async function sendVerificationEmail({ email, name, verificationToken }) {
  const verifyUrl = buildVerificationUrl(verificationToken);
  return sendTransactionalEmail({
    to: email,
    subject: "Verify your ImmFlow email",
    html: verifyEmailHtml({ name, verifyUrl }),
    text: `Verify your ImmFlow email: ${verifyUrl}`,
    event: "verification_sent",
    meta: { email },
  });
}

export async function notifyWelcomeAfterVerification({ email, name }) {
  const dashboardUrl = `${appBaseUrl()}/dashboard`;
  return sendTransactionalEmail({
    to: email,
    subject: "Welcome to ImmFlow",
    html: welcomeEmailHtml({ name, dashboardUrl }),
    text: `Welcome to ImmFlow, ${name}! Open your dashboard: ${dashboardUrl}`,
    event: "welcome_sent",
    meta: { email },
  });
}

export async function notifySubscriptionRenewal({ userId, renewalDate, amount }) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      email: true,
      displayName: true,
      attorney: { select: { name: true } },
    },
  });
  if (!user?.email) return;

  const portalUrl = `${appBaseUrl()}/dashboard`;
  const name = displayName(user);

  await sendTransactionalEmail({
    to: user.email,
    subject: "ImmFlow Pro renewal reminder",
    html: subscriptionRenewalEmailHtml({
      name,
      renewalDate,
      amount,
      portalUrl,
    }),
    text: `Your ImmFlow Pro subscription renews on ${renewalDate}${amount ? ` for ${amount}` : ""}. Manage billing: ${portalUrl}`,
    event: "subscription_renewal_reminder",
    meta: { userId },
  });
}
