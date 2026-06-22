# ImmFlow API Reference

All JSON responses use a consistent envelope:

- **Success:** raw data or `{ success: true, ... }`
- **Error:** `{ error: { message: string, code: string } }`

Authenticated routes expect `Authorization: Bearer <jwt>`.

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | DB connectivity check |

---

## Auth

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | `{ email, password, data: { full_name, bar_number, bar_state } }` | Create account; sends verification email; does not log in until verified |
| POST | `/api/auth/login` | `{ email, password }` | Login; returns `{ user, access_token }` (requires verified email) |
| POST | `/api/auth/verify-email` | `{ token }` | Verify email from link; logs user in |
| POST | `/api/auth/resend-verification` | `{ email }` | Resend verification link |
| POST | `/api/auth/forgot-password` | `{ email }` | Issue reset token; sends email when `EMAIL_API_KEY` is set |
| POST | `/api/auth/reset-password` | `{ token, password }` | Reset password with token |
| POST | `/api/auth/logout` | — | Clears httpOnly session cookie |
| GET | `/api/auth/me` | — | Current user from session cookie |

**Session:** Login/signup set `immflow_session` httpOnly cookie. Client uses `credentials: include` — no JWT in localStorage.

**Error codes:** `INVALID_CREDENTIALS`, `VALIDATION_ERROR`, `EMAIL_EXISTS`

---

## Public data

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/attorneys` | Verified attorney profiles; query: `q`, `location`, `specialty`, `language`, `availability`, `maxRate`, `minRate`, `sort` |
| GET | `/api/listings` | Job board (`?status=open|filled|closed|all`, default `open`) |
| GET | `/api/content` | CMS key/value map for public site |
| GET | `/api/stats` | Live counts: attorneys, listings, languages |

---

## Authenticated (attorney)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/listings` | Create listing (Free: 1 active max) |
| PATCH | `/api/listings/[id]` | Update own listing |
| GET/POST | `/api/applications` | Application count / apply to listing |
| GET/PATCH | `/api/user/profile` | Attorney profile |
| GET | `/api/user/listings` | Authenticated user's listings (all statuses) |
| GET/POST | `/api/messages` | List conversations / send message (Pro) |
| GET/DELETE | `/api/user/subscription` | Read plan / downgrade to Free |
| POST | `/api/billing/checkout` | Start Stripe Checkout |
| POST | `/api/billing/portal` | Stripe Customer Portal (manage subscription) |

`POST /api/user/subscription` — promo/simulate only when admin **test mode** is ON.

**Stripe webhook:** `POST /api/webhooks/stripe` — `checkout.session.completed`, `customer.subscription.*`

**Error codes:** `PRO_UPGRADE_REQUIRED`, `MISSING_TOKEN`, `INVALID_TOKEN`, `BILLING_NOT_AVAILABLE`

---

## Admin (`role: admin` required)

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/api/admin/content` | CMS CRUD |
| GET/PATCH/DELETE | `/api/admin/attorneys` | Verify or remove attorneys |
| DELETE | `/api/admin/listings` | Moderate listings |
| GET | `/api/admin/analytics` | Platform stats |
| POST | `/api/admin/announcements` | Broadcast to all users (requires `EMAIL_API_KEY`) |

---

## Testing credentials

- **Admin:** `admin@myimmflow.com` / `password` → use `/admin`
