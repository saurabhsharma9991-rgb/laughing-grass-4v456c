# ImmFlow Platform

ImmFlow is a marketplace for U.S. immigration attorneys: hearing coverage, case outsourcing, job listings, and AI-assisted matching.

**Stack:** React 19 · Next.js 16 · MySQL (Prisma) · JWT auth  
**Status:** Phase 1 — local testing complete; deployment and email deferred.

---

## Quick start

```bash
cd immflow-app
cp .env.example .env   # edit DATABASE_URL if needed
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) · Admin: [http://localhost:3000/admin](http://localhost:3000/admin)  
Credentials: `admin@myimmflow.com` / `password`

---

## Phase 1 progress (per proposal)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Migrate frontend to React | **Done** — 6 pages + dashboard + admin |
| 2 | Database tables (attorneys, listings, applications, messages) | **Done** — MySQL + Prisma |
| 3 | Connect pages to real DB data | **Done** — attorneys, jobs, apply, matcher ranks DB, CMS, stats |
| 4 | Auth (signup, login, verify, reset) | **Done** — APIs + UI; **email sending deferred** |
| 5 | Netlify CD from GitHub | **Deferred** — `netlify.toml` ready when you deploy |

### Deferred (by design)

| Item | Notes |
|------|-------|
| Netlify / production deploy | Not started |
| Real email (verify / reset) | Dev returns links in API response |
| Supabase | Using **MySQL** instead (confirmed) |

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

## Testing flows locally

1. **Signup** → copy `verificationUrl` from success message → open link → log in  
2. **Post listing** → Job board → filter by type tab → **Apply**  
3. **Pro matcher** → activate promo `IMMFLOW2026` in Dashboard billing → AI Matcher  
4. **Admin CMS** → `/admin` → edit content → save
