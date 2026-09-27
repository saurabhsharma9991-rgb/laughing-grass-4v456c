"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProviderCard from "@/components/ProviderCard";
import TranslationOrderForm from "@/components/TranslationOrderForm";
import BookingRequestForm from "@/components/BookingRequestForm";
import { useI18n } from "@/components/I18nProvider";
import { toastError } from "@/lib/client/alerts";
import { DOCUMENT_TYPES } from "@/lib/constants/translation";
import {
  INTERPRETER_SERVICE_TYPES,
  PSYCH_SERVICE_TYPES,
} from "@/lib/constants/bookings";

export default function ServiceCategoryPage({
  categorySlug,
  initialQuery = "",
  initialFilters = {},
  setPage,
  user,
  setShowAuth,
}) {
  const { t } = useI18n();
  const [category, setCategory] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialQuery || initialFilters.q || "");
  const [language, setLanguage] = useState(initialFilters.language || "");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState(initialFilters.sourceLanguage || "");
  const [target, setTarget] = useState(initialFilters.targetLanguage || "");
  const [filters, setFilters] = useState({
    remote: Boolean(initialFilters.remote),
    inPerson: Boolean(initialFilters.inPerson),
    maxPrice: initialFilters.maxPrice || "",
    minRating: initialFilters.minRating || "",
    availability: initialFilters.availability || "",
    certified: Boolean(initialFilters.certified),
    rush: Boolean(initialFilters.rush),
    documentType: initialFilters.documentType || "",
    turnaround: initialFilters.turnaround || "",
    serviceType: initialFilters.serviceType || "",
    professionalType: initialFilters.professionalType || "",
    licenseState: initialFilters.licenseState || "",
  });

  useEffect(() => {
    fetch(`/api/categories?slug=${encodeURIComponent(categorySlug)}`)
      .then((r) => r.json())
      .then((data) => setCategory(data))
      .catch(() => setCategory(null));
  }, [categorySlug]);

  const load = (overrides = {}) => {
    const nextQ = overrides.q ?? q;
    const nextLanguage = overrides.language ?? language;
    const nextLocation = overrides.location ?? location;
    const nextSource = overrides.source ?? source;
    const nextTarget = overrides.target ?? target;
    const nextFilters = overrides.filters ?? filters;

    setLoading(true);
    const params = new URLSearchParams({ category: categorySlug });
    if (String(nextQ).trim()) params.set("q", String(nextQ).trim());
    if (String(nextLanguage).trim()) params.set("language", String(nextLanguage).trim());
    if (String(nextLocation).trim()) params.set("location", String(nextLocation).trim());
    if (String(nextSource).trim()) params.set("source", String(nextSource).trim());
    if (String(nextTarget).trim()) params.set("target", String(nextTarget).trim());
    for (const [key, value] of Object.entries(nextFilters)) {
      if (value === true) params.set(key, "1");
      else if (value !== false && String(value).trim()) {
        params.set(key, String(value).trim());
      }
    }

    fetch(`/api/providers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProviders(data);
        else if (data.error) toastError(data.error.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!initialQuery.trim()) {
        load();
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/service-finder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: initialQuery }),
        });
        const data = await res.json();
        if (cancelled) return;
        const f = data.filters || {};
        const nextFilters = {
          ...filters,
          remote: Boolean(f.remote),
          inPerson: Boolean(f.inPerson),
          certified: Boolean(f.certified),
          rush: Boolean(f.rush),
          documentType: f.documentType || "",
          turnaround: f.turnaround || "",
          serviceType: f.serviceType || "",
          professionalType: f.professionalType || "",
          licenseState: f.licenseState || "",
          availability: f.availability || "",
          maxPrice: f.maxPrice || "",
          minRating: f.minRating || "",
        };
        const next = {
          q: initialQuery,
          language: f.language || "",
          location: f.location || "",
          source: f.sourceLanguage || "",
          target: f.targetLanguage || "",
          filters: nextFilters,
        };
        setQ(next.q);
        setLanguage(next.language);
        setLocation(next.location);
        setSource(next.source);
        setTarget(next.target);
        setFilters(nextFilters);
        load(next);
      } catch {
        if (!cancelled) load();
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, initialQuery]);

  const isTranslation = categorySlug === "translation" || categorySlug === "interpreter";

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/services" className="text-xs text-green hover:underline font-semibold">
          ← {t("marketplace.categories", "Service categories")}
        </Link>
        <h1 className="font-syne text-2xl md:text-3xl font-extrabold text-text mt-2">
          {category?.name || categorySlug}
        </h1>
        {category?.description && (
          <p className="text-sm text-muted mt-2 max-w-2xl">{category.description}</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("common.search", "Search")}
          className="text-sm py-2 px-3 border rounded-lg"
        />
        <input
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="Language"
          className="text-sm py-2 px-3 border rounded-lg"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="text-sm py-2 px-3 border rounded-lg"
        />
        {isTranslation && (
          <>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source language"
              className="text-sm py-2 px-3 border rounded-lg"
            />
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target language"
              className="text-sm py-2 px-3 border rounded-lg"
            />
          </>
        )}
        <input
          type="number"
          min="0"
          value={filters.maxPrice}
          onChange={(e) =>
            setFilters({ ...filters, maxPrice: e.target.value })
          }
          placeholder="Maximum price"
          className="text-sm py-2 px-3 border rounded-lg"
        />
        <select
          value={filters.minRating}
          onChange={(e) =>
            setFilters({ ...filters, minRating: e.target.value })
          }
          className="text-sm py-2 px-3 border rounded-lg bg-white"
        >
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>
        <input
          type="datetime-local"
          value={filters.availability}
          onChange={(e) =>
            setFilters({ ...filters, availability: e.target.value })
          }
          aria-label="Availability"
          className="text-sm py-2 px-3 border rounded-lg"
        />
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={filters.remote}
            onChange={(e) =>
              setFilters({ ...filters, remote: e.target.checked })
            }
          />
          Remote
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={filters.inPerson}
            onChange={(e) =>
              setFilters({ ...filters, inPerson: e.target.checked })
            }
          />
          In person
        </label>
        {categorySlug === "translation" && (
          <>
            <select
              value={filters.documentType}
              onChange={(e) =>
                setFilters({ ...filters, documentType: e.target.value })
              }
              className="text-sm py-2 px-3 border rounded-lg bg-white"
            >
              <option value="">Any document type</option>
              {DOCUMENT_TYPES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select
              value={filters.turnaround}
              onChange={(e) =>
                setFilters({ ...filters, turnaround: e.target.value })
              }
              className="text-sm py-2 px-3 border rounded-lg bg-white"
            >
              <option value="">Any turnaround</option>
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={filters.certified}
                onChange={(e) =>
                  setFilters({ ...filters, certified: e.target.checked })
                }
              />
              Certified available
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={filters.rush}
                onChange={(e) =>
                  setFilters({ ...filters, rush: e.target.checked })
                }
              />
              Rush available
            </label>
          </>
        )}
        {categorySlug === "interpreter" && (
          <select
            value={filters.serviceType}
            onChange={(e) =>
              setFilters({ ...filters, serviceType: e.target.value })
            }
            className="text-sm py-2 px-3 border rounded-lg bg-white"
          >
            <option value="">Any interpreter service</option>
            {INTERPRETER_SERVICE_TYPES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        )}
        {categorySlug === "psychological" && (
          <>
            <select
              value={filters.serviceType}
              onChange={(e) =>
                setFilters({ ...filters, serviceType: e.target.value })
              }
              className="text-sm py-2 px-3 border rounded-lg bg-white"
            >
              <option value="">Any evaluation type</option>
              {PSYCH_SERVICE_TYPES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <input
              value={filters.professionalType}
              onChange={(e) =>
                setFilters({ ...filters, professionalType: e.target.value })
              }
              placeholder="Professional type"
              className="text-sm py-2 px-3 border rounded-lg"
            />
            <input
              value={filters.licenseState}
              onChange={(e) =>
                setFilters({ ...filters, licenseState: e.target.value })
              }
              placeholder="License state"
              className="text-sm py-2 px-3 border rounded-lg"
            />
          </>
        )}
        <button
          type="submit"
          className="bg-green text-white text-sm font-semibold py-2 px-4 rounded-lg border-none cursor-pointer sm:col-span-2 lg:col-span-1"
        >
          {t("common.search", "Search")}
        </button>
      </form>

      {loading ? (
        <div className="text-center py-16 text-muted">{t("common.loading", "Loading…")}</div>
      ) : providers.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          {t("marketplace.noProviders", "No providers found.")}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setPage?.("home")}
              className="text-green font-semibold bg-transparent border-none cursor-pointer hover:underline"
            >
              Try another search
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}

      {categorySlug === "translation" && (
        <div className="mt-10">
          <TranslationOrderForm
            user={user}
            setShowAuth={setShowAuth}
            initialSource={source}
            initialTarget={target}
            onCreated={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/dashboard?tab=orders";
              } else {
                setPage?.("dashboard");
              }
            }}
          />
        </div>
      )}

      {(categorySlug === "interpreter" || categorySlug === "psychological") && (
        <div className="mt-10">
          <BookingRequestForm
            bookingType={categorySlug === "psychological" ? "psychological" : "interpreter"}
            user={user}
            setShowAuth={setShowAuth}
            onCreated={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/dashboard?tab=bookings";
              } else {
                setPage?.("dashboard");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
