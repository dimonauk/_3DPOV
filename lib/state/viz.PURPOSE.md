# `viz.ts` — purpose twin

## Role

The shared state-bus for the studio's running visualisations —
attractor engine + parameters (Pipeline Epsilon), particle field
registry, and the list of active visualisation IDs for
lifecycle / cleanup.

## Public surface

- `useVizStore` / `vizStore`.
- Types: `AttractorEngine`, `AttractorParams`, `ParticleField`,
  `VizState`, `VizActions`.

## Internal

- `initial` — defaults to Clifford engine with 65,536 particles
  (2^16) and an empty `values` pack.

## Depends on

- `zustand`. No other slice.

## Does not

- **Does not run the GPGPU.** That's the attractor / particles
  capabilities. The slice only holds parameters and metadata.
- **Does not validate parameter ranges.** Each attractor engine
  has its own legal parameter space; that's enforced in the
  capability, not here.
- **Does not own meshes.** Output meshes (e.g. GLB exports from a
  finished attractor run) are written to disk + Shopify; the slice
  only references in-flight visualisations.

## Bordering files

- `lib/capabilities/viz/attractor.ts` — reads engine + values,
  runs the GPGPU ping-pong, writes particle count.
- `lib/capabilities/viz/particles.ts` — registers / unregisters
  particle fields.
- `lib/state/aura.ts` — Aura's mood selects attractor engine
  +parameters (Pipeline Epsilon composition).
- `lib/state/vrm.ts` — bone positions seed particle field
  emission anchors.
- `app/visualiser/*` — the visualiser apps read parameters from
  this slice.
