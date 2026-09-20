# ImmFlow Complete Platform Guide

This document explains how to install, start, use, administer, test, and operate the current ImmFlow application. It describes implemented behavior in the repository rather than the original proposal.

## 1. What ImmFlow is

ImmFlow combines two related products:

1. An immigration-services marketplace where clients can find verified:
   - Immigration attorneys
   - Certified and professional translators
   - Interpreters
   - Psychological-service professionals
   - Additional provider categories created by an administrator
2. An attorney network with:
   - Attorney profiles
   - A job and opportunity board
   - Applications
   - Direct messaging
   - AI-assisted attorney matching
   - Stripe Pro subscriptions

ImmFlow helps users discover and connect with independent professionals. It does not itself provide legal advice, medical advice, psychological assessments, interpretation, or certified translations.

## 2. Technology and architecture

- Next.js 16 App Router
- React 19
- MySQL-compatible database
- Prisma 7 with the MariaDB adapter
- JWT authentication
- HTTP-only session cookie named `immflow_session`
- Tailwind CSS
- Stripe Checkout, Billing Portal, and webhooks
- SMTP, Resend, or ZeptoMail transactional email
- Optional OpenAI matching with deterministic rule-based fallback
- Server-side disk storage for translation files
- Five interface locales: English, Spanish, Hindi, Russian, and Chinese

The accepted production architecture is Prisma/MySQL on DigitalOcean. Supabase and Netlify references in older proposal documents are historical alternatives, not migration requirements.

## 3. Repository location

From the repository root:

```bash
cd immflow-app
```

All commands in this guide assume that `immflow-app` is the current directory.

## 4. Prerequisites

Install or provide:

- Node.js 20 or newer
- npm
- A running MySQL or MariaDB database
- A database and user with permission to create and alter tables
- Optional Stripe, email, and OpenAI accounts
- A persistent writable directory for production uploads

Check local tools:

```bash
node --version
npm --version
mysql --version
```

## 5. First-time local setup

### 5.1 Install dependencies

```bash
npm install
```

The `postinstall` script generates the Prisma client.

### 5.2 Create the environment file

```bash
cp .env.example .env
```

At minimum, set:

```dotenv
DATABASE_URL="mysql://root:password@localhost:3306/immflow"
JWT_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a production-quality JWT secret with:

```bash
openssl rand -base64 48
```

Never use the example development secret in production.

### 5.3 Create the database

Example:

```sql
CREATE DATABASE immflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 5.4 Apply migrations

```bash
npx prisma migrate deploy
```

