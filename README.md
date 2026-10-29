# Patel Yarn House

Full-stack e-commerce storefront and admin panel for yarn and knitting supplies. Single Next.js application — no separate backend.

**Stack:** Next.js 15 (App Router, React 19) · TypeScript · Prisma 6 / PostgreSQL · NextAuth 5 · Razorpay · Tailwind CSS 4 · Radix UI / shadcn · Zustand · Zod

## Architecture

```
app/
  (Customerside)/      storefront: catalog, product detail, cart, checkout, orders
  admin/               inventory, brands, orders, stock, backup/restore
  api/                 payment, auth OTP, delivery, stock, upload, webhooks
  store/store.ts       persisted Zustand cart (localStorage)
  generated/prisma/    generated Prisma client (custom output path)
prisma/                schema, seed scripts, catalog JSON
lib/                   prisma singleton, auth helpers, order finalization
middleware.ts          HTTP Basic auth guard for /admin/*
auth.ts                NextAuth config
```

- **Rendering:** Server Components query Prisma directly; `unstable_cache` (tagged `products`, `brands`, `filter-options`) caches catalog reads. Dynamic routes use the App Router route groups above.
- **Mutations:** Server Actions for cart/checkout/admin CRUD; Route Handlers for third-party callbacks and client-side flows.
- **Cart:** client-only state in Zustand, persisted to `localStorage`; prices and stock are always re-validated server-side before payment.
- **Data model:** `Brand → Product`, `YarnAccessory`, `User → Order → OrderItem` (polymorphic to either product type). Addresses are encoded into a single `Address` column (`street|||city|||state|||landmark`).

## Payments (Razorpay)

Two-phase flow designed for idempotency and reconciliation:

1. `POST /api/razorpay/order` — validates session, re-fetches prices and stock from the DB, computes delivery/tax, creates a Razorpay order plus an **unpaid** `Order` row keyed by the Razorpay order ID.
2. Client completes Razorpay Checkout.
3. `POST /api/razorpay/verify` — checks the HMAC-SHA256 signature, verifies the payment belongs to the order and the captured amount matches the DB amount, then calls `finalizePaidOrder()`.
4. `POST /api/webhooks/razorpay` — handles `payment.captured` as a recovery path (idempotent) and acknowledges `payment.failed`.

Pricing is server-authoritative: delivery is ₹100 under a ₹1,999 subtotal, tax is a flat ₹4, and orders above ₹10,000 are rejected in favor of bulk ordering.

`lib/razorpay/finalize-order.ts`:
- Claims the order with `updateMany({ where: { paid: false } })` so concurrent verify/webhook calls finalize only once.
- Decrements stock in a separate transaction using conditional `updateMany` (`stock >= qty`), preventing negative stock.
- If stock runs out after capture, the order stays `paid: true, complete: false` for manual reconciliation — money is never silently lost.

`paid` = payment captured; `complete` = admin-fulfilled; `delivered` = shipping vs. pickup.

## Auth

- **Customers:** phone + OTP. `POST /api/send-otp` issues a 6-digit code (5 min TTL, 3 requests/hour/phone) delivered via the WhatsApp Cloud API. NextAuth Credentials provider verifies it against the in-memory store; `session.user.id` is the phone number, resolved to the Prisma user UUID per request. JWT sessions, effectively non-expiring.
- **Admin:** HTTP Basic auth via middleware on `/admin/:path*`, compared against a SHA-512 base64 hash (`HASHED_ADMIN_PASSWORD`). Session-based checks additionally guard privileged API routes.

> OTP and rate-limit stores are in-process `Map`s. They require a single long-lived instance (or must be swapped for Redis) when scaling horizontally.

## Media

Admin image uploads are committed to a GitHub repository via the Contents API and served through jsDelivr; `next/image` is allowlisted for `cdn.jsdelivr.net`, `raw.githubusercontent.com`, and `images.unsplash.com`.

## API surface

| Route | Purpose |
| --- | --- |
| `POST /api/send-otp` | Issue WhatsApp OTP |
| `POST /api/razorpay/order` | Validate cart, create Razorpay order + unpaid DB order |
| `POST /api/razorpay/verify` | Signature/amount verification + finalize |
| `POST /api/webhooks/razorpay` | `payment.captured` / `payment.failed` handler |
| `POST /api/check-stock` | Batch stock validation |
| `GET /api/check-order/[orderId]` | Owner-scoped order status |
| `POST /api/complete` | Mark order complete + send tracking WhatsApp |
| `POST /api/upload-image` | Commit image to GitHub, return CDN URL |
| `GET/POST /api/admin/backup` | Full JSON export / transactional upsert restore |

## Local setup

```bash
npm install
# create .env from the table below
npx prisma generate
npx prisma db push          # schema is not tracked as SQL migrations
npx prisma db seed          # optional: runs prisma/seed.js
npm run dev                 # next dev --turbopack
```

### Environment

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET`, `AUTH_URL` | yes | NextAuth |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | yes | Razorpay API |
| `RAZORPAY_WEBHOOK_SECRET` | yes | Webhook HMAC verification |
| `NEXT_PUBLIC_RAZORKEY` | yes | Razorpay checkout key (client) |
| `ADMIN_USERNAME`, `HASHED_ADMIN_PASSWORD` | yes | Admin Basic auth (SHA-512, base64) |
| `WHATSAPPENV`, `WHATSAPPPHONE` | yes | WhatsApp Cloud API token / phone-number ID |
| `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN` | yes | Image upload target |
| `BASEURL`, `NEXT_PUBLIC_BASEURL` | no | Absolute URLs |
| `TAXES` | no | Reserved; tax is currently fixed at ₹4 |

Generate the admin hash: `printf '%s' "$PASSWORD" | shasum -a 512 | cut -d' ' -f1 | xxd -r -p | base64`.

## Scripts

```bash
npm run dev       # development (Turbopack)
npm run build     # prisma generate && next build (output: standalone)
npm run start     # production server
npm run lint
ANALYZE=true npm run build   # bundle analysis
```

## Deployment

`next.config.ts` sets `output: 'standalone'`, so the build emits `.next/standalone` + `.next/static` (no `node_modules` needed at runtime). Any Node host or container works; PostgreSQL and outbound HTTPS to Razorpay, WhatsApp, and GitHub are required. Run `prisma db push` during release and keep privileged secrets (`GITHUB_TOKEN`, `RAZORPAY_KEY_SECRET`, `WHATSAPPENV`) server-side only.
