"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, PLATFORM_LOCALES, isValidLocale } from "@/lib/constants/marketplace";
import { persistLocale, readStoredLocale, translate } from "@/lib/i18n";

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, fallback) => fallback || key,
  locales: PLATFORM_LOCALES,
});

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const preferred = data?.user?.preferredLocale;
        if (isValidLocale(preferred)) {
          setLocaleState(preferred);
          persistLocale(preferred);
        }
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback((next) => {
    if (!isValidLocale(next)) return;
    setLocaleState(next);
    persistLocale(next);
    fetch("/api/user/locale", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {
      // Guests and offline users still retain the local preference.
    });
  }, []);

  const t = useCallback(
    (key, fallback) => translate(locale, key, fallback),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, locales: PLATFORM_LOCALES, ready }),
    [locale, setLocale, t, ready]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
