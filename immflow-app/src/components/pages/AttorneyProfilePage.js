"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import Tag from "@/components/Tag";
import { authFetch } from "@/lib/client/auth-storage";
import { startChatWithAttorney } from "@/lib/client/start-chat";
import { usePlatform } from "@/components/PlatformContext";

export default function AttorneyProfilePage({ attorneyId, user, setShowAuth, setPage }) {
  const { canAccess } = usePlatform();
  const hasMessaging = canAccess("direct_messaging", user?.isPro);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = () => {
    fetch(`/api/attorneys/${attorneyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setProfile(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [attorneyId]);

  const handleContact = () => {
    if (!profile) return;
    startChatWithAttorney(profile, {
      user,
      setShowAuth,
      setPage,
      canAccessMessaging: hasMessaging,
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuth?.(true);
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await authFetch(`/api/attorneys/${attorneyId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (data.error) alert(data.error.message);
      else {
        setReviewForm({ rating: 5, comment: "" });
        load();
      }
    } catch {
      alert("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-muted">Loading profile…</div>;
  }
  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">Attorney not found.</p>
        <Link href="/attorneys" className="text-green hover:underline text-sm font-semibold">
          ← Back to directory
        </Link>
      </div>
    );
  }

  const slots = Array.isArray(profile.availabilitySlots) ? profile.availabilitySlots : [];

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      <Link href="/attorneys" className="text-sm text-green hover:underline font-semibold">
        ← Back to attorneys
      </Link>

      <div className="mt-6 bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar
            initials={profile.initials}
            bg={profile.bg}
            fg={profile.fg}
            photoUrl={profile.photoUrl}
            size="lg"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-syne text-2xl md:text-3xl font-extrabold text-text">{profile.name}</h1>
              {profile.isVerified && (
                <span className="text-[11px] bg-green-light text-green-dark px-2 py-0.5 rounded-full font-semibold">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-muted text-sm mt-1">
              {profile.location} · {profile.exp} experience
            </p>
            <p className="text-sm text-muted-high mt-2">
              State bar: <strong>{profile.stateBar || "—"}</strong> · Bar #{" "}
              <code className="text-xs">{profile.barNumber || "—"}</code>
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="text-amber font-semibold">★ {profile.stars} ({profile.reviews} reviews)</span>
              <span className="font-semibold text-text">{profile.rate}</span>
              <span className="text-muted">{profile.availability}</span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-6">
            <h2 className="font-syne font-bold text-text mb-2">About</h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {profile.specialties?.map((t) => (
            <Tag key={t} green>{t}</Tag>
          ))}
          {profile.languages?.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        {slots.length > 0 && (
          <div className="mt-6">
            <h2 className="font-syne font-bold text-text mb-2">Availability calendar</h2>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <span
                  key={slot.date || slot}
                  className="text-xs bg-bg border border-[rgba(0,0,0,0.09)] px-3 py-1.5 rounded-lg"
                >
                  {typeof slot === "string" ? slot : `${slot.date}${slot.note ? ` — ${slot.note}` : ""}`}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleContact}
          className="mt-8 bg-green hover:bg-green-dark text-white py-3 px-6 rounded-lg border-none cursor-pointer text-sm font-semibold"
        >
          Contact attorney
        </button>
      </div>

      <div className="mt-8 bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 shadow-sm">
        <h2 className="font-syne text-xl font-bold text-text mb-4">Reviews from attorneys</h2>
        {profile.reviewsList?.length ? (
          <div className="space-y-4 mb-6">
            {profile.reviewsList.map((r) => (
              <div key={r.id} className="border-b border-[rgba(0,0,0,0.07)] pb-4 last:border-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-text">
                  <span className="text-amber">★ {r.rating}</span>
                  <span>{r.reviewerName}</span>
                </div>
                {r.comment && <p className="text-sm text-muted mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted mb-6">No reviews yet.</p>
        )}

        {user && user.id !== profile.userId && (
          <form onSubmit={submitReview} className="border-t border-[rgba(0,0,0,0.09)] pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-text">Leave a review</h3>
            <div className="flex items-center gap-2 text-sm">
              <label>Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                className="border rounded-lg p-1.5 text-sm"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} stars</option>
                ))}
              </select>
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              rows={3}
              placeholder="Share your experience working with this attorney…"
              className="w-full text-sm p-2.5 border rounded-lg"
            />
            <button
              type="submit"
              disabled={submittingReview}
              className="bg-green text-white text-sm py-2 px-4 rounded-lg border-none cursor-pointer font-semibold disabled:opacity-60"
            >
              {submittingReview ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
