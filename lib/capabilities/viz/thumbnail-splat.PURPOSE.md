# `viz.thumbnail-splat` — Render a server-side thumbnail of a Gaussian Splat

A surface-agnostic capability for producing a 2D preview of a `.ply` /
`.spz` / `.ksplat` splat record. A splat itself needs WebGL to render,
which doesn't exist in Node — so the studio runs two parallel paths,
picks the right one per call, and lands the output in the same
`ThumbnailSplatResult` shape.

## Role

The media library, the HoloWalk index, link previews (OpenGraph /
Twitter cards), and the print-bar product cards all want a still
preview of a splat. Each one has a different latency budget and a
different appetite for canonical quality. The capability is the seam
where the call-site picks a provider — `card-fast` for instant
placeholders, `splat-real` for canonical thumbnails — and the surface
code reads from the same record either way.

## Providers

| Provider | Engine | Runtime | Speed | Use |
| --- | --- | --- | --- | --- |
| **card-fast** | `@napi-rs/canvas` (Skia, server-side 2D) | Node — works on Vercel | sub-second | Placeholder cards, link previews, media-library shelves |
| **splat-real** | Headless Chromium screenshot of a WebGL viewer | HoloFlow Desktop only (`localhost:8390`) | seconds | Canonical product-page hero, social shares once the desktop helper is up |

## When to use each

- **Always-card-fast surfaces.** The media-library admin grid, the
  capabilities-index thumbnails, anything called from a Vercel route
  handler. Always succeeds; no infrastructure dependency.
- **Prefer splat-real, fall back to card-fast.** The HoloWalk
  sculpture page hero, OpenGraph / Twitter cards for a sculpture URL,
  the print-bar product card hero. Surface code calls splat-real, and
  on `provider-unavailable` falls back to `card-fast` so a card always
  exists.
- **Pre-bake at generation time.** When `viz.splat-generate-360`
  finishes, the bench should call this capability with `splat-real`
  while the asset is still local — the canonical thumbnail then lives
  in the media library alongside the splat, and surfaces don't need to
  rerun the headless browser per request.

## What the card draws

The card composition is intentionally editorial — chrome-on-midnight,
the studio's signature thin pink accent stripe, the sculpture name in
a heavy sans, a smaller subtitle (city / date / engine), and the
gaussian count in monospace at the bottom-right. The font stacks are
`sans-serif` / `monospace`, so an application that registers a brand
font at boot via `GlobalFonts.registerFromPath` automatically takes
over without changes here.

## Foundation-phase status

- `thumbnail-splat.ts` — type surface + client stub. Done.
- `thumbnail-splat.server.ts` — `card-fast` provider live, `splat-real`
  provider documents the expected `/api/thumbnails/splat` request /
  response shape and throws `provider-unavailable` until the desktop
  helper ships.
- The HoloFlow Desktop endpoint at `localhost:8390/api/thumbnails/splat`
  is the next wire — a headless Chromium worker that loads the splat
  via `<spark-viewer>` and screenshots the canvas.

## Composes with

- `viz.splat-generate` and `viz.splat-generate-360` produce the splat
  records this capability draws.
- `viz.splat-render` is the *interactive* counterpart — same record,
  different output (a live three.js viewer vs a still PNG).
- `media.library` is where the rendered PNG lands;
  `sourceRef.thumbnailSplat` points the record back at the splat it
  previews.
- `viz.splat-ar-deploy` consumes the thumbnail URL when assembling the
  signage bundle (the QR plaque can carry the card as a preview crop).
