/**
 * The /play route is the studio's proving ground. The AR game is
 * a two-phase ladder.
 *
 * Phase 1 — Solo. Eight levels, no prerequisites between them.
 * Each isolates and proves one thread of the studio's philosophy
 * by being that thread. The player learns each move on its own
 * before they ever try to combine them.
 *
 * Phase 2 — Braided. The player has the solo moves; now they learn
 * to weave them. Named after the poi vocabulary, because this game
 * is the studio's own movement pedagogy applied to philosophical
 * thought: the 2-braid, the 3-beat weave, the 5-beat weave, and
 * the full weave with all eight threads active at once.
 *
 * The proof is recursive at four orders. The game proves
 * modularity-at-small-scale by being modular. It proves
 * persistence-of-vision-as-angle by rendering angular-sync. It
 * proves the Holoflow Loop by closing it in one session. And the
 * two-phase structure itself proves the studio's pedagogy — poi
 * is taught the same way: master each move alone, then learn the
 * weave. The game teaches the philosophy the way the practice
 * teaches the body.
 */

export type PlayStatus =
  | "live"
  | "preview" // playable now, level structure not yet enforced
  | "next" // the level the bench is building toward
  | "planned" // designed, not built
  | "future"; // designed, queued behind the planned ones

export type SoloLevel = {
  phase: "solo";
  /** Position in the solo ladder, 1-indexed. */
  level: number;
  /** URL slug for the sub-route once it ships. /play/{slug}. */
  slug: string;
  /** Display name. */
  name: string;
  /** The philosophical thread this level demonstrates. */
  proves: string;
  /** What the player does. The interaction. */
  mechanic: string;
  /** How the level is completed. The honest pass-condition. */
  goal: string;
  /** Cross-references — articles or routes that argue the same thread in prose. */
  argumentRoutes: { href: string; label: string }[];
  /** Where it is in its life. */
  status: PlayStatus;
};

export type BraidedLevel = {
  phase: "braided";
  /** Position in the braided ladder, 1-indexed. */
  level: number;
  /** URL slug. /play/{slug}. */
  slug: string;
  /** Display name — uses the poi vocabulary. */
  name: string;
  /** How many solo threads the player braids together at this level. */
  threadCount: number;
  /** The pedagogical move this braid teaches. */
  proves: string;
  /** The interaction. */
  mechanic: string;
  /** The pass-condition. */
  goal: string;
  /** Prerequisite solo level slugs — minimum set the player needs cleared. */
  requires: string[];
  /** Cross-references. */
  argumentRoutes: { href: string; label: string }[];
  status: PlayStatus;
};

export type PlayLevel = SoloLevel | BraidedLevel;

export const soloLevels: SoloLevel[] = [
  {
    phase: "solo",
    level: 1,
    slug: "module",
    name: "The Module",
    proves:
      "Modularity at small scale. The player picks the rig before they swing it; the swap that consumer hardware cannot afford is the swap this game is built on.",
    mechanic:
      "Three or four brush modules — thin line, fat brush, dotted, additive smear — and a prompt that asks the player to draw something specific. Picking the right module is part of the gesture.",
    goal: "Match the brush module to the prompt. A sword with a fat brush is the wrong tool; the level cannot be completed without choosing modular-first.",
    argumentRoutes: [
      { href: "/articles/why-i-build-modular", label: "Why I Build Modular" },
      { href: "/bezel", label: "The bezel — the clip-on product" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game this level graduates into" },
    ],
    status: "preview",
  },
  {
    phase: "solo",
    level: 2,
    slug: "trail",
    name: "The Trail",
    proves:
      "Persistence of vision as angle, not clock. The trail is written by where the pointer is, not when the pointer fires; the same architectural choice the studio's POV LED rigs are built on.",
    mechanic:
      "A single pointer, a single gesture. The trail accumulates the way a long exposure accumulates light. An angular-sync readout on the HUD shows the pointer's mean angular velocity — the trail brightens with the gesture, dims when the angle stalls. The brush is whichever module the visitor passed Module level with; the thin line otherwise.",
    goal: "Hold the gesture continuous. Time-sync gives dots; angular-sync gives the curve. The shape only emerges if the body keeps moving.",
    argumentRoutes: [
      { href: "/articles/why-i-build-my-own-rigs", label: "Why I Build My Own Rigs" },
      { href: "/tutorials/programming-pov-frames", label: "Programming Frames for a POV Rig" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game this level graduates into" },
    ],
    status: "preview",
  },
  {
    phase: "solo",
    level: 3,
    slug: "loop",
    name: "The Loop",
    proves:
      "The Holoflow Loop in one session. Six positions, one closed circuit; here, condensed to a single gesture that travels through all six.",
    mechanic:
      "Draw a trail. The trail is captured (frozen), reified as a small 3D mesh (a marching-cubes pass), and encountered (a rotate-around view of the object you just made).",
    goal: "Recognise the shape of your own gesture in the reified object. The loop has closed when the body that drew it sees what it left behind.",
    argumentRoutes: [
      { href: "/the-loop", label: "The Holoflow Loop" },
      { href: "/articles/nine-seconds-prompt-to-printable", label: "Nine Seconds from Prompt to Printable" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game this level graduates into" },
    ],
    status: "preview",
  },
  {
    phase: "solo",
    level: 4,
    slug: "witness",
    name: "The Witness",
    proves:
      "Cold-eye watching. The studio's video-reading prototype turned inward on the visitor's own trail — Aura describes what is on the canvas, not what the visitor intended.",
    mechanic:
      "Aura narrates as you draw. Her cold-eye reading appears as an overlay, segment by segment; once the audio synth is wired in, she speaks it in her own voice.",
    goal: "Compare Aura's description to what you intended. The level passes when the player sees the gap between intent and trace and either accepts it or redraws.",
    argumentRoutes: [
      { href: "/watch", label: "/watch — Aura's eyes" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game this level graduates into" },
    ],
    status: "preview",
  },
  {
    phase: "solo",
    level: 5,
    slug: "sovereignty",
    name: "Sovereignty",
    proves:
      "Local-first architecture. Every layer keeps working if a vendor pivots or the connection drops; sovereignty mode is the demonstration the visitor can run with their own router unplugged.",
    mechanic:
      "A toggle severs the network. The trail logic keeps working — same render, same cache, same local state.",
    goal: "Complete a drawing with the connection cut. The architecture passes the test the visitor's router can run on demand.",
    argumentRoutes: [
      { href: "/articles/on-the-shoulders-of-open-source", label: "On the Shoulders of Open Source" },
      { href: "/stack", label: "The stack — sovereign by design" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game this level graduates into" },
    ],
    status: "future",
  },
  {
    phase: "solo",
    level: 6,
    slug: "curriculum",
    name: "The Curriculum",
    proves:
      "Self-taught learnability. The position the studio has always held is that anyone willing to sit and learn can get to this work; the curriculum level is that position made into experience.",
    mechanic:
      "Pick one of the seven learning ladders on /learn. The level renders the first rung as an in-game exercise.",
    goal: "Finish one rung's exercise. The body has now performed the act the studio writes about.",
    argumentRoutes: [
      { href: "/learn", label: "Learn — the seven ladders" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game this level graduates into" },
    ],
    status: "future",
  },
  {
    phase: "solo",
    level: 7,
    slug: "perch",
    name: "The Perch",
    proves:
      "Trans-led community gating. The Rookery's quiet door policy admits anyone who can pay; the published trails are a wall of community gesture, sorted by the subscription, not by moderation.",
    mechanic:
      "Publish a trail to the Rookery feed. The subscription gate is the door the level routes through; non-members see the gate, not a workaround.",
    goal: "See your trail on the wall and reply to another member's trail. The community position is passed when the visitor's gesture becomes someone else's prompt.",
    argumentRoutes: [
      { href: "/rookery", label: "The Rookery" },
      { href: "/rookery/about", label: "About the Rookery" },
      { href: "/rookery/tiers", label: "Tiers" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game this level graduates into" },
    ],
    status: "future",
  },
  {
    phase: "solo",
    level: 8,
    slug: "bezel",
    name: "The Bezel",
    proves:
      "The bezel-clip product, ahead of shipping. The same persistence-of-vision firmware family that will run on the clip, here as a software simulation; the buyer holds the future product before it ships.",
    mechanic:
      "WebXR mode with a Quest 3 controller. The controller is treated as if a clip-on bezel were already on it; the same angular-sync firmware runs in JavaScript and draws in 3D space.",
    goal: "Draw a trail in 3D space with the controller-as-bezel. The visitor has held the product the studio is building.",
    argumentRoutes: [
      { href: "/bezel", label: "The bezel — interest list" },
      { href: "/articles/vr-pov-controllers-the-product", label: "VR POV Controllers — the studio's product" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game this level graduates into" },
    ],
    status: "future",
  },
];

export const braidedLevels: BraidedLevel[] = [
  {
    phase: "braided",
    level: 1,
    slug: "the-2-braid",
    name: "The 2-Braid",
    threadCount: 2,
    proves:
      "First weave. Two threads at once — the player chooses which two from the eight they have already passed solo. The weave teaches what no single thread teaches: that the threads inform each other.",
    mechanic:
      "Pick any two solo levels. The game stages a single performance that requires both threads active at the same time. Module + Trail is the typical first pair; Witness + Sovereignty is the harder choice.",
    goal: "Complete a single gesture in which both chosen threads are demonstrably load-bearing — remove either thread and the performance fails.",
    requires: [], // any two solo passes suffice — gate logic at runtime
    argumentRoutes: [
      { href: "/tutorials/spinning-fire-poi-safely", label: "Spinning Fire Poi Safely — the two-hand foundation" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game the braids deploy into" },
    ],
    status: "future",
  },
  {
    phase: "braided",
    level: 2,
    slug: "the-3-beat-weave",
    name: "The 3-Beat Weave",
    threadCount: 3,
    proves:
      "The classic poi move applied to philosophy. Three threads in rhythm; the rhythm itself is the lesson. The studio learned the three-beat weave first as a body discipline; this level applies the same shape to thought.",
    mechanic:
      "Three threads chosen by the player. The performance is timed — the threads have to alternate on a rhythm rather than firing simultaneously. Like the actual three-beat weave, the body learns the pattern by repeating it.",
    goal: "Complete eight clean cycles of the three-thread alternation without dropping the rhythm. The rhythm is the proof; the threads are the moves the rhythm carries.",
    requires: [],
    argumentRoutes: [
      { href: "/practice", label: "Practice — the body discipline this is named after" },
      { href: "/journal/year-one-fire", label: "Year One, Fire" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game the braids deploy into" },
    ],
    status: "future",
  },
  {
    phase: "braided",
    level: 3,
    slug: "the-5-beat",
    name: "The 5-Beat",
    threadCount: 5,
    proves:
      "The advanced weave. Five threads in rhythm; the failure modes multiply, and the discipline becomes recovery rather than execution. Most performances at this level fail somewhere; the lesson is finishing anyway.",
    mechanic:
      "Five chosen threads on a tighter rhythm. The game accepts up to two dropped beats per cycle as the level becomes about graceful recovery, not perfection.",
    goal: "Complete five cycles with at most two recovered drops. The lesson the studio teaches: keep moving, the recovery is the practice.",
    requires: [],
    argumentRoutes: [
      { href: "/journal/year-one-fire", label: "Year One, Fire — recovery as the practice" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game the braids deploy into" },
    ],
    status: "future",
  },
  {
    phase: "braided",
    level: 4,
    slug: "the-full-weave",
    name: "The Full Weave",
    threadCount: 8,
    proves:
      "All eight threads active at once. The studio's whole philosophy operating simultaneously in one performance. This is the level the entire ladder has been pointing toward — and the level whose pass-condition opens the HUB of Neo-London: Chrono-Protocol, the WebXR rhythm-action runner the curriculum graduates into.",
    mechanic:
      "All eight threads required. The performance is a single continuous gesture in which Module choice, angular-sync trail, the closed loop, Aura's cold-eye, sovereignty mode, a curriculum rung, a Perch publish, and the Bezel controller mode are all demonstrably present.",
    goal: "Hold the full weave for one minute. At the end of that minute, the visitor has used every thread of the studio's philosophy in a single sustained gesture. The proof is recursive at every order: the player has proven the studio's pedagogy by using it.",
    requires: [
      "module",
      "trail",
      "loop",
      "witness",
      "sovereignty",
      "curriculum",
      "perch",
      "bezel",
    ],
    argumentRoutes: [
      { href: "/the-loop", label: "The Holoflow Loop" },
      { href: "/about", label: "About — the practice, the method, the studio" },
      { href: "/articles/neo-london-chrono-protocol", label: "Neo-London: Chrono-Protocol — the game this level opens" },
    ],
    status: "future",
  },
];

export const playLevels: PlayLevel[] = [...soloLevels, ...braidedLevels];

export function getPlayLevel(slug: string): PlayLevel | undefined {
  return playLevels.find((l) => l.slug === slug);
}

/**
 * Solo levels are eligible at any time — the player picks the
 * thread they want to learn first.
 *
 * Braided levels are eligible once the player has passed enough
 * solo levels: a 2-braid requires any 2 solo passes; a 3-beat
 * weave requires any 3; the full weave requires all 8.
 */
export function eligibleLevels(completed: Set<string>): PlayLevel[] {
  const soloDoneCount = soloLevels.filter((l) =>
    completed.has(l.slug),
  ).length;

  return playLevels.filter((l) => {
    if (l.phase === "solo") return true;
    if (l.threadCount > soloDoneCount) return false;
    if (l.requires.length > 0) {
      return l.requires.every((r) => completed.has(r));
    }
    return true;
  });
}
