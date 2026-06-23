# Going commercial — Stripe billing & plans

Offset ships with a Free/Pro plan system. **It's off by default** — until you set
`VITE_BILLING_ENABLED=true`, everyone is treated as Pro and nothing is gated, so
the app works exactly as before. Turn it on to charge for Pro and enforce limits.

## Plans

| | Free | Pro |
| --- | --- | --- |
| Assets | 2 | Unlimited |
| AI receipt scans | 10 / month | Unlimited |
| Import bills from Gmail | — | ✓ |
| Receipts, charts, reports, export, backup | ✓ | ✓ |

Edit the numbers/features in [`src/lib/plans.js`](./src/lib/plans.js).

> Limits are enforced in the browser (a good UX guardrail). For hard enforcement
> you'd also check the plan in the serverless functions — a sensible next step.

## 1. Database

Run the updated [`supabase/schema.sql`](./supabase/schema.sql) (it adds a
`profiles` table that stores each user's plan; the Stripe webhook writes to it
with the service-role key, users can only read their own row).

## 2. Stripe setup

1. Create a [Stripe](https://dashboard.stripe.com) account.
2. **Product → add a recurring Price** for "Pro" → copy the **Price ID** (`price_…`).
3. **Developers → API keys** → copy your **Secret key** (`sk_…`).
4. **Developers → Webhooks → Add endpoint** → URL `https://YOUR-SITE/api/stripe/webhook`,
   events: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted` → copy the **Signing secret** (`whsec_…`).

## 3. Environment variables (in Vercel)

Client (build-time, `VITE_` prefix):
- `VITE_BILLING_ENABLED=true`
- `VITE_PRO_PRICE=499` (display only)

Server (no prefix — used by `/api/stripe/*`):
- `STRIPE_SECRET_KEY=sk_…`
- `STRIPE_PRICE_ID=price_…`
- `STRIPE_WEBHOOK_SECRET=whsec_…`
- `SUPABASE_URL=…` and `SUPABASE_SERVICE_ROLE_KEY=…` (Supabase → Settings → API)

Then **redeploy**.

## 4. How it flows

- **Upgrade** (Settings or Pricing) → `/api/stripe/checkout` creates a Checkout
  Session (tagged with the user id) → Stripe hosted checkout.
- On success, Stripe calls `/api/stripe/webhook` → the user's `profiles.plan`
  becomes `pro` and their Stripe customer id is saved.
- **Manage billing** (Settings) → `/api/stripe/portal` opens Stripe's portal to
  change/cancel. Cancellations flip the plan back to `free` via the webhook.

To test locally, use the [Stripe CLI](https://stripe.com/docs/stripe-cli)
(`stripe listen --forward-to localhost:3000/api/stripe/webhook`) and Stripe test
cards.

## Not yet done (next steps for full commercial)

- **Teams / shared access** (invite an accountant) — needs an org model + RLS
  rework; planned as a separate change.
- **Public marketing landing at the root domain** (today `/` is the app; the
  marketing/pricing/legal pages live at `/pricing`, `/terms`, `/privacy`).
- **Server-side limit enforcement** and **Google OAuth verification** for public
  Drive/Gmail use.
