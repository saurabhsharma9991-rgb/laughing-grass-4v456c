import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { requestOpenAiJson } from "@/lib/ai/openai";
import { logEvent } from "@/lib/logger";

const memory = new Map();
const inflight = new Map();
const MEMORY_LIMIT = 50_000;
const CONCURRENCY = 8;
const OPENAI_BATCH_TEXTS = 20;
const OPENAI_BATCH_CHARS = 3000;
const DICTIONARY_LIMIT = 10_000;

const GOOGLE_LOCALE = {
  zh: "zh-CN",
};

const LANGUAGE_NAMES = {
  es: "Spanish",
  hi: "Hindi",
  ru: "Russian",
  zh: "Simplified Chinese",
};

function shouldSkip(text) {
  const value = String(text ?? "");
  if (!value.trim()) return true;
  if (/^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("#") || value.startsWith("mailto:")) {
    return true;
  }
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(value.trim())) return true;
  if (/^#[0-9a-f]{3,8}$/i.test(value.trim())) return true;
  if (!/[A-Za-z\u00C0-\u024F]/.test(value)) return true;
  return false;
}

function hashSource(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function remember(locale, source, translated) {
  if (memory.size >= MEMORY_LIMIT) memory.delete(memory.keys().next().value);
  memory.set(`${locale}:${source}`, translated);
}

async function googleTranslate(text, locale) {
  const tl = GOOGLE_LOCALE[locale] || locale;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { "User-Agent": "ImmFlow" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Google translate ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data?.[0])) throw new Error("Google translate: bad response");
  const out = data[0].map((row) => row?.[0] || "").join("");
  if (!out) throw new Error("Google translate: empty");
  return out;
}

async function openAiTranslate(texts, locale) {
  const language = LANGUAGE_NAMES[locale] || locale;
  const parsed = await requestOpenAiJson({
    feature: "ui_translation",
    cache: false,
    timeoutMs: 60_000,
    maxCompletionTokens: 8000,
    system: `You translate website UI text for ImmFlow, an immigration services marketplace, from English to ${language}.
Return ONLY JSON {"t": [...]} with exactly one translated string per input, in the same order.
Rules: natural, concise ${language} suitable for buttons, labels and page copy. Keep HTML tags and attributes, placeholders like {name} or %s, numbers, prices, dates, URLs, emails and the brand name "ImmFlow" unchanged. Keep personal names and company names as written. Keep common acronyms (AI, USCIS, ID, PDF) as is. Preserve leading arrows or symbols such as "→" and "·".`,
    user: JSON.stringify({ t: texts }),
  });
  const out = parsed?.t;
  if (!Array.isArray(out) || out.length !== texts.length) {
    throw new Error("OpenAI translation: length mismatch");
  }
  return out.map((value, i) => (typeof value === "string" && value.trim() ? value : texts[i]));
}

async function translateFresh(batch, locale) {
  try {
    const out = await openAiTranslate(batch, locale);
    if (out) return { provider: "openai", out };
  } catch (error) {
    logEvent("i18n", "openai_translate_failed", { locale, count: batch.length, error: error.message });
  }
  const out = [];
  for (const text of batch) {
    try {
      out.push(await googleTranslate(text, locale));
    } catch (error) {
      logEvent("i18n", "google_translate_failed", { locale, error: error.message });
      return null;
    }
  }
  return { provider: "google", out };
}

async function loadPersisted(texts, locale) {
  if (!texts.length) return;
  const byHash = new Map(texts.map((text) => [hashSource(text), text]));
  try {
    const rows = await prisma.uiTranslation.findMany({
      where: { locale, sourceHash: { in: [...byHash.keys()] } },
      select: { sourceHash: true, translated: true },
    });
    for (const row of rows) {
      const source = byHash.get(row.sourceHash);
      if (source) remember(locale, source, row.translated);
    }
  } catch (error) {
    logEvent("i18n", "cache_read_failed", { error: error.message });
  }
}

