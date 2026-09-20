# ImmFlow Marketplace Expansion — Progress Tracker

**Source requirements:**
- Previous: [Aayush P.pdf](../../Aayush%20P.pdf) — attorney network (Phases 1–3 ✅)
- New: [new_requirement.md](../../new_requirement.md) — multi-category immigration services marketplace

**Product decisions (locked 2026-09-16):**

| # | Question | Decision |
|---|----------|----------|
| 1 | Audience | Both equally — seekers (public) + providers |
| 2 | Job board / hearing coverage | Keep alongside marketplace |
| 3 | Stripe Pro $29 | Keep for providers |
| 4 | File uploads | Server disk for v1 |
| 5 | i18n | Architecture from Phase A (5 languages) |
| 6 | Ship order | A → B → C → F → D → E |
| 7 | Categories | Fully creatable in Admin from v1 |

**Standing rule:** Everything must be viewable/editable from Admin.

---

## Delivery phases

| Phase | Scope | Status |
|-------|--------|--------|
| **A** Foundation | Provider schema, categories CRUD, verification, seeker/provider signup, i18n shell, migrate attorneys | 🔄 Hardening |
| **B** Marketplace UX | Homepage “What do you need?”, directories, type-specific profiles/filters | 🔄 Completing filters |
| **C** Translation | Onboarding, language pairs, orders, uploads, one-time Stripe pay | 🔄 Completing workflow |
| **F** AI Finder | Cross-category intent → providers (not case AI) | 🔄 Completing dynamic matching |
| **D** Interpreter + Psych | Bookings, evaluation requests | 🔄 Completing workflow |
| **E** i18n content | Full UI + CMS + email localization (5 languages) | 🔄 In progress |

---

## Phase A–E implementation baseline

> The earlier completion labels described the initial feature pass. A code-backed audit found remaining requirements and production defects. See [REQUIREMENTS_AUDIT.md](REQUIREMENTS_AUDIT.md) for the authoritative status.

### A — Foundation
Schema (`ServiceCategory`, `Provider`, credentials, language pairs), multi-role signup, Admin categories/providers, i18n shell (en/es/hi/ru/zh).

### B — Marketplace UX
Homepage category cards + NL search, `/services`, `/services/[slug]`, `/providers/[id]`, `ProviderReview`, rule-based finder.

### C — Translation
Translator onboarding fields, order workflow + statuses, disk uploads (`uploads/`), Stripe one-time checkout (simulated without keys), Admin orders, no blanket USCIS-certified claims.

### F — AI Finder
OpenAI intent parsing with rule fallback, ranked provider matches on homepage, find-not-advise disclaimer.

### D — Bookings
`ServiceBooking` for interpreter + psychological, request forms, Dashboard + Admin panels, professional-responsibility disclaimer.

### E — i18n
Locale files and a language selector exist. Full UI, CMS, help content, and email-body localization are part of the current completion pass.

---

## Key routes & APIs

| Area | Paths |
|------|--------|
| Public | `/`, `/services`, `/services/[slug]`, `/providers/[id]`, `/attorneys`, `/jobs` |
| Orders | `POST/GET /api/translation-orders`, `/api/translation-orders/[id]`, `/files` |
| Bookings | `POST/GET /api/bookings`, `/api/bookings/[id]` |
| Finder | `POST /api/service-finder` |
| Admin | Categories, Providers, Translation orders, Bookings |

---

## Changelog

| Date | Note |
|------|------|
| 2026-09-16 | Decisions locked; initial A → E implementation pass delivered |
| 2026-09-16 | Full requirements audit opened remaining hardening and completeness work |
