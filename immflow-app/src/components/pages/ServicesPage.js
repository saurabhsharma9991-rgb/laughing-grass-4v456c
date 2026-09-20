"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

const ICONS = {
  attorney: "⚖️",
  translation: "📄",
  interpreter: "🎙️",
  psychological: "🧠",
};

export default function ServicesPage({ setPage, initialQuery }) {
  const { t } = useI18n();
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(initialQuery || "");
  const [finding, setFinding] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const runFinder = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setFinding(true);
    try {
      const res = await fetch("/api/service-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.categorySlug) {
        window.location.href = `/services/${data.categorySlug}?q=${encodeURIComponent(query)}`;
      }
    } finally {
      setFinding(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      <h1 className="font-syne text-3xl font-extrabold text-text mb-2">
        {t("home.whatDoYouNeed", "What do you need help with?")}
      </h1>
      <p className="text-sm text-muted mb-8 max-w-xl">
        Choose a service category or describe what you need in your own words.
      </p>

      <form onSubmit={runFinder} className="mb-10">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-green block mb-2">
          {t("home.tellUs", "Tell us what you need...")}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "home.aiSearchPlaceholder",
              "e.g., I need a certified Hindi to English translation."
            )}
            className="flex-1 text-sm py-3 px-4 border border-[rgba(0,0,0,0.15)] rounded-xl bg-white focus:outline-none focus:border-green"
          />
          <button
            type="submit"
            disabled={finding || !query.trim()}
            className="bg-green hover:bg-green-dark text-white font-semibold text-sm py-3 px-6 rounded-xl border-none cursor-pointer disabled:opacity-50"
          >
            {finding ? t("common.loading", "Loading…") : t("common.search", "Search")}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/services/${c.slug}`}
            className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-6 shadow-sm hover:border-green/50 transition-all no-underline text-inherit"
          >
            <div className="text-2xl mb-3">{ICONS[c.slug] || "✦"}</div>
            <h2 className="font-syne text-lg font-bold text-text">{c.name}</h2>
            <p className="text-xs text-muted mt-2 leading-relaxed">{c.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-[rgba(0,0,0,0.08)] flex flex-wrap gap-4 text-sm">
        <button
          type="button"
          onClick={() => setPage?.("attorneys")}
          className="text-green font-semibold bg-transparent border-none cursor-pointer hover:underline"
        >
          {t("nav.findAttorneys", "Find attorneys")} →
        </button>
        <button
          type="button"
          onClick={() => setPage?.("jobs")}
          className="text-green font-semibold bg-transparent border-none cursor-pointer hover:underline"
        >
          {t("nav.jobBoard", "Job board")} →
        </button>
      </div>
    </div>
  );
}
