import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import { FOOTER_COLUMNS } from "@/lib/constants/cms-pages.js";
import {
  normalizeSlug,
  isReservedSlug,
  cmsPagePath,
  renderPageBodyHtml,
} from "@/lib/utils/cms-pages.js";

export { FOOTER_COLUMNS, normalizeSlug, cmsPagePath, renderPageBodyHtml };

export function assertValidSlug(slug) {
  if (!slug || slug.length < 2) {
    throw new AuthError("Slug must be at least 2 characters.", 400, "VALIDATION_ERROR");
  }
  if (isReservedSlug(slug)) {
    throw new AuthError(`Slug "${slug}" is reserved.`, 400, "VALIDATION_ERROR");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new AuthError(
      "Slug may only contain lowercase letters, numbers, and hyphens.",
      400,
      "VALIDATION_ERROR"
    );
  }
}

function localizePage(page, locale = "en") {
  if (!page) return null;
  const overlay =
    locale && locale !== "en" && page.translations?.[locale]
      ? page.translations[locale]
      : null;
  return {
    id: page.id,
    slug: page.slug,
    title: overlay?.title || page.title,
    excerpt: overlay?.excerpt ?? page.excerpt,
    body: overlay?.body || page.body,
    footerColumn: page.footerColumn,
    showInFooter: page.showInFooter,
    showInNav: page.showInNav,
    footerSort: page.footerSort,
    navSort: page.navSort,
    isPublished: page.isPublished,
    href: cmsPagePath(page.slug),
    updatedAt: page.updatedAt,
    createdAt: page.createdAt,
    translations: page.translations || {},
  };
}

export async function listCmsPages({ publishedOnly = false } = {}) {
  const pages = await prisma.cmsPage.findMany({
    where: publishedOnly ? { isPublished: true } : undefined,
    orderBy: [{ footerSort: "asc" }, { title: "asc" }],
  });
  return pages.map((p) => localizePage(p));
}

export async function getCmsPageBySlug(slug, { publishedOnly = true, locale = "en" } = {}) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return null;
  const page = await prisma.cmsPage.findUnique({ where: { slug: normalized } });
  if (!page) return null;
  if (publishedOnly && !page.isPublished) return null;
  return localizePage(page, locale);
}

export async function getCmsMenu(locale = "en") {
  const pages = await prisma.cmsPage.findMany({
    where: {
      isPublished: true,
      OR: [{ showInFooter: true }, { showInNav: true }],
    },
    orderBy: [{ footerSort: "asc" }, { navSort: "asc" }, { title: "asc" }],
  });

  const localized = pages.map((p) => localizePage(p, locale));
  return {
    footer: localized
      .filter((p) => p.showInFooter)
      .sort((a, b) => a.footerSort - b.footerSort || a.title.localeCompare(b.title)),
    nav: localized
      .filter((p) => p.showInNav)
      .sort((a, b) => a.navSort - b.navSort || a.title.localeCompare(b.title)),
  };
}

function normalizeTranslations(input) {
  if (!input || typeof input !== "object") return {};
  const out = {};
  for (const [locale, value] of Object.entries(input)) {
    if (!value || typeof value !== "object") continue;
    out[locale] = {
      title: value.title != null ? String(value.title) : undefined,
      excerpt: value.excerpt != null ? String(value.excerpt) : undefined,
      body: value.body != null ? String(value.body) : undefined,
    };
  }
  return out;
}

function parsePageInput(input, { requireSlug = true } = {}) {
  const title = String(input.title || "").trim();
  if (!title) throw new AuthError("Title is required.", 400, "VALIDATION_ERROR");

  const slug = normalizeSlug(input.slug || title);
  if (requireSlug) assertValidSlug(slug);

  let footerColumn = input.footerColumn ? String(input.footerColumn).trim() : null;
  if (footerColumn && !FOOTER_COLUMNS.includes(footerColumn)) {
    throw new AuthError(
      `footerColumn must be one of: ${FOOTER_COLUMNS.join(", ")}.`,
      400,
      "VALIDATION_ERROR"
    );
  }

  return {
    slug,
    title,
    excerpt: input.excerpt != null ? String(input.excerpt) : null,
    body: input.body != null ? String(input.body) : "",
    translations: normalizeTranslations(input.translations),
    footerColumn,
    showInFooter: Boolean(input.showInFooter),
    showInNav: Boolean(input.showInNav),
    footerSort: Number.isFinite(Number(input.footerSort)) ? Number(input.footerSort) : 0,
    navSort: Number.isFinite(Number(input.navSort)) ? Number(input.navSort) : 0,
    isPublished: Boolean(input.isPublished),
  };
}

export async function createCmsPage(input) {
  const data = parsePageInput(input, { requireSlug: true });
  try {
    const page = await prisma.cmsPage.create({ data });
    return localizePage(page);
  } catch (error) {
    if (error?.code === "P2002") {
      throw new AuthError("A page with that slug already exists.", 409, "CONFLICT");
    }
    throw error;
  }
}

export async function updateCmsPage(id, input) {
  const existing = await prisma.cmsPage.findUnique({ where: { id: Number(id) } });
  if (!existing) throw new AuthError("Page not found.", 404, "NOT_FOUND");

  const data = parsePageInput(
    {
      ...existing,
      ...input,
      slug: input.slug !== undefined ? input.slug : existing.slug,
      translations:
        input.translations !== undefined ? input.translations : existing.translations,
    },
    { requireSlug: true }
  );

  try {
    const page = await prisma.cmsPage.update({
      where: { id: Number(id) },
      data,
    });
    return localizePage(page);
  } catch (error) {
    if (error?.code === "P2002") {
      throw new AuthError("A page with that slug already exists.", 409, "CONFLICT");
    }
    throw error;
  }
}

export async function deleteCmsPage(id) {
  const existing = await prisma.cmsPage.findUnique({ where: { id: Number(id) } });
  if (!existing) throw new AuthError("Page not found.", 404, "NOT_FOUND");
  await prisma.cmsPage.delete({ where: { id: Number(id) } });
  return { success: true };
}
