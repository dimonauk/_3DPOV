# `light-sculpture.ts` — purpose twin (capability `viz.light-sculpture`)

## Role

Turn a `SculptureLocation` into an animated long-exposure light
trail. The AR equivalent of the original photograph: a head cursor
walks the attractor's full trajectory, brightness persists for a
window behind the head, then fades to nothing — the same gesture
the rig made on the night of capture, replayed in situ.

## Public surface

- `renderSculptureFrame(location, elapsedMs, options?)` — pure
  function returning a `RenderFrame` with the visible slice of the
  trajectory plus per-point opacity. Caller turns this into
  geometry (BufferGeometry, point cloud, line strip).
- `sculptureBoundingSphere(location, options?)` — centre + radius
  of the full trajectory in the attractor's own coordinate space,
  scaled by `location.sculpture.scale`. Used by the AR placement
  layer to know how much room the sculpture takes up.
- Type exports: `RenderFrame`, `LightSculptureOptions`.

## Internal

- `trajectoryFor(location, options)` — composes
  `generateAttractor(engine, { count })` from
  `lib/capabilities/viz/attractor`. The capability never
  re-implements iteration maths.
- `pointCountFor(location, override?)` — fallback chain:
  options.count → location.sculpture.particleCount → module
  default 50_000.
- `DEFAULT_PERSISTENCE_MS = 2_000` — two seconds of fully bright
  trail behind the head before fade begins.
- `DEFAULT_WALK_DURATION_MS = 8_000` — eight seconds for the head
  to cross the full trajectory.
- `DEFAULT_COUNT = 50_000` — matches the Aura canon particle
  budget when the location omits its own hint.

## Long-exposure persistence model

The head cursor sweeps `[0, count)` linearly over
`walkDurationMs`, clamped at the right edge once the walk is
complete. Each visible point has an opacity assigned by its
distance behind the head:

- `0 .. persistenceSpan` points behind head → opacity 1
- `persistenceSpan .. persistenceSpan + fadeSpan` → linear fade
  1 → 0
- beyond that → not in the returned arrays

`persistenceSpan` is `persistenceMs / msPerPoint`;
`fadeSpan = persistenceSpan` (symmetric fade tail). Total visible
window = `2 × persistenceSpan` indices. The output arrays cover
only the visible slice — no zero-opacity ballast.

## Depends on

- `lib/capabilities/viz/attractor` — composed for trajectory
  generation. Never modified by this file.
- `lib/state/viz` — type-only import of `AttractorEngine`.
- `lib/state/vrm` — type-only import of `Vec3`.
- `lib/sculpt-walk/locations` — type-only import of
  `SculptureLocation`.

## Does not

- **Does not render.** Pure math; returns plain Float32Arrays. A
  future R3F component will turn the `RenderFrame` into a line or
  point cloud.
- **Does not write to any slice.** No side effects, no rAF loop.
  The driver of `elapsedMs` lives in the component layer.
- **Does not own GPU buffers.** Each call allocates two output
  Float32Arrays sized to the visible window. A caller doing
  per-frame work can pool externally.
- **Does not project to GPS.** The bounding sphere is in the
  attractor's own coordinate space. The AR placement capability
  (future `xr.geospatial`) handles the lat/lon/heading transform.
- **Does not re-iterate the attractor every frame.** v0.1 does
  call `generateAttractor` on every `renderSculptureFrame` call —
  caching belongs to the component layer (`useMemo`) so the
  capability itself stays pure.
- **Does not handle non-`attractor` sculpture kinds.** v0.1 only
  covers `kind: "attractor"` per the SculptureSpec union.
  Additional arms (mesh, volumetric) land as their own
  capabilities composed alongside this one.

## Plug surface

- **State plugs:** none. Headless and side-effect-free.
- **Type plugs in:** `SculptureLocation`, `elapsedMs: number`,
  `LightSculptureOptions`.
- **Type plugs out:** `RenderFrame` (`positions`, `opacities`,
  `engine`); `{ center: Vec3; radius: number }`.
- **Dependency plugs:** `viz.attractor` (composed at runtime via
  direct module import).

## Bordering files

- `lib/capabilities/viz/attractor.ts` — the composed trajectory
  generator. This file never modifies it.
- `lib/sculpt-walk/locations.ts` — supplies the
  `SculptureLocation` input.
- `lib/state/viz.ts` — `AttractorEngine` type source.
- `lib/state/vrm.ts` — `Vec3` type source. (Kept there to avoid
  introducing a fresh `lib/state/geom.ts` slice for one tuple.)
- Future `components/three/LightSculpture.tsx` — the R3F consumer
  that drives `elapsedMs` from `useFrame` and renders the frame.
- Future `xr.geospatial` capability — the AR placement brick that
  composes this capability with a GPS anchor.
