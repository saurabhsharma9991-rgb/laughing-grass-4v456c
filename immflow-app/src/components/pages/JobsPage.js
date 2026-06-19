"use client";

import React, { useState, useEffect } from "react";
import JobCard from "../JobCard";
import { authFetch } from "@/lib/client/auth-storage";
import { listingMatchesTab } from "@/lib/constants/listing-types";

function ApplyModal({ listing, onClose, onSubmit, applying }) {
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-syne font-bold text-text mb-1">Apply to listing</h3>
        <p className="text-xs text-muted mb-4">{listing.title}</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Brief note to the posting attorney (optional)…"
          className="w-full text-sm p-2.5 border rounded-lg mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            disabled={applying}
            onClick={() => onSubmit(message)}
            className="px-4 py-2 text-sm bg-green text-white rounded-lg border-none cursor-pointer font-semibold disabled:opacity-60"
          >
            {applying ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage({ setPage, user, setShowAuth }) {
  const [listings, setListings] = useState([]);
  const [tab, setTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [applyTarget, setApplyTarget] = useState(null);

  const loadListings = () => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusFilter });
    if (search) params.set("q", search);
    if (location) params.set("location", location);
    if (language) params.set("language", language);

    const fetcher = user ? authFetch : fetch;
    fetcher(`/api/listings?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch((err) => console.error("Error loading listings:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(loadListings, 200);
    return () => clearTimeout(t);
  }, [statusFilter, search, location, language, user?.id]);

  const handleApplyClick = (listing) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (listing.myApplication) return;
    if (listing.isOwnListing) {
      setPage("dashboard");
      return;
    }
    setApplyTarget(listing);
  };

  const submitApplication = async (message) => {
    if (!applyTarget) return;
    setApplyingId(applyTarget.id);
    try {
      const res = await authFetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: applyTarget.id, message }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error.message || "Failed to apply.");
      } else {
        setApplyTarget(null);
        loadListings();
      }
    } catch {
      alert("Failed to apply. Please try again.");
    } finally {
      setApplyingId(null);
    }
  };

  const typeTabs = [
    ["all", "All types"],
    ["job", "Jobs"],
    ["hearing", "Hearings"],
    ["outsource", "Outsource"],
    ["contract", "Contract"],
  ];

  const statusTabs = [
    ["open", "Open"],
    ["filled", "Filled"],
    ["closed", "Closed"],
    ["all", "All statuses"],
  ];

  const filtered = listings.filter((j) => listingMatchesTab(j.type, tab));
  const myApplicationCount = listings.filter((j) => j.myApplication).length;

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
          {user && myApplicationCount > 0 && (
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem("immflow_dashboard_tab", "applications");
                setPage("dashboard");
              }}
              className="mb-4 text-xs text-green font-semibold bg-green-light px-3 py-1.5 rounded-lg border-none cursor-pointer hover:underline"
            >
              You have {myApplicationCount} application{myApplicationCount !== 1 ? "s" : ""} on this page — view in Dashboard
            </button>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings…"
              className="flex-1 min-w-[200px] text-sm py-2 px-3 border rounded-lg"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="text-sm py-2 px-3 border rounded-lg w-40"
            />
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Language"
              className="text-sm py-2 px-3 border rounded-lg w-36"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {statusTabs.map(([key, label]) => {
              const isSel = statusFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`py-2 px-[18px] rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 ${
                    isSel
                      ? "border-green-dark bg-green-light text-green-dark"
                      : "border-[rgba(0,0,0,0.09)] bg-transparent text-muted hover:text-text"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {typeTabs.map(([key, label]) => {
              const isSel = tab === key;
              return (
                <button
                  key={key}
                  type="button"
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
          <div className="text-center py-12 text-muted">Loading listings from database…</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 gap-3">
              <span className="text-[13px] text-muted">{filtered.length} listings</span>
              <button
                type="button"
                onClick={() => setPage("post")}
                className="bg-green hover:bg-green-dark text-white py-2 px-[18px] rounded-lg border-none cursor-pointer text-[13px] font-medium transition-all duration-200"
              >
                + Post a listing
              </button>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm">
                No listings match your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {filtered.map((j) => (
                  <JobCard
                    key={j.id}
                    j={j}
                    onApply={() => handleApplyClick(j)}
                    applying={applyingId === j.id}
                    onManageListing={() => {
                      sessionStorage.setItem("immflow_dashboard_tab", "listings");
                      setPage("dashboard");
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {applyTarget && (
        <ApplyModal
          listing={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSubmit={submitApplication}
          applying={applyingId === applyTarget.id}
        />
      )}
    </div>
  );
}
