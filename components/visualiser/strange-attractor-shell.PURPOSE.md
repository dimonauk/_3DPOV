# `strange-attractor-shell.tsx` — purpose twin

## Role

Client shell for the `/visualiser/strange-attractor` route. Mounts
an R3F Canvas with a Points cloud rendered from the trajectory
returned by `viz.attractor`. Mood buttons let the viewer swap
Aura's mood; the engine flips per the canon mapping; the cloud
regenerates.

## Public surface

- Default export `StrangeAttractorShell` — no props.

## Internal

- `AttractorPoints({ generation })` — inner component. Memoises
  a `BufferGeometry` keyed by current `engine` from the viz slice
  and the `generation` counter (so re-clicks of the same mood
  still regenerate if anyone needs it). Normalises the cloud to
  a unit-ish sphere so all four attractors render at similar
  scale.
- `POINT_COUNT = 32_000` — drops from the slice default of 65k to
  keep the in-browser preview snappy. Production "Aura's mood,
  printed" exports will use the full count.
- `useEffect` watches mood; calls `setAttractorEngine` + bumps
  `generation` on change.

## Depends on

- `@react-three/fiber` — Canvas, `<points>`, `<pointsMaterial>`.
- `@react-three/drei` — OrbitControls.
- `three` — `BufferGeometry`, `BufferAttribute`.
- `lib/capabilities/viz/attractor` — `generateAttractor`,
  `engineFromMood`.
- `lib/state/aura` — mood read/write.
- `lib/state/viz` — engine read/write.

## Does not

- **Does not own the iteration.** The capability is pure;
  this shell calls it and renders.
- **Does not auto-rotate the mood.** Mood changes only on click.
- **Does not modulate params.** v0.1 uses default engine params.
  Param sliders (a, b, c, d for Clifford etc.) are a v0.2
  enhancement.
- **Does not export GLB.** That's a future capability
  (`lib/capabilities/viz/attractor-glb.ts`) for the "Aura's mood,
  printed" commission line.

## Bordering files

- `app/visualiser/strange-attractor/page.tsx` — server-component
  shell that embeds this.
- `lib/capabilities/viz/attractor.ts` — generator.
- `lib/state/viz.ts` + `lib/state/aura.ts` — slices.
- `app/visualiser/page.tsx` — index that links here.
