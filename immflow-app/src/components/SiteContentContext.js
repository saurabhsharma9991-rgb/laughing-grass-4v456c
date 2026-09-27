"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";

const SiteContentContext = createContext(null);

export function SiteContentProvider({ children }) {
  const { locale } = useI18n();
  const [content, setContent] = useState({});
  const [menu, setMenu] = useState({ footer: [], nav: [] });
  const [loading, setLoading] = useState(true);

  const refreshContent = async () => {
    try {
      const [contentRes, menuRes] = await Promise.all([
        fetch(`/api/content?locale=${encodeURIComponent(locale)}`),
        fetch(`/api/pages?menu=1&locale=${encodeURIComponent(locale)}`),
      ]);
      const contentData = await contentRes.json();
      const menuData = await menuRes.json();
      if (!contentData.error) {
        setContent(contentData);
      }
      if (!menuData.error) {
        setMenu({
          footer: Array.isArray(menuData.footer) ? menuData.footer : [],
          nav: Array.isArray(menuData.nav) ? menuData.nav : [],
        });
      }
    } catch (e) {
      console.error("Failed to load site content:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContent();
  }, [locale]);

  const get = (key, fallback = "") => {
    return content[key] !== undefined ? content[key] : fallback;
  };

  return (
    <SiteContentContext.Provider
      value={{ content, get, menu, loading, refreshContent }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error("useContent must be used within a SiteContentProvider");
  }
  return ctx;
}
