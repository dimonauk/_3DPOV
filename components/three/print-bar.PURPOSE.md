# `print-bar.tsx` — purpose twin

## Role

The shared 3D commerce strip the studio commits to ship under
every 3D viewport on the site. The "every 3D viewport sells
the thing it shows" surface. Renders **inside** the R3F
`<Canvas>` of its host — not below it — because the site's
contract is true-3D end to end.

Two render modes share the same surface:

- **B mode (default)** — extruded chrome plates with drei
  `<Text>` labels, hover opens a vertical option-stack above
  the plate, click commits the selection. Uses raycaster
  pointer events; spellpunk-Tron accent on the action plate.
- **A mode (fallback)** — drei `<Html transform>` billboard
  with native HTML form controls. Activated when
  `matchMedia('(hover: hover)')` reports `none` (touch-only
  devices: iPad Safari, iPhone, Android phones without a
  stylus that emulates hover).

The branch happens after mount via `useEffect`; SSR-default is
B mode so server-rendered markup stays consistent. R3F
`<Canvas>` already gates renders to the client, so the branch
is effectively client-only.

## Public surface

```ts
<PrintBar
  geometryId="holo-walk-st-johns-roebuck-lane"
  y={-1.4}          // optional, default places below origin
  z={0}             // optional, toward camera
  onOrderReceived={(orderId) => …}
/>
```

- Re-defaults on `geometryId` change.
- Calls `quotePrint` synchronously on every dropdown change.
- Calls `requestPrintQuote` on action-plate click; fires
  `onOrderReceived(orderId)` when status is "received".

## Internal

- State is local: a `PrintQuoteRequest` initialised via
  `defaultQuoteRequest(geometryId)`.
- Dropdowns enumerate over the **default vendor**
  (`defaultVendorFor("GB")`) — Manchester for now. Multi-vendor
  + per-region default lands when more vendors register.
- `openColumn` state tracks which plate's option-stack is open;
  hovering a different plate moves the open state.
- Finish-options are filtered to the active material's
  `material.finishes` whitelist; selecting a new material
  resets `finish` to `raw` to avoid orphan selections.
- Plate visuals: `<RoundedBox>` with
  `meshStandardMaterial metalness=0.85 roughness=0.25`.
  Action plate gets a cyan emissive on hover for the
  spellpunk-Tron read.
- Price colour: `accentGold` (`#ffd700`) when available, red
  when not.
- Lead-time line under the row: monospace, dim chrome,
  matter-of-fact wording — `prints in 5d · +2d UK · ships
  from Manchester`.

## Does not

- **Does not own the camera.** Position is local to the parent
  scene; the host decides where in space the bar lives.
- **Does not call a network.** Both `quotePrint` and
  `requestPrintQuote` are local in v0.1. The Stripe wave
  swaps the body of `requestPrintQuote` without touching this
  file.
- **Does not implement keyboard nav yet.** R3F raycaster has
  no native focus model; a future pass will add a top-level
  visible-focus ring and `Tab` traversal via DOM focus
  redirection through the A-mode HTML controls.
- **Does not handle the pay-to-download branch.** v0.1 ships
  the print-to-order action only. The download-format
  dropdown lands when C2PA signing is wired in.
- **Does not render a vendor strip.** With one registered
  vendor, the bar just uses the default. Multi-vendor UI lands
  when partner contracts arrive.

## Bordering files

- `lib/capabilities/commerce/print-order.ts` — quoting +
  submit seam.
- `lib/print-vendors/_base.ts` + `index.ts` +
  `studio-manchester.ts` — catalogue.
- `app/holo-walk/[id]/sculpture-preview-client.tsx` — first
  host (replaces the page-level "coming next wave" section).
- Future hosts: every `<Canvas>` on the site — atelier,
  visualisers, demos, sphere deep-dives.