Useful checks:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
```

### 5.5 Decide whether to seed demo data

For a new disposable local database only:

```bash
npx prisma db seed
```

Important: `prisma/seed.js` is destructive. It deletes users, attorneys, listings, messages, provider records, CMS content, and admin roles before recreating demo content. Do not run it against staging or production data.

For an existing database, use only:

```bash
npx prisma migrate deploy
```

The migrations safely backfill marketplace RBAC and Help/FAQ CMS content without requiring the destructive seed.

## 6. Starting and stopping the application

### Development

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Stop the server with `Ctrl+C`.

### Production build locally

```bash
npm run build
npm start
```

### Main URLs

- `/` — marketplace home
- `/services` — all service categories
- `/services/[slug]` — category directory
- `/providers/[id]` — public marketplace provider profile
- `/attorneys` — attorney directory
- `/attorneys/[id]` — legacy attorney profile
- `/jobs` — job and opportunity board
- `/post` — create a listing
- `/network` — attorney network
- `/matcher` — AI attorney matcher
- `/dashboard` — authenticated user dashboard
- `/help` — localized Help and FAQ
- `/admin` — administration portal

## 7. Demo accounts

Running the destructive seed creates:

```text
Email: admin@myimmflow.com
Password: password
Role: Super Admin
```

It also creates verified demo attorney accounts whose password is `password`.

These credentials are only for an isolated local demo database. Immediately replace or remove them in any shared environment. Never deploy the seeded default password publicly.

If seed has not been run, no default administrator is guaranteed to exist. Create or promote an administrator directly through a controlled database process, assign `role = "admin"`, and attach an appropriate `AdminRole`.

## 8. Authentication and session behavior

### Supported account types

- Client/seeker — stored as role `public`
- Immigration attorney — role `attorney`
- Non-attorney service provider — role `provider`
- Administrator — role `admin`

### Signup

1. Select **Sign up**.
2. Choose client, attorney, or provider.
3. Enter the required fields.
4. Submit the form.
5. Open the verification email.
6. Follow the verification link.

Passwords must contain at least eight characters.

### Client signup

Clients provide a name, email, password, and preferred language. Their signup status is approved automatically, but email verification is still required.

### Attorney signup

Attorneys also provide bar number and bar state.

The system creates:

- A `User`
- A legacy `Attorney` profile
- An attorney-category `Provider` profile
- Credential information where supplied

The attorney must:

1. Verify the email address.
2. Wait for Admin approval.
3. Log in after approval.

### Provider signup

Providers:

1. Select a service category.
2. Complete fields defined by that category’s Admin-managed `profileSchema`.
3. For translation, enter source and target languages, provider type, certification availability, turnaround, and pricing.
4. Verify the email.
5. Wait for Admin verification.

Provider login remains blocked until `Provider.verificationStatus` becomes `verified`. Verification synchronizes the linked user’s signup status to `approved`.

### Login blocking conditions

Login is rejected when:

- The password is wrong.
- The email is not verified.
- Attorney/provider approval is pending.
- Registration was rejected.
- A provider has been suspended.

### Session behavior

- JWT lifetime: seven days
- Primary browser session: HTTP-only `immflow_session` cookie
- Cookie is `secure` in production
- Cookie uses `SameSite=Lax`
- The frontend also keeps non-secret user display data in session storage
- API authentication accepts the session cookie or a Bearer token

### Password reset

1. Select **Forgot password**.
2. Submit the account email.
3. Open the reset email.
4. Follow the tokenized link.
5. Enter a new password.

The response does not disclose whether an email exists.

### Auth rate limits

Login, signup, forgot-password, and resend-verification endpoints use an in-memory per-IP limiter. The default is 15 attempts per minute per application instance.

## 9. Language and localization

The language selector supports:

- English (`en`)
- Spanish (`es`)
- Hindi (`hi`)
- Russian (`ru`)
- Chinese (`zh`)

Changing language:

1. Updates the current interface locale.
2. Saves it in browser storage/cookie.
3. When logged in, saves it to `User.preferredLocale`.
4. Causes localized CMS content to reload.
5. Controls the locale selected for supported transactional emails.

Locale catalogs are under `src/locales/`. Automated tests enforce key parity with English.

## 10. Marketplace home

The marketplace journey is the primary home experience.

Users can:

- Choose a service category.
- Enter a natural-language request.
- Receive a detected category and ranked provider matches.
- Open provider profiles.
- Continue to category-specific request workflows.
- Access the attorney job board and attorney matcher as secondary journeys.

The service finder is discovery-only. It does not generate legal advice, clinical conclusions, or translation certification claims.

## 11. Service categories

Default categories:

- Immigration Attorneys
- Certified Translation
- Interpreters
- Psychological Services

Categories are database-backed. An administrator can create additional categories without changing application code.

Each category can define:

- Name
- URL slug
- Description
- Icon
- Sort order
- Active/inactive state
- Workflow type
- Dynamic profile fields

Inactive categories are not shown publicly.

## 12. Provider directory and filters

The category page can filter providers by:

- Free-text search
- Service category
- Service language
- Source language
- Target language
- Exact language pair
- Location
- Remote availability
- In-person availability
- Maximum price
- Minimum rating
- Date/time availability
- Certification availability
- Rush availability
- Document type
- Turnaround
- Interpreter/evaluation service type
- Professional type
- License state

Only active, verified providers should be exposed by normal public discovery.

Exact translation language-pair searches are strict. If the user requests Hindi to English, unrelated providers are not returned merely because they support one of those languages.

## 13. Public provider profiles

A public provider profile can show:

- Photo or organization logo
- Display name
- Category
- Verification badge
- Location
- Experience
- Price/rate
- Rating and review count
- Remote and in-person availability
- Availability summary and slots
- Biography
- Service languages
- Exact language pairs
- Dynamic category-specific fields
- Verified credentials
- Reviews
- Contact button
- Translation request or booking action when applicable

Pending, rejected, expired, or suspended credentials are not displayed as verified public credentials.

## 14. AI service finder

Endpoint:

```text
POST /api/service-finder
```

Input:

```json
{
  "query": "I need a certified Hindi to English birth certificate translation"
}
```

The finder:

1. Loads active Admin-managed categories.
2. Extracts category and filters.
3. Uses OpenAI when configured.
4. Falls back to deterministic rules when OpenAI is absent or fails.
5. Queries verified providers.
6. Scores matches.

Ranking factors include:

- Category/service fit
- Language and exact language pair
- Location
- Modality
- Availability
- Verified credentials
- Experience
- Price
- Ratings
- Turnaround

The public endpoint is limited to 12 searches per minute per IP per application instance.

## 15. Client/seeker features

A client can:

- Browse categories and providers without logging in.
- Use the marketplace service finder.
- Create an account.
- Request translations.
- Upload source documents.
- Pay for translation orders.
- Request interpreter bookings.
- Request psychological-service bookings.
- Pay for applicable bookings.
- Track statuses.
- Download permitted files.
- Cancel at allowed stages.
- Review a provider after completed service.
- Apply to open job listings while authenticated.
- Use direct messaging when the account’s feature access allows it.

The client dashboard does not use attorney/provider editing controls.

## 16. Provider self-service

Dashboard **My profile** lets a provider edit:

- Photo/logo
- Name/company
- Location
- Experience
- Biography
- Rate or pricing text
- Availability summary
- Remote availability
- In-person availability
- Availability slots
- Service languages
- Source/target language pairs
- Category-specific profile fields
- Credentials
- Credential organization
- Credential number
- Credential expiration

Credential additions or edits return the credential and provider verification workflow to pending where applicable. Administrators must verify updated credentials.

## 17. Provider verification

Provider statuses:

- `pending`
- `verified`
- `rejected`
- `expired`
- `suspended`

Credential statuses:

- `pending`
- `verified`
- `rejected`
- `expired`

Admin actions include:

- Verify provider
- Reject provider with reason
- Suspend provider
- Mark provider expired
- Return provider to pending
- Add credential
- Verify/reject/expire credential
- Request an updated credential

The Admin panel warns about credentials expiring within 60 days.

Verifying a provider approves the linked user login. Rejecting or suspending a provider blocks provider login. For attorneys, provider verification also synchronizes `Attorney.isVerified`.

## 18. Translation workflow

### Create an order

The client chooses:

- Verified translator
- Source language
- Target language
- Document type
- Standard or certified translation
- Regular or rush turnaround
- Optional source file
- Notes

Source and target languages must differ.

The provider must:

- Be active
- Be verified
- Belong to the translation category
- Offer the requested language pair
- Offer certified translation when certified service is requested

### Translation pricing

The default base is $49 unless provider profile pricing supplies another base.

Adjustments:

- Certified multiplier: 1.45
- Rush multiplier: 1.35
- Minimum charge: $15

The final price is stored in cents and associated with a currency.

### Translation statuses

```text
pending_payment
pending
accepted
in_progress
quality_review
completed
delivered
cancelled
refunded
```

Normal provider transition path:

```text
pending
  → accepted
  → in_progress
  → quality_review
  → completed
  → delivered
