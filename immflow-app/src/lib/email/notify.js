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
  signupRejectedEmailHtml,
  signupApprovedEmailHtml,
  buildVerificationUrl,
} from "@/lib/email/send";
import { emailBody, emailSubject } from "@/lib/email/i18n";

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
          preferredLocale: true,
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
  const locale = listing.postedBy.preferredLocale || "en";
  const localizedText = emailBody(locale, "application", [
    ownerName,
    `new application from ${applicantName}`,
    dashboardUrl,
  ]);

  await sendTransactionalEmail({
    to: listing.postedBy.email,
    subject: `${emailSubject(locale, "newApplication")}: ${listing.title}`,
    html:
      locale === "en"
        ? newApplicationEmailHtml({
            ownerName,
            listingTitle: listing.title,
            applicantName,
            message: message?.trim() || null,
            dashboardUrl,
          })
        : textEmailHtml(localizedText),
    text: localizedText,
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
          preferredLocale: true,
          attorney: { select: { name: true } },
        },
      },
    },
  });
  if (!app?.applicant?.email) return;

  const dashboardUrl = `${appBaseUrl()}/dashboard`;
  const applicantName = displayName(app.applicant);
  const statusLabel = { reviewed: "Reviewed", accepted: "Accepted", rejected: "Update" }[status] || "Update";
  const locale = app.applicant.preferredLocale || "en";
  const localizedText = emailBody(locale, "application", [
    applicantName,
    status,
    dashboardUrl,
  ]);

  await sendTransactionalEmail({
    to: app.applicant.email,
    subject: `${emailSubject(locale, "applicationStatus", statusLabel)}: ${app.listing.title}`,
    html:
      locale === "en"
        ? applicationStatusEmailHtml({
            applicantName,
            listingTitle: app.listing.title,
            status,
            dashboardUrl,
          })
        : textEmailHtml(localizedText),
    text: localizedText,
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
        preferredLocale: true,
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
  const locale = receiver.preferredLocale || "en";
  const localizedText = emailBody(locale, "message", [
    recipientName,
    senderName,
    dashboardUrl,
  ]);

  await sendTransactionalEmail({
    to: receiver.email,
    subject: `${emailSubject(locale, "newMessage")} — ${senderName}`,
    html:
      locale === "en"
        ? newMessageEmailHtml({
            recipientName,
            senderName,
            preview: content,
            dashboardUrl,
          })
        : textEmailHtml(localizedText),
    text: localizedText,
    event: "message_received",
    meta: { receiverId, senderId },
  });
}

export async function sendVerificationEmail({ email, name, verificationToken, locale = "en" }) {
  const verifyUrl = buildVerificationUrl(verificationToken);
  const text = emailBody(locale, "verify", [name || "there", verifyUrl]);
  return sendTransactionalEmail({
    to: email,
    subject: emailSubject(locale, "verify"),
    html: locale === "en" ? verifyEmailHtml({ name, verifyUrl }) : textEmailHtml(text),
    text,
    event: "verification_sent",
    meta: { email },
  });
}

export async function notifyWelcomeAfterVerification({ email, name, locale = "en" }) {
  const dashboardUrl = `${appBaseUrl()}/dashboard`;
  const text = emailBody(locale, "welcome", [name || "there", dashboardUrl]);
  return sendTransactionalEmail({
    to: email,
    subject: emailSubject(locale, "welcome"),
    html: locale === "en" ? welcomeEmailHtml({ name, dashboardUrl }) : textEmailHtml(text),
    text,
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
      preferredLocale: true,
      attorney: { select: { name: true } },
    },
  });
  if (!user?.email) return;

  const portalUrl = `${appBaseUrl()}/dashboard`;
  const name = displayName(user);
  const locale = user.preferredLocale || "en";
  const text = emailBody(locale, "renewal", [name, renewalDate, portalUrl]);

  await sendTransactionalEmail({
    to: user.email,
    subject: emailSubject(locale, "renewal"),
    html:
      locale === "en"
        ? subscriptionRenewalEmailHtml({
            name,
            renewalDate,
            amount,
            portalUrl,
          })
        : textEmailHtml(text),
    text,
    event: "subscription_renewal_reminder",
    meta: { userId },
  });
}

