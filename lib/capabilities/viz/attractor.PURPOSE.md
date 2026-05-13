# `attractor.ts` — purpose twin (capability `viz.attractor`)

## Role

Pipeline Epsilon's body. Iterates one of four strange-attractor
engines (Clifford, Thomas, Lorenz, Dequan Li) to a Float32Array
trajectory the caller renders as points / lines / GLB. Maps
Aura's mood to engine selection: she *is* the attractor she's
feeling.

## Public surface

- `generateAttractor(engine, options?)` — pure trajectory
  generation. Returns `{ engine, positions, params, count }`.
- `engineFromMood(mood)` — canon mapping AuraMood → engine.
- `applyMoodToSlice()` — read aura.mood, write engine to viz
  slice.
- `regenerateFromSlice(options?)` — convenience: regenerate
  using the engine currently in the slice.
- `listEngines()` — `["clifford", "thomas", "lorenz", "dequan-li"]`.
- `defaultsForEngine(engine)` — clone of the engine's default
  params. Callers tune from here.
- Re-exports: `AttractorEngine`, `AttractorParams` (slice types).

## Internal

- `STEPS: Record<engine, Step>` — per-engine iteration function.
- `ENGINE_DEFAULTS` — canonical parameter sets per engine.
  Clifford `(a, b, c, d) = (-1.4, 1.6, 1.0, 0.7)`. Thomas
  `b = 0.208186`. Lorenz `(σ, ρ, β) = (10, 28, 8/3)`. Dequan Li
  `(a, c, d, ε, k, f) = (40, 11/6, 0.16, 0.65, 55, 20)`.
- `SEED_STATE` — initial `(x, y, z)` per engine.
- Each engine's step uses simple Euler integration with a
  per-engine `dt` (smaller for stiffer systems — Dequan Li runs
  at 0.001).

## Mood → engine canon

| Aura mood | Engine | Why |
| --- | --- | --- |
| neutral / focused | lorenz | Stable + iconic butterfly. Aura's default |
| playful | clifford | Planar, repetitive curves. Lighter |
| delighted / tender | thomas | Smooth, slow, symmetric. Soft |
| alert / agitated | dequan-li | Most chaotic. Restless |

## Depends on

- `lib/state/viz` — slice for `attractor` field + engine writes +
  `particleCount` read.
- `lib/state/aura` — `mood` read for `applyMoodToSlice` and
  `engineFromMood`.
- No external npm deps. Box 3 crib is *math reference*, not
  imported code — the iteration kernels are written to our shape.

## Does not

- **Does not render.** Returns raw positions; the component layer
  builds the BufferGeometry + decides Points vs Lines.
- **Does not run a continuous loop.** Pure functions. A future
  `components/three/AttractorField.tsx` will subscribe to the
  viz slice and call `regenerateFromSlice()` on engine change.
- **Does not GPU-iterate.** v0.1 is CPU. WebGPU TSL port lands
  in Wave D behind the same `generateAttractor()` surface.
- **Does not stream points.** Full array allocation per call.
  50k points × 3 floats × 4 bytes = 600 KB — fine for one VRM's
  worth.
- **Does not handle param-animation.** Param sweeps are caller
  responsibility (caller modulates `params`, calls again).

## Plug surface

- **State plugs (write):** `viz.attractor.engine` (via
  `applyMoodToSlice`).
- **State plugs (read):** `aura.mood`, `viz.attractor.engine` +
  `.particleCount`.
- **Type plugs:** input `(engine, options?)`; output
  `GenerateResult` (positions + params + count).
- **Dependency plugs:** none. Pure entry-point.

## Bordering files

- `lib/state/viz.ts` — slice (engine, params, particleCount).
- `lib/state/aura.ts` — mood source.
- Future `components/three/AttractorField.tsx` — renders the
  trajectory.
- Future `app/visualiser/attractor/page.tsx` — atelier viz
  surface.
- Future `lib/capabilities/viz/attractor-glb.ts` — exports
  trajectory to GLB for the "Aura's mood, printed" commission.

## Box 3 lift attribution

Math + parameter sets from:

- `merrypranxter/strange_attractors` (MIT) — Clifford, Lorenz,
  Thomas iteration shapes. We dropped their de Jong + Aizawa
  engines and added Dequan Li in their stead. Their GPGPU
  texture-ping-pong pattern is the v0.2 WebGPU TSL upgrade target.
- Canonical attractor literature for Dequan Li (2009 chaotic
  attractor paper).

Per `docs/MIGRATION_PRINCIPLES.md` border ritual: no vendored
files. The reference code is read, parameters borrowed, kernels
re-typed and re-shaped to our slice contract.
