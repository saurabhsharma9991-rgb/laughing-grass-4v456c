import React, { useState, useEffect } from "react";
import AttorneyCard from "../AttorneyCard";
import { startChatWithAttorney } from "@/lib/client/start-chat";

export default function AttorneysPage({ user, setPage, setShowAuth }) {
  const [attorneys, setAttorneys] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attorneys")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAttorneys(data);
        }
      })
      .catch((err) => console.error("Error loading attorneys:", err))
      .finally(() => setLoading(false));
  }, []);

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

  const filtered = attorneys.filter(
    (a) =>
      (search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) &&
      (selected.length === 0 || selected.some((s) => a.tags.includes(s)))
  );

  const handleContact = (attorney) => {
    startChatWithAttorney(attorney, { user, setShowAuth, setPage });
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
              placeholder="Search by name, specialty, language…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="bg-green hover:bg-green-dark text-white py-2 px-[18px] rounded-lg border-none cursor-pointer text-[13px] transition-all duration-200">
              Search
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => {
              const isSel = selected.includes(f);
              return (
                <button
                  key={f}
                  onClick={() =>
                    setSelected((s) =>
                      s.includes(f) ? s.filter((x) => x !== f) : [...s, f]
                    )
                  }
                  className={`text-xs py-1.5 px-3 rounded-full border cursor-pointer transition-all duration-200 ${
                    isSel
                      ? "border-green bg-green text-white"
                      : "border-[rgba(0,0,0,0.09)] bg-[#f1efe8] text-muted hover:text-text"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto my-8 px-6">
        {loading ? (
          <div className="text-center py-12 text-muted">
            Loading attorneys from database...
          </div>
        ) : (
          <>
            <div className="text-[13px] text-muted mb-4">
              {filtered.length} attorneys found
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filtered.map((a) => (
                <AttorneyCard key={a.id} a={a} onContact={handleContact} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
