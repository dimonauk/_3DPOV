# `move-library.ts` — purpose twin

## Role

The typed catalogue of named moves the studio knows how to perform —
poi spins, hand gestures, body shapes, and transition phrases. Each
entry carries its dominant Laban Effort coordinates in [0..1], a
one-paragraph description, and (where applicable) a pointer back to
the Hangar source it was lifted from. The Laban capability reads
this table; agents look up moves by id; the future evolution engine
will breed across these entries because they share a common
contract.

## Public surface

- `moveLibrary: ReadonlyArray<MoveLibraryEntry>` — the catalogue.
- `getMove(id)` — id lookup.
- `movesByKind(kind)` — filter helper.
- `listMoveIds()` — enumerate ids in catalogue order.
- `MoveLibraryEntry`, `MoveKind`, `LabanCoords` — types.

## Internal

None. Pure data + three trivial helpers.

## Depends on

Nothing. Plain typed object — deliberately decoupled so it can be
loaded server-side or in any future tooling without dragging in the
zustand slices.

## Does not

- **Does not export pose data.** A move's Laban signature is here; the
  per-bone pose (if any) lives in `lib/capabilities/vrm/pose.ts` and
  `lib/capabilities/motion/gesture.ts`. `motion.laban.moveToPose`
  resolves an id to a pose by consulting those modules, not by
  inlining the data here.
- **Does not run any move.** Triggering a gesture is
  `motion.gesture`'s job; running a poi trajectory is the
  choreography engine's job (port in flight). This file is the
  *catalogue*, not the *player*.
- **Does not own the Laban math.** Conversion to/from the canonical
  [-1..+1] convention and nearest-corner classification live in
  `lib/capabilities/motion/laban.ts`. This file just declares the
  coordinates.
- **Does not mutate.** Catalogue is `ReadonlyArray`. New moves are
  appended at edit time, never injected at runtime.

## Depends on (none, but informed by)

- `lib/math/laban.ts` — the [-1..+1] effort math the [0..1]
  coordinates here ultimately bridge to.
- `lib/assets/flow-arts.ts` — the earlier kata-moves table; this
  library subsumes and supersedes that one for the motion.laban
  capability.

## Bordering files

- `lib/capabilities/motion/laban.ts` — the primary consumer. Reads
  this catalogue to resolve `analyseEffort`, `interpolateMoves`, and
  `moveToPose`.
- `lib/capabilities/motion/gesture.ts` — owns the actual hand-peak
  poses; the `hand`-kind entries in this catalogue reference the
  same names so the move-library and the gesture player stay in
  lockstep.
- `lib/capabilities/vrm/pose.ts` — owns the named body-poses;
  `body`-kind entries map to keys there.

## Provenance ledger

| Slug | Coordinates | Source |
| --- | --- | --- |
| `cross` | (1, 0, 1, 1) | LIFTED — MOVE.md "Laban Quality Mapping" table |
| `weave-three` | (0.3, 0.3, 0.7, 0.7) | LIFTED — kataMoves PRESS tag (flow-arts.ts) |
| `windmill-forward` | (0.85, 0.3, 0.75, 0.75) | LIFTED — kataMoves PRESS tag |
| `butterfly` | (0.3, 0.3, 0.4, 0.3) | GUESSED — sustained two-loop figure-8 reading |
| `fountain` | (0.4, 0.3, 0.3, 0.3) | GUESSED — FLOAT/GLIDE neighbourhood |
| `antispin-four` | (0.7, 0.3, 0.5, 0.65) | GUESSED — Press-leaning articulate spin |
| `pendulum` | (0.7, 0.3, 0.3, 0.3) | GUESSED — Glide-leaning rest move |
| `isolation` | (0.85, 0.3, 0.4, 0.7) | GUESSED — Press-leaning bound focus |
| `hyperloop` | (0.3, 0.7, 0.7, 0.3) | GUESSED — Slash neighbourhood |
| `lissajous` | (0.25, 0.25, 0.3, 0.3) | GUESSED — Float neighbourhood |
| `wave` / `nod` / `point` | mapped from `GESTURES` peaks | GUESSED |
| `held-presence` | (0.8, 0.2, 0.7, 0.85) | GUESSED — Aura default character read |
| `butterfly-to-cross` | (0.65, 0.15, 0.7, 0.85) | GUESSED — Press-ward tilt phrase |

Guessed entries are calibration targets, not load-bearing canon.
Tunable without changing callers.
