"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError } from "@/lib/client/alerts";
import { Icon } from "@/components/icons/Icon";

const KIND_LABELS = {
  attorney: "Attorney",
  provider: "Service provider",
  client: "Client",
  admin: "Admin",
};

const FLAG_LABELS = {
  phone_number: "Phone number shared",
};

function KindBadge({ kind }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bg text-muted">
      {KIND_LABELS[kind] || kind}
    </span>
  );
}

const TOPIC_LABELS = {
  general: "General",
  account: "Account",
  billing: "Billing",
  listing: "Listing",
  order: "Order or booking",
  verification: "Verification",
  other: "Other",
};

function ContactInquiries() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("new");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authFetch(`/api/admin/contact-inquiries?status=${status}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
        else if (data.error) toastError(data.error.message);
      })
      .catch(() => toastError("Failed to load contact messages."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const updateStatus = async (id, next) => {
    const res = await authFetch("/api/admin/contact-inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    const data = await res.json();
    if (data.error) toastError(data.error.message);
    else load();
  };

  return (
    <div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="text-sm border rounded-lg px-2 py-1.5 bg-white mb-4"
      >
        <option value="new">New</option>
        <option value="resolved">Resolved</option>
        <option value="all">All</option>
      </select>
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted p-6 text-center bg-white border border-[rgba(0,0,0,0.09)] rounded-xl">
          No contact messages.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-text text-sm">{it.name}</span>
                <a href={`mailto:${it.email}`} className="text-green">
                  {it.email}
                </a>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bg text-muted">
                  {TOPIC_LABELS[it.topic] || it.topic}
                </span>
                <span className="ml-auto text-muted-high">
                  {new Date(it.createdAt).toLocaleString()}
                </span>
              </div>
              {it.subject && <div className="text-sm font-semibold text-text mt-2">{it.subject}</div>}
              <p className="whitespace-pre-wrap text-sm text-text mt-1">{it.message}</p>
              <div className="flex gap-2 mt-3">
                <a
                  href={`mailto:${it.email}?subject=${encodeURIComponent(`Re: ${it.subject || "Your ImmFlow message"}`)}`}
                  className="text-xs font-semibold bg-green text-white rounded-lg px-3 py-1.5 no-underline"
                >
                  Reply by email
                </a>
                <button
                  type="button"
                  onClick={() => updateStatus(it.id, it.status === "new" ? "resolved" : "new")}
                  className="text-xs font-semibold bg-white text-text rounded-lg px-3 py-1.5 border border-[rgba(0,0,0,0.15)] cursor-pointer"
                >
                  {it.status === "new" ? "Mark resolved" : "Reopen"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminMessagesPanel() {
  const [view, setView] = useState("conversations");
  return (
    <div>
      <div className="inline-flex gap-1 p-1 bg-white border border-[rgba(0,0,0,0.09)] rounded-lg mb-4">
        {[
          ["conversations", "User conversations"],
          ["contact", "Contact form"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`text-sm px-3 py-1.5 rounded-md border-none cursor-pointer ${
              view === id ? "bg-green text-white" : "bg-transparent text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "contact" ? <ContactInquiries /> : <Conversations />}
    </div>
  );
}

function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (kind !== "all") params.set("kind", kind);
    if (flaggedOnly) params.set("flagged", "1");
    if (query.trim()) params.set("q", query.trim());
    authFetch(`/api/admin/messages?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
        else if (data.error) toastError(data.error.message);
      })
      .catch(() => toastError("Failed to load conversations."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, flaggedOnly]);

  const openThread = (convo) => {
    const [a, b] = convo.participants;
    if (!a || !b) return;
    setSelected(convo.key);
    setThreadLoading(true);
    authFetch(`/api/admin/messages?a=${a.id}&b=${b.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) toastError(data.error.message);
        else setThread(data);
      })
      .catch(() => toastError("Failed to load conversation."))
      .finally(() => setThreadLoading(false));
  };

  const nameFor = (id) =>
    thread?.participants?.find((p) => p.id === id)?.name || `User #${id}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="text-sm border rounded-lg px-2 py-1.5 bg-white"
        >
          <option value="all">All conversations</option>
          <option value="attorney">Involving an attorney</option>
          <option value="provider">Involving a service provider</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
          />
          Flagged only
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            className="text-sm border rounded-lg px-3 py-1.5"
          />
          <button
            type="submit"
            className="text-sm bg-green text-white rounded-lg px-3 py-1.5 border-none cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl overflow-hidden">
          {loading ? (
            <p className="text-sm text-muted p-4">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted p-6 text-center">No conversations.</p>
          ) : (
            <ul className="divide-y divide-[rgba(0,0,0,0.06)] max-h-[70vh] overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => openThread(c)}
                    className={`w-full text-left px-4 py-3 border-none cursor-pointer ${
                      selected === c.key ? "bg-green-light" : "bg-white hover:bg-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-text truncate">
                        {c.participants.map((p) => p.name).join(" ↔ ")}
                      </div>
                      {c.flaggedCount > 0 && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fdecea] text-[#b42318]">
                          <Icon name="alert" className="w-3 h-3" />
                          {c.flaggedCount} flagged
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.participants.map((p) => (
                        <KindBadge key={p.id} kind={p.kind} />
                      ))}
                    </div>
                    <div className="text-xs text-muted mt-1 truncate">{c.lastMessage}</div>
                    <div className="text-[10px] text-muted-high mt-0.5">
                      {c.messageCount} messages · {new Date(c.lastSentAt).toLocaleString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4 min-h-[300px]">
          {!selected ? (
            <p className="text-sm text-muted text-center py-16">
              Select a conversation to read it.
            </p>
          ) : threadLoading || !thread ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(0,0,0,0.08)] pb-3 mb-3">
                {thread.participants.map((p) => (
                  <div key={p.id} className="text-xs">
                    <span className="font-semibold text-text">{p.name}</span>{" "}
                    <span className="text-muted">({p.email})</span> <KindBadge kind={p.kind} />
                  </div>
                ))}
                <span className="ml-auto text-[10px] text-muted inline-flex items-center gap-1">
                  <Icon name="lock" className="w-3 h-3" /> Read only
                </span>
              </div>
              <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                {thread.messages.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-lg p-3 text-sm ${
                      m.flagged ? "bg-[#fdecea] border border-[#f5c2bc]" : "bg-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted mb-1">
                      <span className="font-semibold text-text">{nameFor(m.senderId)}</span>
                      <span>{new Date(m.sentAt).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-text">{m.content}</p>
                    {m.flagged && (
                      <p className="mt-1.5 text-[11px] font-semibold text-[#b42318] inline-flex items-center gap-1">
                        <Icon name="alert" className="w-3 h-3" />
                        {FLAG_LABELS[m.flagReason] || "Flagged"}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
