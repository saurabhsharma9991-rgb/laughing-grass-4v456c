import { describe, expect, it } from "vitest";
import { assertAllowedUpload } from "./disk";

describe("translation upload validation", () => {
  it("accepts a PDF only when its signature and extension match", () => {
    const buffer = Buffer.from("%PDF-1.7 test");
    expect(
      assertAllowedUpload({
        originalName: "document.pdf",
        mimeType: "application/pdf",
        sizeBytes: buffer.length,
        buffer,
      })
    ).toBe("application/pdf");
  });

  it("rejects spoofed content and path-like unsupported extensions", () => {
    const buffer = Buffer.from("not a pdf");
    expect(() =>
      assertAllowedUpload({
        originalName: "../../document.pdf",
        mimeType: "application/pdf",
        sizeBytes: buffer.length,
        buffer,
      })
    ).toThrow("contents do not match");
    expect(() =>
      assertAllowedUpload({
        originalName: "payload.exe",
        mimeType: "application/pdf",
        sizeBytes: buffer.length,
        buffer,
      })
    ).toThrow("File type not allowed");
  });
});
