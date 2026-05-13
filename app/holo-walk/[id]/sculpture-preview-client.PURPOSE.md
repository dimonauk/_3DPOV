# `sculpture-preview-client.tsx` — purpose twin

## Role

Per-sculpture animated 3D preview for `/holo-walk/<id>`. A thin
shell around `<SculptureFigure>` that adds the desktop chrome —
`<Canvas>`, `<OrbitControls>`, and the engine-name pill in the
top-left corner.

This is the **desktop-spectator** preview — the standing-still
version. The AR variant at `/holo-walk/<id>/ar` lands in the next
wave and uses the magic-window stack (camera + GPS + heading
composition). Both surfaces share the underlying
`<SculptureFigure>` so the visual treatment never drifts between
them.

## Public surface

- Default export `SculpturePreviewClient({ location })`.

## Internal

- Renders `<SculptureFigure location={location} autoRotate />`
  inside a `<Canvas>` with a fov-45 camera pulled back to
  `(0, -0.2, 4.4)` so the model and the print-bar share the
  frame.
- Adds three lights — ambient + warm directional + cool fill —
  so the print-bar's PBR plates read on chrome-on-midnight.
  The sculpture itself reads via emissive Trail + Bloom and
  ignores these lights.
- Auto-rotation is owned by the figure itself (it spins the
  wrapping group); OrbitControls is left non-autoRotating so
  the user can grab and stop the spin if they want to inspect.
- The engine-name pill stays — same Tailwind treatment.
- Mounts `<PrintBar geometryId={…}>` at `scale=0.5` and
  `y=-1.6` below the model. Wires the `onOrderReceived`
  callback to a local `useState`; when an order returns, an
  HTML toast pops in the top-right with the mock order id.

## Depends on

- `@react-three/fiber` (Canvas).
- `@react-three/drei` (OrbitControls).
- `components/three/SculptureFigure` — does all the actual 3D
  rendering: Trail, Bloom, EffectComposer, cycle walker.
- `components/three/print-bar` — the in-scene commerce strip.
- `lib/holo-walk/locations` for the `SculptureLocation` type.

## Does not

- **Does not request camera or GPS permissions.** Preview only.
- **Does not capture or share.** Capture lives in the AR view.
- **Does not own the visual treatment.** `<SculptureFigure>`
  owns Trail colour, Bloom intensity, cycle timing, scale-fit.
- **Does not own the bar's geometry or pricing.** Those live
  in `components/three/print-bar.tsx` +
  `lib/print-vendors/`.

## Bordering files

- `app/holo-walk/[id]/page.tsx` — server-component shell that
  embeds this client.
- `components/three/SculptureFigure.tsx` — the shared 3D renderer
  this file delegates to.
- `lib/holo-walk/locations.ts` — the catalogue.
- Future `app/holo-walk/[id]/ar/page.tsx` — the AR variant with
  magic-window AR + capture + share; will mount the same
  `<SculptureFigure>` with `autoRotate={false}` and an ENU
  `position`.
- Future `components/three/print-bar.tsx` — shared commerce bar.
