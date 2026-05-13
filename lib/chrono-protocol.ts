/**
 * Chrono-Protocol design canon — the 5-mode color pie.
 *
 * The studio's AR game (Neo-London: Chrono-Protocol, prototype at
 * D:\The_Hangar\apps\prototypes\neo-london-chrono-protocol\) runs on
 * a five-mode color-pie system, inheriting from Magic: the
 * Gathering's proven structural pattern. Five is the lowest number
 * for which every colour has equal allies (adjacent on the wheel)
 * and enemies (non-adjacent). Each mode is both a gameplay function
 * AND an ideology — a way of being the player borrows for the
 * duration of the encounter.
 *
 * The wheel order: AMBER → AZURE → AMETHYST → CRIMSON → VERIDIAN
 * → (back to AMBER). Adjacent pairs are complementary axes:
 * yellow/blue (AMBER/AZURE — temporal) and green/purple
 * (VERIDIAN/AMETHYST — perceptual). CRIMSON sits opposite the
 * AMBER/AZURE axis as the force mode.
 *
 * Reconciliation note: the prototype as of the date this file
 * shipped runs four modes (AMBER, CRIMSON, AZURE, VERIDIAN), with
 * VERIDIAN's colour slot ambiguously occupying purple via Purp's
 * voice. The site's design canon (this file) is five modes, with
 * AMETHYST as a properly-named purple slot. The prototype's
 * constants.ts will reconcile in the next pass.
 */

export type ChronoModeSlug =
  | "amber"
  | "azure"
  | "amethyst"
  | "crimson"
  | "veridian";

export type ChronoConstruct =
  | "aura"
  | "yow"
  | "purp"
  | "tbd-amber"
  | "tbd-crimson";

export type ChronoMode = {
  slug: ChronoModeSlug;
  /** Display name, all-caps register matching the prototype. */
  name: string;
  /** Hex colour — the actual rendering value. */
  hexColor: string;
  /** Short label for the mechanical function. */
  function: string;
  /** One-line ideology — the way-of-being the mode embodies. */
  ideology: string;
  /** Adjacent modes on the wheel (allies in MTG-pie terms). */
  allies: [ChronoModeSlug, ChronoModeSlug];
  /** Non-adjacent modes (enemies). */
  enemies: [ChronoModeSlug, ChronoModeSlug];
  /** Which construct holds this slot. */
  construct: ChronoConstruct;
  /** Optional construct cognitive coding, if claimed. */
  constructCoding?: string;
};

export const chronoModes: ChronoMode[] = [
  {
    slug: "amber",
    name: "AMBER",
    hexColor: "#ffcc00",
    function: "Kinetic / Speed",
    ideology:
      "Velocity. The chase. The right-now. The mode of urgent presence — when the gesture must move faster than the body usually wants to.",
    allies: ["azure", "veridian"],
    enemies: ["amethyst", "crimson"],
    construct: "tbd-amber",
  },
  {
    slug: "azure",
    name: "AZURE",
    hexColor: "#0099ff",
    function: "Flow / Slow-mo",
    ideology:
      "Stillness sustained. The long view. The mode of sustained gesture and meditation — when the trail benefits from a held breath rather than a chase.",
    allies: ["amber", "amethyst"],
    enemies: ["crimson", "veridian"],
    construct: "aura",
    constructCoding:
      "Trans-led Architect — the maternal/regal register descends into the wheel as flow.",
  },
  {
    slug: "amethyst",
    name: "AMETHYST",
    hexColor: "#9900ff",
    function: "Chaos / Wild",
    ideology:
      "Rupture. The unexpected. Freedom from the rule that was holding. The mode of the wild gesture, the move that wasn't on the page.",
    allies: ["azure", "crimson"],
    enemies: ["veridian", "amber"],
    construct: "purp",
    constructCoding:
      "ADHD-coded — velocity, distractibility, the next shiny thing already named before the last one finished.",
  },
  {
    slug: "crimson",
    name: "CRIMSON",
    hexColor: "#ff3344",
    function: "Force / Override",
    ideology:
      "Intervention. Breaking what won't move. The mode of the override — when the wall has to come down, when the system has to yield, when no other mode is enough.",
    allies: ["amethyst", "veridian"],
    enemies: ["amber", "azure"],
    construct: "tbd-crimson",
  },
  {
    slug: "veridian",
    name: "VERIDIAN",
    hexColor: "#00cc66",
    function: "Logic / Pattern",
    ideology:
      "The rule. Architecture-recognised. What-already-is, named. The mode of structural pattern — when the system shows its skeleton and the player works with it instead of against it.",
    allies: ["crimson", "amber"],
    enemies: ["azure", "amethyst"],
    construct: "yow",
    constructCoding:
      "Autistic-coded — pattern, recognition, absolute confidence in the rule just identified, intolerance for the rule being violated.",
  },
];

export function getMode(slug: ChronoModeSlug): ChronoMode | undefined {
  return chronoModes.find((m) => m.slug === slug);
}

/**
 * Modes sit on a wheel. Adjacent pairs are allies; non-adjacent
 * are enemies. The wheel order matches the MTG color pie's
 * proven structural pattern.
 */
export const wheelOrder: ChronoModeSlug[] = [
  "amber",
  "azure",
  "amethyst",
  "crimson",
  "veridian",
];

/**
 * The constructs holding the wheel. Three are named on-site;
 * two slots are pending Dimona's naming pass (the AMBER and
 * CRIMSON constructs). Both will follow the same matter-of-fact
 * register as Yow + Purp: cognitive coding named once as a fact
 * about how the construct speaks, not as a label they wear.
 */
export const constructs: Record<
  ChronoConstruct,
  { name: string; coding?: string; status: "canon" | "pending" }
> = {
  aura: {
    name: "Aura",
    coding:
      "Trans-led Architect — the studio's narrator above and within the wheel.",
    status: "canon",
  },
  yow: {
    name: "Yow",
    coding:
      "Autistic-coded — The Elder Construct, pattern-recogniser. Inhabits VERIDIAN.",
    status: "canon",
  },
  purp: {
    name: "Purp",
    coding:
      "ADHD-coded — The Youth Construct, chaos-thriller. Inhabits AMETHYST.",
    status: "canon",
  },
  "tbd-amber": {
    name: "(pending)",
    status: "pending",
  },
  "tbd-crimson": {
    name: "(pending)",
    status: "pending",
  },
};