export async function notifySignupRejected({ email, name, reason, locale = "en" }) {
  if (!email) return false;
  const text = emailBody(locale, "providerRejected", [name || "there", reason || ""]);
  return sendTransactionalEmail({
    to: email,
    subject: emailSubject(locale, "providerRejected"),
    html: locale === "en" ? signupRejectedEmailHtml({ name, reason }) : textEmailHtml(text),
    text,
    event: "signup_rejected",
    meta: { email },
  });
}

export async function notifySignupApproved({ email, name, locale = "en" }) {
  if (!email) return false;
  const loginUrl = `${appBaseUrl()}/dashboard`;
  const text = emailBody(locale, "providerApproved", [
    name || "there",
    "",
    loginUrl,
  ]);
  return sendTransactionalEmail({
    to: email,
    subject: emailSubject(locale, "providerApproved"),
    html:
      locale === "en"
        ? signupApprovedEmailHtml({ name, loginUrl })
        : textEmailHtml(text),
    text,
    event: "signup_approved",
    meta: { email },
  });
}

function textEmailHtml(text) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto">${String(
    text
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")}</div>`;
}

export async function notifyTranslationOrderUpdate(orderId, status) {
  const order = await prisma.translationOrder.findUnique({
    where: { id: Number(orderId) },
    include: {
      client: {
        select: { email: true, displayName: true, preferredLocale: true },
      },
      provider: {
        include: {
          user: {
            select: { email: true, displayName: true, preferredLocale: true },
          },
        },
      },
    },
  });
  if (!order) return;
  const url = `${appBaseUrl()}/dashboard?tab=orders`;
  const recipients = [order.client, order.provider?.user].filter(Boolean);
  await Promise.all(
    recipients.map((recipient) => {
      const locale = recipient.preferredLocale || "en";
      const text = emailBody(locale, "order", [
        recipient.displayName || "there",
        String(status).replace(/_/g, " "),
        url,
      ]);
      return sendTransactionalEmail({
        to: recipient.email,
        subject: `${emailSubject(locale, "orderUpdate")} #${order.id}`,
        text,
        html: textEmailHtml(text),
        event: "translation_order_update",
        meta: { orderId: order.id, status },
      });
    })
  );
}

export async function notifyBookingUpdate(bookingId, status) {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: Number(bookingId) },
    include: {
      client: {
        select: { email: true, displayName: true, preferredLocale: true },
      },
      provider: {
        include: {
          user: {
            select: { email: true, displayName: true, preferredLocale: true },
          },
        },
      },
    },
  });
  if (!booking) return;
  const url = `${appBaseUrl()}/dashboard?tab=bookings`;
  const recipients = [booking.client, booking.provider?.user].filter(Boolean);
  await Promise.all(
    recipients.map((recipient) => {
      const locale = recipient.preferredLocale || "en";
      const text = emailBody(locale, "booking", [
        recipient.displayName || "there",
        String(status).replace(/_/g, " "),
        url,
      ]);
      return sendTransactionalEmail({
        to: recipient.email,
        subject: `${emailSubject(locale, "bookingUpdate")} #${booking.id}`,
        text,
        html: textEmailHtml(text),
        event: "booking_update",
        meta: { bookingId: booking.id, status },
      });
    })
  );
}

export async function notifyCredentialUpdateRequested(providerId, note) {
  const provider = await prisma.provider.findUnique({
    where: { id: Number(providerId) },
    include: {
      user: {
        select: { email: true, displayName: true, preferredLocale: true },
      },
    },
  });
  if (!provider?.user?.email) return;
  const locale = provider.user.preferredLocale || "en";
  const url = `${appBaseUrl()}/dashboard?tab=profile`;
  const text = emailBody(locale, "credential", [
    provider.displayName || provider.user.displayName || "there",
    note || "",
    url,
  ]);
  return sendTransactionalEmail({
    to: provider.user.email,
    subject: emailSubject(locale, "credentialUpdate"),
    text,
    html: textEmailHtml(text),
    event: "credential_update_requested",
    meta: { providerId },
  });
}
