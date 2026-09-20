"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Tag from "@/components/Tag";
import TranslationOrderForm from "@/components/TranslationOrderForm";
import BookingRequestForm from "@/components/BookingRequestForm";
import { authFetch } from "@/lib/client/auth-storage";
import { startChatWithAttorney } from "@/lib/client/start-chat";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import { usePlatform } from "@/components/PlatformContext";
import { useI18n } from "@/components/I18nProvider";

export default function ProviderProfilePage({
  providerId,
  user,
  setShowAuth,
  setPage,
}) {
  const { t } = useI18n();
  const { canAccess } = usePlatform();
  const hasMessaging = canAccess("direct_messaging", user?.isPro);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = () => {
    fetch(`/api/providers/${providerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setProfile(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [providerId]);

  const handleContact = () => {
    if (!profile?.userId) return;
    startChatWithAttorney(
      {
        userId: profile.userId,
        name: profile.displayName,
        initials: profile.initials,
      },
      { user, setShowAuth, setPage, canAccessMessaging: hasMessaging }
    );
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuth?.(true);
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await authFetch(`/api/providers/${providerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        setReviewForm({ rating: 5, comment: "" });
        toastSuccess("Review submitted.");
        load();
      }
    } catch {
      toastError("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-muted">{t("common.loading", "Loading…")}</div>;
  }
  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">Provider not found.</p>
        <Link href="/services" className="text-green hover:underline text-sm font-semibold">
          ← Back to services
        </Link>
      </div>
    );
  }

  const pd = profile.profileData || {};

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      <Link
        href={profile.categorySlug ? `/services/${profile.categorySlug}` : "/services"}
        className="text-xs text-green hover:underline font-semibold"
      >
        ← {profile.categoryName || "Services"}
      </Link>

      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 md:p-8 mt-4 shadow-sm">
        <div className="flex flex-wrap gap-5 items-start">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={`${profile.displayName} profile`}
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-green-light text-green-dark flex items-center justify-center text-xl font-bold">
              {profile.initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-syne text-2xl font-extrabold text-text">{profile.displayName}</h1>
              {profile.badge && (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-light text-green-dark">
                  ✓ {profile.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-muted mt-1">
              {profile.categoryName}
              {profile.location ? ` · ${profile.location}` : ""}
            </p>
            <p className="text-xs text-muted-high mt-1">
              ★ {Number(profile.stars).toFixed(1)} ({profile.reviewsCount || 0} reviews)
              {profile.experienceYears != null ? ` · ${profile.experienceYears} yrs` : ""}
              {profile.rate ? ` · ${profile.rate}` : ""}
            </p>
            <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
              {profile.remoteAvailable && (
                <span className="px-2 py-1 rounded bg-bg text-muted">{t("common.remote", "Remote")}</span>
              )}
              {profile.inPersonAvailable && (
                <span className="px-2 py-1 rounded bg-bg text-muted">{t("common.inPerson", "In person")}</span>
              )}
              {profile.availability && (
                <span className="px-2 py-1 rounded bg-bg text-muted">{profile.availability}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleContact}
            className="bg-green text-white text-sm font-semibold py-2.5 px-5 rounded-lg border-none cursor-pointer hover:bg-green-dark"
          >
            {t("marketplace.contact", "Contact")}
          </button>
        </div>

        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-[rgba(0,0,0,0.07)]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("marketplace.about", "About")}</h2>
            <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {(profile.languages || []).length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("marketplace.languages", "Languages")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.languages.map((l) => (
                <Tag key={l}>{l}</Tag>
              ))}
            </div>
          </div>
        )}

        {(profile.languagePairs || []).length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("marketplace.languagePairs", "Language pairs")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.languagePairs.map((lp) => (
                <Tag key={`${lp.source}-${lp.target}`}>
                  {lp.source} → {lp.target}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(profile.availabilitySlots) &&
          profile.availabilitySlots.length > 0 && (
            <div className="mt-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {t("marketplace.availability", "Availability")}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.availabilitySlots.slice(0, 12).map((slot) => (
                  <Tag key={slot}>{slot}</Tag>
                ))}
              </div>
            </div>
          )}

        {/* Category-specific profile data */}
        {Object.keys(pd).length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("marketplace.credentials", "Credentials & details")}</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {Object.entries(pd).map(([key, value]) => {
                if (
                  value === null ||
                  value === undefined ||
                  value === "" ||
                  key === "certificationNote"
                ) {
                  return null;
                }
                const field = profile.profileSchema?.fields?.find(
                  (item) => item.key === key
                );
                const label =
                  field?.label ||
                  key
                    .replace(/([a-z])([A-Z])/g, "$1 $2")
                    .replace(/[_-]/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                const displayed = Array.isArray(value)
                  ? value
                      .map((item) =>
                        typeof item === "object"
                          ? `${item.source || ""} → ${item.target || ""}`
                          : String(item)
                      )
                      .join(", ")
                  : typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : String(value);
                return (
                  <div key={key}>
                    <dt className="text-muted text-xs">{label}</dt>
                    <dd className="text-xs mt-0.5">{displayed}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}

        {(profile.credentials || []).length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("marketplace.verifiedCredentials", "Verified credentials")}</h2>
            <ul className="space-y-2 text-sm">
              {profile.credentials.map((c) => (
                <li key={c.id} className="text-xs text-muted">
                  <span className="font-semibold text-text">{c.label}</span>
                  {c.organization ? ` · ${c.organization}` : ""}
                  {c.credentialNumber ? ` · ${c.credentialNumber}` : ""}
                  {c.status === "verified" ? " · ✓" : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-syne text-lg font-bold text-text mb-4">{t("marketplace.reviews", "Reviews")}</h2>
        {(profile.reviewsList || []).length === 0 ? (
          <p className="text-sm text-muted mb-6">{t("marketplace.noReviews", "No reviews yet.")}</p>
        ) : (
          <div className="space-y-3 mb-6">
            {profile.reviewsList.map((r) => (
              <div key={r.id} className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4">
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-semibold">{r.reviewerName}</span>
                  <span className="text-xs text-amber">{"★".repeat(r.rating)}</span>
                </div>
                {r.comment && <p className="text-xs text-muted mt-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submitReview} className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Leave a review</h3>
          <select
            value={reviewForm.rating}
            onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
            className="text-sm py-2 px-3 border rounded-lg bg-white"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
          <textarea
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            rows={3}
            placeholder="Optional comment"
            className="w-full text-sm p-3 border rounded-lg"
          />
          <button
            type="submit"
            disabled={submittingReview}
            className="bg-green text-white text-sm font-semibold py-2 px-4 rounded-lg border-none cursor-pointer disabled:opacity-50"
          >
            {submittingReview ? "Submitting…" : "Submit review"}
          </button>
        </form>
      </div>

      {profile.categorySlug === "translation" && (
        <div className="mt-10">
          <TranslationOrderForm
            user={user}
            setShowAuth={setShowAuth}
            providerId={profile.id}
            providerName={profile.displayName}
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

      {(profile.categorySlug === "interpreter" ||
        profile.categorySlug === "psychological") && (
        <div className="mt-10">
          <BookingRequestForm
            bookingType={
              profile.categorySlug === "psychological" ? "psychological" : "interpreter"
            }
            user={user}
            setShowAuth={setShowAuth}
            providerId={profile.id}
            providerName={profile.displayName}
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