```

The provider can decline/cancel only where allowed by the transition map.

The client may cancel while the order is `pending_payment` or `pending`.

Cancelled or refunded orders cannot be revived into active states.

### Translation files

Kinds:

- `source` — uploaded by the client
- `delivery` — uploaded by the assigned translator
- `certification` — uploaded by the assigned translator

An order cannot be marked delivered until a delivery file exists.

A certified order also requires a certification/attestation file before delivery.

### Certified translation statement

Certified orders carry a certification note. The language avoids promising universal acceptance by any agency. The provider is responsible for the supplied certification/attestation.

### Translation payment

1. Order starts as `pending_payment`.
2. Client selects **Pay now**.
3. Server creates a one-time Stripe Checkout session.
4. Stripe redirects back to the order dashboard.
5. Return confirmation and webhook independently validate payment.
6. Paid order becomes `pending`.

The system verifies:

- Checkout mode is `payment`
- Payment status is `paid`
- Order ID metadata
- Client user ID metadata
- Payment type metadata
- Exact amount
- Currency
- Stored Checkout session

A success URL alone is not accepted as payment proof.

If Stripe is absent, payment fails closed. Local simulation works only when:

```dotenv
ALLOW_SIMULATED_PAYMENTS=true
```

and `NODE_ENV` is not `production`.

Stripe refunds move paid translation orders to `refunded`.

### Translation notifications

Localized notifications cover:

- Order creation/request
- Payment
- Provider assignment
- Status changes
- Delivery
- Refund

### Translation review

The client can review the provider after the order reaches `completed` or `delivered`.

## 19. Interpreter booking workflow

The client selects:

- Verified interpreter
- Language
- Interpreter service type
- Modality
- Preferred date/time
- Duration
- Location when relevant
- Notes
- Provider responsibility disclaimer acknowledgment

Supported modalities include:

- Remote
- In person
- Phone
- Video

The selected modality must be supported by the provider.

Interpreter duration:

- Minimum accepted input: 15 minutes
- Maximum: 480 minutes
- Default: 60 minutes
- Provider `minimumBooking` can raise the selected duration

When provider availability slots exist, the requested date must match one of them.

## 20. Psychological-service booking workflow

The client selects:

- Verified psychological-service professional
- Service/evaluation type
- Language
- Telehealth, remote, or in-person modality
- Preferred date/time
- Duration
- Location where applicable
- Relevant notes
- Disclaimer acknowledgment

Dynamic profile and credential fields can include:

- Professional type
- License type
- License number
- License state
- License expiration
- Evaluation types
- Telehealth availability

ImmFlow only connects users with providers. The independent professional is responsible for licensing, evaluation, report quality, and professional obligations.

## 21. Booking statuses and payment

Booking statuses:

```text
pending_payment
requested
confirmed
completed
cancelled
declined
refunded
```

Provider transitions:

```text
requested → confirmed
requested → declined
confirmed → completed
confirmed → cancelled
```

Clients may cancel `pending_payment`, `requested`, or `confirmed` bookings.

Cancelled and refunded bookings cannot be revived.

Pricing is calculated from the provider’s numeric rate and booking duration. If a valid price exists, the booking starts as `pending_payment`. If no price can be derived, it starts as `requested`.

Booking Checkout uses the same amount, currency, metadata, ownership, and paid-status verification principles as translation Checkout.

Refunded booking payments move the booking to `refunded`.

## 22. Attorney directory

The attorney directory lists verified immigration attorneys.

Attorney profiles can include:

- Name
- Photo
- Location
- Bar state and number
- Experience
- Specialties
- Languages
- Rate
- Availability
- Biography
- Reviews
- Contact action

Attorney changes synchronize into the provider architecture so the same attorney can participate in marketplace discovery while the legacy Attorney model remains compatible with the job board.

## 23. Attorney peer reviews

Attorney reviews are restricted:

- Reviewer must be a verified attorney.
- Reviewer cannot review their own profile.
- Rating must be from 1 through 5.
- One review per attorney/reviewer pair is updated rather than duplicated.

Recalculated ratings synchronize to the attorney-category Provider profile.

## 24. Job and opportunity board

Listing statuses:

```text
open
filled
closed
```

Application statuses:

```text
applied
reviewed
accepted
rejected
```

### Browse jobs

Users can search/filter listings by:

- Text
- Location
- Language
- Listing type
- Status

### Create a listing

An authenticated account with feature access can create a listing.

Free-tier default:

- Maximum one open listing

Pro-tier default:

- Unlimited open listings

The Admin feature matrix can change this behavior.

### Apply

An authenticated user can apply when:

- Listing is open.
- Listing is not their own.
- They have not already applied.

### Manage applications

Listing owners can:

- Mark reviewed
- Accept
- Reject

Accepting an application marks the listing `filled`.

Applicants can withdraw unless the application was already accepted.

Transactional notifications are sent for new applications and status changes when email is configured.

## 25. Attorney network

The network page provides attorney-to-attorney discovery and contact.

Access is controlled by the `attorney_network` feature flag. The default allows Free and Pro access.

## 26. AI attorney matcher

This is separate from the marketplace service finder.

Endpoint:

```text
POST /api/matcher
```

It:

- Accepts the user’s attorney/case-fit search criteria.
- Searches verified attorneys.
- Uses OpenAI when configured.
- Falls back to deterministic ranking.
- Returns top matches.

The default feature configuration makes the attorney matcher Pro-only. Admin can change this through the feature matrix.

## 27. Direct messaging

Messages are stored between sender and receiver users.

Users can:

- Start contact from a profile.
- Open Dashboard **Chat & Messages**.
- View conversations.
- Open a message thread.
- Send text messages.

The UI polls the active thread every five seconds.

Sending is controlled by the `direct_messaging` feature flag. It is Pro-only by default.

When email is configured, the recipient receives a localized message notification.

## 28. Provider reviews

For non-attorney providers:

- Reviewer must have a completed service with that provider.
- A completed translation or booking establishes eligibility.
- Self-review is not allowed.
- Rating must be 1 through 5.

For attorney-category providers, verified-attorney peer-review rules apply.

Admin can moderate both legacy attorney and marketplace provider reviews from the Reviews tab.

## 29. ImmFlow Pro subscription

Default plan:

- $29 per month
- Stripe subscription Checkout
- Stripe Billing Portal
- Webhook-managed subscription state

Default Pro features:

- Unlimited listings
- AI attorney matcher
- Direct messaging

Default Free features include browsing, applying, basic posting, and attorney network access, subject to Admin feature settings.

### Subscription flow

1. Open Dashboard **Billing & Subscriptions**.
2. Select upgrade.
3. Server creates Stripe subscription Checkout.
4. Complete Stripe Checkout.
5. Return to Dashboard.
6. Billing sync/webhook updates `isPro`, plan, customer ID, and subscription ID.

### Billing Portal

Pro users can open Stripe’s customer portal to manage payment method or subscription.

### Cancellation

Cancellation:

- Cancels the Stripe subscription when present.
- Downgrades the local account.
- Restores Free-tier feature limits.

### Promotion

The code contains promo code:

```text
IMMFLOW2026
```

It grants three months of promotional Pro and can be used once per account.

Operational warning: the promo endpoint is not restricted to Admin test mode. Change or disable the hard-coded promo before production if it should not be public.

## 30. Dashboard guide

Dashboard tabs:

- Dashboard/Overview
- Translations
- Bookings
- My listings
- My applications
- My profile
- Chat & Messages
- Billing & Subscriptions

The selected tab may be stored in session storage and can also be opened by `?tab=`.

### Client dashboard

- Create and track translation orders
- Create and track bookings
- Pay
- Upload/download permitted files
- Cancel at allowed stages
- Review completed providers
- View applications and messages where applicable

### Provider dashboard

- Edit provider profile
- Manage credentials
- View assigned translation work
- View assigned bookings
- Progress work through allowed statuses
- Upload translation delivery/certification files

### Attorney dashboard

- Edit attorney profile
- Create/manage listings
- Review listing applications
- View own applications
- Use messaging
- Manage Pro billing
- Access attorney matcher/network according to flags

## 31. Admin portal login

1. Open:

```text
http://localhost:3000/admin
```

2. Log in with an Admin account.
3. The page requests `/api/admin/me`.
4. The returned Admin role controls visible tabs and actions.

The seeded local Super Admin is:

```text
admin@myimmflow.com
password
```

Do not use this unchanged outside local development.

## 32. Admin roles and RBAC

Admin access is permission-based.

Resources include:

- Analytics
- CMS
- Settings
- Attorneys
- Listings
- Categories
- Providers
- Translation orders
- Bookings
- Applications
- Reviews
- Broadcast
- Admin users
- Roles

Actions can include:

- View
- Create
- Edit
- Delete

A role with slug `super_admin` has full access. A legacy Admin user without an attached `adminRoleId` is also treated as Super Admin for backward compatibility.

Seeded roles:

- Super Admin — all permissions
- Content Manager — CMS editing plus settings/analytics visibility
- Support — provider, order, booking, attorney, and listing moderation with analytics visibility

## 33. Admin Overview

Overview can show:

- Total/sign-up metrics
- Pending approvals
- Listings
- Pro subscription counts
- Estimated monthly recurring revenue
- Stripe billing information when configured

Requires analytics view permission.

## 34. Admin Site Content

The CMS supports:

- Navigation content
- Homepage sections
- Footer
- Help/FAQ
- Additional content fields

Each content field has:

- Key
- Value
- Type
- Section
- Admin label
- Optional Spanish, Hindi, Russian, and Chinese translations

To edit:

1. Open **Site content**.
2. Select a section.
3. Select a language.
4. Edit fields.
5. Select **Publish all changes**.

To format FAQ:

```text
Question?|Answer
Another question?|Another answer
```

Use one question/answer pair per line.

Keys beginning with `platform.` are protected from normal CMS create/delete operations.

## 35. Admin Features and test mode

Admin can configure:

- Test mode
- Free listing limit
- Free and Pro access for each feature

Feature keys:

- `browse_attorneys`
- `apply_to_listings`
- `post_listings`
- `unlimited_listings`
- `ai_matcher`
- `direct_messaging`
- `attorney_network`

Important distinction:

- Platform test mode enables test UI and Admin simulation behavior.
- Translation/booking payment simulation separately requires `ALLOW_SIMULATED_PAYMENTS=true`.

Do not enable simulated payments in production.

## 36. Admin Categories

Admin can:

- Create category
- Edit category
- Activate/deactivate
- Set order
- Define dynamic profile schema
- Delete an empty category

A category containing providers cannot be deleted; deactivate it instead.

### Profile schema format

Example:

```json
{
  "version": 1,
  "workflow": "contact",
  "fields": [
    {
      "key": "licenseNumber",
      "label": "License number",
      "type": "text",
      "required": true,
      "verificationSensitive": true,
      "help": "Enter the number exactly as issued."
    },
    {
      "key": "serviceTypes",
      "label": "Services",
      "type": "multiselect",
      "required": false,
      "options": [
        "Consultation",
        "Document review"
      ]
    }
  ]
}
```

Supported workflow values:

- `contact`
- `order`
- `booking`
- `directory`

Supported field types:

- `text`
- `textarea`
- `number`
- `boolean`
- `date`
- `select`
- `multiselect`
- `language_pairs`

Rules:

- Maximum 40 fields
- Keys must be unique
- Keys are normalized to letters, numbers, and underscores
- Select options are limited and sanitized
- Required fields are checked during full onboarding

## 37. Admin Providers

Admin can:

- Search/filter providers
- Filter by category
- Filter by verification status
- Verify
- Reject with reason
- Suspend
- Mark expired
- Return to pending
- Add credentials
- Set credential status
- Request credential update
- View expiration warnings
- Delete provider profile

Deleting a Provider profile does not delete the linked User account.

## 38. Admin Translation Orders

Admin can:

- View all orders
- Filter by status
- Assign a verified translation provider
- Reassign where permitted
- Change status
- View file counts
- Edit notes through the API

Provider assignment recalculates translation price using provider base pricing.

## 39. Admin Bookings

Admin can:

- View interpreter and psychological bookings
- Filter by type/status
- Assign a verified provider whose category matches booking type
- Change lifecycle status
- Add provider notes through the API

## 40. Admin Attorneys

Admin can:

- View attorney records
- Approve signup and verify
- Reject signup with reason
- Edit attorney details
- Grant/revoke Pro
- Delete the user

Attorney verification must remain synchronized with the attorney Provider profile.

## 41. Admin Listings and Applications

Listings:

- View
- Edit
- Change status
- Delete

Applications:

- View across the platform
- Change status
- Delete

Application acceptance can mark the listing filled.

## 42. Admin Reviews

The Reviews panel combines:

- Attorney peer reviews
- Marketplace provider reviews

Admin can delete a review when the role has `reviews.delete`. Ratings are recalculated after deletion.

## 43. Admin Broadcast

Broadcast sends email to non-Admin users.

Operational behavior:

- Sending is synchronous.
- It is not a durable background queue.
- Partial delivery failures are possible.
- Large audiences may encounter provider rate limits.

Use carefully and test with a small audience first.

## 44. Admin Users and Roles

Authorized administrators can:

- Create Admin staff accounts
- Edit staff
- Assign roles
- Create custom roles
- Edit permission matrices
- Delete allowed Admin users/roles

Protect the system Super Admin role and always keep at least one verified working Super Admin account.

## 45. Email configuration

### SMTP

```dotenv
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=your-account
MAIL_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="ImmFlow"
EMAIL_PROVIDER=smtp
```

### Resend

```dotenv
EMAIL_PROVIDER=resend
EMAIL_API_KEY="re_..."
EMAIL_FROM="ImmFlow <noreply@example.com>"
```

### ZeptoMail

```dotenv
EMAIL_PROVIDER=zeptomail
EMAIL_API_KEY="..."
EMAIL_FROM="ImmFlow <noreply@example.com>"
```

Email events include:

- Email verification
- Password reset
- Welcome
- Signup approval/rejection
- Application submitted/status
- New direct message
- Subscription renewal
- Credential update request
- Translation order updates
- Booking updates
- Admin broadcast

When email is not configured in development, verification/reset links may be logged to the server console.

## 46. Stripe configuration

```dotenv
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."
NEXT_PUBLIC_APP_URL="https://your-domain.example"
```

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is currently not required by the server-redirect Checkout implementation.

Configure the webhook URL:

```text
https://your-domain.example/api/webhooks/stripe
```

Required event handling includes:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`