async function persist(locale, provider, pairs) {
  try {
    await prisma.uiTranslation.createMany({
      data: pairs.map(([source, translated]) => ({
        locale,
        sourceHash: hashSource(source),
        source,
        translated,
        provider,
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    logEvent("i18n", "cache_write_failed", { error: error.message });
  }
}

function makeBatches(texts) {
  const batches = [];
  let batch = [];
  let size = 0;
  for (const text of texts) {
    if (batch.length && (batch.length >= OPENAI_BATCH_TEXTS || size + text.length > OPENAI_BATCH_CHARS)) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(text);
    size += text.length;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

async function runBatch(batch, locale) {
  const result = await translateFresh(batch, locale);
  if (!result) return;
  const pairs = batch.map((source, i) => [source, result.out[i]]);
  pairs.forEach(([source, translated]) => remember(locale, source, translated));
  await persist(locale, result.provider, pairs);
}

/** Fill the memory cache for every text: memory → MySQL → OpenAI → Google. Failures are not cached. */
async function translateMany(texts, locale) {
  const unique = [...new Set(texts.filter((text) => !shouldSkip(text)))];
  await loadPersisted(unique.filter((text) => !memory.has(`${locale}:${text}`)), locale);

  const waiting = [];
  const missing = [];
  for (const text of unique) {
    const key = `${locale}:${text}`;
    if (memory.has(key)) continue;
    if (inflight.has(key)) waiting.push(inflight.get(key));
    else missing.push(text);
  }

  const jobs = makeBatches(missing).map((batch) => {
    let resolve;
    const done = new Promise((r) => {
      resolve = r;
    });
    batch.forEach((text) => inflight.set(`${locale}:${text}`, done));
    return { batch, resolve };
  });

  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      try {
        await runBatch(job.batch, locale);
      } catch (error) {
        logEvent("i18n", "batch_failed", { locale, error: error.message });
      } finally {
        job.batch.forEach((text) => inflight.delete(`${locale}:${text}`));
        job.resolve();
      }
    }
  };
  await Promise.all([
    ...Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker),
    ...waiting,
  ]);
}

/** Every saved translation for a locale, so browsers can render known strings without a round trip. */
export async function translationDictionary(locale) {
  if (!locale || locale === "en") return {};
  const rows = await prisma.uiTranslation.findMany({
    where: { locale, source: { not: "" } },
    select: { source: true, translated: true },
    orderBy: { id: "desc" },
    take: DICTIONARY_LIMIT,
  });
  const entries = {};
  for (const row of rows) {
    if (row.source.length <= 500 && row.translated !== row.source) entries[row.source] = row.translated;
  }
  return entries;
}

/** Translate a flat list of UI strings in order; null marks a string that could not be translated right now. */
export async function translateTexts(texts, locale) {
  if (!locale || locale === "en") return texts;
  await translateMany(texts, locale);
  return texts.map((text) => (shouldSkip(text) ? text : memory.get(`${locale}:${text}`) ?? null));
}

const STRUCTURAL_KEY = /(href|url|slug|icon|type|id|key|class|style|color|variant|align|target|count|src|path|action|method|rel)(_|$)/i;
const COPY_KEY = /(title|text|desc|label|excerpt|body|subtitle|heading|content|copy|cta|badge|note|question|answer|placeholder|caption|summary|message|intro|copyright|quote|headline|tagline|prompt|html|faq)(_|$)/i;

function isCopyKey(key) {
  if (!key) return true;
  if (STRUCTURAL_KEY.test(key)) return false;
  return COPY_KEY.test(key);
}

function collectStrings(value, bucket, key) {
  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (parsed) {
      collectStrings(parsed, bucket);
      return;
    }
    if (!isCopyKey(key) || shouldSkip(value)) return;
    bucket.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, bucket, key));
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, item] of Object.entries(value)) {
      collectStrings(item, bucket, childKey);
    }
  }
}

function tryParseJson(text) {
  const trimmed = String(text).trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function applyStrings(value, locale, key) {
  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (parsed) return JSON.stringify(applyStrings(parsed, locale));
    if (!isCopyKey(key) || shouldSkip(value)) return value;
    return memory.get(`${locale}:${value}`) || value;
  }
  if (Array.isArray(value)) return value.map((item) => applyStrings(item, locale, key));
  if (value && typeof value === "object") {
    const next = {};
    for (const [childKey, item] of Object.entries(value)) {
      next[childKey] = applyStrings(item, locale, childKey);
    }
    return next;
  }
  return value;
}

/** Translate English copy into a visitor language. Keys, URLs, and empty text stay as written. */
export async function translateDeep(value, locale) {
  if (!locale || locale === "en" || value == null) return value;
  const bucket = [];
  collectStrings(value, bucket);
  await translateMany(bucket, locale);
  return applyStrings(value, locale);
}
