# Holo-Flow Studio

Storefront for Holo-Flow — ambient-light waveguides, desktop sculptures,
and configurable wall-array art from twelve years of poi practice. Built
on [vercel/commerce](https://github.com/vercel/commerce) with Shopify as
the commerce backend.

Branch layout on `dimonauk/_3DPOV`:

- `holoflow-commerce` — this branch, vercel/commerce fork with Holo-Flow
  customization at the repo root
- `site-standalone` / `claude/museum-gallery-site-uRkun` — the bespoke
  Chrono-Protocol site (kept as copy/voice reference; not deployed)
- `master` — unrelated Arduino project that this repo originally held

## Stack

- Next.js 15 canary, React 19
- Tailwind CSS v4 (tokens in `app/globals.css` under `@theme`)
- Shopify Storefront API via `lib/shopify/*` (don't replace — extend via
  helpers like `lib/three-d.ts`)
- Cart + checkout: default vercel/commerce (Shopify-hosted checkout)
- 3D viewer: React Three Fiber, graceful fallback when GLB is missing
- Cormorant Garamond / Inter / JetBrains Mono via `next/font/google`

## Customization surface

Matches the original handoff brief's order of attack:

| Touchpoint | File |
|---|---|
| Palette | `app/globals.css` (`@theme` block — kawaii-cyberpunk tokens) |
| Fonts | `app/layout.tsx` (`next/font` loaders) |
| Navbar | `components/layout/navbar/index.tsx` |
| Logo | `components/icons/logo.tsx`, `components/logo-square.tsx` |
| Hero + statement | `app/page.tsx` |
| Product page + 3D | `app/product/[handle]/page.tsx` · `components/product/gallery-with-3d.tsx` · `components/product/glb-viewer.tsx` |
| 3D URL convention | `lib/three-d.ts` |

## Untouched (per brief)

- `components/cart/*` — cart state + modal
- `lib/shopify/*` — Storefront client, queries, mutations
- `app/api/revalidate/route.ts` — webhook revalidation handler
- Checkout flow (Shopify-hosted; out of frontend's reach on Basic)

## Local development

```sh
pnpm install
cp .env.example .env.local    # fill in Shopify token + domain
pnpm dev                      # http://localhost:3000
```

You must have at least `SHOPIFY_STORE_DOMAIN` and
`SHOPIFY_STOREFRONT_ACCESS_TOKEN` set before anything renders.

## Deploy to Vercel

See [docs/vercel-setup.md](./docs/vercel-setup.md) for the full
walkthrough. Quick version:

1. Import the repo in Vercel, pick this branch.
2. Set env vars (`.env.example` is the full contract).
3. Deploy.
4. Point Shopify webhooks at
   `<deploy-url>/api/revalidate?secret=<SHOPIFY_REVALIDATION_SECRET>`.

## Shopify setup

See [docs/shopify-setup.md](./docs/shopify-setup.md). Summary: install
the Headless app, create a storefront, grab the token, wire
`Main menu` → `next-js-frontend-header-menu`, create the six webhooks,
seed a product.

## 3D models

Products with the `3d` tag on Shopify get a **Photographs / 3D view**
tab strip on the product page. The GLB file resolves to
`/models/{product-handle}.glb`. Drop files in `public/models/` for dev,
or point `NEXT_PUBLIC_MODEL_BASE_URL` at a CDN (Vercel Blob, Cloudflare
R2, etc.) for production.

Until a file is present, the viewer renders a tinted primitive with a
"Model pending" caption so the tab still feels intentional rather
than broken.

## Staging vs production

- **Staging**: Shopify Partners dev store `holoflow-dev.myshopify.com`,
  pointed at a Vercel preview branch. All experiments happen here first.
- **Production**: `holoflow.myshopify.com`, pointed at `holoflow.co.uk`.

Env vars are scoped per-environment in Vercel's dashboard so dev-store
data never reaches production and vice versa.
