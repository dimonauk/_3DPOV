# `profiles.ts` — purpose twin

## Role

The studio's canonical mapping from a personality vector to a
starting wardrobe profile. Given an OCEAN reading, the catalogue
returns a small set of palettes, silhouettes, and texture notes the
studio uses as a generative starting point — never a prescription.

The data is studio canon. The Hangar research-doc that informs the
shapes (`References_DO_NOT_EDIT_OR_CHANGE/OCEAN_CLOTHING_SYSTEM.md`)
is the *source*; this file is the *site version* — anonymised, typed,
deliberately reduced to eight entries that span the cube.

## Public surface

- `WardrobeProfile` — the entry shape.
- `OceanRangeSpec`, `OceanRange` — the OCEAN-region types.
- `listProfiles()` — the whole catalogue.
- `getProfile(id)` — single lookup.
- `profilesForOcean(ocean)` — top three closest profiles to a vector.

## Internal

- `PROFILES` — the catalogue array.
- `BY_ID` — slug map built once at module load.
- `distanceToRegion` — Manhattan distance to a constrained region,
  averaged across constrained axes. Axes the profile does not
  constrain contribute nothing; unconstrained profiles sort last.

## Depends on

- `lib/state/aura` for the `OceanVector` type. Type-only import; no
  runtime coupling. The slice is the live state; this file is static
  catalogue.

## Does not

- **Does not generate textures or meshes.** That is the ComfyUI /
  garment-generator side of the pipeline (future capability). This
  file produces the *prompt-input* — palette, silhouette, texture
  notes — that those generators read.
- **Does not run cloth simulation.** Stiffness, damping, turbulence
  belong to a future `viz.garment` capability; the trait→physics
  mapping in the Hangar source informs that capability but is not
  encoded here.
- **Does not assign a profile to a cast member.** Cast bibles in
  `lib/cast/*` hold `oceanBaseline` values; `profilesForOcean()` is
  the function that resolves a bible to a wardrobe at read time. No
  static `aura → vivid-maximalist` map exists, by design.
- **Does not predict behaviour.** The mapping is generative, not
  diagnostic. Given a trait vector, the catalogue proposes a
  starting wardrobe; the wearer adjusts.

## Bordering files

- `lib/state/aura.ts` — the `OceanVector` type and the live slice.
- `lib/cast/aura.ts` and siblings — character bibles whose
  `oceanBaseline` feeds `profilesForOcean()`.
- `components/articles/entries/ocean-as-wardrobe.tsx` — the public
  prose for the catalogue.
- Future: `lib/capabilities/garment/*` — the runtime that takes a
  profile and produces textures, meshes, and simulation parameters.

## Memory

- The Hangar source (`OCEAN_CLOTHING_SYSTEM.md`) is the research
  ancestor; named students from that doc are anonymised here to
  *shapes* (the high-openness-high-extraversion shape, the
  chief-of-staff shape, and so on). The source folder is marked
  `DO_NOT_EDIT_OR_CHANGE` — read-only, treated as canon by reference,
  not by reproduction.

## Notes on the catalogue size

Eight entries, not six and not fifty. Six leaves obvious cells of the
OCEAN cube uncovered; fifty turns the catalogue into a taxonomy the
operator has to navigate rather than work inside. Eight is the size
at which `profilesForOcean()` reliably returns sensible top-threes
across the OCEAN cube without the catalogue feeling crowded. The
breakdown:

- 4 entries anchored by *one extreme + one extreme* pairs (high/high
  or high/low) on the most informative axis pairs;
- 2 entries on a single-axis extreme with a soft second constraint;
- 2 hybrid centres where a mid band on one axis composes with an
  extreme on another.

If a ninth entry earns its place, it earns it by closing a hole
`profilesForOcean()` keeps missing — not by being a new aesthetic
the studio fancied. The catalogue is a commitment, not a wishlist.
