import React, { useState, useEffect } from "react";
import JobCard from "../JobCard";
import { authHeaders } from "@/lib/client/auth-storage";
import { listingMatchesTab } from "@/lib/constants/listing-types";

export default function JobsPage({ setPage, user, setShowAuth }) {
  const [listings, setListings] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);

  const loadListings = () => {
    setLoading(true);
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch((err) => console.error("Error loading listings:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleApply = async (listingId) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setApplyingId(listingId);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error.message || "Failed to apply.");
      } else {
        alert("Application submitted successfully.");
        loadListings();
      }
    } catch {
      alert("Failed to apply. Please try again.");
    } finally {
      setApplyingId(null);
    }
  };

  const tabs = [
    ["all", "All listings"],
    ["job", "Jobs"],
    ["hearing", "Hearings"],
    ["outsource", "Outsource"],
    ["contract", "Contract"],
  ];

  const filtered = listings.filter((j) => listingMatchesTab(j.type, tab));

  return (
    <div>
      <div className="bg-white border-b border-[rgba(0,0,0,0.09)] py-10 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-green mb-3">
            Job board
          </div>
          <h1 className="font-syne text-3xl md:text-4xl font-extrabold mb-5 text-text">
            Immigration listings
          </h1>
          <div className="flex flex-wrap gap-1.5">
            {tabs.map(([key, label]) => {
              const isSel = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`py-2 px-[18px] rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 ${
                    isSel
                      ? "border-green bg-green text-white"
                      : "border-[rgba(0,0,0,0.09)] bg-transparent text-muted hover:text-text"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto my-8 px-6">
        {loading ? (
          <div className="text-center py-12 text-muted">
            Loading listings from database...
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 gap-3">
              <span className="text-[13px] text-muted">
                {filtered.length} listings
              </span>
              <button
                onClick={() => setPage("post")}
                className="bg-green hover:bg-green-dark text-white py-2 px-[18px] rounded-lg border-none cursor-pointer text-[13px] font-medium transition-all duration-200"
              >
                + Post a listing
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filtered.map((j) => (
                <JobCard
                  key={j.id}
                  j={j}
                  onApply={() => handleApply(j.id)}
                  applying={applyingId === j.id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
