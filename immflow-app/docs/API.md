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
| POST | `/api/auth/signup` | `{ email, password, data: { full_name, bar_number, bar_state } }` | Create account; dev returns `verificationUrl` |
| POST | `/api/auth/login` | `{ email, password }` | Login; returns `{ user, access_token }` |
| POST | `/api/auth/verify-email` | `{ token }` | Confirm email verification token |
| POST | `/api/auth/forgot-password` | `{ email }` | Issue password reset token (logged in dev) |
| POST | `/api/auth/reset-password` | `{ token, password }` | Reset password with token |

**Error codes:** `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `VALIDATION_ERROR`

---

## Public data

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/attorneys` | Verified attorney profiles only |
| GET | `/api/listings` | Open job board listings |
| GET | `/api/content` | CMS key/value map for public site |
| GET | `/api/stats` | Live counts: attorneys, listings, languages |

---

## Authenticated (attorney)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/listings` | Create listing (Free: 1 active max) |
| GET/POST | `/api/applications` | Application count / apply to listing |
| GET/POST | `/api/messages` | List conversations / send message (Pro) |
| GET/POST/DELETE | `/api/user/subscription` | Status, promo, Stripe sim, cancel |

**Error codes:** `PRO_UPGRADE_REQUIRED`, `MISSING_TOKEN`, `INVALID_TOKEN`

---

## Admin (`role: admin` required)

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/api/admin/content` | CMS CRUD |
| GET/PATCH/DELETE | `/api/admin/attorneys` | Verify or remove attorneys |
| DELETE | `/api/admin/listings` | Moderate listings |
| GET | `/api/admin/analytics` | Platform stats |
| POST | `/api/admin/announcements` | Broadcast email stub |

Middleware returns `401` when `Authorization` header is missing on `/api/admin/*`. Full JWT + role check runs in each route via `requireAdmin`.

---

## Testing credentials

- **Admin:** `admin@myimmflow.com` / `password` → use `/admin`
- **Promo code:** `IMMFLOW2026` (3 months Pro, testing only)
