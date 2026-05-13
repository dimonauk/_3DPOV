# `laban.ts` — purpose twin (capability `motion.laban`)

## Role

The kinematic extraction brick. Turns a window of pose samples into
Laban Effort coordinates + the closest named Basic Effort. Also
blends two named moves by their Laban signatures, and resolves a
move id to a PoseVector when one is on file (hand gestures, body
shapes). This is the math the Hangar's `choreography_engine.js`
implies but doesn't ship in pure form — the studio's atomised
version lives here.

## Public surface

- `analyseEffort(samples)` — pose-sample window → `AnalysisResult`.
- `interpolateMoves(from, to, t)` — blend two named moves' Laban
  coordinates at parameter t; returns `null` if either id is
  unknown.
- `moveToPose(moveId, ctx?)` — resolve a move id to a `PoseVector`
  via the appropriate body / hand pose library; returns `null` when
  the move has no static pose (poi trajectories, transitions).
- `movesByBasicEffort(name)` — catalogue helper; enumerates every
  move whose nearest Basic Effort matches.
- Types: `EffortVector`, `BasicEffort`, `AnalysisResult`,
  `PoseSample`, `MoveToPoseContext`.

## Internal

- `effortToSigned(e)` — bridge from the public [0..1] surface to the
  canonical [-1..+1] cube used by `lib/visualiser/laban-math.ts`.
- `clamp01`, `clampEffort` — keep blends inside the cube.
- `eulerMagnitude`, `poseDelta` — per-bone tween-distance helpers
  underneath `analyseEffort`.
- The kinematic heuristic constants (0.005 rad/ms for "time",
  0.4 rad for "weight") — calibration targets, intentionally
  visible in the function body so the next pass can replace them
  with jerk/curvature integrals without touching the public surface.

## Depends on

- `lib/cast/move-library` — reads the [0..1] move catalogue.
- `lib/visualiser/laban-math` — consumed read-only for the
  closest-Basic-Effort classifier. Not re-exported.
- `lib/capabilities/motion/gesture` — reads `GESTURES` for hand-pose
  resolution.
- `lib/capabilities/vrm/pose` — reads `POSES` for body-pose
  resolution.
- `lib/state/vrm` — type-only import of `PoseVector` and `Euler`.

## Does not

- **Does not write to any slice.** Pure functions only. Callers
  pipe `analyseEffort`'s output into the `aura` slice (current mood),
  the `input` slice (gesture events), or wherever else; this file
  never reaches a setter.
- **Does not own the [0..1] vs [-1..+1] convention.** The public
  surface here is [0..1] because that's what the move-library
  declares and what the task spec asks for. The canonical math
  module stays at [-1..+1]; conversion is internal to this file.
- **Does not animate a move.** Running `motion.gesture` is the
  player; running a poi trajectory is the (in-flight) choreography
  engine port. This file analyses and blends; it does not drive.
- **Does not modify `lib/math/laban.ts`.** Consumes the existing
  Laban helpers as-is, per the task boundary.

## Plug surface

- **State plugs:** none. Headless.
- **Type plugs:** input `ReadonlyArray<PoseSample>` /
  `(string, string, number)` / `(string, MoveToPoseContext?)`;
  outputs `AnalysisResult` / `EffortVector | null` /
  `PoseVector | null`.
- **Dependency plugs:** none mandatory. Callers may pre-load
  `motion.gesture` so `moveToPose` for `hand` ids is hot.

## Bordering files

- `lib/cast/move-library.ts` — the catalogue this capability reads.
  The two files are a pair: catalogue + extractor.
- `lib/math/laban.ts` — sibling math module; not consumed today but
  reachable for callers who prefer the [-1..+1] convention.
- `lib/visualiser/laban-math.ts` — the classifier this file delegates
  to. Kept as the single source for the Basic Effort vertices.
- `lib/capabilities/motion/gesture.ts` — provides `GESTURES` for
  hand-pose resolution.
- `lib/capabilities/vrm/pose.ts` — provides `POSES` for body-pose
  resolution.
- Future `lib/capabilities/motion/choreography.ts` — will consume
  this capability to pick the next move from a song's effort arc.
- Future evolution engine — will breed move-library entries by
  perturbing their Laban coordinates; this capability will score the
  results.

## How the Hangar canon lands here

THE_LIVING_STAGE §II names Effort as the *flirt dial* — Direct →
Indirect → Free → Bound as a four-beat seduction phrase. With the
catalogue + this extractor, the studio can:

1. Capture pose samples from a webcam / motion-capture stream.
2. Reduce to a four-axis Effort vector + the closest named corner.
3. Score the current beat against the intended dial position.
4. Blend the next move's coordinates into the current ones to
   stage a smooth transition rather than a cut.

That's the choreography engine, atomised — the choreographer's
intuition expressed as four numbers, ten named moves, and three
pure functions.
