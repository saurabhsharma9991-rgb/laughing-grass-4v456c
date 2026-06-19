# ImmFlow Phase 2 Plan

**Branch:** `dev/phase2`  
**Status:** Complete — ready to merge and deploy

Phase 2 wires external services and production hardening on top of the Phase 1 core.

---

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `dev/phase1` | Frozen deploy candidate for marketplace-only hotfixes |
| `dev/phase2` | Full production stack (email, Stripe, SEO routes) |
| `main` | Stable releases after sign-off |

---

## Completed deliverables

### Sprint 1 — Email & session security

- Resend + ZeptoMail email providers (`EMAIL_PROVIDER`)
- Password reset emails
- Welcome email on signup
- Admin broadcast to all users
- httpOnly `immflow_session` cookie (no JWT in localStorage)
- `GET /api/auth/me` session bootstrap
- `POST /api/auth/logout`
- Rate limiting on login / signup / forgot-password

### Sprint 2 — Stripe billing

- `stripe_customer_id` / `stripe_subscription_id` on users
- `POST /api/billing/checkout`
- `POST /api/billing/portal` (Customer Portal)
- `POST /api/webhooks/stripe`
- Dashboard upgrade + manage subscription
- Structured webhook logging

### Sprint 3 — Routes & dashboard polish

- SEO URLs: `/`, `/jobs`, `/attorneys`, `/network`, `/matcher`, `/post`, `/dashboard`
- Per-route `metadata` titles/descriptions
- Dashboard **My listings** tab (edit, close, reopen, mark filled)
- Job board status filters (open / filled / closed / all)
- `GET /api/listings?status=open|filled|closed|all`
- `GET /api/user/listings` (owner's listings)

### Sprint 4 — Production ops

- [Netlify deploy runbook](NETLIFY.md)
- `npm run smoke` — smoke test script
- Structured logging (`src/lib/logger.js`)
- Rate limiting (`src/lib/rate-limit.js`)

---

## Environment variables

```env
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=https://myimmflow.com

EMAIL_API_KEY=
EMAIL_FROM="ImmFlow <noreply@myimmflow.com>"
EMAIL_PROVIDER=resend   # or zeptomail

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=price_...
```

---

## Definition of done

- [x] Password reset email with `?reset=` link
- [x] Welcome email on signup
- [x] Admin broadcast
- [x] Stripe Checkout + webhooks
- [x] Stripe Customer Portal
- [x] httpOnly cookie sessions
- [x] SEO-friendly App Router URLs
- [x] Dashboard listing management
- [x] Job board status filters
- [x] `npm test` and `npm run build` pass

---

## Quick test

```bash
npm run dev
npm run smoke
npm test
npm run build
```
