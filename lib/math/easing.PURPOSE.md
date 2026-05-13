# `easing.ts` &mdash; purpose twin

## Role

Canonical catalogue of easing curves. The studio uses one easing
library everywhere &mdash; LED-wall morphing, Aura's face cross-fades,
the parents-of-sculptures blend, the Laban-effort smoothing &mdash; so
they all read off the same names and the same curves.

## Public surface

- `Easing` &mdash; `(t: number) => number` headless function type.
  Input `t` lives in `[0, 1]`; output is roughly the same range
  (elastic and back deliberately overshoot, by design).
- `EasingName` &mdash; literal-union of every canonical curve key.
  Derived from `keyof typeof easings` so the catalogue itself is the
  single source of truth.
- `easings` &mdash; the `Record<EasingName, Easing>` lookup table,
  with all 31 canonical curves (linear + the ten in/out/inOut
  families).
- `byName(name)` &mdash; type-safe lookup by `EasingName`.
- `getEasing(name)` &mdash; loose-string lookup that also resolves the
  Python aliases (`ease_in`, `ease_in_out`, `bounce`, `elastic`,
  `back`). Linear is the safe fallback.
- `easingRegistry` &mdash; the loose-string version of `easings` that
  underpins `getEasing`. Exported because legacy JSON sequences key
  off the Python names.
- The thirty-one named functions (linear, easeInQuad &hellip;
  easeInOutBounce) are exported individually for direct import.
- `mix(a, b, t)` and `smoothstep(edge0, edge1, x)` &mdash; the two
  utility blends every morphing call site needs alongside an easing.
- `bounce(t)` &mdash; the half-sine bump from the Hangar's Python
  source, preserved under its original name for sequence
  compatibility.

## Internal

- `BACK_S`, `BACK_S2`, `ELASTIC_C4`, `ELASTIC_C5`, `BOUNCE_N1`,
  `BOUNCE_D1` &mdash; the Penner / CSS-spec magic numbers, hoisted to
  module scope so they aren't re-allocated per call.
- `easeOutBounce` is the primitive; `easeInBounce` and
  `easeInOutBounce` derive from it via the standard reflect / mirror
  trick.
- `EasingFunction` is re-exported as an alias of `Easing` so legacy
  imports keep compiling.

## Depends on

- Nothing. Pure maths.

## Does not

- **Does not import Three.js or React.** Easings are scalar
  functions; the visualiser and capability layers consume them.
- **Does not interpolate vectors, quaternions, or colours.** That
  belongs in the callers (`morphing-math.ts`, the laban smoother,
  the VRM expression blender). Easing is one-dimensional.
- **Does not own animation state.** Time, duration, current value,
  loop mode &mdash; all of those sit in `morphing-math.ts` or in a
  zustand slice.
- **Does not pre-compute a cache.** The Python source pre-baked 1000
  samples per curve for performance; in the browser the JIT'd Math
  calls are faster than a Map lookup, so the cache is dropped.

## Bordering files

- `lib/visualiser/morphing-math.ts` &mdash; the main consumer; turns
  an `EasingName` plus a `MorphingConfig` into a sampled scalar.
- `lib/state/viz.ts` &mdash; visualiser slice where easing names live
  alongside other animation parameters.
- Hangar source:
  `D:\The_Hangar\python-services\morphing_engine.py`
  (the EasingLibrary class).
