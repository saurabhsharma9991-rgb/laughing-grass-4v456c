import { logEvent } from "@/lib/logger";
import { aiCacheKey, withAiCache } from "@/lib/ai/cache";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const FALLBACK_MODEL = "gpt-4o-mini";

export function getOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-6-luna";
}

export function isOpenAiEnabled() {
  return Boolean(
    process.env.OPENAI_API_KEY?.trim() &&
      process.env.OPENAI_DISABLED?.trim().toLowerCase() !== "true"
  );
}

export function normalizeAiText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function supportsTemperature(model) {
  return /^gpt-4(?:o|\.1)?(?:-|$)/.test(model);
}

function buildBody({ model, system, user, maxCompletionTokens, temperature }) {
  const body = {
    model,
    response_format: { type: "json_object" },
    max_completion_tokens: maxCompletionTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (supportsTemperature(model)) {
    body.temperature = temperature;
  } else {
    body.reasoning_effort = "none";
  }
  return body;
}

async function postChat(body, apiKey, timeoutMs) {
  return fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function requestOpenAiJson({
  feature,
  system,
  user,
  cacheParts = [],
  ttlSeconds = 21_600,
  maxCompletionTokens = 512,
  temperature = 0.1,
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!isOpenAiEnabled() || !apiKey) return null;

  const model = getOpenAiModel();
  const timeoutMs = Math.max(
    1000,
    Number(process.env.OPENAI_TIMEOUT_MS) || 15000
  );
  const cacheKey = aiCacheKey([feature, model, system, user, ...cacheParts]);

  const { payload, cacheHit } = await withAiCache({
    key: cacheKey,
    feature,
    model,
    ttlSeconds,
    load: async () => {
      const startedAt = Date.now();
      let usedModel = model;
      let body = buildBody({
        model,
        system,
        user,
        maxCompletionTokens,
        temperature,
      });
      let response = await postChat(body, apiKey, timeoutMs);

      if (response.status === 404 && model !== FALLBACK_MODEL) {
        usedModel = FALLBACK_MODEL;
        body = buildBody({
          model: FALLBACK_MODEL,
          system,
          user,
          maxCompletionTokens,
          temperature,
        });
        response = await postChat(body, apiKey, timeoutMs);
        logEvent("ai", "model_fallback", { feature, from: model, to: FALLBACK_MODEL });
      }

      if (!response.ok) {
        throw new Error(`OpenAI API error ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content || "{}");
      const usage = data?.usage || {};
      logEvent("ai", "completion", {
        feature,
        model: data?.model || usedModel,
        latencyMs: Date.now() - startedAt,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      });
      return parsed;
    },
  });

  if (cacheHit) {
    logEvent("ai", "completion_cached", { feature, model });
  }

  return payload;
}
