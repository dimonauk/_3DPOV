# `commerce/print-order.ts` — purpose twin

## Role

The synchronous quote function the 3D print-bar component
re-runs on every dropdown change, plus the
`requestPrintQuote` seam where Stripe + the partner order API
will wire in once the Stripe wave lands. Vendor-agnostic by
design: it goes through the `lib/print-vendors` registry.

## Public surface

- `quotePrint(req)` → `PrintQuote` — pure, synchronous,
  re-runnable per keystroke. Looks up vendor, validates the
  material × finish whitelist, computes price from scale band
  multiplier × material base rate + finish surcharge.
- `requestPrintQuote(req)` → `Promise<{ status, orderId?, reason? }>`
  — v0.1 mock: validates the quote, returns a generated mock
  order id, and the calling page renders the "we'll be in touch
  within one bench-day" copy. The function body is the seam
  Stripe replaces.
- `defaultQuoteRequest(geometryId)` → `PrintQuoteRequest` — the
  bar uses this to initialise its state when it mounts.

## Internal

- Volume estimate is chunky: scale-band midpoint cubed × 0.18
  (a sculpture-not-solid-block density factor). The real number
  comes from live mesh volume once the geometry pipeline ships;
  this estimate is loud enough to make small-vs-large pieces
  feel meaningfully differently-priced.
- `cryptoRandomId` prefers `crypto.randomUUID` and falls back
  to `Math.random` for environments without it.

## Does not

- **Does not call any network.** Both functions are local; the
  `await Promise.resolve()` in `requestPrintQuote` is just a
  microtask handle for the future async swap.
- **Does not read geometry volume.** Estimate-only in v0.1.
- **Does not charge VAT, shipping, or partner cuts.** Gross
  piece price only. Stripe + the partner adapter add those at
  checkout.
- **Does not handle the pay-to-download branch.** That is the
  `DownloadDelivery` shape in `_base.ts`; a sibling function
  `quoteDownload` lands when the C2PA signing pipeline ships.

## Bordering files

- `lib/print-vendors/_base.ts` — shapes consumed.
- `lib/print-vendors/index.ts` — vendor registry.
- `components/three/print-bar.tsx` — the renderer that calls
  `quotePrint` and (on action button) `requestPrintQuote`.
- Future `lib/print-providers/stripe.ts` — drops in behind
  `requestPrintQuote` body in the Stripe wave.
