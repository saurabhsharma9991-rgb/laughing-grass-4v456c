"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, PLATFORM_LOCALES, isValidLocale } from "@/lib/constants/marketplace";
import { persistLocale, readStoredLocale, translate } from "@/lib/i18n";
import { usePlatform } from "@/components/PlatformContext";

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, fallback) => fallback || key,
  locales: PLATFORM_LOCALES,
});

export function I18nProvider({ children }) {
  const { enabledLocales } = usePlatform();
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  const locales = useMemo(
    () => PLATFORM_LOCALES.filter((item) => enabledLocales?.includes(item.code)),
    [enabledLocales]
  );

  useEffect(() => {
    const allowed = new Set(enabledLocales?.length ? enabledLocales : ["en"]);
    const stored = readStoredLocale();
    const hasStored =
      typeof window !== "undefined" && Boolean(localStorage.getItem("immflow_locale"));
    let next = DEFAULT_LOCALE;
    if (hasStored && allowed.has(stored)) next = stored;
    else if (typeof navigator !== "undefined") {
      const browser = String(navigator.language || "")
        .slice(0, 2)
        .toLowerCase();
      if (allowed.has(browser)) next = browser;
    }
    const resolved = isValidLocale(next) && allowed.has(next) ? next : DEFAULT_LOCALE;
    setLocaleState(resolved);
    persistLocale(resolved);
    setReady(true);
  }, [enabledLocales]);

  const setLocale = useCallback(
    (next) => {
      if (!isValidLocale(next)) return;
      if (enabledLocales?.length && !enabledLocales.includes(next)) return;
      setLocaleState(next);
      persistLocale(next);
      fetch("/api/user/locale", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      }).catch(() => {});
    },
    [enabledLocales]
  );

  const t = useCallback((key, fallback) => translate(locale, key, fallback), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, locales, ready }),
    [locale, setLocale, t, locales, ready]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
