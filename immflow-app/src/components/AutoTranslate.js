"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "svg", "SVG"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const SKIP_SELECTOR = '[translate="no"], .notranslate, [data-no-translate], [contenteditable="true"]';
const CACHE_PREFIX = "immflow_tx3_";
const CACHE_LIMIT = 10_000;
const DICTIONARY_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const REQUEST_TEXTS = 400;
const REQUEST_CHARS = 75_000;
const MAX_RETRIES = 3;
const OVERLAY_MAX_MS = 6000;
const TRANSLATING_LABEL = {
  es: "Traduciendo…",
  hi: "अनुवाद हो रहा है…",
  ru: "Перевод…",
  zh: "正在翻译…",
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const textRecords = new WeakMap();
const attrRecords = new WeakMap();
const caches = new Map();
const dictionaryLoads = new Map();
const unchanged = new Map();
const failures = new Map();
const titleRecord = { source: null, shown: null };
let hasTranslated = false;

function unchangedFor(locale) {
  if (!unchanged.has(locale)) unchanged.set(locale, new Set());
  return unchanged.get(locale);
}

function needsTranslation(text) {
  const value = text.trim();
  if (!value || !/[A-Za-z]/.test(value)) return false;
  if (/^https?:\/\//i.test(value) || /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(value)) return false;
  return true;
}

function readStored(locale) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + locale);
    if (!raw) return { entries: {}, dictionaryAt: 0 };
    const parsed = JSON.parse(raw);
    return { entries: parsed.entries || {}, dictionaryAt: Number(parsed.dictionaryAt) || 0 };
  } catch {
    return { entries: {}, dictionaryAt: 0 };
  }
}

function loadCache(locale) {
  if (!caches.has(locale)) {
    const stored = readStored(locale);
    const map = new Map(Object.entries(stored.entries));
    map.dictionaryAt = stored.dictionaryAt;
    caches.set(locale, map);
  }
  return caches.get(locale);
}

let saveTimer = null;
function saveCache(locale) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const map = caches.get(locale);
    if (!map) return;
    try {
      const entries = Object.fromEntries([...map.entries()].slice(-CACHE_LIMIT));
      localStorage.setItem(
        CACHE_PREFIX + locale,
        JSON.stringify({ entries, dictionaryAt: map.dictionaryAt || 0 })
      );
    } catch {
      // Storage full or unavailable; the in-memory cache still works for this visit.
    }
  }, 800);
}

/** Pull every translation the server already knows for this locale (one request, shared by all visitors). */
function loadDictionary(locale) {
  const cache = loadCache(locale);
  if (Date.now() - (cache.dictionaryAt || 0) < DICTIONARY_MAX_AGE_MS) return Promise.resolve();
  if (dictionaryLoads.has(locale)) return dictionaryLoads.get(locale);
  const promise = fetch(`/api/translate?locale=${encodeURIComponent(locale)}`)
    .then((r) => r.json())
    .then((data) => {
      if (!data?.entries) return;
      for (const [source, translated] of Object.entries(data.entries)) {
        if (!cache.has(source)) cache.set(source, translated);
      }
      cache.dictionaryAt = Date.now();
      saveCache(locale);
    })
    .catch(() => {})
    .finally(() => dictionaryLoads.delete(locale));
  dictionaryLoads.set(locale, promise);
  return promise;
}

function isSkipped(el) {
  if (!el || typeof el.closest !== "function") return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  return Boolean(el.closest(SKIP_SELECTOR));
}

function splitWhitespace(value) {
  const lead = value.match(/^\s*/)[0];
  const trail = value.slice(lead.length).match(/\s*$/)[0];
  return { lead, core: value.slice(lead.length, value.length - trail.length), trail };
}

/** Source text for a node: its original English if we translated it, otherwise what React just rendered. */
function textSource(node) {
  const rec = textRecords.get(node);
  return rec && node.nodeValue === rec.shown ? rec.source : node.nodeValue;
}

function attrSource(el, attr) {
  const rec = attrRecords.get(el)?.get(attr);
  const current = el.getAttribute(attr);
  return rec && current === rec.shown ? rec.source : current;
}

