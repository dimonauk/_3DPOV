# Chrono-Protocol Archive

Gallery / archive site for the Neo-London Chrono-Protocol. Museum-first
structure: world, then collections, then acquisition. Not a product grid.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- MDX via `next-mdx-remote` (file-based collections in `content/`)
- Stripe Checkout (stub — see `app/api/checkout/route.ts`)

## Layout

```
app/
  page.tsx                 landing — Welcome to the Protocol
  protocol/                the written protocol
  collections/             index + [slug] detail (MDX)
  shop/                    acquire index + [slug] + policy pages
  api/checkout/route.ts    Stripe stub
content/collections/*.mdx  one file per collection (frontmatter + prose)
components/                header, footer
lib/collections.ts         reads content/ at build time
```

## Adding a collection

Drop a new MDX file in `content/collections/` with the frontmatter used
in the existing files. `code` is the Protocol reference (CP-004 etc.);
`tint` is the CSS colour used for the plate gradient until a real image
replaces it. Restart `npm run dev` after adding files.

## Replacing the placeholder plates

The plate tiles are CSS gradients. When real rig output is available,
replace each `div` with an `<Image>`, and add `heroImage` / `plateImage`
fields to frontmatter. Do this per collection; don't centralise
prematurely.

## Running

```
npm install
npm run dev
```

## Ship deadline

Per the brief: four weeks from the day this was scaffolded, or hand it
over to Cargo / Shopify. Don't tinker.
