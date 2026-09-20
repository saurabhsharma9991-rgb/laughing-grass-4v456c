"use client";

import React, { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import { useI18n } from "@/components/I18nProvider";
import {
  COMMON_LANGUAGES,
  DOCUMENT_TYPES,
  quoteTranslationCents,
  formatMoney,
  defaultCertificationNote,
} from "@/lib/constants/translation";

export default function TranslationOrderForm({
  user,
  setShowAuth,
  providerId = null,
  providerName = null,
  initialSource = "",
  initialTarget = "",
  onCreated,
}) {
  const { t } = useI18n();
  const [sourceLanguage, setSourceLanguage] = useState(initialSource || "");
  const [targetLanguage, setTargetLanguage] = useState(initialTarget || "");
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [translationType, setTranslationType] = useState("standard");
  const [turnaround, setTurnaround] = useState("regular");
  const [clientNotes, setClientNotes] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [translators, setTranslators] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(
    providerId ? String(providerId) : ""
  );

  useEffect(() => {
    if (providerId) return;
    const params = new URLSearchParams({ category: "translation" });
    if (sourceLanguage) params.set("source", sourceLanguage);
    if (targetLanguage) params.set("target", targetLanguage);
    if (translationType === "certified") params.set("certified", "1");
    fetch(`/api/providers?${params}`)
      .then((r) => r.json())
      .then((data) => setTranslators(Array.isArray(data) ? data : []))
      .catch(() => setTranslators([]));
  }, [providerId, sourceLanguage, targetLanguage, translationType]);

  const estimate = useMemo(
    () =>
      formatMoney(
        quoteTranslationCents({ translationType, turnaround })
      ),
    [translationType, turnaround]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuth?.(true);
      return;
    }
    if (!sourceLanguage || !targetLanguage) {
      toastError(t("translation.selectLanguages", "Select source and target languages."));
      return;
    }
    if (!selectedProviderId) {
      toastError(t("translation.selectProvider", "Select a verified translator."));
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch("/api/translation-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLanguage,
          targetLanguage,
          documentType,
          translationType,
          turnaround,
          clientNotes,
          providerId: Number(selectedProviderId),
          certificationNote:
            translationType === "certified" ? defaultCertificationNote("certified") : null,
        }),
      });
      const order = await res.json();
      if (order.error) {
        toastError(order.error.message);
        return;
      }

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", "source");
        const up = await authFetch(`/api/translation-orders/${order.id}/files`, {
          method: "POST",
          body: fd,
        });
        const upData = await up.json();
        if (upData.error) {
          toastError(upData.error.message || "Order created but file upload failed.");
        }
      }

      toastSuccess(t("translation.created", "Order created. Complete payment to submit."));
      onCreated?.(order);
    } catch {
      toastError("Failed to create order.");
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
            {t("translation.requestTitle", "Request a translation")}
          </h3>
        <p className="text-xs text-muted mt-1">
          {providerName
            ? `Requesting from ${providerName}. Estimated starting price ${estimate}.`
            : `Get a quote, upload your document, and pay securely. Estimated starting price ${estimate}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="text-muted font-medium">{t("auth.sourceLanguage", "Source language")}</span>
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
            required
          >
            <option value="">Select…</option>
            {COMMON_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-muted font-medium">{t("auth.targetLanguage", "Target language")}</span>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
            required
          >
            <option value="">Select…</option>
            {COMMON_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs sm:col-span-2">
          <span className="text-muted font-medium">{t("translation.documentType", "Document type")}</span>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
          >
            {DOCUMENT_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!providerId && (
        <label className="block text-xs">
          <span className="text-muted font-medium">{t("translation.selectProvider", "Verified translator")}</span>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white"
            required
          >
            <option value="">Select a matching translator…</option>
            {translators.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.displayName}
                {provider.rate ? ` · ${provider.rate}` : ""}
                {provider.stars ? ` · ${provider.stars}★` : ""}
              </option>
            ))}
          </select>
          {sourceLanguage &&
            targetLanguage &&
            translators.length === 0 && (
              <span className="block text-[10px] text-amber mt-1">
                No verified provider currently offers this exact language pair.
              </span>
            )}
        </label>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <fieldset className="text-xs border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
          <legend className="px-1 text-muted font-medium">{t("translation.translationType", "Translation type")}</legend>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="radio"
              name="ttype"
              checked={translationType === "standard"}
              onChange={() => setTranslationType("standard")}
            />
            {t("translation.standard", "Professional (standard)")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="ttype"
              checked={translationType === "certified"}
              onChange={() => setTranslationType("certified")}
            />
            {t("translation.certified", "Certified / attested")}
          </label>
        </fieldset>
        <fieldset className="text-xs border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
          <legend className="px-1 text-muted font-medium">{t("translation.turnaround", "Turnaround")}</legend>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="radio"
              name="turn"
              checked={turnaround === "regular"}
              onChange={() => setTurnaround("regular")}
            />
            {t("translation.regular", "Regular")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="turn"
              checked={turnaround === "rush"}
              onChange={() => setTurnaround("rush")}
            />
            {t("translation.rush", "Rush")}
          </label>
        </fieldset>
      </div>

      {translationType === "certified" && (
        <p className="text-[11px] text-muted-high leading-relaxed bg-bg rounded-lg p-3">
          {defaultCertificationNote("certified")}
        </p>
      )}

      <label className="block text-xs">
        <span className="text-muted font-medium">{t("translation.uploadDocument", "Upload document")} ({t("common.optional", "optional")})</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full text-sm"
        />
      </label>

      <label className="block text-xs">
        <span className="text-muted font-medium">{t("translation.notes", "Notes for translator")}</span>
        <textarea
          value={clientNotes}
          onChange={(e) => setClientNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
          placeholder="Names to preserve, formatting needs, deadline…"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto bg-green text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? t("common.loading", "Creating…") : `${t("translation.createOrder", "Create order")} · ~${estimate}`}
      </button>
    </form>
  );
}
