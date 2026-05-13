# `sculpture-preview-client.tsx` — purpose twin

## Role

Per-sculpture animated 3D preview for `/holo-walk/<id>`. Renders
the location's light-trajectory as an animated points cloud
using the `viz.light-sculpture` capability and `viz.attractor`
underneath. Loops continuously; auto-rotates via OrbitControls.

This is the **desktop-spectator** preview — the standing-still
version. The AR variant at `/holo-walk/<id>/ar` lands in the
next wave and uses the magic-window stack (camera + GPS +
heading composition).

## Public surface

- Default export `SculpturePreviewClient({ location })`.

## Internal

- `AnimatedSculpture` — `<points>` whose `BufferGeometry`
  position + opacity attributes are rewritten every frame from
  `renderSculptureFrame(location, elapsedMs)`.
- The geometry's bounding sphere drives a per-frame scale-to-fit
  so different attractors (Clifford ~2 units vs Lorenz ~30
  units) render at comparable visual size.
- `startRef` is `useRef(performance.now())` so elapsed-time
  survives re-renders without resetting the animation.

## Depends on

- `@react-three/fiber` (Canvas, useFrame).
- `@react-three/drei` (OrbitControls).
- `three` (BufferAttribute, BufferGeometry, Points).
- `lib/capabilities/viz/light-sculpture` for `renderSculptureFrame`.
- `lib/holo-walk/locations` for `SculptureLocation` type.

## Does not

- **Does not request camera or GPS permissions.** This is the
  preview, not the AR view. No browser permissions invoked.
- **Does not capture or share.** Capture lives in the AR view.
- **Does not include the print bar yet.** The bar lands as a
  shared component across all 3D viewports in a later wave.
- **Does not run the geo capability.** GPS is for the AR variant.

## Bordering files

- `app/holo-walk/[id]/page.tsx` — server-component shell that
  embeds this client.
- `lib/capabilities/viz/light-sculpture.ts` — the renderer.
- `lib/capabilities/viz/attractor.ts` — generates the underlying
  trajectory.
- `lib/holo-walk/locations.ts` — the catalogue.
- Future `app/holo-walk/[id]/ar/page.tsx` — the AR variant with
  magic-window AR + capture + share.
- Future `components/three/print-bar.tsx` — shared commerce bar.
