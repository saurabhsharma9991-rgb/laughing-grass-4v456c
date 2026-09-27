import { describe, expect, it, vi, afterEach } from "vitest";
import { aiCacheKey } from "./cache";
import { getOpenAiModel, isOpenAiEnabled, normalizeAiText } from "./openai";

describe("openai helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to GPT-6 Luna", () => {
    vi.stubEnv("OPENAI_MODEL", "");
    expect(getOpenAiModel()).toBe("gpt-6-luna");
  });

  it("stays disabled without a key", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(isOpenAiEnabled()).toBe(false);
  });

  it("normalizes queries for cache-friendly repeats", () => {
    expect(normalizeAiText("  Hindi   to   English  ")).toBe("hindi to english");
  });

  it("builds a stable cache key", () => {
    expect(aiCacheKey(["service_intent", "a"])).toBe(aiCacheKey(["service_intent", "a"]));
    expect(aiCacheKey(["service_intent", "a"])).not.toBe(aiCacheKey(["service_intent", "b"]));
  });
});
