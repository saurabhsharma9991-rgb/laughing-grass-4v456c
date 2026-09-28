"use client";

import React, { useMemo, useState } from "react";
import {
  HOME_BLOCK_TYPES,
  createHomeBlock,
  createEmptyHomepageDocument,
} from "@/lib/constants/homepage-blocks";
import { Icon } from "@/components/icons/Icon";
import {
  parseHomepageDocument,
  serializeHomepageDocument,
} from "@/lib/utils/homepage-document";

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

function WaysCardsEditor({ cards, onChange }) {
  const items = Array.isArray(cards) ? cards : [];
  const update = (idx, patch) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3 space-y-2 bg-bg/40">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold uppercase text-muted">Card {idx + 1}</span>
            <button
              type="button"
              className="text-[10px] text-red bg-transparent border-none cursor-pointer"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
            >
              Remove
            </button>
          </div>
          <input className={inputClass()} placeholder="Icon (scale, document, search)" value={item.icon || ""} onChange={(e) => update(idx, { icon: e.target.value })} />
          <input className={inputClass()} placeholder="Title" value={item.title || ""} onChange={(e) => update(idx, { title: e.target.value })} />
          <textarea className={inputClass()} rows={2} placeholder="Description" value={item.desc || ""} onChange={(e) => update(idx, { desc: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputClass()} placeholder="CTA label" value={item.cta || ""} onChange={(e) => update(idx, { cta: e.target.value })} />
            <input className={inputClass()} placeholder="Link (href)" value={item.href || ""} onChange={(e) => update(idx, { href: e.target.value })} />
          </div>
        </div>
      ))}
      <button
        type="button"
        className="text-xs text-green font-semibold bg-transparent border-none cursor-pointer"
        onClick={() =>
          onChange([
            ...items,
            { icon: "spark", title: "New card", desc: "", cta: "Learn more", href: "/" },
          ])
        }
      >
        + Add card
      </button>
    </div>
  );
}

function GenericCardsEditor({ items, onChange }) {
  const list = Array.isArray(items) ? items : [];
  const update = (idx, patch) => {
    const next = [...list];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {list.map((item, idx) => (
        <div key={idx} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3 space-y-2 bg-bg/40">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold uppercase text-muted">Card {idx + 1}</span>
            <button
              type="button"
              className="text-[10px] text-red bg-transparent border-none cursor-pointer"
              onClick={() => onChange(list.filter((_, i) => i !== idx))}
            >
              Remove
            </button>
          </div>
          <input className={inputClass()} placeholder="Icon" value={item.icon || ""} onChange={(e) => update(idx, { icon: e.target.value })} />
          <input className={inputClass()} placeholder="Title" value={item.title || ""} onChange={(e) => update(idx, { title: e.target.value })} />
          <textarea className={inputClass()} rows={2} placeholder="Body" value={item.body || ""} onChange={(e) => update(idx, { body: e.target.value })} />
          <input className={inputClass()} placeholder="Link (href)" value={item.href || ""} onChange={(e) => update(idx, { href: e.target.value })} />
        </div>
      ))}
      <button
        type="button"
        className="text-xs text-green font-semibold bg-transparent border-none cursor-pointer"
        onClick={() => onChange([...list, { icon: "spark", title: "New card", body: "", href: "/" }])}
      >
        + Add card
      </button>
    </div>
  );
}

