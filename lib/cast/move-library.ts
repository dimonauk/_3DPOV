/**
 * lib/cast/move-library.ts — Typed catalogue of named moves / gestures
 * with Laban Effort coordinates.
 *
 * One-line role: the studio's working vocabulary of poi spins, hand
 * gestures, body shapes, and transition phrases — each tagged with its
 * dominant Laban Effort so motion.laban can blend and analyse them.
 * Full purpose in move-library.PURPOSE.md.
 *
 * # Source
 *
 * Migrated from the Hangar move corpus:
 *   - D:\The_Hangar\apps\prototypes\poi-sculptor\js\moves.js (the 21
 *     precomputed generators).
 *   - D:\The_Hangar\apps\prototypes\poi-sculptor\move_library\cross\MOVE.md
 *     (the only fully written-up move; ships the Laban table verbatim).
 *   - D:\The_Hangar\apps\prototypes\poi-sculptor\docs\THE_LIVING_STAGE.md
 *     (the Effort = Flirt-Dial framing the gesture kinds inherit from).
 *   - lib/capabilities/motion/gesture.ts (hand-gesture peaks reused for
 *     the "hand" kind here so the catalogue and the gesture player
 *     share names).
 *
 * Laban coordinates here are in [0..1] (the task's surface):
 *   space  : 0 = indirect / flexible, 1 = direct
 *   time   : 0 = sustained,          1 = sudden
 *   weight : 0 = light,              1 = strong
 *   flow   : 0 = free,               1 = bound
 *
 * The existing `lib/math/laban.ts` uses [-1..+1]; conversion lives in
 * `lib/capabilities/motion/laban.ts` (effortFromUnit / effortToUnit).
 */

export type MoveKind = "poi" | "hand" | "body" | "transition";

export type LabanCoords = {
  /** 0 = indirect/flexible, 1 = direct. */
  space: number;
  /** 0 = sustained, 1 = sudden. */
  time: number;
  /** 0 = light, 1 = strong. */
  weight: number;
  /** 0 = free, 1 = bound. */
  flow: number;
};

export type MoveLibraryEntry = {
  /** Slug; must be unique across the catalogue. */
  id: string;
  /** Display name. */
  name: string;
  kind: MoveKind;
  laban: LabanCoords;
  /** One-paragraph description. */
  description: string;
  /** Optional pointer back to the Hangar source. */
  sourcePath?: string;
};

/**
 * The canonical move library. At least 8-12 entries spanning all four
 * kinds. Add new moves by appending; keep slugs stable — the registry
 * and any future scoring layer index by `id`.
 *
 * Laban-coordinate provenance: Cross is LIFTED verbatim from MOVE.md's
 * "Laban Quality Mapping" table; weave-three is LIFTED from kataMoves'
 * PRESS tag; windmill-forward inherits PRESS from kataMoves. Every
 * other set of coordinates is a working estimate by the porter against
 * the Effort × Space × Time × Weight × Flow definitions in
 * THE_LIVING_STAGE.md §II. They are tunable without breaking callers.
 */
