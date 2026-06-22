# ImmFlow Phase 2 — Core Features

**Source:** [Aayush P.pdf](../../Aayush%20P.pdf) — *Phase 2 — Core Features (Weeks 3–4)*  
**App:** [myimmflow.com](https://myimmflow.com)  
**Branch:** `main` (merged from `dev/phase2`)  
**Stack:** Next.js 16 · React 19 · Prisma · MySQL · JWT + httpOnly cookies  
**Last updated:** June 22, 2026

Phase 2 delivers the **marketplace core**: public attorney profiles, a real job board, database-backed search, and a full application workflow. This document maps **every PDF Phase 2 requirement** to what was built, where it lives, and what remains.

---

## Status legend

| Mark | Meaning |
|------|---------|
| ✅ | Complete and shipped |
| ~ | Partially complete or implemented differently than the PDF |
| ⬜ | Not complete |

**PDF Phase 2 overall:** ✅ **Complete**

---

## Prerequisites (Phase 1 — context)

Phase 2 builds on the Phase 1 foundation. Implementation differs from the PDF stack (Supabase → **Prisma + MySQL**), but the capabilities are in place.

| # | PDF requirement | Status | Implementation |
|---|-----------------|--------|----------------|
| 1 | Migrate frontend to React on GitHub | ✅ | Next.js App Router in `immflow-app/` |
| 2 | Database tables (attorneys, listings, applications, messages) | ✅ | `prisma/schema.prisma` + migrations |
| 3 | Connect all pages to real data | ✅ | `/api/attorneys`, `/api/listings`, `/api/messages`, etc. |
| 4 | Auth: signup, login, email verification, password reset | ✅ | Custom JWT; **email verification required before login**; reset via `?reset=` |
| 5 | Deploy with CI/CD | ~ | Live on **DigitalOcean droplet** (+ optional [Netlify runbook](./NETLIFY.md)) |

---

## 6. Attorney profiles — public profile page

**PDF:** Each attorney gets a public profile with photo, bio, bar verification, specialties, languages, availability, rate, reviews, and contact.

| Sub-requirement | Status | Where / how |
|-----------------|--------|-------------|
| Photo upload | ✅ | Dashboard → **My profile** (`ProfileEditor.js`); stored in `attorneys.photo_url` |
| Bio and practice description | ✅ | Profile editor + `/attorneys/[id]` (`AttorneyProfilePage.js`) |
| Bar number and state bar verification badge | ✅ | `bar_number`, `state_bar`; admin **Approve & verify**; badge on profile when `is_verified` |
| Specialties and visa categories | ✅ | Tag input on profile; directory + profile display |
| Languages spoken | ✅ | Tag input; used in search/filters |
| Availability calendar | ✅ | Date slots in profile editor (`availabilitySlots` JSON); shown on public profile |
| Hourly rate or flat fee | ✅ | `rate` field on cards and profile |
| Reviews and ratings from other attorneys | ✅ | `Review` model; 1–5 stars; `POST /api/attorneys/[id]/reviews`; auto-averaged `stars` / `reviews_count` |
| Contact button | ✅ | **Message attorney** → dashboard chat (Pro-gated via platform features) |

### Routes & APIs

| Surface | Path / endpoint |
|---------|-----------------|
| Public profile page | `/attorneys/[id]` |
| Directory | `/attorneys` |
| Profile API | `GET /api/attorneys/[id]` |
| Update own profile | `PATCH /api/user/profile` |
| Submit review | `POST /api/attorneys/[id]/reviews` |

### Data model

- `Attorney` — name, bio, bar, specialties, languages, rate, availability, `photo_url`, `availability_slots` (JSON), `is_verified`
- `Review` — `attorney_id`, `reviewer_id`, `rating`, `comment`

**Item 6 overall:** ✅ **Complete**

---

## 7. Real listings — job board

**PDF:** Fully functional job board: post hearings, outsource, jobs, of counsel; set compensation/location/requirements; manage applications; mark filled or closed.

| Sub-requirement | Status | Where / how |
|-----------------|--------|-------------|
| Post hearing coverage, outsource, full-time, of counsel | ✅ | **Post a listing** (`PostPage.js`); types in `listing-types.js` |
| Set compensation, location, case type, language requirements | ✅ | `pay`, `location`, `type`, `tags` (JSON) on `Listing` |
| Receive and manage applications | ✅ | Dashboard → **My listings** → **Review applications** (`ListingManager.js`) |
| Mark listings as filled or closed | ✅ | Owner edit/close/reopen; **accept applicant** sets status `filled` |

### Routes & APIs

| Surface | Path / endpoint |
|---------|-----------------|
| Job board | `/jobs` |
| Post listing | `/post` |
| List open jobs | `GET /api/listings?status=open` |
| Owner listings | `GET /api/user/listings` |
| Create / update listing | `POST /api/listings`, `PATCH /api/listings/[id]` |
| Admin moderate | `GET/PATCH/DELETE /api/admin/listings` |

### Listing statuses

`open` · `filled` · `closed` — filterable on job board (`JobsPage.js`).

**Item 7 overall:** ✅ **Complete**

---

## 8. Search and filters (real database)

**PDF:** Filter by location, case type, language, availability, and rate; natural language search; sort by rating, availability, relevance.

| Sub-requirement | Status | Where / how |
|-----------------|--------|-------------|
| Filter by location | ✅ | `GET /api/attorneys?location=`; job board location filter |
| Filter by case type | ✅ | Specialty tags + listing type tabs on `/jobs` |
| Filter by language | ✅ | `?language=` on attorneys and listings |
| Filter by availability | ✅ | Dropdown on **Find Attorneys** (`AttorneysPage.js`); `?availability=` |
| Filter by rate | ✅ | Dropdown on **Find Attorneys** (`?maxRate=`); NL “under $200” via `?q=` |
| Natural language search | ✅ | `?q=` — e.g. “Spanish speaking asylum attorney in Miami” |
| Sort by rating, availability, relevance | ✅ | `?sort=rating|availability|relevance` |

### Query parameters (`GET /api/attorneys`)

| Param | Description |
|-------|-------------|
| `q` | Natural-language search |
| `location` | City/state substring |
| `specialty` | Specialty or tag |
| `language` | Language spoken |
| `availability` | Availability label |
| `maxRate` | Max hourly/flat rate (e.g. `200`) |
| `minRate` | Min rate (API only; optional) |
| `sort` | `relevance` · `rating` · `availability` |

### Implementation files

- `src/lib/services/attorney-search.js` — query + filter pipeline
- `src/lib/utils/attorney-search.js` — NL parsing, sort helpers
- `src/app/api/attorneys/route.js` — public search API

**Item 8 overall:** ✅ **Complete**

---

## 9. Application system

**PDF:** Attorneys apply to listings; posting attorneys review and accept applicants.

| Sub-requirement | Status | Where / how |
|-----------------|--------|-------------|
| Attorneys can apply to listings | ✅ | Apply modal on job board; optional message; `POST /api/applications` |
| Posting attorneys can review applicants | ✅ | Status: `applied` → `reviewed` / `accepted` / `rejected` |
| Posting attorneys can accept applicants | ✅ | Accept marks listing **filled**; updates `applicants_count` |

### Routes & APIs

| Action | Endpoint |
|--------|----------|
| Apply | `POST /api/applications` `{ listingId, message? }` |
| My applications | `GET /api/applications` |
| Applications for a listing (owner) | `GET /api/applications?listingId=` |
| Update status | `PATCH /api/applications/[id]` `{ status }` |

### UI

- **Applicants:** Dashboard → **My applications** (`MyApplications.js`)
- **Owners:** Dashboard → **My listings** → applicant list (`ListingManager.js`)

### Email (beyond PDF Phase 2 — shipped on `main`)

| Event | Status | Module |
|-------|--------|--------|
| Email to listing owner on new application | ✅ | `src/lib/email/notify.js` |
| Email to applicant on status change | ✅ | `src/lib/email/notify.js` |

**Item 9 overall:** ✅ **Complete**

---

## Production infrastructure (supports Phase 2 in live)

These were built on the `dev/phase2` branch so Phase 2 features work on **myimmflow.com** (not all are in the PDF Phase 2 section; they are required for production).

### Email

| Feature | Status | Notes |
|---------|--------|-------|
| Password reset | ✅ | `POST /api/auth/forgot-password` → `?reset=token` |
| Email verification on signup | ✅ | `POST /api/auth/signup` → `?verify=token`; `POST /api/auth/resend-verification` |
| Welcome email after verification | ✅ | Sent from `verify-email` route |
| Admin broadcast | ✅ | `POST /api/admin/announcements` |
| Providers | ✅ | **ZeptoMail** (production, HTTPS API), Resend, Gmail SMTP (local/dev; **blocked on DO port 587**) |

**Production `.env` (email):**

```env
EMAIL_API_KEY="your_zeptomail_send_mail_token"
EMAIL_FROM="myimmflow <verify@myimmflow.com>"
EMAIL_PROVIDER=zeptomail
```

See `.env.example` for SMTP and Resend alternatives.

### Auth & sessions

| Feature | Status |
|---------|--------|
| httpOnly `immflow_session` cookie | ✅ |
| `GET /api/auth/me` bootstrap | ✅ |
| `POST /api/auth/logout` | ✅ |
| Rate limiting (login, signup, forgot-password, resend-verification) | ✅ |

### Stripe billing (PDF Phase 3 — delivered early)

| Feature | Status |
|---------|--------|
| Free tier + Pro $29/mo | ✅ |
| `POST /api/billing/checkout` | ✅ |
| `POST /api/billing/portal` | ✅ |
| `POST /api/webhooks/stripe` | ✅ |
| Dashboard billing tab | ✅ |
| Test mode promo `IMMFLOW2026` | ✅ |

**Live webhook events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.upcoming`

### Admin & platform (beyond PDF Phase 2)

| Feature | Status |
|---------|--------|
| Admin RBAC (users & roles) | ✅ |
| CMS (homepage, nav, footer) | ✅ |
| Platform test mode + feature flags | ✅ |
| Analytics overview | ✅ |

### Routes & SEO

| Route | Purpose |
|-------|---------|
| `/` | Home |
| `/attorneys`, `/attorneys/[id]` | Directory + profile |
| `/jobs` | Job board |
| `/network` | Attorney network |
| `/matcher` | Matcher (rule-based on live data) |
| `/post` | Create listing |
| `/dashboard` | Attorney dashboard |
| `/admin` | Admin panel |

Per-route `metadata` for SEO on App Router pages.

### Ops & quality

| Item | Status |
|------|--------|
| Structured logging (`src/lib/logger.js`) | ✅ |
| Rate limiting (`src/lib/rate-limit.js`) | ✅ |
| Smoke test (`npm run smoke`) | ✅ |
| Unit tests (`npm test`) | ✅ |
| [API.md](./API.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) | ✅ |

---

## Deployment

### Production (current)

| Item | Value |
|------|--------|
| Host | DigitalOcean droplet (`159.223.129.167`) |
| App path | `/var/www/immflow/immflow-app` |
| Process | PM2 → `npm start` (port 3000) |
| Reverse proxy | Nginx + Let’s Encrypt |
| Database | MySQL on same droplet |
| Domain | `myimmflow.com` → A record to droplet |

**Deploy updates:**

```bash
cd /var/www/immflow && git pull origin main
cd immflow-app && npm install && npx prisma migrate deploy && npm run build
pm2 restart immflow
```

### Alternative

[NETLIFY.md](./NETLIFY.md) — Netlify + `@netlify/plugin-nextjs` (`netlify.toml` in repo).

---

## Environment variables (full)

```env
# Core
DATABASE_URL="mysql://user:pass@localhost:3306/immflow"
JWT_SECRET="openssl rand -base64 32"
NEXT_PUBLIC_APP_URL="https://myimmflow.com"
NODE_ENV=production

# Email — ZeptoMail (recommended on DigitalOcean)
EMAIL_API_KEY="send_mail_token_without_Zoho-enczapikey_prefix"
EMAIL_FROM="myimmflow <verify@myimmflow.com>"
EMAIL_PROVIDER=zeptomail

# Email — optional SMTP (often blocked on DO outbound 587)
# MAIL_HOST=smtp.gmail.com
# MAIL_PORT=587
# MAIL_ENCRYPTION=tls
# MAIL_USERNAME=
# MAIL_PASSWORD=
# MAIL_FROM_ADDRESS=
# MAIL_FROM_NAME="ImmFlow"
# EMAIL_PROVIDER=smtp

# Stripe (live)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

---

## Definition of done — PDF Phase 2 (items 6–9)

- [x] **6** Public attorney profile with all sub-fields (photo, bio, bar, specialties, languages, calendar, rate, reviews, contact)
- [x] **7** Job board: post types, compensation/location/tags, applications, filled/closed
- [x] **8** Search: location, case type, language, availability, NL search, sort (rate: NL only, no dedicated UI)
- [x] **9** Applications: apply, review, accept → filled

### Production verification (live)

- [x] Signup → verification email (ZeptoMail)
- [x] Verify link → welcome email → login
- [x] Stripe Checkout (live keys)
- [ ] Confirm live webhook → Pro unlock after payment (test once)
- [ ] Password reset email on production URL
- [ ] Admin test mode **off** for real billing only

---

## Remaining gaps (not blocking Phase 2 launch)

| Item | PDF section | Priority |
|------|-------------|----------|
| Dedicated **rate filter** UI (min/max or slider) | §8 | Low |
| Admin **reject signup** (vs verify-only) | Phase 3 §12 | Medium |
| External **LLM** for AI matcher | Phase 3 §13 | Future |
| Live Stripe **payment dashboard** embed in admin | Phase 3 §12 | Low |

---

## Quick verification

```bash
cd immflow-app
cp .env.example .env   # configure DATABASE_URL, JWT, email, Stripe
npm install
npx prisma migrate deploy
npm run dev              # http://localhost:3000

npm test
npm run build
npm run smoke            # server must be running
```

**Smoke against production:**

```bash
SMOKE_BASE_URL=https://myimmflow.com node scripts/smoke-test.mjs
```

**Default admin (after seed):** `admin@myimmflow.com` / `password` → `/admin` — **change in production.**

---

## Related documents

| Document | Purpose |
|----------|---------|
| [Aayush P.pdf](../../Aayush%20P.pdf) | Original proposal (Phases 1–3) |
| [CHECKLIST.md](./CHECKLIST.md) | Full project checklist (Phases 1–3 + extras) |
| [API.md](./API.md) | API reference |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview |
| [NETLIFY.md](./NETLIFY.md) | Netlify deploy runbook |

---

## Phase 2 summary

| PDF item | Title | Status |
|----------|-------|--------|
| 6 | Attorney profiles | ✅ |
| 7 | Real listings / job board | ✅ |
| 8 | Search and filters | ~ (rate UI) |
| 9 | Application system | ✅ |

**ImmFlow Phase 2 (proposal scope) is complete in code and live on myimmflow.com**, with one optional UI enhancement (rate filter) and standard production hardening (webhook end-to-end test, admin password, test mode off) remaining as ops tasks.
