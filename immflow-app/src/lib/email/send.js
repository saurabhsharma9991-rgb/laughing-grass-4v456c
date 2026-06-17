import { appBaseUrl } from "@/lib/auth-tokens";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email service is not configured. Set EMAIL_API_KEY.");
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

function getEmailConfig() {
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "ImmFlow <noreply@myimmflow.com>";
  const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  return { apiKey, from, provider };
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

/** Send a transactional email via Resend or ZeptoMail. */
export async function sendEmail({ to, subject, html, text }) {
  const { apiKey, from, provider } = getEmailConfig();
  if (!apiKey) {
    throw new EmailNotConfiguredError();
  }

  const recipients = Array.isArray(to) ? to : [to];
  if (!recipients.length || !subject?.trim()) {
    throw new Error("Email requires at least one recipient and a subject.");
  }

  if (provider === "zeptomail") {
    return sendViaZeptoMail({ apiKey, from, to: recipients, subject, html, text });
  }

  return sendViaResend({ apiKey, from, to: recipients, subject, html, text });
}

export function isEmailConfigured() {
  return Boolean(process.env.EMAIL_API_KEY?.trim());
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
