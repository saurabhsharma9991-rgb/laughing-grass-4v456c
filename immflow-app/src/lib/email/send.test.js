import { describe, it, expect } from "vitest";
import {
  buildPasswordResetUrl,
  passwordResetEmailHtml,
  announcementEmailHtml,
  newApplicationEmailHtml,
  applicationStatusEmailHtml,
  verifyEmailHtml,
  buildVerificationUrl,
} from "@/lib/email/send";

describe("email templates", () => {
  it("builds password reset URL with encoded token", () => {
    const url = buildPasswordResetUrl("abc+def");
    expect(url).toContain("reset=abc%2Bdef");
  });

  it("includes reset link in password reset HTML", () => {
    const html = passwordResetEmailHtml({
      resetUrl: "https://myimmflow.com/?reset=token",
      userEmail: "user@example.com",
    });
    expect(html).toContain("https://myimmflow.com/?reset=token");
    expect(html).toContain("user@example.com");
  });

  it("escapes announcement subject in HTML", () => {
    const html = announcementEmailHtml({
      subject: "<script>",
      content: "Hello\nWorld",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("Hello<br/>World");
  });

  it("includes listing title in new application email", () => {
    const html = newApplicationEmailHtml({
      ownerName: "Maria",
      listingTitle: "H-1B Associate",
      applicantName: "James",
      message: "Interested",
      dashboardUrl: "https://myimmflow.com/dashboard",
    });
    expect(html).toContain("H-1B Associate");
    expect(html).toContain("James");
  });

  it("includes status in application update email", () => {
    const html = applicationStatusEmailHtml({
      applicantName: "James",
      listingTitle: "H-1B Associate",
      status: "accepted",
      dashboardUrl: "https://myimmflow.com/dashboard",
    });
    expect(html).toContain("accepted");
  });

  it("includes verification link in verify email", () => {
    const url = buildVerificationUrl("abc+token");
    expect(url).toContain("verify=abc%2Btoken");
    const html = verifyEmailHtml({ name: "Jane", verifyUrl: url });
    expect(html).toContain(url);
    expect(html).toContain("Jane");
  });
});
