# `_base.ts` — purpose twin

## Role

The typed contract every print-vendor catalogue obeys + the
typed quote/download shapes the 3D print-bar reads from. The
substrate that lets `commerce.print-order` be vendor-agnostic
and the bar be data-driven: dropdowns enumerate over
`vendor.materials` / `vendor.scaleBands` / a finish whitelist,
and the live price reads off a `PrintQuote`.

## Public surface

- Slug unions: `PrintVendorId`, `PrintMaterialSlug`,
  `PrintFinishSlug`, `PrintScaleSlug`. Adding a new vendor or
  material is a one-line literal-union extension here + a new
  catalogue file in this folder; nothing else changes.
- Per-row shapes: `PrintMaterial`, `PrintScaleBand`,
  `PrintLeadTime`, `PrintVendor`.
- Quote shapes: `PrintQuoteRequest`, `PrintQuote`.
- `DownloadDelivery` for the pay-to-download branch (STL / 3MF
  / GLB / USDZ with optional C2PA signed-provenance flag).

## Does not

- **Does not implement quoting.** The quote function lives in
  `lib/capabilities/commerce/print-order.ts`. This file only
  types the request and the response.
- **Does not register vendors.** That's `index.ts`'s job.
- **Does not name a specific vendor in the type union.** Slugs
  are kebab-case enums; the name + blurb + contact details live
  inside each vendor's record.

## Bordering files

- `index.ts` — the vendor registry + helpers.
- `studio-manchester.ts` (first concrete entry) — one mock
  vendor with a material × finish × scale catalogue.
- `lib/capabilities/commerce/print-order.ts` — consumes
  `PrintQuoteRequest` / `PrintQuote`.
- `components/three/print-bar.tsx` — consumes vendor records
  for its dropdowns and quote results for its price readout.
