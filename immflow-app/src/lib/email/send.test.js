import { describe, it, expect } from "vitest";
import {
  buildPasswordResetUrl,
  passwordResetEmailHtml,
  announcementEmailHtml,
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
});
