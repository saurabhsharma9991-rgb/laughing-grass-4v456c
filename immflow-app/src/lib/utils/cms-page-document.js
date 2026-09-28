import { iconSvg, plainCopy } from "@/components/icons/Icon";
import {
  createEmptyDocument,
  createBlock,
  createBlockId,
} from "@/lib/constants/cms-page-blocks.js";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sanitizeBasicHtml(html) {
  return String(html || "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*\/?\s*>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

function paragraphsFromText(text) {
  const escaped = escapeHtml(text).trim();
  if (!escaped) return "";
  return escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

/** Detect & normalize stored body into a page document. */
export function parsePageDocument(raw) {
  if (raw == null || raw === "") {
    return createEmptyDocument({ mode: "blocks" });
  }

  if (typeof raw === "object" && raw.version) {
    return normalizeDocument(raw);
  }

  const str = String(raw).trim();
  if (!str) return createEmptyDocument({ mode: "blocks" });

  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object" && (parsed.version || parsed.blocks || parsed.mode)) {
      return normalizeDocument(parsed);
    }
  } catch {
    // legacy plain text / HTML
  }

  if (/<[a-z][\s\S]*>/i.test(str)) {
    return {
      version: 1,
      mode: "html",
      blocks: [],
      html: str,
    };
  }

  return {
    version: 1,
    mode: "blocks",
    blocks: [
      {
        id: createBlockId(),
        type: "paragraph",
        data: { text: str },
      },
    ],
    html: "",
  };
}

function normalizeDocument(doc) {
  const mode = doc.mode === "html" ? "html" : "blocks";
  const blocks = Array.isArray(doc.blocks)
    ? doc.blocks
        .filter((b) => b && typeof b === "object" && b.type)
        .map((b) => ({
          id: b.id || createBlockId(),
          type: String(b.type),
          data: b.data && typeof b.data === "object" ? b.data : {},
        }))
    : [];

  return {
    version: 1,
    mode,
    blocks: mode === "blocks" && blocks.length === 0 ? createEmptyDocument().blocks : blocks,
    html: typeof doc.html === "string" ? doc.html : "",
  };
}

export function serializePageDocument(doc) {
  return JSON.stringify(normalizeDocument(doc));
}

export function renderBlockHtml(block) {
  if (!block?.type) return "";
  const d = block.data || {};

  switch (block.type) {
    case "hero": {
      const align = d.align === "center" ? "text-center" : "text-left";
      const btn =
        d.buttonLabel && d.buttonHref
          ? `<p class="mt-6"><a href="${escapeHtml(d.buttonHref)}" class="inline-block bg-green text-white no-underline py-2.5 px-5 rounded-lg text-sm font-semibold">${escapeHtml(d.buttonLabel)}</a></p>`
          : "";
      return `<section class="cms-hero rounded-2xl bg-green-light/40 border border-green/20 px-6 py-10 mb-8 ${align}">
        ${d.eyebrow ? `<div class="text-[11px] font-semibold uppercase tracking-wider text-green mb-2">${escapeHtml(d.eyebrow)}</div>` : ""}
        <h2 class="font-syne text-3xl md:text-4xl font-extrabold text-text mb-3">${escapeHtml(d.title || "")}</h2>
        ${d.subtitle ? `<p class="text-base text-muted max-w-2xl ${d.align === "center" ? "mx-auto" : ""} leading-relaxed">${escapeHtml(d.subtitle)}</p>` : ""}
        ${btn}
      </section>`;
    }
    case "heading": {
      const level = Number(d.level) === 3 ? 3 : 2;
      const tag = `h${level}`;
      const size = level === 3 ? "text-lg" : "text-xl md:text-2xl";
      return `<${tag} class="font-syne ${size} font-bold text-text mt-8 mb-3">${escapeHtml(d.text || "")}</${tag}>`;
    }
    case "paragraph":
      return `<div class="text-sm text-text leading-relaxed mb-4">${paragraphsFromText(d.text || "")}</div>`;
    case "richtext":
      return `<div class="cms-richtext text-sm text-text leading-relaxed mb-4">${sanitizeBasicHtml(d.html || "")}</div>`;
    case "image": {
      if (!d.url) return "";
      return `<figure class="my-8 ${d.fullWidth ? "" : "max-w-xl"}">
        <img src="${escapeHtml(d.url)}" alt="${escapeHtml(d.alt || "")}" class="w-full rounded-xl border border-[rgba(0,0,0,0.08)]" />
        ${d.caption ? `<figcaption class="text-xs text-muted mt-2 text-center">${escapeHtml(d.caption)}</figcaption>` : ""}
      </figure>`;
    }
    case "cards": {
      const items = Array.isArray(d.items) ? d.items : [];
      const cards = items
        .map(
          (item) => `<div class="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 h-full flex flex-col">
            ${item.icon ? `<div class="text-green mb-3">${iconSvg(item.icon, "w-6 h-6")}</div>` : ""}
            <div class="font-semibold text-text text-sm mb-1">${escapeHtml(item.title || "")}</div>
            <p class="text-xs text-muted leading-relaxed flex-1">${escapeHtml(item.body || "")}</p>
          </div>`
        )
        .join("");
      return `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 my-6 items-stretch">${cards}</div>`;
    }
    case "faq": {
      const items = Array.isArray(d.items) ? d.items : [];
      const rows = items
        .map(
          (item) => `<details class="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4 mb-2">
            <summary class="font-semibold text-sm cursor-pointer">${escapeHtml(item.question || "")}</summary>
            <p class="text-sm text-muted mt-3 leading-relaxed">${escapeHtml(item.answer || "")}</p>
          </details>`
        )
        .join("");
      return `<div class="my-6">${rows}</div>`;
    }
    case "cta": {
      const btn =
        d.buttonLabel && d.buttonHref
          ? `<a href="${escapeHtml(d.buttonHref)}" class="inline-block bg-green text-white no-underline py-2.5 px-5 rounded-lg text-sm font-semibold mt-4">${escapeHtml(d.buttonLabel)}</a>`
          : "";
      return `<section class="my-8 rounded-2xl bg-green-dark text-white px-6 py-8">
        <h3 class="font-syne text-xl font-bold mb-2">${escapeHtml(d.title || "")}</h3>
        ${d.text ? `<p class="text-sm text-white/75 leading-relaxed max-w-xl">${escapeHtml(d.text)}</p>` : ""}
        ${btn}
      </section>`;
    }
    case "contact":
      return `<section class="my-6 bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 text-sm">
        ${d.email ? `<p class="mb-2"><span class="text-muted">Email:</span> <a class="text-green font-semibold" href="mailto:${escapeHtml(d.email)}">${escapeHtml(d.email)}</a></p>` : ""}
        ${d.phone ? `<p class="mb-2"><span class="text-muted">Phone:</span> ${escapeHtml(d.phone)}</p>` : ""}
        ${d.address ? `<p class="mb-2"><span class="text-muted">Address:</span> ${escapeHtml(d.address)}</p>` : ""}
        ${d.note ? `<p class="text-xs text-muted mt-3">${escapeHtml(d.note)}</p>` : ""}
      </section>`;
    case "quote":
      return `<blockquote class="my-8 border-l-4 border-green pl-5 py-1">
        <p class="font-syne text-lg text-text italic leading-relaxed">“${escapeHtml(d.text || "")}”</p>
        ${d.attribution ? `<cite class="block text-xs text-muted mt-2 not-italic">— ${escapeHtml(d.attribution)}</cite>` : ""}
      </blockquote>`;
    case "divider":
      return `<hr class="my-8 border-0 border-t border-[rgba(0,0,0,0.1)]" />`;
    case "html":
      return `<div class="cms-html my-4">${sanitizeBasicHtml(d.html || "")}</div>`;
    default:
      return "";
  }
}

/** Render full page document to safe HTML for public pages. */
export function renderPageDocumentHtml(docOrRaw) {
  const doc = parsePageDocument(docOrRaw);
  if (doc.mode === "html") {
    return sanitizeBasicHtml(doc.html || "");
  }
  return (doc.blocks || []).map(renderBlockHtml).filter(Boolean).join("\n");
}

/** Legacy helper used elsewhere — now routes through document renderer. */
export function renderPageBodyHtml(body) {
  return renderPageDocumentHtml(body);
}

export { createBlock, createEmptyDocument };
