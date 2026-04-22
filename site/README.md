# Chrono-Protocol Archive

Gallery / archive site for the Neo-London Chrono-Protocol. Museum-first
structure: world, then collections, then acquisition. Not a product grid.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- MDX via `next-mdx-remote` (file-based collections in `content/`)
- Three.js / React Three Fiber / drei for GLB product viewers
- Stripe Checkout (real; stubs out when `STRIPE_SECRET_KEY` is absent)
- Vercel Analytics + Speed Insights

## Layout

```
app/
  page.tsx                 landing — Welcome to the Protocol
  protocol/                the written protocol
  collections/             index + [slug] detail (MDX)
  shop/                    acquire index + [slug] + [slug]/thanks + policy pages
  api/checkout/route.ts    Stripe Checkout Session (stubs when key missing)
  robots.ts, sitemap.ts    SEO file conventions
  opengraph-image.tsx      build-time OG card
  icon.tsx                 favicon
  not-found.tsx, error.tsx, loading.tsx
content/collections/*.mdx  one file per collection (frontmatter + prose)
components/                header, footer, plate-placeholder, glb-viewer,
                           array-configurator, work-spec, work-preview
lib/collections.ts         reads content/ at build time (React.cache)
lib/works.ts               Work discriminated union (plate|waveguide|sculpture|array)
lib/stripe.ts              lazy Stripe client
lib/constants.ts, pricing.ts, site.ts
public/works/              drop GLB files here (paths referenced from MDX frontmatter)
```

## Deploy to Vercel

1. Push this branch to GitHub (already on `site-standalone` in the
   primary repo, or commit it anywhere).
2. Import the repo at <https://vercel.com/new>.
   - **Framework**: Next.js (auto-detected)
   - **Root directory**: project root (on `site-standalone`) or `site/`
     if deploying from the museum-gallery branch.
3. Set environment variables (see `.env.example`):
   - `NEXT_PUBLIC_SITE_URL` — your production URL (e.g.
     `https://chrono-protocol.com`)
   - `STRIPE_SECRET_KEY` — `sk_live_…` or `sk_test_…`. If omitted, the
     checkout route stubs.
   - `STRIPE_WEBHOOK_SECRET` — for the order-confirmation webhook
     (handler not yet implemented).
4. Deploy. Vercel builds, generates all 26 static pages, and spins up
   the `/api/checkout` serverless function.
5. In the Vercel dashboard enable **Analytics** and **Speed Insights**
   (the `<Analytics />` and `<SpeedInsights />` components are already
   mounted; enabling the products in the dashboard turns on the data
   pipeline).

### Custom domain

Add the domain in Vercel → Project → Domains, then set
`NEXT_PUBLIC_SITE_URL` to match. The sitemap, robots.txt, and OG tags
pick it up automatically.

## Adding a collection

Drop a new MDX file in `content/collections/` with a frontmatter block
that matches one of the four `work.type` variants — see the existing
CP-001…CP-006 files for the shape. Restart `npm run dev` after adding
files.

## Adding GLB models

Drop the file in `public/works/` matching the path in the MDX
frontmatter (e.g. `work.glb: /works/004-lamp-of-the-watch.glb`). The
viewer picks it up on next load; before then it renders a tinted
primitive placeholder with a "Model pending" label.

## Replacing the placeholder plate tiles

The plate tiles are CSS gradients (`<PlatePlaceholder>`). When real
scans are ready, swap that component for `<Image>` — the viewer API
is already decoupled in `components/work-preview.tsx`.

## Running locally

```
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Without `STRIPE_SECRET_KEY` set, clicking
ACQUIRE redirects back to the product page with `?stub=1`. With it set
(use a `sk_test_…` key), you'll be forwarded to Stripe Checkout in test
mode.

## Build

```
npm run build
```

Produces a fully-static set of pages plus the `/api/checkout` function.
No `output: "export"` — `output: "export"` and server routes are
mutually exclusive, and the checkout route is a real server endpoint.
