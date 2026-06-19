import nodemailer from "nodemailer";
import { appBaseUrl } from "@/lib/auth-tokens";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      "Email service is not configured. Set MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM_ADDRESS (SMTP), or EMAIL_API_KEY (Resend/ZeptoMail)."
    );
    this.name = "EmailNotConfiguredError";
    this.code = "EMAIL_NOT_CONFIGURED";
  }
}

export class EmailDeliveryError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "EmailDeliveryError";
    this.status = status;
  }
}

function getSmtpConfig() {
  const host = process.env.MAIL_HOST?.trim();
  const user = process.env.MAIL_USERNAME?.trim();
  const pass = process.env.MAIL_PASSWORD?.trim();
  const fromAddress = process.env.MAIL_FROM_ADDRESS?.trim();
  if (!host || !user || !pass || !fromAddress) return null;

  const port = parseInt(process.env.MAIL_PORT || "587", 10);
  const encryption = (process.env.MAIL_ENCRYPTION || "tls").toLowerCase();
  const fromName = process.env.MAIL_FROM_NAME?.trim() || "ImmFlow";
  const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

  return {
    host,
    port,
    secure: encryption === "ssl",
    requireTls: encryption === "tls",
    auth: { user, pass },
    from,
  };
}

function getEmailConfig() {
  const smtp = getSmtpConfig();
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const explicitProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const provider =
    explicitProvider ||
    (smtp && !apiKey ? "smtp" : apiKey ? process.env.EMAIL_PROVIDER || "resend" : "resend");

  const from =
    process.env.EMAIL_FROM?.trim() ||
    smtp?.from ||
    "ImmFlow <noreply@myimmflow.com>";

  return { apiKey, from, provider: provider.toLowerCase(), smtp };
}

let smtpTransport;

function getSmtpTransport(smtp) {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth,
      ...(smtp.requireTls && !smtp.secure ? { requireTLS: true } : {}),
    });
  }
  return smtpTransport;
}

async function sendViaSmtp({ smtp, from, to, subject, html, text }) {
  const transport = getSmtpTransport(smtp);
  try {
    return await transport.sendMail({
      from,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      ...(text ? { text } : {}),
    });
  } catch (err) {
    throw new EmailDeliveryError(`SMTP error: ${err.message}`, 502);
  }
}