function collect(root, locale, items) {
  if (root.nodeType !== Node.TEXT_NODE && root.nodeType !== Node.ELEMENT_NODE) return;
  const rootEl = root.nodeType === Node.TEXT_NODE ? root.parentElement : root;
  if (!rootEl || isSkipped(rootEl)) return;

  const visitText = (node) => {
    if (isSkipped(node.parentElement)) return;
    const rec = textRecords.get(node);
    if (rec && rec.locale === locale && node.nodeValue === rec.shown) return;
    const source = textSource(node);
    const { core } = splitWhitespace(source);
    if (locale === "en" ? rec : needsTranslation(core)) items.push({ kind: "text", node, source, core });
  };

  const visitAttrs = (el) => {
    if (isSkipped(el)) return;
    for (const attr of ATTRS) {
      if (!el.hasAttribute(attr)) continue;
      const rec = attrRecords.get(el)?.get(attr);
      const current = el.getAttribute(attr);
      if (rec && rec.locale === locale && current === rec.shown) continue;
      const source = attrSource(el, attr);
      if (locale === "en" ? rec : needsTranslation(source)) {
        items.push({ kind: "attr", el, attr, source, core: source.trim() });
      }
    }
  };

  if (root.nodeType === Node.TEXT_NODE) {
    visitText(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  visitAttrs(root);
  for (const el of root.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(","))) visitAttrs(el);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) visitText(node);
}

function apply(item, translated, locale) {
  if (item.kind === "text") {
    if (textSource(item.node) !== item.source) return;
    const { lead, trail } = splitWhitespace(item.source);
    const shown = locale === "en" ? item.source : lead + translated + trail;
    textRecords.set(item.node, { source: item.source, shown, locale });
    if (item.node.nodeValue !== shown) item.node.nodeValue = shown;
    return;
  }
  if (attrSource(item.el, item.attr) !== item.source) return;
  const shown = locale === "en" ? item.source : translated;
  if (!attrRecords.has(item.el)) attrRecords.set(item.el, new Map());
  attrRecords.get(item.el).set(item.attr, { source: item.source, shown, locale });
  if (item.el.getAttribute(item.attr) !== shown) item.el.setAttribute(item.attr, shown);
}

function restoreSource(item) {
  if (item.kind === "text") {
    const rec = textRecords.get(item.node);
    if (rec && item.node.nodeValue === rec.shown && rec.shown !== rec.source) {
      textRecords.delete(item.node);
      item.node.nodeValue = rec.source;
    }
    return;
  }
  const rec = attrRecords.get(item.el)?.get(item.attr);
  if (rec && item.el.getAttribute(item.attr) === rec.shown && rec.shown !== rec.source) {
    attrRecords.get(item.el).delete(item.attr);
    item.el.setAttribute(item.attr, rec.source);
  }
}

async function fetchTranslations(texts, locale) {
  const chunks = [];
  let chunk = [];
  let chars = 0;
  for (const text of texts) {
    const clipped = text.slice(0, 4000);
    if (chunk.length >= REQUEST_TEXTS || (chars + clipped.length > REQUEST_CHARS && chunk.length)) {
      chunks.push(chunk);
      chunk = [];
      chars = 0;
    }
    chunk.push(clipped);
    chars += clipped.length;
  }
  if (chunk.length) chunks.push(chunk);

  const cache = loadCache(locale);
  await Promise.all(
    chunks.map(async (batch) => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, texts: batch }),
        });
        const data = await res.json();
        if (!Array.isArray(data?.translations)) return;
        batch.forEach((text, i) => {
          const translated = data.translations[i];
          if (translated === null || translated === undefined) {
            const tries = (failures.get(`${locale}:${text}`) || 0) + 1;
            failures.set(`${locale}:${text}`, tries);
            if (tries >= MAX_RETRIES) unchangedFor(locale).add(text);
          } else if (translated !== text) {
            cache.set(text, translated);
          } else {
            unchangedFor(locale).add(text);
          }
        });
      } catch {
        // Leave the English text in place if the translation service is unreachable.
      }
    })
  );
  saveCache(locale);
}

