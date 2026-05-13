# `particles.ts` — purpose twin (capability `viz.particles`)

## Role

Owns the logical registration of running particle fields on the
`viz` slice. The Aura-Alive 50k-particles-with-bone-emitters
artefact, atomised: this is the brick that *declares* the fields
exist, with what counts, anchored to which VRM bones (or free, or
to explicit emitter points). The render of those fields is a
separate brick (a future `components/three/ParticleField.tsx`
that subscribes to the slice and emits geometry).

Composition wiring:

- `vrm.load` produces a `VRMHandleId`. `viz.particles` reads that
  id to anchor bone-emitters to a specific avatar.
- `aura` slice supplies the mood; future capabilities (or this
  one in v0.2) modulate `count` from mood — playful → more
  particles, focused → fewer.
- `components/three/ParticleField.tsx` (future) is the rendering
  consumer — it reads `viz.particleFields[id]`, decodes the
  `source` string, and resolves the bone world-position from the
  `vrm` slice's handle on each frame.

## Public surface

- `startParticleField(options)` — register a field. Options:
  `{ id, count, source }` where `source` is `"free"` |
  `{ boneAnchor: { vrmHandleId, boneName } }` |
  `{ emitted: ReadonlyArray<readonly [number, number, number]> }`.
  Returns the id.
- `stopParticleField(id)` — remove a field from the slice.
- `updateParticleCount(id, count)` — re-upsert with a new count.
- `listFields()` — snapshot of every registered field.
- `auraParticleFields(vrmHandleId)` — the canon convenience:
  register three bone-anchored fields (head + leftHand +
  rightHand) totalling 50,000 particles. Returns the ids.

## Internal

- `encodeSource(source)` — translates the structured source object
  into the string form stored on the slice. The slice's
  `ParticleField.source` is `string` (intentionally narrow) so
  this capability owns the wire format.

## Source string encoding

The slice's `source: string` is the wire format between this
capability and the future component-layer consumer:

| Structured source                                | Wire string                          |
| ------------------------------------------------ | ------------------------------------ |
| `"free"`                                         | `"free"`                             |
| `{ boneAnchor: { vrmHandleId, boneName } }`      | `"bone-anchored:<id>:<bone>"`        |
| `{ emitted: [...pts] }`                          | `"emitted:<N>pts"`                   |

The `emitted` form is intentionally count-only — the actual point
coordinates do not live on the slice. A consumer that needs the
points keeps them in its own scope (or in a future
`viz.particleEmitterPoints` field).

## Aura canon — 50k distribution

`auraParticleFields(vrmHandleId)` distributes Aura's 50,000-particle
cloud across the three canon emitters:

- `head` — 20,000 (focal point of attention, slightly larger share).
- `leftHand` — 15,000.
- `rightHand` — 15,000.

Equal hands so neither dominates when she gestures asymmetrically.
The head's slightly-larger share keeps the visual centre of mass
on her face, where the viewer's eyes go first.

Field ids are deterministic — `aura:<vrmHandleId>:head` and
`aura:<vrmHandleId>:leftHand` / `aura:<vrmHandleId>:rightHand` —
so a second call on the same handle re-upserts without
proliferating fields.

## Depends on

- `lib/state/viz` — writes to `particleFields` via
  `upsertParticleField` / `removeParticleField`. Reads
  `particleFields` for `updateParticleCount` and `listFields`.

## Does not

- **Does not render.** Rendering belongs to a future
  `components/three/ParticleField.tsx` that subscribes to the
  slice. This capability is headless and Three.js-free.
- **Does not own particle simulation shaders.** GPGPU / TSL /
  compute-pass logic is the component layer's concern.
- **Does not couple to a specific particle backend.** Whether the
  consumer is `THREE.Points`, a WebGPU compute pass, or a custom
  CPU sim is invisible here.
- **Does not handle GPU disposal.** When `stopParticleField` is
  called, the slice entry vanishes; the component layer is
  responsible for tearing down buffers in its own cleanup.
- **Does not resolve bone world-positions** (v0.1). The slice
  stores the bone identifier; the consumer reads the world
  matrix on each frame. A v0.2 may introduce a
  `particleAnchors: Record<string, Vec3>` slice field driven by
  this capability's rAF loop, but that lives on the slice's
  roadmap, not here.
- **Does not validate that the referenced bone exists on the VRM.**
  The consumer fails gracefully if the bone is missing — it's
  cheaper to let the renderer's bone lookup return `null` than
  to gate registration on a VRM probe.

## Plug surface

- **State plugs (write):** `viz.particleFields` (via
  `upsertParticleField` + `removeParticleField`).
- **State plugs (read):** `viz.particleFields` (for
  `updateParticleCount` + `listFields`).
- **Type plugs in:** `ParticleFieldOptions` — `id`, `count`,
  `source` discriminated union.
- **Type plugs out:** `string` (the id) from `startParticleField`
  / `auraParticleFields`. `ParticleField[]` from `listFields`.
- **Dependency plugs:** `vrm.load` for bone-anchored mode (the
  handle id must reference a loaded VRM). No hard runtime
  coupling — the consumer resolves bones lazily.

## Bordering files

- `lib/state/viz.ts` — the slice this writes to. Owns the
  `ParticleField` type + the upsert/remove actions.
- `lib/state/vrm.ts` — the slice the consumer reads to resolve
  bone world-positions for `bone-anchored:` sources.
- `lib/capabilities/vrm/load.ts` — produces the VRM handle whose
  id is referenced in `boneAnchor`.
- `components/three/ParticleField.tsx` *(future)* — the rendering
  consumer. Subscribes to `viz.particleFields`, decodes
  `source`, runs the per-frame bone-anchor resolution.
- *(future)* GPGPU / WebGPU TSL shader modules — when the
  render path moves off `THREE.Points` to a compute pass. Those
  files live under `lib/shaders/` and stay out of this
  capability's scope.
