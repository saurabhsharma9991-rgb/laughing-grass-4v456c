# ImmFlow Platform

ImmFlow is a marketplace for U.S. immigration attorneys: hearing coverage, case outsourcing, job listings, and AI-assisted matching.

**Stack:** React 19 · Next.js 16 · MySQL (Prisma) · JWT auth  
**Status:** Phase 1 — production-ready core; external integrations listed below.

---

## Quick start

```bash
cd immflow-app
cp .env.example .env   # edit DATABASE_URL + JWT_SECRET
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) · Admin: [http://localhost:3000/admin](http://localhost:3000/admin)  
Credentials: `admin@myimmflow.com` / `password`

---

## Phase 1 checklist (per proposal)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Migrate frontend to React | **Done** — 6 pages + dashboard + admin |
| 2 | Database tables (attorneys, listings, applications, messages) | **Done** — MySQL + Prisma |
| 3 | Connect pages to real DB data | **Done** |
| 4 | Auth (signup, login, reset password) | **Done** — instant signup (no email verification gate) |
| 5 | Netlify CD from GitHub | **Ready** — `netlify.toml` exists; deploy when repo is connected |

### Removed for production (no simulations)

- Email verification gate and dev verification links
- Stripe sandbox link, “simulate payment”, and promo code activation
- Simulated admin broadcast emails

### Still requires external setup (post–Phase 1 core)

See **What's left** at the end of this doc.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |

---

## Documentation

- [API reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)

---

## Local testing flows

1. **Signup** → account is created and you are logged in immediately  
2. **Post listing** → Job board → filter by type → **Apply**  
3. **Pro features** (matcher, messaging, unlimited listings) → require `isPro` on user (admin DB or future Stripe)  
4. **Admin CMS** → `/admin` → edit content → save

---

## What's left to do (outside Phase 1 core)

| Priority | Item | Notes |
|----------|------|-------|
| High | **Deploy to Netlify** | Connect GitHub repo, set `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL` |
| High | **Transactional email** | ZeptoMail/Resend for password reset (signup no longer needs verify) |
| High | **Stripe billing** | Checkout + webhooks to set `isPro`; replace “contact support” upgrade path |
| Medium | **Admin Pro toggle** | UI to grant/revoke Pro without DB access |
| Medium | **Broadcast emails** | Wire `/api/admin/announcements` to email provider |
| Medium | **httpOnly auth cookies** | Replace localStorage JWT for production security |
| Low | **App Router URLs** | `/jobs`, `/attorneys` for SEO (currently SPA routing) |
| Low | **Attorney listing self-edit** | Dashboard UI for `PATCH /api/listings/[id]` |
