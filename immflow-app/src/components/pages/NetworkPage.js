import React, { useState, useEffect } from "react";
import AttorneyCard from "../AttorneyCard";
import { startChatWithAttorney } from "@/lib/client/start-chat";

export default function NetworkPage({ user, setPage, setShowAuth }) {
  const [attorneys, setAttorneys] = useState([]);
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

  const handleContact = (attorney) => {
    startChatWithAttorney(attorney, { user, setShowAuth, setPage });
  };

  return (
    <div>
      <div className="bg-white border-b border-[rgba(0,0,0,0.09)] py-10 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-green mb-3">
            Attorney network
          </div>
          <h1 className="font-syne text-3xl md:text-4xl font-extrabold mb-3 text-text">
            Attorney-to-attorney
          </h1>
          <p className="text-base text-muted max-w-xl leading-relaxed">
            Find fellow immigration attorneys for hearing coverage, outsourcing,
            co-counsel, and referrals.
          </p>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto my-8 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
          {[
            [
              "⚖️",
              "Hearing coverage",
              "Find attorneys for master calendar, merits, and bond hearings.",
            ],
            [
              "📁",
              "Case outsourcing",
              "Offload filings and full cases to vetted immigration attorneys.",
            ],
            [
              "🤝",
              "Co-counsel",
              "Find co-counsel for complex removal, asylum, or circuit court cases.",
            ],
            [
              "📄",
              "Of counsel",
              "Formalize referral relationships with immigration specialists.",
            ],
          ].map(([icon, title, desc]) => (
            <div
              key={title}
              className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[14px] p-6 shadow-sm"
            >
              <div className="text-3xl mb-3">{icon}</div>
              <div className="text-base font-semibold text-text mb-2">
                {title}
              </div>
              <p className="text-[13px] text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted">
            Loading network members...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {attorneys.map((a) => (
              <AttorneyCard key={a.id} a={a} onContact={handleContact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
