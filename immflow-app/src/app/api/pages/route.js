import { apiSuccess, handleApiError } from "@/lib/api/response";
import { getCmsMenu, listCmsPages } from "@/lib/services/cms-pages";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const locale = url.searchParams.get("locale") || "en";
    const menuOnly = url.searchParams.get("menu") === "1";

    if (menuOnly) {
      const menu = await getCmsMenu(locale);
      return apiSuccess(menu);
    }

    const pages = await listCmsPages({ publishedOnly: true });
    return apiSuccess(
      pages.map(({ id, slug, title, excerpt, href, footerColumn, showInFooter, showInNav }) => ({
        id,
        slug,
        title,
        excerpt,
        href,
        footerColumn,
        showInFooter,
        showInNav,
      }))
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch pages.");
  }
}