function BlockFields({ block, onChange }) {
  const d = block.data || {};
  const set = (key, value) => onChange({ ...d, [key]: value });

  switch (block.type) {
    case "home_hero":
      return (
        <div className="space-y-2">
          <Field label="Badge">
            <input className={inputClass()} value={d.badge || ""} onChange={(e) => set("badge", e.target.value)} />
          </Field>
          <Field label="Title (use line breaks)">
            <textarea className={inputClass()} rows={2} value={d.title || ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Subtitle">
            <textarea className={inputClass()} rows={3} value={d.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Primary CTA label">
              <input className={inputClass()} value={d.cta_primary || ""} onChange={(e) => set("cta_primary", e.target.value)} />
            </Field>
            <Field label="Primary link">
              <input className={inputClass()} value={d.cta_primary_href || ""} onChange={(e) => set("cta_primary_href", e.target.value)} placeholder="/attorneys" />
            </Field>
            <Field label="Secondary CTA label">
              <input className={inputClass()} value={d.cta_secondary || ""} onChange={(e) => set("cta_secondary", e.target.value)} />
            </Field>
            <Field label="Secondary link">
              <input className={inputClass()} value={d.cta_secondary_href || ""} onChange={(e) => set("cta_secondary_href", e.target.value)} />
            </Field>
            <Field label="Tertiary link label">
              <input className={inputClass()} value={d.cta_tertiary || ""} onChange={(e) => set("cta_tertiary", e.target.value)} />
            </Field>
            <Field label="Tertiary link (#signup for auth)">
              <input className={inputClass()} value={d.cta_tertiary_href || ""} onChange={(e) => set("cta_tertiary_href", e.target.value)} />
            </Field>
          </div>
          <p className="text-[10px] text-muted">Category tiles and AI service finder always show with this section.</p>
        </div>
      );
    case "home_network":
      return (
        <div className="space-y-2">
          <Field label="Badge">
            <input className={inputClass()} value={d.badge || ""} onChange={(e) => set("badge", e.target.value)} />
          </Field>
          <Field label="Title">
            <input className={inputClass()} value={d.title || ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Body">
            <textarea className={inputClass()} rows={3} value={d.body || ""} onChange={(e) => set("body", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Primary button label">
              <input className={inputClass()} value={d.primaryLabel || ""} onChange={(e) => set("primaryLabel", e.target.value)} />
            </Field>
            <Field label="Primary link">
              <input className={inputClass()} value={d.primaryHref || ""} onChange={(e) => set("primaryHref", e.target.value)} />
            </Field>
            <Field label="Secondary button label">
              <input className={inputClass()} value={d.secondaryLabel || ""} onChange={(e) => set("secondaryLabel", e.target.value)} />
            </Field>
            <Field label="Secondary link">
              <input className={inputClass()} value={d.secondaryHref || ""} onChange={(e) => set("secondaryHref", e.target.value)} />
            </Field>
            <Field label="AI panel title">
              <input className={inputClass()} value={d.aiPanelTitle || ""} onChange={(e) => set("aiPanelTitle", e.target.value)} />
            </Field>
            <Field label="AI panel CTA">
              <input className={inputClass()} value={d.aiPanelCta || ""} onChange={(e) => set("aiPanelCta", e.target.value)} />
            </Field>
          </div>
          <Field label="AI panel link">
            <input className={inputClass()} value={d.aiPanelHref || ""} onChange={(e) => set("aiPanelHref", e.target.value)} />
          </Field>
        </div>
      );
    case "home_stats":
      return (
        <div className="space-y-2">
          <p className="text-[10px] text-muted mb-2">Attorney, listing, and language counts come from live stats when available.</p>
          <Field label="Attorneys label">
            <input className={inputClass()} value={d.attorneys_label || ""} onChange={(e) => set("attorneys_label", e.target.value)} />
          </Field>
          <Field label="States count (static)">
            <input className={inputClass()} value={d.states_count || ""} onChange={(e) => set("states_count", e.target.value)} />
          </Field>
          <Field label="States label">
            <input className={inputClass()} value={d.states_label || ""} onChange={(e) => set("states_label", e.target.value)} />
          </Field>
          <Field label="Listings label">
            <input className={inputClass()} value={d.listings_label || ""} onChange={(e) => set("listings_label", e.target.value)} />
          </Field>
          <Field label="Languages label">
            <input className={inputClass()} value={d.languages_label || ""} onChange={(e) => set("languages_label", e.target.value)} />
          </Field>
        </div>
      );
    case "home_ways":
      return (
        <div className="space-y-2">
          <Field label="Badge">
            <input className={inputClass()} value={d.badge || ""} onChange={(e) => set("badge", e.target.value)} />
          </Field>
          <Field label="Title">
            <input className={inputClass()} value={d.title || ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Cards">
            <WaysCardsEditor cards={d.cards} onChange={(cards) => set("cards", cards)} />
          </Field>
        </div>
      );
    case "home_ai":
      return (
        <div className="space-y-2">
          <Field label="Badge">
            <input className={inputClass()} value={d.badge || ""} onChange={(e) => set("badge", e.target.value)} />
          </Field>
          <Field label="Title">
            <input className={inputClass()} value={d.title || ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="CTA label">
              <input className={inputClass()} value={d.cta || ""} onChange={(e) => set("cta", e.target.value)} />
            </Field>
            <Field label="CTA link">
              <input className={inputClass()} value={d.href || ""} onChange={(e) => set("href", e.target.value)} />
            </Field>
          </div>
        </div>
      );
    case "home_featured":
      return (
        <div className="space-y-2">
          <Field label="Badge">
            <input className={inputClass()} value={d.badge || ""} onChange={(e) => set("badge", e.target.value)} />
          </Field>
          <Field label="Title">
            <input className={inputClass()} value={d.title || ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="See-all label">
              <input className={inputClass()} value={d.cta || ""} onChange={(e) => set("cta", e.target.value)} />
            </Field>
            <Field label="See-all link">
              <input className={inputClass()} value={d.href || ""} onChange={(e) => set("href", e.target.value)} />
            </Field>
          </div>
        </div>
      );
    case "home_pricing":
      return (
        <div className="space-y-2">
          <Field label="Badge">
            <input className={inputClass()} value={d.badge || ""} onChange={(e) => set("badge", e.target.value)} />
          </Field>
          <Field label="Title">
            <input className={inputClass()} value={d.title || ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Subtitle">
            <textarea className={inputClass()} rows={2} value={d.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
        </div>
      );
    case "home_join":
      return (
        <div className="space-y-2">
          <Field label="Title">
            <input className={inputClass()} value={d.title || ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Subtitle">
            <textarea className={inputClass()} rows={2} value={d.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Primary CTA">
              <input className={inputClass()} value={d.cta || ""} onChange={(e) => set("cta", e.target.value)} />
            </Field>
            <Field label="Primary link (#signup)">
              <input className={inputClass()} value={d.href || ""} onChange={(e) => set("href", e.target.value)} />
            </Field>
            <Field label="Secondary CTA">
              <input className={inputClass()} value={d.cta_secondary || ""} onChange={(e) => set("cta_secondary", e.target.value)} />
            </Field>
            <Field label="Secondary link">
              <input className={inputClass()} value={d.secondary_href || ""} onChange={(e) => set("secondary_href", e.target.value)} />
            </Field>
          </div>
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
    case "cards":
      return <GenericCardsEditor items={d.items} onChange={(items) => set("items", items)} />;
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
    case "html":
      return (
        <Field label="Custom HTML">
          <textarea
            className={`${inputClass()} font-mono text-xs leading-relaxed`}
            rows={8}
            value={d.html || ""}
            onChange={(e) => set("html", e.target.value)}
          />
        </Field>
      );
    case "divider":
      return <p className="text-xs text-muted">Horizontal divider — no settings.</p>;
    default:
      return <p className="text-xs text-muted">Unknown block type.</p>;
  }
}

export default function HomepageBlockEditor({ value, onChange }) {
  const doc = useMemo(() => {
    const parsed = parseHomepageDocument(value);
    if (parsed) return parsed;
    return createEmptyHomepageDocument();
  }, [value]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(doc.blocks?.[0]?.id || null);

  const commit = (nextDoc) => {
    onChange(serializeHomepageDocument(nextDoc));
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
    commit({ ...doc, blocks: next.length ? next : createEmptyHomepageDocument().blocks });
    if (expandedId === id) setExpandedId(next[0]?.id || null);
  };

  const duplicateBlock = (index) => {
    const block = doc.blocks[index];
    const copy = createHomeBlock(block.type);
    copy.data = JSON.parse(JSON.stringify(block.data || {}));
    const next = [...doc.blocks];
    next.splice(index + 1, 0, copy);
    commit({ ...doc, blocks: next });
    setExpandedId(copy.id);
  };

  const addBlock = (type) => {
    const block = createHomeBlock(type);
    commit({ ...doc, blocks: [...(doc.blocks || []), block] });
    setExpandedId(block.id);
    setPickerOpen(false);
  };

  const typeMeta = (type) => HOME_BLOCK_TYPES.find((t) => t.type === type);

  return (
    <div className="border border-[rgba(0,0,0,0.09)] rounded-xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.08)] bg-bg/50">
        <div className="text-xs font-semibold text-text">Homepage sections</div>
        <p className="text-[10px] text-muted mt-0.5">Add, remove, and reorder blocks. Publish to update the live homepage.</p>
      </div>
      <div className="p-4 min-h-[320px]">
        <div className="space-y-3">
          {doc.blocks.map((block, index) => {
            const meta = typeMeta(block.type);
            const open = expandedId === block.id;
            return (
              <div key={block.id} className="border border-[rgba(0,0,0,0.1)] rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-bg/60">
                  <button
                    type="button"
                    className="flex-1 text-left text-xs font-semibold text-text bg-transparent border-none cursor-pointer"
                    onClick={() => setExpandedId(open ? null : block.id)}
                  >
                    <Icon name={meta?.icon || "spark"} className="w-3.5 h-3.5 mr-1.5" />
                    {meta?.label || block.type}
                  </button>
                  <button type="button" title="Move up" className="text-xs px-1.5 py-0.5 border rounded cursor-pointer bg-white" onClick={() => moveBlock(index, -1)}>↑</button>
                  <button type="button" title="Move down" className="text-xs px-1.5 py-0.5 border rounded cursor-pointer bg-white" onClick={() => moveBlock(index, 1)}>↓</button>
                  <button type="button" title="Duplicate" className="text-xs px-1.5 py-0.5 border rounded cursor-pointer bg-white" onClick={() => duplicateBlock(index)}>⧉</button>
                  <button type="button" title="Delete" className="text-xs px-1.5 py-0.5 border border-red/30 text-red rounded cursor-pointer bg-white" onClick={() => removeBlock(block.id)}><Icon name="close" className="w-3 h-3" /></button>
                </div>
                {open && (
                  <div className="p-3 border-t border-[rgba(0,0,0,0.06)]">
                    <BlockFields block={block} onChange={(data) => updateBlockData(block.id, data)} />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                {HOME_BLOCK_TYPES.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => addBlock(t.type)}
                    className="text-left p-2.5 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white hover:border-green cursor-pointer"
                  >
                    <div className="text-sm font-semibold text-text">
                      <Icon name={t.icon} className="w-4 h-4 mr-1" />
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
      </div>
    </div>
  );
}
