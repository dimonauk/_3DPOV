/**
 * lib/assets/flow-arts.ts — Typed flow-arts data: Laban Movement
 * Analysis canon + the kata move-library that maps onto it.
 *
 * Laban canon migrated from the choreography engine at
 * D:\The_Hangar\apps\prototypes\poi-sculptor\choreography_engine.js
 * (the EFFORT object, lines 8-73).
 *
 * The eight Basic Efforts sit at the corners of a cube whose axes are
 * Space (direct vs indirect), Weight (strong vs light), and Time
 * (sustained vs sudden). Flow (bound vs free) is the fourth axis —
 * tracked here as a number in 0..1 because it modulates rather than
 * defines the corner.
 *
 * Kata moves are the studio's working library of named gestures —
 * each one tagged with which Laban effort it lives in, so the
 * choreography engine can blend between them when staging a piece.
 */

export type LabanSpace = "direct" | "indirect";
export type LabanWeight = "strong" | "light";
export type LabanTime = "sustained" | "sudden";
export type LabanFlow = "bound" | "free";

export type LabanCorner = {
  /** All-caps name matching the choreography engine. */
  name:
    | "PRESS"
    | "GLIDE"
    | "PUNCH"
    | "SLASH"
    | "FLOAT"
    | "WRING"
    | "FLICK"
    | "DAB";
  /** Canonical hex colour from the choreography engine. */
  hexColor: string;
  /** Trail width in metres (default for a 25-mm cell sculpture). */
  trailWidth: number;
  space: LabanSpace;
  weight: LabanWeight;
  time: LabanTime;
  flow: LabanFlow;
  /** One-line description of the effort's character. */
  notes: string;
};

export const labanCorners: LabanCorner[] = [
  {
    name: "PRESS",
    hexColor: "#4060ff",
    trailWidth: 0.035,
    space: "direct",
    weight: "strong",
    time: "sustained",
    flow: "bound",
    notes:
      "Direct, strong, sustained, bound. The held push; the gesture that knows exactly where it is going and refuses to be rushed.",
  },
  {
    name: "GLIDE",
    hexColor: "#80ffcc",
    trailWidth: 0.018,
    space: "direct",
    weight: "light",
    time: "sustained",
    flow: "free",
    notes:
      "Direct, light, sustained, free. The skating line; long, unbroken, weightless, certain.",
  },
  {
    name: "PUNCH",
    hexColor: "#ff4020",
    trailWidth: 0.05,
    space: "direct",
    weight: "strong",
    time: "sudden",
    flow: "bound",
    notes:
      "Direct, strong, sudden, bound. The strike. The gesture that arrives at its destination instantaneously and stops there.",
  },
  {
    name: "SLASH",
    hexColor: "#ff8800",
    trailWidth: 0.045,
    space: "indirect",
    weight: "strong",
    time: "sudden",
    flow: "free",
    notes:
      "Indirect, strong, sudden, free. The sword cut; force that scatters across a curve rather than landing at a point.",
  },
  {
    name: "FLOAT",
    hexColor: "#ccbbff",
    trailWidth: 0.012,
    space: "indirect",
    weight: "light",
    time: "sustained",
    flow: "free",
    notes:
      "Indirect, light, sustained, free. The dust mote, the dream gesture. Almost no weight; almost no aim.",
  },
  {
    name: "WRING",
    hexColor: "#9944cc",
    trailWidth: 0.04,
    space: "indirect",
    weight: "strong",
    time: "sustained",
    flow: "bound",
    notes:
      "Indirect, strong, sustained, bound. The grappling pull; force applied over time across a winding path.",
  },
  {
    name: "FLICK",
    hexColor: "#ffff44",
    trailWidth: 0.014,
    space: "indirect",
    weight: "light",
    time: "sudden",
    flow: "free",
    notes:
      "Indirect, light, sudden, free. The spark. The shake-off gesture; the wrist-twitch that wasn't on the page.",
  },
  {
    name: "DAB",
    hexColor: "#ff88cc",
    trailWidth: 0.016,
    space: "direct",
    weight: "light",
    time: "sudden",
    flow: "bound",
    notes:
      "Direct, light, sudden, bound. The tap. The gesture that arrives, registers, and leaves before the trail can thicken.",
  },
];

export type KataMove = {
  slug: string;
  name: string;
  /** Approximate duration of the move at flow-arts tempo. */
  durationMs: number;
  /** Which Laban corner the move primarily lives in. */
  labanEffort: LabanCorner["name"];
  /** Optional path to a trajectory JSON in /public/assets/flow-arts/. */
  trajectoryUrl?: string;
  /** One-sentence description of the move. */
  notes: string;
};

/**
 * Kata moves; the studio's named-move library. Names taken from the
 * cross-category move_library at D:\The_Hangar\apps\prototypes\poi-sculptor\move_library\cross
 * (the gross structure; the trajectory data still lives in Blender
 * working files and is deferred to a later migration pass).
 */
export const kataMoves: KataMove[] = [
  {
    slug: "cross-low",
    name: "Cross (low)",
    durationMs: 1200,
    labanEffort: "GLIDE",
    notes:
      "Two-hand cross at hip height; the foundational pattern that every other cross variation extends.",
  },
  {
    slug: "cross-high",
    name: "Cross (high)",
    durationMs: 1200,
    labanEffort: "GLIDE",
    notes:
      "Cross raised to shoulder height; opens the upper register of the trail-volume above the dancer.",
  },
  {
    slug: "cross-buzzsaw",
    name: "Cross-buzzsaw",
    durationMs: 800,
    labanEffort: "SLASH",
    notes:
      "Cross executed at speed with the trails biting back into the page; the gesture that earned the name.",
  },
  {
    slug: "weave-three-beat",
    name: "Three-beat weave",
    durationMs: 1800,
    labanEffort: "PRESS",
    notes:
      "Classical three-beat weave; the pattern that maps cleanly onto LSystem-fern geometry when frozen.",
  },
  {
    slug: "windmill-forward",
    name: "Forward windmill",
    durationMs: 1500,
    labanEffort: "PRESS",
    notes:
      "Both poi tracing parallel forward circles at shoulder height; the simplest two-hand spiral.",
  },
  {
    slug: "stall-flower",
    name: "Stall flower",
    durationMs: 2400,
    labanEffort: "FLOAT",
    notes:
      "Stationary stall at the end of an extended arm with the poi held vertical; the breath at the top of a phrase.",
  },
  {
    slug: "tangle-dab",
    name: "Tangle-dab",
    durationMs: 600,
    labanEffort: "DAB",
    notes:
      "Pre-tangle isolation, then a sharp dab to release; the kata's punctuation mark.",
  },
  {
    slug: "throw-flick",
    name: "Throw-flick recovery",
    durationMs: 700,
    labanEffort: "FLICK",
    notes:
      "Mid-air toss with a flick-of-wrist recovery on the catch; sits in the corner where DAB and FLICK overlap.",
  },
  {
    slug: "wring-orbit",
    name: "Wring-orbit",
    durationMs: 3000,
    labanEffort: "WRING",
    notes:
      "Sustained orbit with the bodyline pulling against the spin; the move that proves the dancer's centre is still in charge.",
  },
  {
    slug: "punch-stop",
    name: "Punch-stop",
    durationMs: 400,
    labanEffort: "PUNCH",
    notes:
      "Hard accent: full extension, full halt. The exclamation that begins or ends a phrase.",
  },
];

export function getLabanCorner(
  name: LabanCorner["name"],
): LabanCorner | undefined {
  return labanCorners.find((c) => c.name === name);
}

export function getKataMove(slug: string): KataMove | undefined {
  return kataMoves.find((m) => m.slug === slug);
}

/**
 * Stage zones from the choreography engine — the 9-point grid the
 * choreographer addresses by name (downstage-left, upstage-centre,
 * etc). Vectors are in metres, on a stage 8m wide by 6m deep.
 */
export const stageZones: Record<
  string,
  { x: number; y: number; z: number; label: string }
> = {
  DSL: { x: -2.5, y: 0, z: -2.0, label: "Downstage left" },
  DSC: { x: 0.0, y: 0, z: -2.2, label: "Downstage centre" },
  DSR: { x: 2.5, y: 0, z: -2.0, label: "Downstage right" },
  CSL: { x: -2.5, y: 0, z: 0.0, label: "Centre-stage left" },
  CSC: { x: 0.0, y: 0, z: 0.0, label: "Centre-stage centre" },
  CSR: { x: 2.5, y: 0, z: 0.0, label: "Centre-stage right" },
  USL: { x: -2.5, y: 0, z: 2.2, label: "Upstage left" },
  USC: { x: 0.0, y: 0, z: 2.0, label: "Upstage centre" },
  USR: { x: 2.5, y: 0, z: 2.2, label: "Upstage right" },
};
