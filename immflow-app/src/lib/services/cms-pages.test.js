import { describe, expect, it } from "vitest";
import {
  normalizeSlug,
  cmsPagePath,
  renderPageBodyHtml,
} from "../utils/cms-pages.js";
import {
  parsePageDocument,
  serializePageDocument,
  renderPageDocumentHtml,
} from "../utils/cms-page-document.js";
import { createBlock, createEmptyDocument } from "../constants/cms-page-blocks.js";

describe("cms page helpers", () => {
  it("normalizes slugs", () => {
    expect(normalizeSlug("About Us!")).toBe("about-us");
    expect(normalizeSlug("  Terms--of  Use  ")).toBe("terms-of-use");
  });

  it("builds page paths", () => {
    expect(cmsPagePath("about")).toBe("/pages/about");
  });

  it("renders legacy plain text paragraphs", () => {
    const html = renderPageBodyHtml("Hello\n\nWorld");
    expect(html).toContain("Hello");
    expect(html).toContain("World");
  });

  it("strips script tags from HTML bodies", () => {
    const html = renderPageBodyHtml("<p>Hi</p><script>alert(1)</script>");
    expect(html).toContain("<p>Hi</p>");
    expect(html.toLowerCase()).not.toContain("<script");
  });

  it("round-trips block documents", () => {
    const doc = createEmptyDocument({ mode: "blocks" });
    doc.blocks = [createBlock("hero"), createBlock("faq")];
    const raw = serializePageDocument(doc);
    const parsed = parsePageDocument(raw);
    expect(parsed.mode).toBe("blocks");
    expect(parsed.blocks).toHaveLength(2);
    expect(parsed.blocks[0].type).toBe("hero");
  });

  it("renders hero and faq blocks", () => {
    const doc = {
      version: 1,
      mode: "blocks",
      blocks: [
        {
          id: "1",
          type: "hero",
          data: { title: "Hello", subtitle: "World", buttonLabel: "Go", buttonHref: "/" },
        },
        {
          id: "2",
          type: "faq",
          data: { items: [{ question: "Q?", answer: "A." }] },
        },
      ],
      html: "",
    };
    const html = renderPageDocumentHtml(doc);
    expect(html).toContain("Hello");
    expect(html).toContain("Q?");
    expect(html).toContain("<details");
  });
});
