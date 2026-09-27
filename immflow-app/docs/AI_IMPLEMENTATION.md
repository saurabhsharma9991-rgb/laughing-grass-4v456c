# ImmFlow AI Implementation Report

**Date:** September 27, 2026  
**Sources:** `Aayush P.pdf` (Phase 3 §13 attorney matcher) and `new_requirement.md` (§7–§8, §12)

## Recommendation: GPT-6 Luna over GPT-4o mini

Use **`gpt-6-luna`** as the production model.

| | GPT-4o mini | GPT-6 Luna |
|---|---|---|
| Role | Older cheap chat model | Current high-volume GPT-6 model |
| Typical use | Short classification | Classification, ranking, high-volume JSON |
| Input price | About $0.15 / 1M tokens | About $0.10 / 1M tokens |
| Output price | About $0.60 / 1M tokens | About $0.50 / 1M tokens |
| Cached input | Limited | About $0.01 / 1M tokens |
| Fit for ImmFlow | Adequate | Better: structured JSON, cheaper repeats |

Luna is the right default for ImmFlow because both required AI jobs are short, repeated JSON tasks: intent parsing and ranking. Set `reasoning_effort=none` so Luna does not spend extra reasoning tokens.

Keep `OPENAI_MODEL=gpt-4o-mini` only if the API key cannot call Luna. The client falls back to 4o-mini on a 404 model error.

## What the documents require

From **Aayush P.pdf**

- Connect the existing AI Matcher UI to **real attorney data** (not a frontend demo).
- Pro-gated matcher access.

From **new_requirement.md**

- AI is a **marketplace search assistant only**.
- Do **not** build case management, legal strategy, eligibility, clinical assessments, or translation certification.
- **AI Service Finder** maps natural language to category + filters, then shows providers.
- **AI provider matching** ranks by service, language/pair, location, modality, availability, credentials, verification, experience, price, rating, and turnaround.
- Home page “Tell us what you need…” must drive that finder.

## Audit before this pass

| Surface | Required | Status before fix | Gap |
|---|---|---|---|
| `/matcher` attorney ranking | PDF §13 | Partial | Own OpenAI call, defaulted to 4o-mini, no cache, no shared client |
| Home / `/api/service-finder` intent | Req §7, §12 | Partial | Own OpenAI call, no cache, unused shared client |
| Provider ranking after intent | Req §8 | Rule-only | LLM parsed intent, then deterministic scores only |
| Category page after finder | Req §7 | Partial | `?q=` was a keyword search, not applied AI filters |
| Case / legal / clinical AI | Forbidden | Correctly absent | Keep it that way |
| Spend controls | Implied | Missing | Duplicate HTTP clients, no cache on live paths |

`src/lib/ai/openai.js` and `src/lib/ai/cache.js` plus `ai_response_cache` already existed but were not used by the two production AI services.

## What this pass implements

1. One OpenAI client for finder + matcher (`gpt-6-luna`, `reasoning_effort=none`, 4o-mini fallback).
2. Two-layer cache: in-memory LRU, then MySQL `ai_response_cache`, plus in-flight dedupe.
3. Skip the LLM when the rule parser already has a high-confidence category and languages.
4. Cached LLM rerank of the top provider candidates so matching is not rule-only.
5. Category directory applies finder filters from the original query.
6. Matcher endpoint rate-limited like the service finder.

## Cache policy

| Feature | TTL | Cache key |
|---|---|---|
| Service intent | 24 hours | normalized query + category list |
| Provider rerank | 6 hours | category + filters + candidate ids |
| Attorney matcher | 6 hours | query + need + case + candidate user ids |

Repeated searches such as “Hindi to English birth certificate” should hit cache after the first paid call.

## How to configure

```dotenv
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-6-luna"
# OPENAI_DISABLED=true          # force rules only
# OPENAI_TIMEOUT_MS=15000
# OPENAI_INTENT_TTL_SECONDS=86400
# OPENAI_MATCH_TTL_SECONDS=21600
```

Then:

```bash
npx prisma migrate deploy
```

Without a key, both features keep working with the rule fallback.
