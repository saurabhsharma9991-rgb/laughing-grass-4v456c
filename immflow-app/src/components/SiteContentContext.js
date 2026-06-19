"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const SiteContentContext = createContext(null);

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  const refreshContent = async () => {
    try {
      const res = await fetch("/api/content");
      const data = await res.json();
      if (!data.error) {
        setContent(data);
      }
    } catch (e) {
      console.error("Failed to load site content:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContent();
  }, []);

  const get = (key, fallback = "") => {
    return content[key] !== undefined ? content[key] : fallback;
  };

  return (
    <SiteContentContext.Provider value={{ content, get, loading, refreshContent }}>
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
