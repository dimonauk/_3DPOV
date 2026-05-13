# `apps.ts` — purpose twin

## Role

The static launcher manifest. `/apps` is the studio's *catalogue
of callable surfaces* — every demo, visualiser, tool, game, and
(future) iframe-wrapped external app that the user can launch as
a discrete experience. Grouped by tag (Aura, World, Visualiser,
Studio, Play); annotated with ChronoMode register where it
applies; gated as `open` / `rookery` / `purchase` so the Stripe
wave can land tiers without touching this catalogue.

## Public surface

- `apps: AppEntry[]` — the catalogue.
- `listApps()` / `getApp(id)` / `appsByTag(tag)` / `appTags()`.
- Types: `AppEntry`, `AppKind`, `AppGateKind`.

## Internal

Pure typed data.

## Depends on

Nothing. Plain TypeScript module.

## Does not

- **Does not invoke apps.** This is a manifest. Clicking the
  card in `/apps` navigates to `href`.
- **Does not enforce gates.** v0.1 every entry is `open`. The
  Rookery + Stripe wave will introduce a check at the router /
  middleware layer; the data here annotates intent but doesn't
  block.
- **Does not iframe external apps.** When `external: true` lands
  on an entry, the future `app/apps/[id]/launch/page.tsx` will
  wrap it in an iframe shell. Not built yet.
- **Does not handle Capacitor / native packaging.** The data
  shape is Capacitor-ready (each entry has a stable id +
  href), but the native wrappers ship in a future wave.

## Bordering files

- `app/apps/page.tsx` — the catalogue route.
- `public/manifest.webmanifest` — PWA manifest the apps surface
  pairs with. The shell route registers as a PWA, the catalogue
  is its launcher.
- `lib/rookery/tiers.ts` — future gate checker for `rookery`
  entries.
- Future `app/apps/[id]/launch/page.tsx` — iframe wrapper for
  external apps with auth + Stripe gate.