Use Stripe test keys and test-mode webhooks before switching to live keys.

Do not manually call payment-confirmation actions as a substitute for Stripe. The API validates the retrieved Checkout Session.

## 47. OpenAI configuration

```dotenv
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
```

OpenAI is optional. Without it:

- Marketplace service finder continues with rules.
- Attorney matcher continues with rules.

Provider discovery remains available even if OpenAI is unavailable.

## 48. Upload configuration

```dotenv
UPLOAD_ROOT="/var/lib/immflow/uploads"
```

Default:

```text
immflow-app/uploads
```

Translation file limit:

- 15 MB per file

Allowed:

- PDF
- JPEG
- PNG
- WebP
- Legacy Word `.doc`
- Word `.docx`
- Plain text

Validation checks:

- Filename exists
- Size
- Extension
- MIME type
- File signature for binary formats
- Path remains under upload root

Production requirements:

- Persistent mounted DigitalOcean volume
- Application-user read/write permissions
- Encryption/backups appropriate for sensitive documents
- Restore testing
- Malware scanning if required by deployment policy
- Retention/deletion policy

Do not rely on ephemeral serverless storage.

## 49. Environment variable reference

Required:

- `DATABASE_URL`
- `JWT_SECRET` in production

Strongly recommended:

- `NEXT_PUBLIC_APP_URL`

