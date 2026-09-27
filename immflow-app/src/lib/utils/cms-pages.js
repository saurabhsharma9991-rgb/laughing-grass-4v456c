import { FOOTER_COLUMNS } from "@/lib/constants/cms-pages.js";
export {
  parsePageDocument,
  serializePageDocument,
  renderPageDocumentHtml,
  renderPageBodyHtml,
  sanitizeBasicHtml,
} from "@/lib/utils/cms-page-document.js";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "attorneys",
  "dashboard",
  "help",
  "jobs",
  "matcher",
  "network",
  "post",
  "providers",
  "services",
  "pages",
  "login",
  "signup",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function normalizeSlug(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function isReservedSlug(slug) {
  return RESERVED_SLUGS.has(slug);
}

export function cmsPagePath(slug) {
  return `/pages/${encodeURIComponent(slug)}`;
}

export function isValidFooterColumn(column) {
  return FOOTER_COLUMNS.includes(column);
}