export default function AutoTranslate({ locale }) {
  const [overlay, setOverlay] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.documentElement.lang = locale;
    if (locale === "en" && !hasTranslated) return undefined;

    let disposed = false;
    let pending = [];
    let timer = null;
    let inFlight = 0;
    let firstPass = locale !== "en";
    const cache = locale === "en" ? null : loadCache(locale);
    const skip = unchangedFor(locale);

    const setTitle = (shown) => {
      titleRecord.shown = shown;
      if (document.title !== shown) document.title = shown;
    };

    /** Apply everything we already know right now; return what still needs the server. */
    const applyKnown = (roots) => {
      const items = [];
      for (const root of roots) if (root.isConnected) collect(root, locale, items);
      if (document.title !== titleRecord.shown) titleRecord.source = document.title;
      const title = titleRecord.source;

      if (locale === "en") {
        items.forEach((item) => apply(item, item.core, "en"));
        if (title) setTitle(title);
        return [];
      }
      hasTranslated = true;
      const misses = [];
      for (const item of items) {
        if (cache.has(item.core)) {
          apply(item, cache.get(item.core), locale);
          continue;
        }
        // Never leave text in a previous language: show English until this locale's version arrives.
        restoreSource(item);
        if (!skip.has(item.core)) misses.push(item);
      }
      if (title && cache.has(title)) setTitle(cache.get(title));
      else if (title && needsTranslation(title) && !skip.has(title)) {
        misses.push({ kind: "title", core: title });
      }
      return misses;
    };

    const finishOverlay = () => {
      if (firstPass && inFlight === 0) {
        firstPass = false;
        setOverlay(false);
      }
    };

    const flush = async () => {
      timer = null;
      const misses = pending;
      pending = [];
      if (!misses.length || disposed) {
        finishOverlay();
        return;
      }
      inFlight += 1;
      try {
        await fetchTranslations([...new Set(misses.map((m) => m.core))], locale);
      } finally {
        inFlight -= 1;
      }
      if (disposed) return;
      // Apply the whole batch at once so the page switches language in one step.
      const retry = [];
      for (const item of misses) {
        if (item.kind === "title") {
          if (cache.has(item.core) && document.title === titleRecord.source) setTitle(cache.get(item.core));
        } else if (cache.has(item.core)) {
          apply(item, cache.get(item.core), locale);
        } else if (!skip.has(item.core)) {
          retry.push(item);
        }
      }
      finishOverlay();
      if (retry.length) {
        setTimeout(() => {
          if (disposed) return;
          pending.push(...applyKnown(retry.map((i) => (i.kind === "text" ? i.node : i.el))));
          if (!timer) timer = setTimeout(flush, 60);
        }, 4000);
      }
    };

    const queue = (misses) => {
      if (!misses.length) return;
      pending.push(...misses);
      if (!timer) timer = setTimeout(flush, 60);
    };

    const observer = new MutationObserver((mutations) => {
      const roots = new Set();
      for (const m of mutations) {
        if (m.type === "childList") m.addedNodes.forEach((n) => roots.add(n));
        else roots.add(m.target);
      }
      // MutationObserver callbacks run before paint, so cached strings never flash in English.
      queue(applyKnown(roots));
    });

    const start = async () => {
      let misses = applyKnown([document.body]);
      if (locale !== "en" && misses.length) {
        setOverlay(true);
        setTimeout(() => {
          if (!disposed) {
            firstPass = false;
            setOverlay(false);
          }
        }, OVERLAY_MAX_MS);
        await loadDictionary(locale);
        if (disposed) return;
        misses = applyKnown([document.body]);
      }
      queue(misses);
      if (!misses.length) finishOverlay();
    };

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
    start();

    return () => {
      disposed = true;
      observer.disconnect();
      clearTimeout(timer);
      setOverlay(false);
    };
  }, [locale]);

  if (!overlay) return null;
  return (
    <div
      translate="no"
      aria-live="polite"
      className="fixed inset-0 z-[9999] pointer-events-none flex items-start justify-center bg-white/55 backdrop-blur-[1px] transition-opacity"
    >
      <div className="mt-24 inline-flex items-center gap-2 rounded-full bg-text text-white text-xs font-semibold px-4 py-2 shadow-lg">
        <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        {TRANSLATING_LABEL[locale] || "Translating…"}
      </div>
    </div>
  );
}
