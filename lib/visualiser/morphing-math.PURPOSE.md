# `morphing-math.ts` &mdash; purpose twin

## Role

The animation-config layer that sits between an easing curve and the
thing being animated. Owns the maths of: one morph over a duration,
a sequence of morphs played back-to-back, and the sample-at-time
query a renderer or exporter needs.

## Public surface

- `MorphingConfig` &mdash; one leg of a morph: `{ duration, easing,
  fromValue, toValue, loop? }`. Duration is in milliseconds; easing
  is an `EasingName`. The caller picks the substrate (LED brightness,
  stroke width, an SDF blend, a Laban factor) and runs one config
  per scalar channel.
- `MorphingLoop` &mdash; `"none" | "loop" | "ping-pong"`. `loop` may
  also be a `boolean` for ergonomic call sites; `true` resolves to
  `"loop"`, `false` to `"none"`.
- `defaultConfig()` &mdash; sane starting values for a UI seed: 2&nbsp;s
  duration, `easeInOutCubic`, 0&rarr;1, no loop.
- `sampleAt(config, tMs)` &mdash; sample the morph at `tMs` ms since
  start. Applies loop semantics to normalise time, runs the eased
  curve, blends `fromValue` and `toValue`.
- `sampleAtEased(config, eased)` &mdash; sample with the eased value
  supplied directly. Used by callers that pre-compute the curve in a
  batch (frame exporters, LED tables).
- `normalisedTime(config, tMs)` &mdash; the [0, 1] time after loop
  logic. Exposed so visualisers can show the raw phase alongside the
  output value.
- `MorphingSequence` &mdash; `ReadonlyArray<MorphingConfig>`. Sequence
  duration is the sum of the legs.
- `sequenceDuration(seq)`, `legAt(seq, tMs)`, `sampleSequence(seq,
  tMs)` &mdash; the three queries a renderer needs to scrub a
  sequence on a timeline.
- `sampleFrames(target, frameCount)` &mdash; generates a frame table
  by evenly spacing `frameCount` samples across the duration. Works
  on a single `MorphingConfig` or a whole `MorphingSequence`.
- `cosineLerp(a, b, t)` &mdash; half-cosine blend (equivalent shape
  to `easeInOutSine`), preserved under the name the Hangar's
  choreography engine uses.
- `mixCurves(a, b, w)` &mdash; weighted pointwise blend of two easing
  curves into a new `Easing`. Lets callers crossfade between named
  curves without inventing new names.
- `curve(name)` &mdash; convenience re-export of `byName(name)` for
  callers that only ever import from this module.

## Internal

- `normaliseLoop(loop)` &mdash; folds the boolean / undefined / mode
  union into a `MorphingLoop`.
- Loop maths: `"loop"` uses modulo wrap; `"ping-pong"` uses a
  `2 * duration` cycle and mirrors the second half.
- Past-the-end behaviour for a sequence pins to the last leg's final
  value rather than wrapping &mdash; sequence-level looping is
  deliberately not supported; loop semantics belong on the
  individual leg.

## Depends on

- `lib/math/easing.ts` &mdash; `byName`, `mix`, and the `Easing` /
  `EasingName` types.

## Does not

- **Does not render.** No Canvas, no SVG, no Three.js. The Python
  source bundled `render_frame_svg`, `export_animation`,
  `_generate_readme`; those belong in components or in the chrono
  pipeline, not in the maths.
- **Does not own a clock.** Time is supplied by the caller as `tMs`;
  this file never reads `performance.now()` or `Date.now()`.
- **Does not pre-cache.** Cheaper to call the curve than to hit a
  map.
- **Does not interpolate non-scalars.** Two-D points, vectors,
  colours, quaternions &mdash; the caller runs one config per
  channel.
- **Does not register a capability.** Easings are maths, not
  capabilities; the rendering / export layers above this module are
  where capabilities live.
- **Does not fold in the LED-wall-specific pattern morphing.** The
  Python `morph_patterns()` interpolated `CircuitPattern` objects
  with their node and trace lists; here we lift only the scalar
  morph, and the LED renderer composes it per-channel.

## Bordering files

- `lib/math/easing.ts` &mdash; the curve catalogue (read).
- `lib/state/viz.ts` &mdash; visualiser slice that owns the active
  `MorphingSequence` for the renderer.
- Future: `components/visualiser/led-wall/*` &mdash; the renderer
  that consumes `sampleFrames()` for SVG / LED export.
- Hangar source:
  `D:\The_Hangar\python-services\morphing_engine.py`
  (the MorphingEngine class &mdash; rendering/export layers
  deliberately not ported here).
