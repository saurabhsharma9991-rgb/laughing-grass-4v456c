# ImmFlow Architecture

## Overview

ImmFlow is a Next.js 16 application in **testing phase**: feature-complete against the original prototype and live site reference, with simulated integrations where production services are not yet wired.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React client components)                          │
│  ├── SPA shell: src/app/page.js (client-side "routing")     │
│  ├── Admin UI: src/app/admin/page.js                        │
│  └── Shared: components/, lib/client/auth-storage.js        │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch /api/*
┌──────────────────────────▼──────────────────────────────────┐
│  Next.js App Router                                         │
│  ├── middleware.js — admin API header gate + security headers │
│  └── api/**/route.js — thin handlers                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  src/lib/                                                     │
│  ├── auth/ — JWT sign/verify, requireAuth, requireAdmin       │
│  ├── api/response.js — apiSuccess, apiError, withHandler      │
│  ├── validators/ — request body validation                    │
│  ├── services/ — business logic (auth, listings, attorneys)   │
│  └── db.js — Prisma client (MariaDB adapter)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  MySQL / MariaDB (Prisma ORM)                               │
└─────────────────────────────────────────────────────────────┘
```

## Routing model

Public pages use **client-side state** (`page` in `page.js`) rather than App Router segments (`/jobs`, `/attorneys`). This matches the original single-page prototype. Admin is a real route at `/admin`.

**Future:** migrate to `src/app/(marketing)/jobs/page.js` etc. when SEO and deep links become a priority.

## Authentication

- Passwords hashed with `bcryptjs`
- Sessions are **JWT in localStorage** (acceptable for testing; production should use httpOnly cookies)
- `POST /api/listings` derives `userId` from JWT — never from request body (IDOR fix)
- Admin users redirect to `/admin` on login; attorney dashboard is separate

## Feature matrix (testing vs production)

| Feature | Status |
|---------|--------|
| Attorney directory, job board, CMS | Live DB |
| Signup / login / email verify / reset | Implemented (email is console/log stub) |
| AI matcher | Client-side demo data |
| Stripe billing | Sandbox link + simulated activation |
| Direct messaging | Real DB; Pro-gated |
| Announcements broadcast | Stub (no SendGrid) |

## Directory layout

```
immflow-app/
├── prisma/          Schema, migrations, seed
├── src/
│   ├── app/         Next.js routes (page, admin, api)
│   ├── components/  UI pages and shared components
│   └── lib/         Server utilities + client auth helpers
├── docs/            API and architecture reference
└── netlify.toml     Deploy config
```

## Local development

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Run tests: `npm test`
