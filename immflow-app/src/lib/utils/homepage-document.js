import { createBlockId } from "../constants/cms-page-blocks.js";
import {
  createEmptyHomepageDocument,
  buildDefaultHomepageDocument,
} from "../constants/homepage-blocks.js";
import { PAGE_PATHS, pageForPath } from "../constants/routes.js";

function normalizeHomepageDocument(doc) {
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
    blocks: blocks.length ? blocks : createEmptyHomepageDocument().blocks,
  };
}

export function parseHomepageDocument(raw) {
  if (raw == null || raw === "") {
    return null;
  }

  if (typeof raw === "object" && raw.version) {
    return normalizeHomepageDocument(raw);
  }

  const str = String(raw).trim();
  if (!str) return null;

  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.blocks)) {
      return normalizeHomepageDocument(parsed);
    }
  } catch {
    return null;
  }

  return null;
}

export function serializeHomepageDocument(doc) {
  return JSON.stringify(normalizeHomepageDocument(doc));
}

export function resolveHomepageDocument(raw, getFn) {
  const parsed = parseHomepageDocument(raw);
  if (parsed && parsed.blocks?.length) {
    return parsed;
  }
  return buildDefaultHomepageDocument(getFn);
}

/** Navigate from homepage block hrefs (paths, page keys, #signup, external). */
export function followHomeHref(href, { setPage, setShowAuth } = {}) {
  const h = String(href || "").trim();
  if (!h) return;
  if (h === "#signup" || h === "#auth") {
    setShowAuth?.(true);
    return;
  }
  if (/^https?:\/\//i.test(h)) {
    window.location.href = h;
    return;
  }
  const path = h.startsWith("/") ? h.replace(/\/$/, "") || "/" : `/${h}`;
  const pageKey = pageForPath(path);
  if (pageKey && PAGE_PATHS[pageKey] === path && setPage) {
    setPage(pageKey);
    return;
  }
  window.location.href = path;
}
