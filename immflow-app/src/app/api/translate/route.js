import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isValidLocale } from "@/lib/constants/marketplace";
import { getPlatformSettings } from "@/lib/services/platform-settings";
import { translateTexts, translationDictionary } from "@/lib/services/auto-translate";

const MAX_TEXTS = 400;

/** GET ?locale=hi → { entries: { english: translated } } for preloading. */
export async function GET(req) {
  try {
    const limited = rateLimit(`translate-dict:${clientIp(req)}`, { limit: 30, windowMs: 60_000 });
    if (!limited.allowed) {
      return apiError("Too many translation requests.", 429, "RATE_LIMITED");
    }
    const locale = new URL(req.url).searchParams.get("locale") || "";
    if (!isValidLocale(locale)) return apiError("Unsupported locale.", 400, "VALIDATION_ERROR");
    const res = apiSuccess({ entries: await translationDictionary(locale) });
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=3600");
    return res;
  } catch (error) {
    return handleApiError(error, "Failed to load translations.");
  }
}
const MAX_TEXT_LENGTH = 4000;
const MAX_TOTAL_CHARS = 80_000;

/** POST { locale, texts: string[] } → { translations: string[] } (same order). */
export async function POST(req) {
  try {
    const limited = rateLimit(`translate:${clientIp(req)}`, { limit: 120, windowMs: 60_000 });
    if (!limited.allowed) {
      return apiError("Too many translation requests.", 429, "RATE_LIMITED");
    }
    const body = await req.json();
    const locale = String(body?.locale || "");
    const texts = Array.isArray(body?.texts) ? body.texts : null;
    if (!isValidLocale(locale)) return apiError("Unsupported locale.", 400, "VALIDATION_ERROR");
    if (!texts || texts.length > MAX_TEXTS || texts.some((t) => typeof t !== "string")) {
      return apiError(`texts must be up to ${MAX_TEXTS} strings.`, 400, "VALIDATION_ERROR");
    }
    const clipped = texts.map((t) => t.slice(0, MAX_TEXT_LENGTH));
    if (clipped.reduce((sum, t) => sum + t.length, 0) > MAX_TOTAL_CHARS) {
      return apiError("Too much text in one request.", 400, "VALIDATION_ERROR");
    }
    const settings = await getPlatformSettings();
    if (locale !== "en" && !settings.enabledLocales?.includes(locale)) {
      return apiError("That language is not enabled.", 400, "LOCALE_DISABLED");
    }
    return apiSuccess({ translations: await translateTexts(clipped, locale) });
  } catch (error) {
    return handleApiError(error, "Translation failed.");
  }
}
