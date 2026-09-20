# ImmFlow Platform

ImmFlow is an immigration-services marketplace for clients, attorneys, translators, interpreters, and licensed psychological-service professionals. The attorney job board and professional network remain available alongside the service marketplace.

**Stack:** React 19 · Next.js 16 · MySQL (Prisma) · JWT + httpOnly cookies  
**Status:** Active marketplace completion and production-hardening pass. See [Requirements audit](docs/REQUIREMENTS_AUDIT.md).

---

## Branch strategy

| Branch | Use for |
|--------|---------|
| `dev/phase1` | Marketplace-only deploy, CMS tweaks |
| `dev/phase2` | Full production (email, Stripe, SEO routes) — **recommended** |
| `main` | Stable releases |

---

## Quick start

```bash
cd immflow-app
cp .env.example .env   # edit DATABASE_URL + JWT_SECRET + Stripe/Email
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

**URLs:** [http://localhost:3000](http://localhost:3000) · `/services` · `/jobs` · `/attorneys` · `/dashboard` · `/admin`
**Admin:** `admin@myimmflow.com` / `password`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run smoke` | HTTP smoke test (server must be running) |
| `npm run lint` | ESLint |

---

## Documentation

- [Complete setup, feature, admin, and operations guide](docs/COMPLETE_PLATFORM_GUIDE.md)
- [API reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Phase 2 plan](docs/PHASE2.md)
- [Marketplace tracker](docs/MARKETPLACE.md)
- [Requirements audit](docs/REQUIREMENTS_AUDIT.md)
- [Netlify deploy](docs/NETLIFY.md)

---

## Phase 1 + 2 checklist

| Item | Status |
|------|--------|
| React frontend + admin CMS | Done |
| MySQL + Prisma data layer | Done |
| Auth (signup, login, reset) | Done |
| Feature flags + test mode | Done |
| Transactional email (Resend/ZeptoMail) | Done |
| Stripe Checkout + webhooks + portal | Done |
| httpOnly session cookies | Done |
| SEO routes (`/jobs`, `/attorneys`, …) | Done |
| Dashboard listing edit/close | Done |
| Netlify deploy config + runbook | Done |

---

## Deploy

See [docs/NETLIFY.md](docs/NETLIFY.md) for step-by-step Netlify setup.
