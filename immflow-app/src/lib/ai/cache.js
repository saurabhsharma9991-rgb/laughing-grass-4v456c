import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/logger";

const memoryCache = new Map();
const inflight = new Map();
const MAX_MEMORY_ENTRIES = 500;

export function aiCacheKey(parts) {
  return crypto
    .createHash("sha256")
    .update(parts.map((part) => String(part ?? "")).join("|"))
    .digest("hex");
}

function readMemory(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  memoryCache.delete(key);
  memoryCache.set(key, entry);
  return entry.payload;
}

function writeMemory(key, payload, expiresAt) {
  memoryCache.set(key, { payload, expiresAt });
  while (memoryCache.size > MAX_MEMORY_ENTRIES) {
    memoryCache.delete(memoryCache.keys().next().value);
  }
}

async function readPersistent(key) {
  try {
    const entry = await prisma.aiResponseCache.findUnique({
      where: { cacheKey: key },
    });
    if (!entry || entry.expiresAt.getTime() <= Date.now()) return null;
    writeMemory(key, entry.payload, entry.expiresAt.getTime());
    return entry.payload;
  } catch (error) {
    logEvent("ai", "cache_read_failed", { error: error.message });
    return null;
  }
}

async function writePersistent({ key, feature, model, payload, expiresAt }) {
  try {
    await prisma.aiResponseCache.upsert({
      where: { cacheKey: key },
      create: {
        cacheKey: key,
        feature,
        model,
        payload,
        expiresAt,
      },
      update: {
        model,
        payload,
        expiresAt,
      },
    });
  } catch (error) {
    logEvent("ai", "cache_write_failed", { feature, error: error.message });
  }
}

export async function withAiCache({ key, feature, model, ttlSeconds, load }) {
  const memoryHit = readMemory(key);
  if (memoryHit) {
    logEvent("ai", "cache_hit", { feature, layer: "memory" });
    return { payload: memoryHit, cacheHit: true };
  }

  const persistentHit = await readPersistent(key);
  if (persistentHit) {
    logEvent("ai", "cache_hit", { feature, layer: "mysql" });
    return { payload: persistentHit, cacheHit: true };
  }

  if (inflight.has(key)) {
    logEvent("ai", "cache_hit", { feature, layer: "inflight" });
    return { payload: await inflight.get(key), cacheHit: true };
  }

  const promise = (async () => {
    const payload = await load();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    writeMemory(key, payload, expiresAt.getTime());
    await writePersistent({ key, feature, model, payload, expiresAt });
    return payload;
  })();

  inflight.set(key, promise);
  try {
    return { payload: await promise, cacheHit: false };
  } finally {
    inflight.delete(key);
  }
}