export const moveLibrary: ReadonlyArray<MoveLibraryEntry> = [
  // ---------- poi (from js/moves.js) ----------
  {
    id: "cross",
    name: "Cross",
    kind: "poi",
    laban: { space: 1.0, time: 0.0, weight: 1.0, flow: 1.0 },
    description:
      "Two poi in orthogonal planes (wall + wheel) at phase π/2 — the canonical safety offset that gives maximum 3D separation at every crossing. Top-down projection collapses two circles into a crisp plus-sign. Held planes; minimal anchor drift; full extension.",
    sourcePath:
      "apps/prototypes/poi-sculptor/move_library/cross/MOVE.md",
  },
  {
    id: "butterfly",
    name: "Butterfly",
    kind: "poi",
    laban: { space: 0.3, time: 0.3, weight: 0.4, flow: 0.3 },
    description:
      "Symmetric two-hand figure-8 in front of the body — the foundational beginner spin. The two poi mirror each other across the centre line in a smooth, sustained loop.",
    sourcePath: "apps/prototypes/poi-sculptor/js/moves.js#butterfly",
  },
  {
    id: "weave-three",
    name: "Three-beat weave",
    kind: "poi",
    laban: { space: 0.3, time: 0.3, weight: 0.7, flow: 0.7 },
    description:
      "Classical three-beat weave; the pattern that maps cleanly onto L-system fern geometry when frozen. Sustained tempo, weight bound across the body's centre line, controlled.",
    sourcePath: "apps/prototypes/poi-sculptor/js/moves.js#weave3",
  },
  {
    id: "fountain",
    name: "Fountain",
    kind: "poi",
    laban: { space: 0.4, time: 0.3, weight: 0.3, flow: 0.3 },
    description:
      "Both poi tracing vertical arcs that rise and fall together — a soft, breath-like cycle. Reads as offering rather than commanding; sits closest to FLOAT/GLIDE on the Effort cube.",
    sourcePath: "apps/prototypes/poi-sculptor/js/moves.js#fountain",
  },
  {
    id: "antispin-four",
    name: "Antispin four-petal",
    kind: "poi",
    laban: { space: 0.7, time: 0.3, weight: 0.5, flow: 0.65 },
    description:
      "Four-petal antispin flower — the poi rotate against the arm's spin to draw four lobes per revolution. Direct and articulate, but the bound flow keeps the petals geometrically precise.",
    sourcePath: "apps/prototypes/poi-sculptor/js/moves.js#antispin4",
  },
  {
    id: "windmill-forward",
    name: "Forward windmill",
    kind: "poi",
    laban: { space: 0.85, time: 0.3, weight: 0.75, flow: 0.75 },
    description:
      "Both poi tracing parallel forward circles at shoulder height — the simplest two-hand spiral. Direct, strong, sustained, bound; the Press corner of the Effort cube.",
    sourcePath: "apps/prototypes/poi-sculptor/js/moves.js#windmill",
  },
  {
    id: "pendulum",
    name: "Pendulum",
    kind: "poi",
    laban: { space: 0.7, time: 0.3, weight: 0.3, flow: 0.3 },
    description:
      "Gentle low arc swung back and forth across the body's centre — the breath at rest between phrases. Direct in line, light in weight, free in flow.",
    sourcePath: "apps/prototypes/poi-sculptor/js/moves.js#pendulum",
  },
  {
    id: "isolation",
    name: "Isolation",
    kind: "poi",
    laban: { space: 0.85, time: 0.3, weight: 0.4, flow: 0.7 },
    description:
      "Single-hand orbit holding a fixed point in space while the hand traces a counter-circle around it — the poi appears to hang motionless in the air. Direct attention, bound discipline, light contact.",
    sourcePath: "apps/prototypes/poi-sculptor/js/moves.js#isolation",
  },
  {
    id: "hyperloop",
    name: "Hyperloop",
    kind: "poi",
    laban: { space: 0.3, time: 0.7, weight: 0.7, flow: 0.3 },
    description:
      "Five-petal cardioid orbit at speed — the poi whip across the arms in a wide indirect arc. Sits near the Slash corner; indirect, sudden, strong, free.",
    sourcePath: "apps/prototypes/poi-sculptor/js/moves.js#hyperloop",
  },
  {
    id: "lissajous",
    name: "Lissajous 3:2",
    kind: "poi",
    laban: { space: 0.25, time: 0.25, weight: 0.3, flow: 0.3 },
    description:
      "Two poi at a 3:2 frequency ratio — the trail draws a slowly-precessing braided figure that never quite repeats. Indirect, sustained, light, free; the FLOAT corner expressed as motion.",
    sourcePath: "apps/prototypes/poi-sculptor/js/moves.js#lissajous",
  },

  // ---------- hand (from lib/capabilities/motion/gesture.ts) ----------
  {
    id: "wave",
    name: "Wave",
    kind: "hand",
    laban: { space: 0.85, time: 0.7, weight: 0.4, flow: 0.3 },
    description:
      "Right arm raised high, palm forward, head tilted yaw-right. DARLINGS! energy — held longer than is strictly polite. Direct in space (aimed at the visitor), sudden in arrival, light in weight, free in flow.",
    sourcePath: "lib/capabilities/motion/gesture.ts#GESTURES.wave",
  },
  {
    id: "nod",
    name: "Nod",
    kind: "hand",
    laban: { space: 0.85, time: 0.7, weight: 0.4, flow: 0.7 },
    description:
      "Small head pitch with a faint neck follow — the hostess acknowledging, not agreeing. Direct, sudden, light, bound (she does not surrender the room).",
    sourcePath: "lib/capabilities/motion/gesture.ts#GESTURES.nod",
  },
  {
    id: "point",
    name: "Point",
    kind: "hand",
    laban: { space: 1.0, time: 0.65, weight: 0.5, flow: 0.7 },
    description:
      "Right arm extended toward a target, index implied by the hand bone direction. Direct, sudden, bound — the brat directing.",
    sourcePath: "lib/capabilities/motion/gesture.ts#GESTURES.point",
  },

  // ---------- body (whole-rig shape from THE_LIVING_STAGE) ----------
  {
    id: "held-presence",
    name: "Held presence",
    kind: "body",
    laban: { space: 0.8, time: 0.2, weight: 0.7, flow: 0.85 },
    description:
      "The Aura default — weight on one hip, hand at hip, chin up, slight thoracic arch. Not standing but presenting. Direct, sustained, strong, bound; the hostess's home register.",
    sourcePath: "lib/capabilities/vrm/pose.ts#POSES.auraDefault",
  },

  // ---------- transition (from MOVE.md "Transitions In / Out") ----------
  {
    id: "butterfly-to-cross",
    name: "Butterfly → Cross",
    kind: "transition",
    laban: { space: 0.65, time: 0.15, weight: 0.7, flow: 0.85 },
    description:
      "Four-to-eight-beat tilt: reduce butterfly frequency to 1.0, then progressively rotate one poi's plane from diagonal toward pure wall, the other toward pure wheel. The wrists do the work; the anchor barely moves.",
    sourcePath:
      "apps/prototypes/poi-sculptor/move_library/cross/MOVE.md#Transitions",
  },
];

/** Lookup a move by id. Returns undefined if no such move exists. */
export function getMove(id: string): MoveLibraryEntry | undefined {
  return moveLibrary.find((m) => m.id === id);
}

/** Enumerate moves of a given kind. */
export function movesByKind(kind: MoveKind): MoveLibraryEntry[] {
  return moveLibrary.filter((m) => m.kind === kind);
}

/** Enumerate every move id, in catalogue order. */
export function listMoveIds(): string[] {
  return moveLibrary.map((m) => m.id);
}