async function sendViaResend({ apiKey, from, to, subject, html, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(text ? { text } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new EmailDeliveryError(
      `Resend API error (${res.status}): ${body.slice(0, 200)}`,
      res.status
    );
  }

  return res.json();
}

async function sendViaZeptoMail({ apiKey, from, to, subject, html, text }) {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  const fromName = match ? match[1].trim() : "ImmFlow";
  const fromAddress = match ? match[2].trim() : from;
  const recipients = Array.isArray(to) ? to : [to];

  const res = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: {
      Authorization: `Zoho-enczapikey ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { address: fromAddress, name: fromName },
      to: recipients.map((email) => ({ email_address: { address: email } })),
      subject,
      htmlbody: html,
      ...(text ? { textbody: text } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new EmailDeliveryError(
      `ZeptoMail API error (${res.status}): ${body.slice(0, 200)}`,
      res.status
    );
  }

  return res.json();
}

/** Send a transactional email via SMTP, Resend, or ZeptoMail. */
export async function sendEmail({ to, subject, html, text }) {
  const { apiKey, from, provider, smtp } = getEmailConfig();

  const recipients = Array.isArray(to) ? to : [to];
  if (!recipients.length || !subject?.trim()) {
    throw new Error("Email requires at least one recipient and a subject.");
  }

  if (provider === "smtp") {
    if (!smtp) throw new EmailNotConfiguredError();
    return sendViaSmtp({ smtp, from, to: recipients, subject, html, text });
  }

  if (!apiKey) throw new EmailNotConfiguredError();

  if (provider === "zeptomail") {
    return sendViaZeptoMail({ apiKey, from, to: recipients, subject, html, text });
  }

  return sendViaResend({ apiKey, from, to: recipients, subject, html, text });
}

export function isEmailConfigured() {
  if (getSmtpConfig()) return true;
  return Boolean(process.env.EMAIL_API_KEY?.trim());
}

export function getEmailProvider() {
  return getEmailConfig().provider;
}

export function passwordResetEmailHtml({ resetUrl, userEmail }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #141E30;">
  <h2 style="color: #35577D;">Reset your ImmFlow password</h2>
  <p>We received a request to reset the password for <strong>${userEmail}</strong>.</p>
  <p><a href="${resetUrl}" style="display:inline-block;background:#35577D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset password</a></p>
  <p style="font-size:13px;color:#666;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
  <p style="font-size:12px;color:#999;">ImmFlow — U.S. immigration attorney marketplace</p>
</body>
</html>`;
}

export function welcomeEmailHtml({ name, dashboardUrl }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #141E30; max-width: 560px;">
  <h2 style="color: #35577D;">Welcome to ImmFlow, ${name.replace(/</g, "&lt;")}!</h2>
  <p>Your attorney account is ready. Browse the network, post listings, and connect with fellow immigration practitioners.</p>
  <p><a href="${dashboardUrl}" style="display:inline-block;background:#35577D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Open your dashboard</a></p>
  <p style="font-size:12px;color:#999;">ImmFlow — U.S. immigration attorney marketplace</p>
</body>
</html>`;
}

export function buildPasswordResetUrl(resetToken) {
  return `${appBaseUrl()}/?reset=${encodeURIComponent(resetToken)}`;
}

export function buildVerificationUrl(verificationToken) {
  return `${appBaseUrl()}/?verify=${encodeURIComponent(verificationToken)}`;
}

export function verifyEmailHtml({ name, verifyUrl }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #141E30; max-width: 560px;">
  <h2 style="color: #35577D;">Verify your ImmFlow email</h2>
  <p>Hi ${name.replace(/</g, "&lt;")},</p>
  <p>Thanks for signing up. Please confirm your email address to activate your attorney account and log in.</p>
  <p><a href="${verifyUrl}" style="display:inline-block;background:#35577D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Verify email address</a></p>
  <p style="font-size:13px;color:#666;">If the button does not work, copy and paste this link into your browser:<br/><span style="word-break:break-all;">${verifyUrl}</span></p>
  <p style="font-size:12px;color:#999;">ImmFlow — U.S. immigration attorney marketplace</p>
</body>
</html>`;
}

export function announcementEmailHtml({ subject, content }) {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #141E30; max-width: 560px;">
  <h2 style="color: #35577D;">${subject.replace(/</g, "&lt;")}</h2>
  <div style="margin: 16px 0;">${escaped}</div>
  <p style="font-size:12px;color:#999;margin-top:32px;">You received this because you have an ImmFlow account.</p>
</body>
</html>`;
}

export function newApplicationEmailHtml({ ownerName, listingTitle, applicantName, message, dashboardUrl }) {
  const note = message
    ? `<p style="background:#f5f7fa;padding:12px;border-radius:8px;font-size:14px;">${message.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>`
    : "";

  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #141E30; max-width: 560px;">
  <h2 style="color: #35577D;">New application on your listing</h2>
  <p>Hi ${ownerName.replace(/</g, "&lt;")},</p>
  <p><strong>${applicantName.replace(/</g, "&lt;")}</strong> applied to <strong>${listingTitle.replace(/</g, "&lt;")}</strong>.</p>
  ${note}
  <p><a href="${dashboardUrl}" style="display:inline-block;background:#35577D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Review applicants</a></p>
  <p style="font-size:12px;color:#999;">ImmFlow — U.S. immigration attorney marketplace</p>
</body>
</html>`;
}

export function applicationStatusEmailHtml({ applicantName, listingTitle, status, dashboardUrl }) {
  const labels = {
    reviewed: "reviewed",
    accepted: "accepted",
    rejected: "not selected",
  };
  const label = labels[status] || status;

  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #141E30; max-width: 560px;">
  <h2 style="color: #35577D;">Application update</h2>
  <p>Hi ${applicantName.replace(/</g, "&lt;")},</p>
  <p>Your application for <strong>${listingTitle.replace(/</g, "&lt;")}</strong> was <strong>${label}</strong>.</p>
  <p><a href="${dashboardUrl}" style="display:inline-block;background:#35577D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View your applications</a></p>
  <p style="font-size:12px;color:#999;">ImmFlow — U.S. immigration attorney marketplace</p>
</body>
</html>`;
}

export function newMessageEmailHtml({ recipientName, senderName, preview, dashboardUrl }) {
  const snippet = preview
    .replace(/</g, "&lt;")
    .replace(/\n/g, "<br/>")
    .slice(0, 280);

  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #141E30; max-width: 560px;">
  <h2 style="color: #35577D;">New message on ImmFlow</h2>
  <p>Hi ${recipientName.replace(/</g, "&lt;")},</p>
  <p><strong>${senderName.replace(/</g, "&lt;")}</strong> sent you a message:</p>
  <p style="background:#f5f7fa;padding:12px;border-radius:8px;font-size:14px;">${snippet}</p>
  <p><a href="${dashboardUrl}" style="display:inline-block;background:#35577D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Open messages</a></p>
  <p style="font-size:12px;color:#999;">ImmFlow — U.S. immigration attorney marketplace</p>
</body>
</html>`;
}

export function subscriptionRenewalEmailHtml({ name, renewalDate, amount, portalUrl }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #141E30; max-width: 560px;">
  <h2 style="color: #35577D;">ImmFlow Pro renewal reminder</h2>
  <p>Hi ${name.replace(/</g, "&lt;")},</p>
  <p>Your ImmFlow Pro subscription will renew on <strong>${renewalDate}</strong>${amount ? ` for <strong>${amount}</strong>` : ""}.</p>
  <p><a href="${portalUrl}" style="display:inline-block;background:#35577D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Manage billing</a></p>
  <p style="font-size:12px;color:#999;">ImmFlow — U.S. immigration attorney marketplace</p>
</body>
</html>`;
}
