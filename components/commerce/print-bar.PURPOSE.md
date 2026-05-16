# `components/commerce/print-bar.tsx` — purpose twin

## Role

The YouTube-style commerce strip the studio mounts in the DOM
under every 3D viewport (or generated-geometry output blob).
The "every viewport is commercial intent" surface — drop-ship
3D-print farming today, pay-to-download once the C2PA signing
pipeline lands.

This is the **HTML/DOM** sibling of
`components/three/print-bar.tsx`. The 3D one renders inside an
R3F `<Canvas>` as extruded chrome plates with raycaster hover.
This one is a plain HTML strip — `<select>` dropdowns, a
"Add to print order" button, a price readout — and it lives
**below** the viewport (or below the export controls in a
generator chamber).

Use the 3D one when the host viewport has spare 3D real estate
under the model. Use this one when the host is a chamber whose
canvas owns the full frame and the bar slots in as a
post-generation commerce row (lithophane, image-to-3d,
text-to-3d, splat generators).

## Public surface

```ts
<PrintBar
  source={{
    kind: "stl",            // "stl" | "glb" | "ply"
    url: blobOrRemoteUrl,
    label: "Lithophane",    // optional, drives the geometryId
  }}
  geometryId="lithophane:dimona-2026-05-16"   // optional override
  onOrderReceived={(orderId) => { /* … */ }}
/>
```

- Re-defaults on `source.url` (or explicit `geometryId`) change.
- Calls `quotePrint` synchronously on every dropdown change.
- Calls `requestPrintQuote` on "Add to print order" click;
  fires `onOrderReceived(orderId)` when status is "received".
- Logger namespace: `commerce:print-bar`.

## Labelling (frozen — do not drift)

- Section header: **"Print this"** (sentence case, sans).
- Dropdown labels: **"Vendor"**, **"Scale"**, **"Finish"**,
  **"Material"**.
- Price readout: **"From £X · Y day(s) lead time"** (X = quote
  price; Y = printDays + shipDaysUK).
- Button: **"Add to print order"**.
- Loading: **"fetching quote…"** (lowercase, ellipsis-three-dots
  glyph).
- Body voice: HOLOFLOW — terse, lowercase, mechanical.
  Headings sentence case.

## Internal

- State is local: a `PrintQuoteRequest` initialised via
  `defaultQuoteRequest(geometryId)`, plus a small `OrderState`
  union (idle / submitting / received / unavailable).
- `geometryId` falls back to `${source.kind}:${source.label ?? source.url}`
  so two different uploads in the same chamber are different
  geometries for ordering purposes.
- The vendor dropdown is rendered disabled with only the
  default vendor (Manchester) — multi-vendor UI lands when
  partner contracts arrive.
- Material change resets `finish` to `raw` to avoid orphan
  selections (e.g. "polished" not allowed on PLA).
- Order submission uses React 19's `useTransition` so the
  "fetching quote…" pending state reads correctly even though
  `requestPrintQuote` resolves on a microtask.

## Does not

- **Does not call any network.** Both `quotePrint` and
  `requestPrintQuote` are local in v0.1. The Stripe wave swaps
  the body of `requestPrintQuote`; this file does not change.
- **Does not read live mesh volume.** The capability estimates
  from scale-band midpoint × 0.18; this component just renders
  what comes back.
- **Does not handle pay-to-download.** v0.1 ships
  print-to-order only. The download-format dropdown lands when
  C2PA signing is wired in.
- **Does not own its position in the host page.** The host
  decides where to slot it (typically just below the viewport
  or under the generator's export controls).

## Integration pattern

For a generator chamber (lithophane is the v0.1 example):

```tsx
{output.kind === "ready" ? (
  <PrintBar
    source={{
      kind: "stl",
      url: URL.createObjectURL(output.blob),
      label: output.filename,
    }}
  />
) : null}
```

For a static viewer chamber (sphere deep-dive, holo-walk
sculpture):

```tsx
<PrintBar
  source={{ kind: "glb", url: glbUrl, label: piece.title }}
  geometryId={piece.id}   // stable id from the catalogue
/>
```

Future chambers copy the pattern by:

1. Importing `PrintBar` from `components/commerce/print-bar`.
2. Picking the right `source.kind` for the geometry the
   chamber emits.
3. Passing a stable `geometryId` if the chamber has a
   catalogue id, otherwise leaving the synthesised default.

## Bordering files

- `lib/capabilities/commerce/print-order.ts` — quoting +
  submit seam.
- `lib/print-vendors/_base.ts` + `index.ts` +
  `studio-manchester.ts` — catalogue.
- `components/three/print-bar.tsx` — the 3D sibling for
  in-canvas hosts.
- `app/atelier/lithophane/lithophane-client.tsx` — first DOM
  host (renders the bar once the STL is generated).
- Future hosts: every generator chamber + every static viewer
  with a downloadable geometry (image-to-3d, text-to-3d, splat
  generators, sphere deep-dive, holo-walk piece pages).