Email:

- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_ENCRYPTION`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM_ADDRESS`
- `MAIL_FROM_NAME`
- `EMAIL_PROVIDER`
- `EMAIL_API_KEY`
- `EMAIL_FROM`

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

Marketplace:

- `ALLOW_SIMULATED_PAYMENTS` — local only
- `UPLOAD_ROOT`

AI:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Development/operations:

- `NGROK_HOST`
- `SMOKE_BASE_URL`
- `NODE_ENV`

## 50. API overview

### Public

- `GET /api/health`
- `GET /api/platform/config`
- `GET /api/content`
- `GET /api/stats`
- `GET /api/categories`
- `GET /api/providers`
- `GET /api/providers/[id]`
- `GET /api/providers/[id]/reviews`
- `GET /api/attorneys`
- `GET /api/attorneys/[id]`
- `GET /api/attorneys/[id]/reviews`
- `GET /api/listings`
- `GET /api/listings/[id]`
- `POST /api/service-finder`

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Authenticated user

- `GET/PATCH /api/user/profile`
- `PATCH /api/user/locale`
- `GET/DELETE /api/user/subscription`
- `GET/POST /api/user/listings`
- `GET/POST /api/applications`
- `PATCH/DELETE /api/applications/[id]`
- `GET/POST /api/messages`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/billing/sync`
- `POST /api/matcher`

### Providers

- `GET/PATCH /api/providers/me`
- `POST /api/providers/[id]/reviews`

### Translation

- `GET/POST /api/translation-orders`
- `GET/PATCH /api/translation-orders/[id]`
- `POST/GET/DELETE /api/translation-orders/[id]/files`

### Bookings

- `GET/POST /api/bookings`
- `GET/PATCH /api/bookings/[id]`

### Administration

- `/api/admin/me`
- `/api/admin/permissions`
- `/api/admin/analytics`
- `/api/admin/billing`
- `/api/admin/content`
- `/api/admin/settings`
- `/api/admin/categories`
- `/api/admin/providers`
- `/api/admin/orders`
- `/api/admin/bookings`
- `/api/admin/attorneys`
- `/api/admin/listings`
- `/api/admin/applications`
- `/api/admin/reviews`
- `/api/admin/announcements`
- `/api/admin/users`
- `/api/admin/users/[id]`
- `/api/admin/roles`
- `/api/admin/roles/[id]`

### Webhooks

- `POST /api/webhooks/stripe`

All protected routes enforce authentication and, for Admin routes, the appropriate RBAC permission.

## 51. Database model overview

Core identity:

- `User`
- `AdminRole`

Attorney network:

- `Attorney`
- `Listing`
- `Application`
- `Message`
- `Review`

Marketplace:

- `ServiceCategory`
- `Provider`
- `ProviderLanguagePair`
- `ProviderCredential`
- `ProviderReview`
- `TranslationOrder`
- `TranslationOrderFile`
- `ServiceBooking`

Content/configuration:

- `SiteContent`

Important dual-model rule: attorneys have both an `Attorney` and an attorney-category `Provider`. Synchronization preserves legacy job-board functionality and unified marketplace discovery.

## 52. Tests and verification

Run unit tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

Run Prisma checks:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Run smoke checks:

```bash
npm start
```

In another terminal:

```bash
npm run smoke
```

Against deployed environment:

```bash
SMOKE_BASE_URL="https://your-domain.example" npm run smoke
```

The smoke script checks health, platform config, public data, categories, providers, localized CMS, marketplace pages, Help, jobs, attorneys, network, matcher, dashboard, and post routes.

## 53. DigitalOcean production deployment outline

1. Create a managed MySQL database or secured MySQL service.
2. Create the application runtime.
3. Configure Node 20+.
4. Set all production environment variables.
5. Mount persistent upload storage.
6. Install dependencies.
7. Run:

```bash
npx prisma migrate deploy
npm run build
npm start
```

8. Configure reverse proxy and TLS.
9. Set `NEXT_PUBLIC_APP_URL` to the public HTTPS origin.
10. Register Stripe webhook URL and events.
11. Verify email sender domain.
12. Turn off any test/simulation behavior.
13. Run deployed smoke tests.
14. Configure database and upload backups.
15. Configure logs, uptime checks, alerts, and restore tests.

Do not run the destructive seed in production.

## 54. Production security checklist

- Replace seeded/default passwords.
- Use a unique high-entropy `JWT_SECRET`.
- Use TLS everywhere.
- Restrict database network access.
- Use a least-privilege database user.
- Keep `ALLOW_SIMULATED_PAYMENTS` unset or false.
- Review/remove public promo code behavior.
- Use live Stripe keys only after test-mode validation.
- Verify Stripe webhook signature secret.
- Use a persistent private upload volume.
- Establish sensitive-file retention and deletion procedures.
- Restrict Admin accounts with RBAC.
- Preserve at least one secure Super Admin account.
- Configure rate limiting at the reverse proxy or distributed store.
- Back up MySQL and uploads.
- Test restores.
- Protect logs from sensitive document content.
- Verify email domain SPF, DKIM, and DMARC.
- Monitor rejected webhook signatures and payment mismatches.

## 55. Common troubleshooting

### Database health returns 503

Check:

- MySQL is running.
- `DATABASE_URL` is correct.
- Database/user exists.
- Network/firewall allows access.
- Migrations were applied.

```bash
npx prisma migrate status
```

### Login says email is not verified

- Open the verification email.
- Use resend verification.
- In local development without email, inspect the server console for the verification URL.

### Login says approval is pending

- For attorney: Admin → Attorneys → approve/verify.
- For provider: Admin → Providers → verify.

Email verification alone does not approve professional accounts.

### Login says rejected or suspended

An Admin must review the provider/attorney record and intentionally restore it to an allowed status. Do not bypass the approval check in the database without reviewing the reason.

### Stripe checkout says not configured

Check:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID` for Pro
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- Correct test/live mode consistency

