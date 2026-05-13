# `sculpture-figure-math.ts` — purpose twin

## Role

The pure-maths underlay for `components/three/SculptureFigure.tsx`.
Two jobs, both side-effect-free: turn an elapsed-millisecond reading
into a trajectory index that loops cleanly, and turn a flat
position buffer into a centre-of-mass + scale-fit so every
attractor renders at a comparable visual size.

Sits in `lib/visualiser/` next to the other render-side maths
modules (`laban-math`, `morphing-math`, `tir-math`) — the rule
being: anything a renderer reaches for that doesn't need React or
Three.js belongs here, not in the component file.

## Public surface

- `cycleIndex(elapsedMs, count, cycleMs)` — wrap-safe index into a
  trajectory of `count` points that loops every `cycleMs`. Returns
  `0` for empty or zero-duration inputs.
- `readPoint(positions, i)` — read `(x, y, z)` at index `i` from a
  flat `[x0,y0,z0, x1,y1,z1, ...]` Float32Array. Returns zeroes for
  out-of-range indices.
- `fitToRadius(positions, targetRadius?)` — return the uniform
  `scale`, `center`, and `radius` that map the trajectory's
  bounding sphere onto `targetRadius` scene units. Default target
  is `DEFAULT_TARGET_RADIUS = 1.4`.
- `FitResult` — `{ scale, center, radius }` triple returned by
  `fitToRadius`.
- `DEFAULT_TARGET_RADIUS = 1.4` — default visual radius the
  sculpture fits inside at `scale=1.0`.
- `DEFAULT_CYCLE_MS = 12_000` — default full-walk duration the
  component uses unless overridden.

## Internal

- `readPoint` is the only branchy helper — every read goes through
  it so `noUncheckedIndexedAccess` callers don't have to repeat the
  `typeof === "number"` coalesce themselves.

## Depends on

- Nothing. No React, no Three.js, no slice imports. Pure TypeScript
  plus `Float32Array` from the runtime.

## Does not

- **Does not generate trajectories.** That's `viz.attractor`'s job.
  This module operates on already-generated buffers.
- **Does not own state.** No refs, no slices, no `useFrame`. The
  component does the per-frame work and calls into these
  functions.
- **Does not handle units.** Caller decides what "1 unit" means in
  their scene (preview = R3F world units; AR = ENU metres). The
  module is dimensionless.

## Bordering files

- `components/three/SculptureFigure.tsx` — the only consumer.
- `lib/capabilities/viz/attractor.ts` — produces the trajectory
  the component then feeds in here.
- `lib/capabilities/viz/light-sculpture.ts` — the original
  long-exposure capability. Same maths idea, different output
  shape (per-frame slice rather than head-index lookup).

## Why split out

The component file would push past the 300-line bench limit if
this maths lived inline. Splitting keeps the renderer focused on
the scene graph (`<Trail>`, `<Bloom>`, `<EffectComposer>`,
`useFrame`) and keeps the maths cheap to unit-test should we ever
want to.
