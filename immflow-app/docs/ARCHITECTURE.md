# ImmFlow Architecture

## Overview

ImmFlow is a Next.js 16 application with a production-ready Phase 1 core: real MySQL data, JWT auth, admin CMS, and attorney marketplace features. External billing and email delivery are intentionally not simulated.

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

Public pages use **App Router URLs** (`/jobs`, `/attorneys`, `/dashboard`, etc.) backed by a shared client `AppShell`. Admin is at `/admin`.

## Authentication

- Passwords hashed with `bcryptjs`
- Sessions are **JWT in httpOnly cookie** (`immflow_session`); client uses `credentials: include`
- User profile cached in `sessionStorage` only (no JWT in localStorage)
- `GET /api/auth/me` bootstraps the client session
- `POST /api/listings` derives `userId` from JWT — never from request body

## Feature matrix (Phase 1)

| Feature | Status |
|---------|--------|
| Attorney directory, job board, CMS | Live DB |
| Signup / login / password reset APIs | Live (reset email needs provider) |
| AI matcher | Ranks real attorneys; Pro-gated |
| Stripe billing | Not wired — contact support / future webhooks |
| Direct messaging | Real DB; Pro-gated |
| Announcements broadcast | Requires email provider configuration |

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
