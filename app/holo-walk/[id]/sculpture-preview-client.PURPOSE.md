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
  inside a `<Canvas>` with a default fov-45 camera at `(0, 0, 3.4)`.
  Auto-rotation is owned by the figure itself (it spins the
  wrapping group); OrbitControls is left non-autoRotating so the
  user can grab and stop the spin if they want to inspect.
- The engine-name pill stays — same Tailwind treatment as before.

## Depends on

- `@react-three/fiber` (Canvas).
- `@react-three/drei` (OrbitControls).
- `components/three/SculptureFigure` — does all the actual 3D
  rendering: Trail, Bloom, EffectComposer, cycle walker.
- `lib/holo-walk/locations` for the `SculptureLocation` type.

## Does not

- **Does not request camera or GPS permissions.** Preview only.
- **Does not capture or share.** Capture lives in the AR view.
- **Does not own the visual treatment.** `<SculptureFigure>` owns
  Trail colour, Bloom intensity, cycle timing, scale-fit. Changing
  the look means changing that file, not this one.
- **Does not include the print bar yet.** The bar lands as a
  shared component across all 3D viewports in a later wave.

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
