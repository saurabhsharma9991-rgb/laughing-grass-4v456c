"use client";

import React, { useState, useEffect, useCallback } from "react";
import AttorneyCard from "../AttorneyCard";
import { startChatWithAttorney } from "@/lib/client/start-chat";
import { usePlatform } from "@/components/PlatformContext";

const SORT_OPTIONS = [
  ["relevance", "Relevance"],
  ["rating", "Highest rated"],
  ["availability", "Soonest available"],
];

const AVAILABILITY_FILTERS = [
  "",
  "Available now",
  "Avail. in 3 days",
  "Avail. in 5 days",
  "2 wk wait",
];

export default function AttorneysPage({ user, setPage, setShowAuth }) {
  const { canAccess } = usePlatform();
  const hasMessaging = canAccess("direct_messaging", user?.isPro);
  const [attorneys, setAttorneys] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("relevance");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (location) params.set("location", location);
    if (language) params.set("language", language);
    if (availability) params.set("availability", availability);
    if (sort) params.set("sort", sort);
    if (selected.length === 1) params.set("specialty", selected[0]);

    fetch(`/api/attorneys?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAttorneys(data);
      })
      .catch((err) => console.error("Error loading attorneys:", err))
      .finally(() => setLoading(false));
  }, [search, location, language, availability, sort, selected]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const filters = [
    "Removal defense",
    "Asylum",
    "Family petition",
    "H-1B",
    "DACA",
    "Naturalization",
    "Spanish",
    "Mandarin",
    "Hindi",
  ];

  const handleContact = (attorney) => {
    startChatWithAttorney(attorney, {
      user,
      setShowAuth,
      setPage,
      canAccessMessaging: hasMessaging,
    });
  };

  return (
    <div>
      <div className="bg-white border-b border-[rgba(0,0,0,0.09)] py-10 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-green mb-3">
            Immigration attorneys
          </div>
          <h1 className="font-syne text-3xl md:text-4xl font-extrabold mb-5 text-text">
            Find your attorney
          </h1>
          <div className="flex gap-2 bg-white border border-[rgba(0,0,0,0.15)] rounded-lg p-1.5 pl-4 items-center mb-4">
            <span className="text-muted-high">🔍</span>
            <input
              className="border-none bg-transparent text-sm outline-none flex-1 text-text placeholder-muted-high"
              placeholder='Try "Spanish speaking asylum attorney in Miami"'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (city, state)"
              className="text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
            />
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Language"
              className="text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
            />
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white"
            >
              <option value="">Any availability</option>
              {AVAILABILITY_FILTERS.filter(Boolean).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {filters.map((f) => {
              const isSel = selected.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() =>
                    setSelected((s) =>
                      s.includes(f) ? s.filter((x) => x !== f) : [...s, f]
                    )
                  }
                  className={`py-1.5 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    isSel
                      ? "border-green bg-green text-white"
                      : "border-[rgba(0,0,0,0.09)] bg-transparent text-muted hover:text-text"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border rounded-lg py-1 px-2 text-xs bg-white"
            >
              {SORT_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto my-8 px-6">
        {loading ? (
          <div className="text-center py-12 text-muted">Searching attorneys…</div>
        ) : (
          <>
            <div className="text-[13px] text-muted mb-4">
              {attorneys.length} attorneys found
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {attorneys.map((a) => (
                <div key={a.id}>
                  <AttorneyCard a={a} href={`/attorneys/${a.id}`} />
                  <button
                    type="button"
                    onClick={() => handleContact(a)}
                    className="w-full mt-2 bg-green hover:bg-green-dark text-white font-semibold text-[11px] py-1.5 rounded-lg border-none cursor-pointer"
                  >
                    Message
                  </button>
                </div>
              ))}
            </div>
            {attorneys.length === 0 && (
              <div className="text-center py-12 text-muted text-sm">No attorneys match your search.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
