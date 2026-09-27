"use client";

import React, { useMemo, useState } from "react";
import {
  PAGE_BLOCK_TYPES,
  createBlock,
  createEmptyDocument,
} from "@/lib/constants/cms-page-blocks";
import {
  parsePageDocument,
  serializePageDocument,
  renderPageDocumentHtml,
} from "@/lib/utils/cms-page-document";

function Field({ label, children }) {
  return (
    <label className="block text-xs font-semibold text-muted mb-2">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

function inputClass() {
  return "w-full text-sm border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2 bg-white text-text";
}

function BlockFields({ block, onChange }) {
  const d = block.data || {};
  const set = (key, value) => onChange({ ...d, [key]: value });

  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-2">
          <Field label="Eyebrow">
            <input className={inputClass()} value={d.eyebrow || ""} onChange={(e) => set("eyebrow", e.target.value)} />
          </Field>
          <Field label="Title">
            <input className={inputClass()} value={d.title || ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Subtitle">
            <textarea className={inputClass()} rows={2} value={d.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Button label">
              <input className={inputClass()} value={d.buttonLabel || ""} onChange={(e) => set("buttonLabel", e.target.value)} />
            </Field>
            <Field label="Button link">
              <input className={inputClass()} value={d.buttonHref || ""} onChange={(e) => set("buttonHref", e.target.value)} placeholder="/services" />
            </Field>
          </div>
          <Field label="Align">
            <select className={inputClass()} value={d.align || "left"} onChange={(e) => set("align", e.target.value)}>
              <option value="left">Left</option>
              <option value="center">Center</option>
            </select>
          </Field>
        </div>
      );
    case "heading":
      return (
        <div className="space-y-2">
          <Field label="Heading text">
            <input className={inputClass()} value={d.text || ""} onChange={(e) => set("text", e.target.value)} />
          </Field>
          <Field label="Level">
            <select className={inputClass()} value={d.level || 2} onChange={(e) => set("level", Number(e.target.value))}>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </Field>
        </div>
      );
    case "paragraph":
      return (
        <Field label="Text">
          <textarea className={inputClass()} rows={5} value={d.text || ""} onChange={(e) => set("text", e.target.value)} />
        </Field>
      );
    case "richtext":
    case "html":
      return (
        <Field label={block.type === "html" ? "Custom HTML" : "HTML content"}>
          <textarea
            className={`${inputClass()} font-mono text-xs leading-relaxed`}
            rows={8}
            value={d.html || ""}
            onChange={(e) => set("html", e.target.value)}
          />
        </Field>
      );
    case "image":
      return (
        <div className="space-y-2">
          <Field label="Image URL">
            <input className={inputClass()} value={d.url || ""} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Alt text">
            <input className={inputClass()} value={d.alt || ""} onChange={(e) => set("alt", e.target.value)} />
          </Field>
          <Field label="Caption">
            <input className={inputClass()} value={d.caption || ""} onChange={(e) => set("caption", e.target.value)} />
          </Field>
          <label className="inline-flex items-center gap-2 text-xs text-text cursor-pointer">
            <input type="checkbox" checked={Boolean(d.fullWidth)} onChange={(e) => set("fullWidth", e.target.checked)} />
            Full width
          </label>
        </div>
      );
    case "cards":
      return (
        <div className="space-y-3">
          {(d.items || []).map((item, idx) => (
            <div key={idx} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3 space-y-2 bg-bg/40">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold uppercase text-muted">Card {idx + 1}</span>
                <button
                  type="button"
                  className="text-[10px] text-red bg-transparent border-none cursor-pointer"
                  onClick={() =>
                    set(
                      "items",
                      (d.items || []).filter((_, i) => i !== idx)
                    )
                  }
                >
                  Remove
                </button>
              </div>
              <input
                className={inputClass()}
                placeholder="Icon / emoji"
                value={item.icon || ""}
                onChange={(e) => {
                  const items = [...(d.items || [])];
                  items[idx] = { ...items[idx], icon: e.target.value };
                  set("items", items);
                }}
              />
              <input
                className={inputClass()}
                placeholder="Title"
                value={item.title || ""}
                onChange={(e) => {
                  const items = [...(d.items || [])];
                  items[idx] = { ...items[idx], title: e.target.value };
                  set("items", items);
                }}
              />
              <textarea
                className={inputClass()}
                rows={2}
                placeholder="Body"
                value={item.body || ""}
                onChange={(e) => {
                  const items = [...(d.items || [])];
                  items[idx] = { ...items[idx], body: e.target.value };
                  set("items", items);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-green font-semibold bg-transparent border-none cursor-pointer"
            onClick={() =>
              set("items", [...(d.items || []), { icon: "✦", title: "New card", body: "" }])
            }
          >
            + Add card
          </button>
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          {(d.items || []).map((item, idx) => (
            <div key={idx} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3 space-y-2 bg-bg/40">
              <div className="flex justify-between">
                <span className="text-[10px] font-semibold uppercase text-muted">FAQ {idx + 1}</span>
                <button
                  type="button"
                  className="text-[10px] text-red bg-transparent border-none cursor-pointer"
                  onClick={() => set("items", (d.items || []).filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </div>
              <input
                className={inputClass()}
                placeholder="Question"
                value={item.question || ""}
                onChange={(e) => {
                  const items = [...(d.items || [])];
                  items[idx] = { ...items[idx], question: e.target.value };
                  set("items", items);
                }}
              />
              <textarea
                className={inputClass()}
                rows={2}
                placeholder="Answer"
                value={item.answer || ""}
                onChange={(e) => {
                  const items = [...(d.items || [])];
                  items[idx] = { ...items[idx], answer: e.target.value };
                  set("items", items);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-green font-semibold bg-transparent border-none cursor-pointer"
            onClick={() =>
              set("items", [...(d.items || []), { question: "New question?", answer: "" }])
            }
          >
            + Add FAQ
          </button>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-2">
          <Field label="Title">
            <input className={inputClass()} value={d.title || ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Text">
            <textarea className={inputClass()} rows={2} value={d.text || ""} onChange={(e) => set("text", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Button label">
              <input className={inputClass()} value={d.buttonLabel || ""} onChange={(e) => set("buttonLabel", e.target.value)} />
            </Field>
            <Field label="Button link">
              <input className={inputClass()} value={d.buttonHref || ""} onChange={(e) => set("buttonHref", e.target.value)} />
            </Field>
          </div>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-2">
          <Field label="Email">
            <input className={inputClass()} value={d.email || ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputClass()} value={d.phone || ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Address">
            <input className={inputClass()} value={d.address || ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Note">
            <input className={inputClass()} value={d.note || ""} onChange={(e) => set("note", e.target.value)} />
          </Field>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <Field label="Quote">
            <textarea className={inputClass()} rows={3} value={d.text || ""} onChange={(e) => set("text", e.target.value)} />
          </Field>
          <Field label="Attribution">
            <input className={inputClass()} value={d.attribution || ""} onChange={(e) => set("attribution", e.target.value)} />
          </Field>
        </div>
      );
    case "divider":
      return <p className="text-xs text-muted">Horizontal divider — no settings.</p>;
    default:
      return <p className="text-xs text-muted">Unknown block type.</p>;
  }
}

export default function PageBlockEditor({ value, onChange }) {
  const doc = useMemo(() => parsePageDocument(value), [value]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(doc.blocks?.[0]?.id || null);
  const [showPreview, setShowPreview] = useState(true);

  const commit = (nextDoc) => {
    onChange(serializePageDocument(nextDoc));
  };

  const setMode = (mode) => {
    if (mode === doc.mode) return;
    if (mode === "html") {
      commit({
        version: 1,
        mode: "html",
        blocks: doc.blocks,
        html: doc.html || renderPageDocumentHtml(doc) || "<p></p>",
      });
    } else {
      commit({
        version: 1,
        mode: "blocks",
        blocks: doc.blocks?.length ? doc.blocks : createEmptyDocument().blocks,
        html: doc.html || "",
      });
    }
  };

  const updateBlockData = (id, data) => {
    commit({
      ...doc,
      blocks: doc.blocks.map((b) => (b.id === id ? { ...b, data } : b)),
    });
  };

  const moveBlock = (index, dir) => {
    const next = [...doc.blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    commit({ ...doc, blocks: next });
  };

  const removeBlock = (id) => {
    const next = doc.blocks.filter((b) => b.id !== id);
    commit({ ...doc, blocks: next.length ? next : createEmptyDocument().blocks });
    if (expandedId === id) setExpandedId(next[0]?.id || null);
  };

  const duplicateBlock = (index) => {
    const block = doc.blocks[index];
    const copy = createBlock(block.type);
    copy.data = JSON.parse(JSON.stringify(block.data || {}));
    const next = [...doc.blocks];
    next.splice(index + 1, 0, copy);
    commit({ ...doc, blocks: next });
    setExpandedId(copy.id);
  };

  const addBlock = (type) => {
    const block = createBlock(type);
    commit({ ...doc, mode: "blocks", blocks: [...(doc.blocks || []), block] });
    setExpandedId(block.id);
    setPickerOpen(false);
  };

  const typeMeta = (type) => PAGE_BLOCK_TYPES.find((t) => t.type === type);

  const previewHtml = renderPageDocumentHtml(doc);

  return (
    <div className="border border-[rgba(0,0,0,0.09)] rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[rgba(0,0,0,0.08)] bg-bg/50">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("blocks")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md border cursor-pointer ${
              doc.mode === "blocks"
                ? "bg-green text-white border-green"
                : "bg-white text-muted border-[rgba(0,0,0,0.12)]"
            }`}
          >
            Section builder
          </button>
          <button
            type="button"
            onClick={() => setMode("html")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md border cursor-pointer ${
              doc.mode === "html"
                ? "bg-green text-white border-green"
                : "bg-white text-muted border-[rgba(0,0,0,0.12)]"
            }`}
          >
            Free-hand HTML
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs text-muted hover:text-text bg-transparent border-none cursor-pointer"
        >
          {showPreview ? "Hide preview" : "Show preview"}
        </button>
      </div>

      <div className={`grid ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        <div className="p-4 border-r border-[rgba(0,0,0,0.06)] min-h-[320px]">
          {doc.mode === "html" ? (
            <div>
              <p className="text-[11px] text-muted mb-2">
                Paste or write full page HTML. Scripts and unsafe tags are stripped on publish.
              </p>
              <textarea
                className={`${inputClass()} font-mono text-xs leading-relaxed`}
                rows={18}
                value={doc.html || ""}
                onChange={(e) => commit({ ...doc, html: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {doc.blocks.map((block, index) => {
                const meta = typeMeta(block.type);
                const open = expandedId === block.id;
                return (
                  <div
                    key={block.id}
                    className="border border-[rgba(0,0,0,0.1)] rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 bg-bg/60">
                      <button
                        type="button"
                        className="flex-1 text-left text-xs font-semibold text-text bg-transparent border-none cursor-pointer"
                        onClick={() => setExpandedId(open ? null : block.id)}
                      >
                        <span className="mr-1.5">{meta?.icon || "•"}</span>
                        {meta?.label || block.type}
                      </button>
                      <button type="button" title="Move up" className="text-xs px-1.5 py-0.5 border rounded cursor-pointer bg-white" onClick={() => moveBlock(index, -1)}>↑</button>
                      <button type="button" title="Move down" className="text-xs px-1.5 py-0.5 border rounded cursor-pointer bg-white" onClick={() => moveBlock(index, 1)}>↓</button>
                      <button type="button" title="Duplicate" className="text-xs px-1.5 py-0.5 border rounded cursor-pointer bg-white" onClick={() => duplicateBlock(index)}>⧉</button>
                      <button type="button" title="Delete" className="text-xs px-1.5 py-0.5 border border-red/30 text-red rounded cursor-pointer bg-white" onClick={() => removeBlock(block.id)}>✕</button>
                    </div>
                    {open && (
                      <div className="p-3 border-t border-[rgba(0,0,0,0.06)]">
                        <BlockFields
                          block={block}
                          onChange={(data) => updateBlockData(block.id, data)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {pickerOpen ? (
                <div className="border border-green/30 rounded-xl p-3 bg-green-light/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-text">Add a section</span>
                    <button type="button" className="text-xs text-muted bg-transparent border-none cursor-pointer" onClick={() => setPickerOpen(false)}>
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PAGE_BLOCK_TYPES.map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => addBlock(t.type)}
                        className="text-left p-2.5 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white hover:border-green cursor-pointer"
                      >
                        <div className="text-sm font-semibold text-text">
                          <span className="mr-1">{t.icon}</span>
                          {t.label}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">{t.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="w-full py-2.5 rounded-lg border border-dashed border-green text-green text-sm font-semibold bg-green-light/30 cursor-pointer hover:bg-green-light/50"
                >
                  + Add section
                </button>
              )}
            </div>
          )}
        </div>

        {showPreview && (
          <div className="p-4 bg-bg/30 overflow-auto max-h-[640px]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">
              Live preview
            </div>
            <div
              className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-5 text-sm [&_a]:text-green [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: previewHtml || "<p class='text-muted text-xs'>Nothing to preview yet.</p>" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
