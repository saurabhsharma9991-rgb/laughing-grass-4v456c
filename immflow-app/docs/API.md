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
| POST | `/api/auth/signup` | `{ email, password, data: { full_name, bar_number, bar_state } }` | Create account; returns `{ user, access_token }` |
| POST | `/api/auth/login` | `{ email, password }` | Login; returns `{ user, access_token }` |
| POST | `/api/auth/verify-email` | `{ token }` | Legacy endpoint (verification no longer required at signup) |
| POST | `/api/auth/forgot-password` | `{ email }` | Issue reset token (email delivery requires provider) |
| POST | `/api/auth/reset-password` | `{ token, password }` | Reset password with token |

**Error codes:** `INVALID_CREDENTIALS`, `VALIDATION_ERROR`, `EMAIL_EXISTS`

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
| PATCH | `/api/listings/[id]` | Update own listing |
| GET/POST | `/api/applications` | Application count / apply to listing |
| GET/PATCH | `/api/user/profile` | Attorney profile |
| GET/POST | `/api/messages` | List conversations / send message (Pro) |
| GET/DELETE | `/api/user/subscription` | Read plan / downgrade to Free |

`POST /api/user/subscription` returns `501 BILLING_NOT_AVAILABLE` (no simulated upgrades).

**Error codes:** `PRO_UPGRADE_REQUIRED`, `MISSING_TOKEN`, `INVALID_TOKEN`, `BILLING_NOT_AVAILABLE`

---

## Admin (`role: admin` required)

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/api/admin/content` | CMS CRUD |
| GET/PATCH/DELETE | `/api/admin/attorneys` | Verify or remove attorneys |
| DELETE | `/api/admin/listings` | Moderate listings |
| GET | `/api/admin/analytics` | Platform stats |
| POST | `/api/admin/announcements` | Broadcast (requires `EMAIL_API_KEY`; sending not wired) |

---

## Testing credentials

- **Admin:** `admin@myimmflow.com` / `password` → use `/admin`
