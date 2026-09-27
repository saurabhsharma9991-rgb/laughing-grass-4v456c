import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { getCmsPageBySlug } from "@/lib/services/cms-pages";
import {
  parsePageDocument,
  renderPageDocumentHtml,
} from "@/lib/utils/cms-page-document";

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const locale = new URL(req.url).searchParams.get("locale") || "en";
    const page = await getCmsPageBySlug(slug, { publishedOnly: true, locale });
    if (!page) return apiError("Page not found.", 404, "NOT_FOUND");

    const document = parsePageDocument(page.body);
    return apiSuccess({
      ...page,
      document,
      bodyHtml: renderPageDocumentHtml(document),
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch page.");
  }
}
