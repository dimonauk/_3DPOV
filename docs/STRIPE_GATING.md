# Stripe gating — current state and outstanding wiring

The site has the **scaffolding** for tier-gated access wired into the
data layer, but the **Stripe SDK is not yet integrated**. This doc names
what's there, what's not, and the env contract for the missing parts.

## What's already there

### Tier definitions — [lib/rookery/tiers.ts](../lib/rookery/tiers.ts)

Three tiers, with `PRICING_STATUS = "proposed"` declaring the copy as
draft until Stripe is live:

| Slug   | Name   | Price       | Cadence    |
|--------|--------|-------------|------------|
| perch  | Perch  | £6 / month  | recurring  |
| nest   | Nest   | £12 / month | recurring  |
| fledge | Fledge | £75 once    | one-time   |

Each tier carries `name`, `price` (display string), `cadence`, `blurb`
(Dimona voice), `includes[]` (feature list), and optional `caveat`.

### Per-app gate intent — [lib/apps.ts](../lib/apps.ts)

`AppGateKind` is a union: `"open" | "rookery" | "purchase"`. Every
`AppEntry` in the apps catalogue declares its gate. The intent is
declared, but no runtime check enforces it — every app currently
renders for every visitor.

### Per-service pricing status — [lib/services.ts](../lib/services.ts)

Each service entry carries:
- `pricingStatus`: `"live" | "proposed" | "interest-list" | "calendar-gated"`
- `readiness`: `"live" | "scaffold" | "blueprint" | "concept"`

These flags are mirrored to `data-pricing` and `data-readiness` HTML
attributes on the rendered service cards so visitors and operators can
both tell at a glance which numbers are real.

### Rookery routes

- [app/rookery/about/page.tsx](../app/rookery/about/page.tsx) — community framing
- [app/rookery/tiers/page.tsx](../app/rookery/tiers/page.tsx) — tier display
- [app/api/rookery/onboarding/route.ts](../app/api/rookery/onboarding/route.ts) — email onboarding (no Stripe)

## What's NOT there yet

The `stripe` SDK is not imported anywhere in the repo (verified with
`grep '^import.*stripe' --include='*.ts*'` — zero matches as of
2026-05-17). To complete tier gating, the following five pieces are
still required:

### 1. Stripe SDK + types

```bash
pnpm add stripe @stripe/stripe-js
```

### 2. Checkout session route — `app/api/rookery/checkout/route.ts`

Takes a tier slug, creates a Stripe Checkout Session with the matching
Price ID, returns the session URL. The mapping `slug → price_id` lives
in env (`STRIPE_PRICE_PERCH`, `STRIPE_PRICE_NEST`, `STRIPE_PRICE_FLEDGE`)
so prices can be swapped without code changes.

### 3. Webhook handler — `app/api/rookery/webhook/route.ts`

Handles `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, and `checkout.session.completed` for
Fledge one-time purchases. Writes the subscription state to
`users/{uid}.subscription` in Firestore:

```ts
type SubscriptionRecord = {
  tier: "perch" | "nest" | "fledge" | null;
  status: "active" | "past_due" | "canceled" | "expired";
  currentPeriodEnd?: string; // ISO date
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
};
```

### 4. Client subscription hook — `lib/auth/use-subscription.ts`

Reads the current visitor's `users/{uid}.subscription` doc, exposes
`{ tier, status, isActive, canAccess(gate: AppGateKind) }`. Server
counterpart at `lib/auth/get-subscription.ts` for App Router server
components.

### 5. Gate-enforcing components

- `<RookeryGate tier="perch">{children}</RookeryGate>` — wraps protected
  surfaces, renders a subscribe-to-access overlay otherwise.
- Apps catalogue filter — `app/apps/page.tsx` should dim or annotate
  apps with `gate: "rookery"` for non-subscribers, link to
  `/rookery/tiers` with an `?intent=<app-id>` query.

## Env contract additions

Append to `.env.example` when wiring:

```sh
# --- Stripe (Rookery subscription gates) ----------------------------
# Create at https://dashboard.stripe.com/apikeys (use restricted test
# keys in dev, live keys in production)
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Price IDs from Stripe → Products → each tier → Pricing
STRIPE_PRICE_PERCH=""
STRIPE_PRICE_NEST=""
STRIPE_PRICE_FLEDGE=""

# Webhook signing secret from Stripe → Developers → Webhooks
# → endpoint → "Signing secret"
STRIPE_WEBHOOK_SECRET=""

# Optional billing portal return URL (defaults to /account)
NEXT_PUBLIC_BILLING_PORTAL_RETURN_URL=""
```

## Order of operations when wiring

1. Operator-side: create Stripe products + recurring + one-time prices
   for the three tiers, register a webhook pointing at production
   `/api/rookery/webhook`.
2. Land #1–#3 (SDK + checkout + webhook). The webhook write to
   Firestore is the load-bearing piece — everything else reads from
   that single source of truth.
3. Flip `PRICING_STATUS` in `lib/rookery/tiers.ts` from `"proposed"`
   to `"live"`.
4. Land #4–#5 (hook + gate component). Gradually opt protected
   surfaces in by wrapping them in `<RookeryGate>`.
5. Bookkeeping: extend `lib/services.ts` entries with `stripePriceId`
   for commerceable services and adopt the same checkout path.