### Local payment simulation does not work

Set:

```dotenv
ALLOW_SIMULATED_PAYMENTS=true
```

Simulation never works when `NODE_ENV=production`.

### Payment completed but UI still shows pending

Check:

- Webhook delivery in Stripe.
- Webhook signing secret.
- Checkout metadata.
- Return URL’s `session_id`.
- Server logs for payment mismatch/rejection.
- Amount and currency stored on the order/booking.

### Upload rejected

Check:

- File is under 15 MB.
- Extension is allowed.
- MIME matches extension.
- Binary signature is valid.
- Current user owns the permitted upload role.
- Provider is assigned before uploading delivery files.

### Delivered status is blocked

- Upload a delivery file.
- For certified translation, also upload a certification file.

### Booking date is rejected

The provider has explicit availability slots and the requested date does not match.

### No providers appear

Check:

- Category is active.
- Provider is active.
- Provider status is `verified`.
- Language pair is exact.
- Filters are not too restrictive.
- Required profile data is populated.

### AI is unavailable

The system should use rule fallback. Check `OPENAI_API_KEY` and model configuration only if LLM behavior is required.

### Email is not sent

Check either complete SMTP settings or API-provider settings. Confirm sender authorization and inspect server logs.

### Pro feature remains locked

Check:

- `User.isPro`
- Subscription webhook delivery
- Feature matrix
- Promo expiration
- Billing sync

