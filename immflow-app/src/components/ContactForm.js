"use client";

import React, { useEffect, useState } from "react";
import { authFetch, getStoredUser } from "@/lib/client/auth-storage";
import { toastError } from "@/lib/client/alerts";

const TOPICS = [
  ["general", "General question"],
  ["account", "My account or login"],
  ["billing", "Billing or subscription"],
  ["listing", "My listing or profile"],
  ["order", "An order or booking"],
  ["verification", "Verification"],
  ["other", "Something else"],
];

const inputClass =
  "w-full text-sm py-2.5 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white focus:outline-none focus:border-green";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "general",
    subject: "",
    message: "",
    website: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.displayName || user.user_metadata?.full_name || "",
        email: f.email || user.email || "",
      }));
    }
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.message.trim().length < 10) {
      toastError("Please write a message of at least 10 characters.");
      return;
    }
    setSending(true);
    try {
      const res = await authFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        toastError(data.error.message);
        return;
      }
      setSent(true);
    } catch {
      toastError("Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <section className="my-8 bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-6 text-center">
        <h2 className="font-syne text-xl font-bold text-text">Message sent</h2>
        <p className="text-sm text-muted mt-2">
          Thanks, {form.name.split(" ")[0] || "there"}. We&apos;ll reply to {form.email}, usually
          within one business day.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setForm((f) => ({ ...f, subject: "", message: "" }));
          }}
          className="mt-4 text-sm font-semibold text-green bg-transparent border-none cursor-pointer"
        >
          Send another message
        </button>
      </section>
    );
  }

  return (
    <section className="my-8 bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 md:p-6">
      <h2 className="font-syne text-xl font-bold text-text">Send us a message</h2>
      <p className="text-xs text-muted mt-1 mb-5">
        Our team reads every message. Please don&apos;t include passwords or card numbers.
      </p>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs font-medium text-muted mb-1">Your name</span>
          <input required value={form.name} onChange={set("name")} className={inputClass} maxLength={120} />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-muted mb-1">Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={set("email")}
            className={inputClass}
            maxLength={255}
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-muted mb-1">Topic</span>
          <select value={form.topic} onChange={set("topic")} className={inputClass}>
            {TOPICS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-muted mb-1">Subject (optional)</span>
          <input value={form.subject} onChange={set("subject")} className={inputClass} maxLength={200} />
        </label>
        <label className="block md:col-span-2">
          <span className="block text-xs font-medium text-muted mb-1">Message</span>
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={set("message")}
            className={inputClass}
            maxLength={5000}
          />
        </label>
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={set("website")}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={sending}
            className="bg-green text-white text-sm font-semibold py-2.5 px-6 rounded-lg border-none cursor-pointer disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>
    </section>
  );
}
