# Chrono-Protocol Archive

Gallery / archive site for the Neo-London Chrono-Protocol. Museum-first
structure: world, then collections, then acquisition. Not a product grid.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdimonauk%2F_3DPOV&project-name=chrono-protocol&env=NEXT_PUBLIC_SITE_URL,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,RESEND_API_KEY,ORDER_FROM_EMAIL,ORDER_NOTIFICATION_EMAIL&envDescription=See%20.env.example%20in%20the%20repo%20root&envLink=https%3A%2F%2Fgithub.com%2Fdimonauk%2F_3DPOV%2Fblob%2Fsite-standalone%2F.env.example)

Deploy button targets the `site-standalone` branch (where the site is the
repo root). For the `museum-gallery` branch, import manually and set the
root directory to `site/`.

## Stack

- Next.js 14 App Router, React 18, TypeScript strict
- Tailwind CSS
- MDX via `next-mdx-remote`; file-based catalog in `content/collections/`
- Zod-validated frontmatter (fails the build on bad MDX)
- Three.js / React Three Fiber / drei for GLB product viewers
- Stripe Checkout (real sessions; stubs when `STRIPE_SECRET_KEY` is missing)
- Resend for order-confirmation email
- Vercel Analytics + Speed Insights

## Routes

```
/                            landing — Welcome to the Protocol
/protocol                    the written document
/collections                 index of every kata/artefact
/collections/[slug]          field record + artefact page (MDX body)
/shop                        catalogue view
/shop/[slug]                 acquire page (type-aware: configurator for arrays)
/shop/[slug]/thanks          Stripe success_url target
/shop/certificate            COA policy
/shop/shipping               shipping & returns

/api/checkout                POST  → Stripe Checkout Session (or stub)
/api/stripe/webhook          POST  → signature-verify + send email
/api/health                  GET   → catalog + integration status

/robots.txt, /sitemap.xml, /opengraph-image, /icon
```

## Deploy to Vercel (one-click)

1. Click the **Deploy with Vercel** button above, or go to
   <https://vercel.com/new> and import `dimonauk/_3DPOV` from the
   `site-standalone` branch.
2. Vercel auto-detects Next.js. Accept defaults.
3. Fill in the environment variables:

   | Key | Required | Purpose |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | Prod only | Canonical URL used by OG tags, sitemap, Stripe redirects |
   | `STRIPE_SECRET_KEY` | For real checkout | `sk_live_…` or `sk_test_…`. Without it, checkout stubs |
   | `STRIPE_WEBHOOK_SECRET` | For email-on-paid | `whsec_…` from the Stripe webhook config |
   | `RESEND_API_KEY` | For email | `re_…` from resend.com |
   | `ORDER_FROM_EMAIL` | With Resend | Must be on a Resend-verified domain |
   | `ORDER_NOTIFICATION_EMAIL` | Optional | BCC for a shared studio inbox |

4. Deploy. First build generates 29+ pages.

### Custom domain

Vercel → Project → Domains → add your domain. Then update
`NEXT_PUBLIC_SITE_URL` to match; the sitemap, robots.txt, and OG cards
pick it up on the next build.

### Stripe webhook setup (post-deploy)

1. In the Stripe Dashboard go to **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR_DOMAIN/api/stripe/webhook`
3. Events to send: `checkout.session.completed`
4. Copy the signing secret (`whsec_…`) and set it as `STRIPE_WEBHOOK_SECRET`
   in Vercel. Redeploy.

### Analytics / Speed Insights

Already mounted in the root layout. Enable the two products in the Vercel
dashboard → Project → Analytics / Speed Insights to start collecting data.

## Local development

```
npm install
cp .env.example .env.local       # fill in keys you have
npm run dev                      # http://localhost:3000
```

Without any keys set, the site runs fully — the checkout button stubs
back to the product page so you can see the full UI flow. Drop in a
Stripe test key to exercise the real Checkout session.

## Build & verify

```
npm run build        # full production build
npm run lint         # next lint (CI gate)
npm run typecheck    # tsc --noEmit (CI gate)
```

## CI

`.github/workflows/ci.yml` runs `npm ci && lint && typecheck && build` on
every push and PR. Failing builds block merges.

## Sync the catalog into Stripe

When you're ready to have real Stripe Products/Prices (instead of inline
price_data in each Checkout Session), run:

```
STRIPE_SECRET_KEY=sk_test_... npm run sync-stripe
# or, dry-run first:
npm run sync-stripe -- --dry-run
```

This script reads `content/collections/*.mdx`, creates a Stripe Product
per collection (ID = `CP_cp-001`, etc.), and a Price per SKU/configuration
with a stable `lookup_key`. Safe to re-run — updates in place and
deactivates stale prices.

## Adding a collection

Drop a new MDX file in `content/collections/`. The frontmatter must
satisfy `lib/schemas.ts` — if it doesn't, the build fails with a
line-by-line reason. See the CP-001…CP-006 files for each shape:

- `work.type: plate` — paper + priceGBP
- `work.type: waveguide` — material + ledSpec + powerDraw + priceGBP + glb path
- `work.type: sculpture` — material + optional base + priceGBP + glb path
- `work.type: array` — material + panelDimensions + options[] + glb path

## Adding GLB models

Drop the file in `public/works/` at the path referenced from
frontmatter (e.g. `work.glb: /works/004-lamp-of-the-watch.glb`). The
GLB viewer HEAD-probes on mount: if present, it loads the model; if
not, it renders a tinted primitive stub with a "Model pending" label
so the page never looks broken.

## Replacing the placeholder plate tiles

The 2D plate visuals are `<PlatePlaceholder>` (CSS gradients). When
real scans are ready, replace the component's body with `<Image>` or
swap at the call-site in `components/work-preview.tsx`. The API around
it doesn't change.

## Project layout

```
app/
  page.tsx                   landing
  protocol/                  written protocol
  collections/               index + [slug]
  shop/                      index + [slug] + [slug]/thanks + policies
  api/
    checkout/                Stripe session creation
    stripe/webhook/          signature-verify + email-on-paid
    health/                  catalog + integration status
  robots.ts, sitemap.ts
  opengraph-image.tsx, icon.tsx
  not-found.tsx, error.tsx, loading.tsx
  layout.tsx                 root metadata + analytics
components/                  site chrome + work-spec/preview + configurator
content/collections/         MDX catalog (schema-validated)
lib/
  collections.ts             reads + validates + caches
  works.ts                   discriminated union
  schemas.ts                 zod frontmatter contract
  stripe.ts, email.ts        lazy integrations
  constants.ts, pricing.ts, site.ts
public/works/                drop GLB files here
scripts/sync-stripe.ts       catalog → Stripe Products/Prices
.github/workflows/ci.yml     lint + typecheck + build
```