### Admin tab is missing

The Admin role lacks that tab’s view permission. Update the role permission matrix using a Super Admin.

### Production uploads disappear

The application is writing to ephemeral storage. Configure `UPLOAD_ROOT` on a persistent mounted volume.

## 56. Known operational cautions

- The seed is a database reset, not a production bootstrap.
- The built-in promo code should be reviewed before launch.
- In-memory rate limits are per process and not globally distributed.
- Admin broadcast is synchronous, not a queue.
- Disk uploads require persistent infrastructure.
- Old Netlify documentation does not account for persistent local document storage.
- Some older API/phase documents describe only the original attorney application and are not the complete marketplace reference.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is listed historically but is not used by the current redirect-based Checkout implementation.

## 57. Recommended first acceptance test

### Admin

1. Log in to `/admin`.
2. Confirm category visibility.
3. Create a temporary provider category.
4. Add dynamic fields.
5. Verify a pending test provider.
6. Confirm provider login works.
7. Review RBAC using a limited Support account.

### Client and translation

1. Create and verify a client.
2. Search for a language pair.
3. Select a verified translator.
4. Create an order.
5. Upload a source PDF.
6. Complete Stripe test payment.
7. Confirm status becomes `pending`.
8. Log in as translator.
9. Progress through the status flow.
10. Upload delivery and certification when applicable.
11. Deliver.
12. Review the provider.

