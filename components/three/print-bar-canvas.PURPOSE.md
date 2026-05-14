# `print-bar-canvas.tsx` — purpose twin

## Role

Reusable "drop a print-bar into any page" wrapper. Mounts
`<PrintBar>` inside its own R3F `<Canvas>` with sensible lights
and a fixed camera so a host page can add commerce intent with
a single component without composing into an existing 3D scene.

Two distinct uses now coexist:

- **In-scene** (e.g. `/holo-walk/[id]`) — `<PrintBar>` lives in
  the same `<Canvas>` as the model; commerce is part of the
  gallery world.
- **Strip below** (e.g. `/atelier/algorithms/[slug]`) —
  `<PrintBarCanvas>` rides as a fixed-height strip below the
  primary viewport; commerce is its own surface but still
  rendered in 3D, not 2D HTML chrome.

Both honour the contract: print-bar always lives in a `<Canvas>`,
never as pure HTML.

## Public surface

```tsx
<PrintBarCanvas
  geometryId="atelier-spiral"
  showOrderToast={true}   // optional, default true
/>
```

## Internal

- 180px-tall outer div; the canvas fills it.
- Camera at `(0, 0, 6.5)` with fov 38 frames the default-scale
  print-bar's plate row centred horizontally with the price
  readout above and lead-time line below.
- Three lights — ambient + warm directional + cool fill —
  match the lights the HoloWalk preview uses so the PBR plates
  read consistently across hosts.
- `lastOrderId` state captures the mock order id; if shown, the
  toast pops top-right with the receipt copy.

## Depends on

- `@react-three/fiber` `<Canvas>`.
- `components/three/print-bar` (the underlying 3D toolbar +
  Html fallback).

## Does not

- **Does not include the model.** The host page owns the
  primary 3D viewport. This component is the commerce strip
  only.
- **Does not auto-detect hover-vs-touch.** PrintBar internally
  switches between B (3D plates) and A (Html billboard) modes
  via `matchMedia('(hover: hover)')` — that logic isn't
  duplicated here.

## Bordering files

- `components/three/print-bar.tsx` — the wrapped component.
- `lib/capabilities/commerce/print-order.ts` — quoting + submit.
- `lib/print-vendors/` — catalogue.
- First host outside HoloWalk: `components/atelier/algorithm-preview.tsx`.
