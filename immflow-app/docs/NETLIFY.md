# Netlify deployment runbook

Deploy ImmFlow from the `dev/phase2` branch (or `dev/phase1` for marketplace-only without billing).

## Prerequisites

- GitHub repo connected to Netlify
- Managed MySQL (PlanetScale, Railway, Aiven, etc.)
- Resend or ZeptoMail account (password reset + welcome + broadcasts)
- Stripe account (live keys for production)

## 1. Create Netlify site

1. Netlify → **Add new site** → **Import from Git**
2. Select repository and branch (`dev/phase2`)
3. Base directory: `immflow-app`
4. Build command (from `netlify.toml`): `npx prisma migrate deploy && npm run build`
5. Publish directory: `.next` (handled by `@netlify/plugin-nextjs`)

## 2. Environment variables

Set in Netlify → Site settings → Environment variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://myimmflow.com` |
| `EMAIL_API_KEY` | Yes | Resend or ZeptoMail |
| `EMAIL_FROM` | Yes | `ImmFlow <noreply@myimmflow.com>` |
| `EMAIL_PROVIDER` | No | `resend` (default) or `zeptomail` |
| `STRIPE_SECRET_KEY` | Phase 2 | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Phase 2 | From Stripe webhook endpoint |
| `STRIPE_PRICE_ID` | Phase 2 | `price_...` (not `prod_`) |

## 3. Stripe webhook (production)

1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://myimmflow.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 4. DNS

Point your domain to Netlify (A/CNAME records per Netlify docs). Enable HTTPS.

## 5. Post-deploy checks

```bash
cd immflow-app
SMOKE_BASE_URL=https://myimmflow.com node scripts/smoke-test.mjs
```

Manual:

- Signup → welcome email (if configured)
- Forgot password → reset email
- Post listing → apply on job board
- Stripe upgrade → Pro features unlock
- Admin `/admin` → CMS, features, broadcast

## 6. Admin test mode

Before public launch: Admin → **Features & test mode** → turn **test mode OFF**.

## 7. Rollback

Redeploy a previous Netlify deploy or switch branch to `dev/phase1` for marketplace-only.
