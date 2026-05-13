# `enneper.ts` — purpose twin

## Role

Builds an Enneper minimal-surface patch as a tessellated grid mesh
and traces its border with a Catmull-Rom tube so the silhouette
stays crisp. Fills the `enneper` slot in the 30-algorithm catalogue.

## Public surface

- `EnneperParams` — alias of `CommonParams`. `complexity` selects
  patch resolution (28..52); `density` thickens the border tube.
- `defaultParams()` — `{ seed: 2929, complexity: 0.5, scale: 1.0, density: 0.4 }`.
- `generate(params)` — raw vertex/index arrays.
- `generateGeometry(params)` — merged `THREE.BufferGeometry`,
  normalised to the unit cube.

## Internal

- `buildPatch(res, range, s)` — emits the indexed grid from the
  classic Enneper parametric form `(u - u³/3 + uv², v - v³/3 + vu²,
  u² - v²)` over `u, v ∈ [-range, range]`. Z is half-scaled before
  `normalise()` so the saddle doesn't compress the in-plane lobes.
- `buildBorder(res, range, s, r)` — samples the four patch edges
  and sweeps them through a closed `TubeGeometry`.

## Depends on

- `three`.
- `./_base` for `seededRng`, `mergeAll`, `normalise`, `attrsOf`,
  `CommonParams`, `GeneratedMesh`.

## Does not

- **Does not implement the generalised n-order Enneper.** The Hangar
  source toggled an integer `n` for higher-order petals; the brief
  asks for the classical form (`n = 1`), so the order is fixed and
  the lobe count is always four.
- **Does not apply the Hangar's twist field.** The atelier preview
  reads more clearly without the helical warp; the seed still varies
  the patch range so different seeds produce visibly different lobes.
- **Does not thicken the surface into a shell.** The Hangar offset a
  back-face along the normals to give the patch wall thickness; the
  studio reads the single-sided surface fine with computed normals
  and `THREE.DoubleSide` materials at the call site.

## Bordering files

- `lib/algorithms/_base.ts` — shared helpers.
- `lib/algorithms/index.ts` — registry (user-controlled).
- `lib/assets/algorithms.ts` — catalogue entry id 29, slug `enneper`.
- Hangar source: `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\algorithms\algo_29_Enneper.ts`
  (spirit-ported — twist + generalised-order dropped).
