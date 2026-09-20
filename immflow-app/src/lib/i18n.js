import { DEFAULT_LOCALE, isValidLocale } from "@/lib/constants/marketplace";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import hi from "@/locales/hi.json";
import ru from "@/locales/ru.json";
import zh from "@/locales/zh.json";

const CATALOGS = { en, es, hi, ru, zh };

const LOCALE_COOKIE = "immflow_locale";

export function getCatalog(locale) {
  const code = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  return CATALOGS[code] || CATALOGS[DEFAULT_LOCALE];
}

/** Resolve dotted key path, e.g. "nav.login" */
export function translate(locale, key, fallback) {
  const catalog = getCatalog(locale);
  const parts = String(key).split(".");
  let cur = catalog;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") {
      cur = undefined;
      break;
    }
    cur = cur[part];
  }
  if (typeof cur === "string") return cur;
  if (fallback != null) return fallback;
  // Fall back to English
  if (locale !== DEFAULT_LOCALE) return translate(DEFAULT_LOCALE, key, key);
  return key;
}

export function readStoredLocale() {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const fromStorage = localStorage.getItem(LOCALE_COOKIE);
    if (isValidLocale(fromStorage)) return fromStorage;
    const match = document.cookie.match(/(?:^|; )immflow_locale=([^;]*)/);
    const fromCookie = match ? decodeURIComponent(match[1]) : null;
    if (isValidLocale(fromCookie)) return fromCookie;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale) {
  if (!isValidLocale(locale) || typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_COOKIE, locale);
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;
  } catch {
    /* ignore */
  }
}

export { LOCALE_COOKIE };
