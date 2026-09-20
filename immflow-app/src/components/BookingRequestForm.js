"use client";

import React, { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import { useI18n } from "@/components/I18nProvider";
import {
  BOOKING_DISCLAIMER,
  BOOKING_MODALITIES,
  INTERPRETER_SERVICE_TYPES,
  PSYCH_SERVICE_TYPES,
} from "@/lib/constants/bookings";
import { COMMON_LANGUAGES } from "@/lib/constants/translation";

export default function BookingRequestForm({
  bookingType = "interpreter",
  user,
  setShowAuth,
  providerId = null,
  providerName = null,
  onCreated,
}) {
  const { t } = useI18n();
  const isPsych = bookingType === "psychological";
  const serviceOptions = isPsych ? PSYCH_SERVICE_TYPES : INTERPRETER_SERVICE_TYPES;

  const [language, setLanguage] = useState(isPsych ? "" : "Spanish");
  const [serviceType, setServiceType] = useState(serviceOptions[0]);
  const [modality, setModality] = useState(isPsych ? "telehealth" : "video");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(isPsych ? "60" : "60");
  const [location, setLocation] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(
    providerId ? String(providerId) : ""
  );

  const modalityOptions = useMemo(() => {
    if (isPsych) return ["telehealth", "in_person", "remote"];
    return BOOKING_MODALITIES.filter((m) => m !== "telehealth");
  }, [isPsych]);

  useEffect(() => {
    if (providerId) return;
    const params = new URLSearchParams({
      category: isPsych ? "psychological" : "interpreter",
    });
    if (language) params.set("language", language);
    if (serviceType) params.set("serviceType", serviceType);
    if (scheduledAt) params.set("availability", scheduledAt);
    if (modality === "in_person") params.set("inPerson", "1");
    else params.set("remote", "1");
    fetch(`/api/providers?${params}`)
      .then((r) => r.json())
      .then((data) => setProviders(Array.isArray(data) ? data : []))
      .catch(() => setProviders([]));
  }, [
    providerId,
    isPsych,
    language,
    serviceType,
    scheduledAt,
    modality,
  ]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuth?.(true);
      return;
    }
    if (!disclaimerAck) {
      toastError(t("bookings.acknowledge", "Please acknowledge the platform disclaimer."));
      return;
    }
    if (!selectedProviderId) {
      toastError(t("bookings.selectProvider", "Select a verified professional."));
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType,
          providerId: Number(selectedProviderId),
          language: language || undefined,
          serviceType,
          modality,
          scheduledAt: scheduledAt || undefined,
          durationMinutes: Number(durationMinutes) || undefined,
          location: location || undefined,
          clientNotes,
          disclaimerAck: true,
        }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess(t("bookings.submitted", "Booking request submitted."));
        onCreated?.(data);
      }
    } catch {
      toastError("Failed to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 space-y-4"
    >
      <div>
        <h3 className="font-syne text-lg font-extrabold text-text">
          {isPsych
            ? t("bookings.requestPsych", "Request a psychological evaluation")
            : t("bookings.bookInterpreter", "Book an interpreter")}
        </h3>
        <p className="text-xs text-muted mt-1">
          {providerName
            ? `Requesting ${providerName}.`
            : "Choose details and we’ll connect you with a verified professional."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="text-muted font-medium">{t("bookings.language", "Language")}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
          >
            <option value="">Any language</option>
            {COMMON_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs sm:col-span-1">
          <span className="text-muted font-medium">{t("bookings.serviceType", "Service type")}</span>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
          >
            {serviceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-muted font-medium">{t("bookings.modality", "Modality")}</span>
          <select
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
          >
            {modalityOptions.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-muted font-medium">{t("bookings.preferredTime", "Preferred date & time")}</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
          />
        </label>
        <label className="block text-xs">
          <span className="text-muted font-medium">{t("bookings.duration", "Duration (minutes)")}</span>
          <input
            type="number"
            min="15"
            step="15"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
          />
        </label>
        {(modality === "in_person" || location) && (
          <label className="block text-xs sm:col-span-2">
            <span className="text-muted font-medium">{t("bookings.location", "Location")}</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or address"
              className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
            />
          </label>
        )}
      </div>

      {!providerId && (
        <label className="block text-xs">
          <span className="text-muted font-medium">
            {t("bookings.selectProvider", "Verified professional")}
          </span>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white"
            required
          >
            <option value="">Select an available provider…</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.displayName}
                {provider.rate ? ` · ${provider.rate}` : ""}
                {provider.stars ? ` · ${provider.stars}★` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-xs">
        <span className="text-muted font-medium">{t("bookings.notes", "Notes")}</span>
        <textarea
          value={clientNotes}
          onChange={(e) => setClientNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
          placeholder={
            isPsych
              ? "Case context for the clinician (no sensitive details beyond what’s needed)…"
              : "Interview type, dialect preferences, etc."
          }
        />
      </label>

      <label className="flex items-start gap-2 text-[11px] text-muted-high leading-relaxed">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={disclaimerAck}
          onChange={(e) => setDisclaimerAck(e.target.checked)}
        />
        <span>{t("bookings.disclaimer", BOOKING_DISCLAIMER)}</span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="bg-green text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? t("common.loading", "Submitting…") : t("bookings.submitRequest", "Submit request")}
      </button>
    </form>
  );
}