### Booking

1. Select an available interpreter or psychological professional.
2. Choose supported modality and date.
3. Acknowledge disclaimer.
4. Create and pay if priced.
5. Confirm provider sees the booking.
6. Confirm and complete.
7. Review the provider.

### Attorney network

1. Approve a test attorney.
2. Verify public attorney profile.
3. Post a listing.
4. Apply from a second account.
5. Review and accept application.
6. Test direct messaging with required feature access.
7. Test the attorney matcher.

### Localization

1. Switch through all five languages.
2. Confirm preference survives reload and login.
3. Edit Help CMS translations.
4. Verify `/help` changes by locale.
5. Trigger a transactional email for each locale.

## 58. Documentation map

- `README.md` — short project entry point
- `docs/COMPLETE_PLATFORM_GUIDE.md` — this complete guide
- `docs/REQUIREMENTS_AUDIT.md` — requirements and final verification
- `docs/MARKETPLACE.md` — marketplace implementation tracker
- `docs/ARCHITECTURE.md` — original architecture notes
- `docs/API.md` — original API reference; not exhaustive for newer marketplace routes
- `docs/CHECKLIST.md` — original proposal checklist
- `docs/PHASE2.md` and `docs/PHASE3.md` — historical phase documentation

When documents disagree, use the running code, Prisma schema, migrations, this guide, and `REQUIREMENTS_AUDIT.md` as the current sources of truth.
