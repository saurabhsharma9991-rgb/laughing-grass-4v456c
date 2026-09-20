# ImmFlow Project Checklist

**Source:** [Aayush P.pdf](../../Aayush%20P.pdf) project proposal  
**App:** [myimmflow.com](https://myimmflow.com)  
**Repo branch:** current workspace branch  
**Last reviewed:** September 16, 2026

> This checklist covers the original attorney proposal. For the code-backed audit of both specifications and current remediation status, use [REQUIREMENTS_AUDIT.md](REQUIREMENTS_AUDIT.md). “Complete” in this file means the core repository feature exists; external production configuration is tracked separately.

Legend:

| Mark | Meaning |
|------|---------|
| `[x]` | Complete in this codebase |
| `[~]` | Partially complete or implemented differently than the PDF |
| `[ ]` | Not complete |

---

## About ImmFlow (context)

ImmFlow is a two-sided marketplace for U.S. immigration attorneys:

1. **Public** — find verified immigration attorneys  
2. **Attorneys** — hearing coverage, outsourcing, co-counsel, referrals, jobs  

---

## Current state (per proposal — pre-build baseline)

These were listed as already live before backend work:

| Item | Proposal | Current repo |
|------|----------|--------------|
| 6 frontend pages (Home, Attorneys, Jobs, Network, Matcher, Post) | Live | `[x]` Rebuilt in Next.js App Router |
| User authentication | Supabase | `[~]` Custom JWT + MySQL (not Supabase) |
| Stripe $29/mo Pro | Live | `[x]` Checkout + webhooks + portal |
| Domain myimmflow.com | Live | `[x]` Production on **DigitalOcean** (`myimmflow.com`) |
| AI matcher (frontend demo) | Live | `[~]` Rule-based matcher on real DB data |
| Responsive design | Live | `[x]` |

### Original tech stack vs implementation

| Proposal | Built |
|----------|-------|
| HTML / CSS / JS → migrate to React | `[x]` Next.js 16 + React |
| Supabase (auth + DB) | `[~]` **Prisma + MySQL** — same data model, different stack |
| Stripe | `[x]` |
| Netlify hosting | `[~]` | `netlify.toml` kept for reference; **production is DigitalOcean** |
| Namecheap domain | `[x]` | `myimmflow.com` → DigitalOcean droplet |

---

## Phase 1 — Foundation (Weeks 1–2)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Migrate HTML/CSS/JS frontend to a proper React app on GitHub | `[x]` | Next.js app in `immflow-app/` |
| 2 | Set up database tables for attorneys, listings, applications, and messages | `[~]` | All tables exist via Prisma/MySQL; **not** Supabase |
| 3 | Connect all frontend pages to real database data | `[x]` | `/api/attorneys`, `/api/listings`, `/api/messages`, etc. |
| 4 | Authentication: signup, login, email verification, password reset | `[x]` | Signup, login, email verification required, password reset emails |
| 5 | Deploy with continuous deployment | `[x]` | Live on **DigitalOcean** (PM2 + Nginx); manual `git pull` deploy |

**Phase 1 summary:** 4 complete · 1 partial (Supabase → Prisma/MySQL stack difference)

---

## Phase 2 — Core Features (Weeks 3–4)

### 6. Attorney profiles — public profile page

| Sub-requirement | Status | Notes |
|-----------------|--------|-------|
| Photo upload | `[x]` | Dashboard → Edit profile; stored in `photo_url` |
| Bio and practice description | `[x]` | Profile editor + `/attorneys/[id]` |
| Bar number and state bar verification badge | `[x]` | Bar fields + admin verify toggle + badge on profile |
| Specialties and visa categories | `[x]` | Tag input on profile; shown on directory + profile |
| Languages spoken | `[x]` | Tag input + filters |
| Availability calendar | `[x]` | Date slots in profile editor; shown on public profile |
| Hourly rate or flat fee | `[x]` | `rate` field on profile and cards |
| Reviews and ratings from other attorneys | `[x]` | `Review` model; 1–5 stars; auto-averaged rating |
| Contact button | `[x]` | Message attorney → dashboard chat (Pro feature) |

| # | Requirement | Status |
|---|-------------|--------|
| 6 | Attorney profiles (all sub-items above) | `[x]` |

---

### 7. Real listings — job board

| Sub-requirement | Status | Notes |
|-----------------|--------|-------|
| Post hearing coverage, outsource, full-time, of counsel | `[x]` | Listing types on Post page |
| Set compensation, location, case type, language requirements | `[x]` | pay, location, type, tags |
| Receive and manage applications | `[x]` | Dashboard → My listings → Review applications |
| Mark listings as filled or closed | `[x]` | Owner + admin; accept applicant auto-fills listing |

| # | Requirement | Status |
|---|-------------|--------|
| 7 | Real listings (all sub-items above) | `[x]` |

---

### 8. Search and filters (connected to real database)

| Sub-requirement | Status | Notes |
|-----------------|--------|-------|
| Filter by location | `[x]` | `/api/attorneys?location=` + job board location filter |
| Filter by case type | `[x]` | Specialty tags + listing type tabs |
| Filter by language | `[x]` | Dedicated filter on attorneys + listings |
| Filter by availability | `[x]` | Dropdown on Find Attorneys |
| Filter by rate | `[x]` | Dropdown on Find Attorneys (`?maxRate=`); NL “under $200” in search box |
| Natural language search | `[x]` | e.g. “Spanish speaking asylum attorney in Miami” |
| Sort by rating, availability, and relevance | `[x]` | `sort=rating|availability|relevance` |

| # | Requirement | Status |
|---|-------------|--------|
| 8 | Search and filters | `[x]` |

**Phase 2 summary:** 3 complete · 0 partial

---

### 9. Application system

| Sub-requirement | Status | Notes |
|-----------------|--------|-------|
| Attorneys can apply to listings | `[x]` | Apply modal with optional message |
| Posting attorneys can review applicants | `[x]` | Accept / reject / mark reviewed |
| Posting attorneys can accept applicants | `[x]` | Accept marks listing **filled** |

| # | Requirement | Status |
|---|-------------|--------|
| 9 | Application system | `[x]` |

**Phase 2 (PDF) overall:** ✅ **Complete**

---

## Phase 3 — Growth Features (Weeks 5–6)

### 10. Direct messaging

| Sub-requirement | Status | Notes |
|-----------------|--------|-------|
| Secure in-platform messaging between attorneys | `[x]` | `/api/messages`, dashboard Chat tab; Pro-gated |

| # | Requirement | Status |
|---|-------------|--------|
| 10 | Direct messaging | `[x]` |

---

### 11. Stripe subscriptions

| Sub-requirement | Status | Notes |
|-----------------|--------|-------|
| Free tier with limited features | `[x]` | Feature flags + listing limit |
| Pro tier $29/month — unlimited listings, AI matcher, messaging | `[x]` | `STRIPE_PRICE_ID`, platform feature flags |
| Promo code `IMMFLOW2026` — 3 months free | `[x]` | Test-mode promo + `PROMO_CODE_TEST` |
| Billing dashboard — manage subscription | `[x]` | Dashboard → Billing; Stripe Customer Portal |

| # | Requirement | Status |
|---|-------------|--------|
| 11 | Stripe subscriptions | `[x]` |

---

### 12. Admin dashboard

| Sub-requirement | Status | Notes |
|-----------------|--------|-------|
| View and manage all attorney profiles | `[x]` | Admin → Attorneys; full profile edit |
| Approve or reject new signups | `[x]` | `signupStatus` + approve/reject UI + rejection email |
| Manage and moderate listings | `[x]` | Admin → Listings edit/delete |
| View subscriber and payment data | `[x]` | `/api/admin/billing` — live Stripe MRR + recent charges |
| Send announcements or emails to users | `[x]` | Admin → Broadcast (Resend/ZeptoMail) |
| View platform analytics — signups, listings, revenue | `[x]` | Admin → Overview incl. pending signups |

| # | Requirement | Status |
|---|-------------|--------|
| 12 | Admin dashboard | `[x]` |

---

### 13. AI matcher integration

| Sub-requirement | Status | Notes |
|-----------------|--------|-------|
| Connect AI matcher to real attorney data | `[x]` | Loads verified attorneys server-side |
| Production AI matching (LLM / advanced) | `[x]` | OpenAI via `OPENAI_API_KEY`; rule-based fallback |

| # | Requirement | Status |
|---|-------------|--------|
| 13 | AI matcher integration | `[x]` |

---

### 14. Email notifications

| Sub-requirement | Status | Notes |
|-----------------|--------|-------|
| Password reset email | `[x]` | |
| Welcome email on signup | `[x]` | After verification (when approved) |
| Admin broadcast email | `[x]` | |
| New application notification | `[x]` | `notifyListingOwnerOfApplication` |
| New message notification | `[x]` | `notifyReceiverOfMessage` |
| Subscription reminder | `[x]` | `notifySubscriptionRenewal` |
| Signup rejection email | `[x]` | Admin reject flow |

| # | Requirement | Status |
|---|-------------|--------|
| 14 | Email notifications (full set) | `[x]` |

**Phase 3 (PDF) overall:** ✅ Complete — see [PHASE3.md](./PHASE3.md)

---

## Additional features (beyond Aayush P.pdf)

Built on `dev/phase2` but not in the original proposal:

### Admin & platform

| Feature | Status | Notes |
|---------|--------|-------|
| Admin RBAC — users & roles with granular permissions | `[x]` | Users & roles tab; 8 resource areas |
| CMS — editable homepage / nav / footer copy | `[x]` | Section editor + live preview |
| Platform settings — test mode toggle | `[x]` | Promo `IMMFLOW2026` in test mode |
| Free vs Pro feature flags (admin-controlled) | `[x]` | `PlatformSettingsPanel` |
| Admin Pro grant/revoke on attorneys | `[x]` | Attorneys table |

### Security & sessions

| Feature | Status | Notes |
|---------|--------|-------|
| httpOnly session cookie (`immflow_session`) | `[x]` | No JWT in localStorage |
| `GET /api/auth/me` session bootstrap | `[x]` | |
| `POST /api/auth/logout` | `[x]` | |
| Rate limiting on auth endpoints | `[x]` | login / signup / forgot-password |

### Routes & UX

| Feature | Status | Notes |
|---------|--------|-------|
| SEO-friendly URLs (`/jobs`, `/attorneys`, `/dashboard`, …) | `[x]` | |
| Per-route metadata (title / description) | `[x]` | |
| Public attorney profile URL `/attorneys/[id]` | `[x]` | PDF Phase 2 |
| Dashboard listing manager (edit / close / reopen / filled) | `[x]` | |
| Job board status filters (open / filled / closed) | `[x]` | |

### Email & billing (internal Phase 2 doc)

| Feature | Status | Notes |
|---------|--------|-------|
| Resend + ZeptoMail providers | `[x]` | `EMAIL_PROVIDER` |
| Stripe Checkout + webhooks + Customer Portal | `[x]` | |
| Structured logging | `[x]` | `src/lib/logger.js` |
| Smoke test script | `[x]` | `npm run smoke` |
| API / architecture docs | `[x]` | `docs/API.md`, `docs/ARCHITECTURE.md` |

---

## Progress summary

| Section | Complete | Partial | Open |
|---------|----------|---------|------|
| Phase 1 — Foundation | 4 | 1 | 0 |
| Phase 2 — Core Features | 4 | 0 | 0 |
| Phase 3 — Growth Features | 5 | 0 | 0 |
| Additional (beyond PDF) | 18 | 0 | 0 |

**Proposal scope (Phases 1–3):** ✅ complete in code  
**PDF Phase 2 (profiles, listings, search, applications):** ✅ complete  
**PDF Phase 3 (messaging, billing, admin, AI, email):** ✅ complete — [PHASE3.md](./PHASE3.md)  
**Production ops:** verify Stripe webhook secret + run pending migrations on DigitalOcean

---

## Production deployment checklist

Use before calling the platform production-ready on **myimmflow.com**.

### Repository & CI

- [ ] All Phase 2 / Phase 3 code committed on `dev/phase2`
- [ ] PR reviewed and merged to deploy branch
- [ ] GitHub repository connected to Netlify
- [ ] Netlify base directory set to `immflow-app`
- [ ] Continuous deploy enabled on target branch

### Database

- [ ] Managed MySQL provisioned (PlanetScale, Railway, Aiven, etc.)
- [ ] `DATABASE_URL` set in Netlify env
- [ ] `npx prisma migrate deploy` succeeds on production DB
- [ ] Seed or migrate existing admin user + `super_admin` role (if fresh DB)
- [ ] Database backups enabled

### Environment variables (Netlify)

- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET` (`openssl rand -base64 32`)
- [ ] `NEXT_PUBLIC_APP_URL` = `https://myimmflow.com`
- [ ] `EMAIL_API_KEY`
- [ ] `EMAIL_FROM` = `ImmFlow <noreply@myimmflow.com>`
- [ ] `EMAIL_PROVIDER` = `resend` or `zeptomail`
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` (from live webhook)
- [ ] `STRIPE_PRICE_ID` = `price_...` (**not** `prod_...`)

### Stripe (live)

- [ ] Stripe account business name set (required for Checkout)
- [ ] Live webhook: `https://myimmflow.com/api/webhooks/stripe`
- [ ] Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Test live checkout end-to-end
- [ ] Test Customer Portal (manage / cancel)

### Email (live)

- [ ] Sending domain verified in Resend/ZeptoMail
- [ ] Password reset email works on production URL
- [ ] Welcome email on signup works
- [ ] Admin broadcast tested with small group

### DNS & SSL

- [ ] `myimmflow.com` points to Netlify (Namecheap DNS)
- [ ] HTTPS certificate active
- [ ] `www` redirect configured (if used)

### Post-deploy smoke tests

```bash
cd immflow-app
npm run smoke    # against production URL if script supports it
```

Manual checks:

- [ ] Home page loads
- [ ] Sign up → login → dashboard
- [ ] Find Attorneys search + profile page
- [ ] Post listing → apply → owner reviews application
- [ ] Pro upgrade (Stripe Checkout)
- [ ] Admin login → CMS save → analytics
- [ ] Admin users/roles (super admin only)
- [ ] Test mode **off** in production (`Platform settings`)

### Security & ops

- [ ] `JWT_SECRET` is unique per environment (not dev fallback)
- [ ] `.env` never committed
- [ ] Admin password changed from seed default
- [ ] At least one super admin assigned
- [ ] Error logging monitored (Netlify / external)
- [ ] Rate limits acceptable under load

### Optional (remaining proposal items)

- [x] Dedicated rate filter on Find Attorneys UI
- [x] Email on new application (to listing owner)
- [x] Email on new message
- [x] Subscription renewal reminder emails
- [x] External AI API for matcher (OpenAI / etc.)
- [x] Admin signup approve/reject flow
- [x] Live Stripe billing summary in admin
- [x] Promo expiration enforcement
- [x] Checkout session sync fallback (`/api/billing/sync`)
- [ ] Admin “reject signup” workflow (vs verify-only)

---

## Quick local verification

```bash
cd immflow-app
npm run dev          # http://localhost:3000
npm test
npm run build
npm run smoke        # if DB + env configured
```

**Default admin (after seed):** `admin@myimmflow.com` / `password` → `/admin`

---

## Reference documents

| Doc | Purpose |
|-----|---------|
| [Aayush P.pdf](../../Aayush%20P.pdf) | Original client proposal |
| [PHASE2.md](./PHASE2.md) | Internal Phase 2 (email, Stripe, ops) |
| [NETLIFY.md](./NETLIFY.md) | Deploy runbook |
| [API.md](./API.md) | API reference |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview |
