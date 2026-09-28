const memory = new Map();
const SEP = "\n⟦⟧\n";

const GOOGLE_LOCALE = {
  zh: "zh-CN",
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

function googleLocale(locale) {
  return GOOGLE_LOCALE[locale] || locale;
}

async function translateChunk(text, locale) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(googleLocale(locale))}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { "User-Agent": "ImmFlow" } });
  if (!res.ok) return text;
  const data = await res.json();
  if (!Array.isArray(data?.[0])) return text;
  return data[0].map((row) => row?.[0] || "").join("") || text;
}

async function translateMany(texts, locale) {
  const pending = [];
  for (const text of texts) {
    if (shouldSkip(text)) continue;
    if (!memory.has(`${locale}:${text}`)) pending.push(text);
  }
  const unique = [...new Set(pending)];
  let batch = [];
  let size = 0;

  const flush = async () => {
    if (!batch.length) return;
    const packed = batch.join(SEP);
    const current = batch;
    batch = [];
    size = 0;
    try {
      const translated = await translateChunk(packed, locale);
      const parts = translated.split(SEP);
      current.forEach((source, index) => {
        memory.set(`${locale}:${source}`, parts[index] || source);
      });
    } catch {
      current.forEach((source) => memory.set(`${locale}:${source}`, source));
    }
  };

  for (const text of unique) {
    if (size + text.length + SEP.length > 1500 && batch.length) await flush();
    if (text.length > 1500) {
      await flush();
      const pieces = text.match(/[\s\S]{1,1400}/g) || [text];
      let combined = "";
      for (const piece of pieces) combined += await translateChunk(piece, locale);
      memory.set(`${locale}:${text}`, combined || text);
      continue;
    }
    batch.push(text);
    size += text.length + SEP.length;
  }
  await flush();
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
