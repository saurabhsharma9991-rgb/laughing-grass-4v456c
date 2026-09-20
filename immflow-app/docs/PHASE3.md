# Phase 3 — Growth Features

**Source:** [Aayush P.pdf](../../Aayush%20P.pdf) items 10–14  
**Status:** Complete (June 2026)

---

## Summary

| # | Feature | Status |
|---|---------|--------|
| 10 | Direct messaging | ✅ |
| 11 | Stripe subscriptions | ✅ |
| 12 | Admin dashboard | ✅ |
| 13 | AI matcher | ✅ |
| 14 | Email notifications | ✅ |

---

## 10. Direct messaging

- Pro-gated attorney-to-attorney chat in Dashboard → Messages
- `/api/messages` with self-message guard
- Deep-link from attorney cards via `start-chat.js`

---

## 11. Stripe subscriptions

### Production billing

- **Checkout:** `POST /api/billing/checkout` → Stripe Checkout ($29/mo)
- **Portal:** `POST /api/billing/portal` → Customer Portal (cancel / update card)
- **Webhooks:** `POST /api/webhooks/stripe` (primary activation path)
- **Sync fallback:** `POST /api/billing/sync` with `{ sessionId }` after checkout redirect (if webhook is delayed)

### Promo code `IMMFLOW2026`

- 3 months Pro via `POST /api/user/subscription` `{ promoCode: "IMMFLOW2026" }`
- Works in **production** (not test-mode-only)
- `subscriptionExpires` enforced on login and `/api/auth/me`
- One use per account (`promoUsed`)

### Cancel

- `DELETE /api/user/subscription` cancels Stripe subscription when present, then downgrades user

### Env

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
```

---

## 12. Admin dashboard

### Signup approval flow

New attorney signups:

1. Register → `signupStatus: pending`
2. Verify email → still pending (no session until approved)
3. Admin → Attorneys → **Approve & verify** or **Reject signup**
4. Rejected users get email; cannot log in

**Migration:** `20260619120000_signup_status` — existing users set to `approved`.

### Stripe analytics

- `GET /api/admin/billing` — live MRR, active subscriptions, recent charges
- Admin → Overview shows pending signups + Stripe payment table

---

## 13. AI matcher

- **API:** `POST /api/matcher` (Pro required unless feature flag allows Free)
- **Service:** `src/lib/services/matcher-ai.js`
  - Uses **OpenAI** when `OPENAI_API_KEY` is set
  - Falls back to rule-based `rankAttorneysForMatch` otherwise
- **UI:** Matcher page calls API server-side (no client-only ranking)

### Env (optional)

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

---

## 14. Email notifications

| Event | Template | Trigger |
|-------|----------|---------|
| Password reset | `passwordResetEmailHtml` | forgot-password |
| Email verification | `verifyEmailHtml` | signup |
| Welcome | `welcomeEmailHtml` | after verification (if approved) |
| New application | `newApplicationEmailHtml` | application submit |
| Application status | `applicationStatusEmailHtml` | owner updates status |
| New message | `newMessageEmailHtml` | message send |
| Subscription renewal | `subscriptionRenewalEmailHtml` | billing reminder |
| Signup rejected | `signupRejectedEmailHtml` | admin reject |

Provider: ZeptoMail / Resend / SMTP via `EMAIL_PROVIDER`.

---

## Deploy checklist (Phase 3)

On DigitalOcean after pulling this phase:

```bash
cd immflow-app
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart immflow --update-env
```

1. Run migration `20260619120000_signup_status` (and any prior pending migrations)
2. Fix live `STRIPE_WEBHOOK_SECRET` if webhooks still fail in PM2 logs
3. Set `OPENAI_API_KEY` on server for production AI matching (optional)
4. Turn **test mode off** in Admin → Settings for production
5. Smoke-test: signup → verify → admin approve → login → matcher → Stripe checkout

---

## API additions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/matcher` | AI/rule-based attorney ranking |
| POST | `/api/billing/sync` | Activate Pro from checkout `session_id` |
| GET | `/api/admin/billing` | Stripe MRR + recent payments |

User model fields: `signupStatus`, `rejectionReason`.
