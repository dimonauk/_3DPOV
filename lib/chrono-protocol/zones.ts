/**
 * Chrono-Protocol zone canon — site-side mirror of the prototype's
 * D:\The_Hangar\apps\prototypes\neo-london-chrono-protocol\constants.ts
 * ZONES array, extended with the site's needs: difficulty enum,
 * mode roster per zone, enemy roster, boss, splat-library cross-link.
 *
 * Three zones in order of difficulty:
 *   - Leake St Arches — The Safehouse — tutorial
 *   - The Royal Mile  — Trafalgar to Regent St — normal
 *   - Soho Grid       — Carnaby Data Stream — hard
 *
 * Cross-link rule: hasSplat is true only when the slug here matches a
 * playable zone in the splat library at data/neo-london/zones.json. The
 * splat library's current first wave (Bankside, Liverpool Street, etc.)
 * does not overlap with the Chrono-Protocol zone slugs, so all three
 * read false at v0.1. The splat-pipeline agent's next pass will land
 * Leake St as the first overlap; the boolean flips then.
 */

import type { ChronoModeSlug } from "../chrono-protocol";

export type ZoneSlug = "leake-st-arches" | "royal-mile" | "soho-grid";
export type ZoneDifficulty = "tutorial" | "normal" | "hard";

export type ZoneEnemy = {
  /** Slug for inline rendering. */
  slug: string;
  name: string;
  /** Which mode neutralises this enemy. */
  weakness: ChronoModeSlug;
  /** Health pool. */
  hp: number;
  /** Display colour. */
  color: string;
  /** One-line description for the briefing screen. */
  description: string;
};

export type Zone = {
  slug: ZoneSlug;
  name: string;
  /** The prototype's "billing" line — the location subtitle. */
  billing: string;
  /** Longer Aura-register description for the briefing screen. */
  description: string;
  difficulty: ZoneDifficulty;
  /** Modes that appear in this zone's encounters. */
  activeModes: ChronoModeSlug[];
  /** Enemy roster for this zone. */
  enemies: ZoneEnemy[];
  /** Boss for this zone (or null if zone has no boss yet). */
  boss: ZoneEnemy | null;
  /** Whether the zone has a SHARP-rendered splat available. */
  hasSplat: boolean;
  /** Slug into data/neo-london/zones.json when hasSplat is true. */
  splatSlug: string | null;
  /** Tunnel speed multiplier — gameplay tuning. Base TUNNEL_SPEED = 12. */
  tunnelSpeedMultiplier: number;
  /** Constructs that narrate this zone (subset of {aura, yow, purp}). */
  narrators: Array<"aura" | "yow" | "purp">;
};

export const zones: Zone[] = [
  {
    slug: "leake-st-arches",
    name: "Leake St Arches",
    billing: "The Safehouse",
    description:
      "The graffiti-walled tunnel under Waterloo. The permission wall the studio used to mark its first London years. Tutorial-difficulty by design — slow tunnel, two enemy types, no boss. Aura narrates the run alone; Yow and Purp stay out of the room for the first walk.",
    difficulty: "tutorial",
    activeModes: ["amber", "azure", "veridian"],
    enemies: [
      {
        slug: "tag-glitch",
        name: "Tag Glitch",
        weakness: "azure",
        hp: 2,
        color: "#ff66cc",
        description:
          "A flickering tag-spray hovering in the arch. Sustained AZURE flow neutralises it on the long exhale.",
      },
      {
        slug: "rebar-spike",
        name: "Rebar Spike",
        weakness: "amber",
        hp: 3,
        color: "#ffcc00",
        description:
          "A protruding fragment of the tunnel's own skeleton. AMBER's kinetic speed sidesteps the spike before it lands.",
      },
      {
        slug: "drift-pattern",
        name: "Drift Pattern",
        weakness: "veridian",
        hp: 2,
        color: "#00cc66",
        description:
          "A wall-tile that won't sit quiet in the grid. VERIDIAN names the pattern and the tile settles.",
      },
    ],
    boss: null,
    hasSplat: false,
    splatSlug: null,
    tunnelSpeedMultiplier: 0.6,
    narrators: ["aura"],
  },
  {
    slug: "royal-mile",
    name: "The Royal Mile",
    billing: "Trafalgar to Regent St",
    description:
      "The sightline from the National Gallery up through Piccadilly Circus and round the bend toward Carnaby. The spine of central London the studio has walked with a 360 pole more times than the journal has bothered to record. Normal difficulty — four enemy types and one boss. Yow joins Aura for this run; he reads the patterns Aura would only name once.",
    difficulty: "normal",
    activeModes: ["amber", "azure", "amethyst", "veridian"],
    enemies: [
      {
        slug: "ad-burst",
        name: "Ad Burst",
        weakness: "crimson",
        hp: 4,
        color: "#ff3344",
        description:
          "A holographic ad-pane bursts open across the sightline. CRIMSON's override pulls the override-card and the pane folds.",
      },
      {
        slug: "tourist-swarm",
        name: "Tourist Swarm",
        weakness: "amber",
        hp: 3,
        color: "#ffcc00",
        description:
          "A clot of unmoving bodies in the middle of the street. AMBER's kinetic threads the gap before the gap closes.",
      },
      {
        slug: "loop-glitch",
        name: "Loop Glitch",
        weakness: "azure",
        hp: 4,
        color: "#0099ff",
        description:
          "A frame stuttering in the camera feed. AZURE's held breath holds the frame still until the loop resolves.",
      },
      {
        slug: "carnaby-tilt",
        name: "Carnaby Tilt",
        weakness: "veridian",
        hp: 5,
        color: "#00cc66",
        description:
          "The street's grid won't square. VERIDIAN reads the angle the city's actually on and the tilt corrects.",
      },
    ],
    boss: {
      slug: "piccadilly-spire",
      name: "Piccadilly Spire",
      weakness: "crimson",
      hp: 14,
      color: "#ff3344",
      description:
        "Eros's pedestal extruded into a thirty-metre data-spire. CRIMSON brings it down in three phases; the third only opens after the second clears clean.",
    },
    hasSplat: false,
    splatSlug: null,
    tunnelSpeedMultiplier: 1.0,
    narrators: ["aura", "yow"],
  },
  {
    slug: "soho-grid",
    name: "Soho Grid",
    billing: "Carnaby Data Stream",
    description:
      "The tight orthogonal grid east of Regent Street, neon-lit, where the wireframe register reads as native rather than applied. Hard difficulty — five enemy types, one boss, a faster tunnel. Aura, Yow, and Purp all narrate; the chorus runs full. The full-weave proving ground in city form.",
    difficulty: "hard",
    activeModes: ["amber", "azure", "amethyst", "crimson", "veridian"],
    enemies: [
      {
        slug: "data-mole",
        name: "Data Mole",
        weakness: "veridian",
        hp: 3,
        color: "#00cc66",
        description:
          "A burrowing pattern in the road-grid. VERIDIAN traces the burrow back to its rule and the mole surfaces.",
      },
      {
        slug: "neon-sprite",
        name: "Neon Sprite",
        weakness: "amethyst",
        hp: 4,
        color: "#9900ff",
        description:
          "A pixel-fizzing rogue lighting unit. AMETHYST's chaos answers with its own and the sprite scatters.",
      },
      {
        slug: "buffer-overrun",
        name: "Buffer Overrun",
        weakness: "azure",
        hp: 5,
        color: "#0099ff",
        description:
          "A render-buffer spilling its own contents into the playable field. AZURE's flow drains the buffer along the long axis.",
      },
      {
        slug: "ad-ouroboros",
        name: "Ad Ouroboros",
        weakness: "crimson",
        hp: 6,
        color: "#ff3344",
        description:
          "An advertising loop eating its own tail. CRIMSON cuts the loop at the junction so the rest can't reform.",
      },
      {
        slug: "rate-limiter",
        name: "Rate Limiter",
        weakness: "amber",
        hp: 4,
        color: "#ffcc00",
        description:
          "A frame-limit imposed by the grid on the player's tempo. AMBER outpaces the limit before it sets.",
      },
    ],
    boss: {
      slug: "carnaby-monolith",
      name: "Carnaby Monolith",
      weakness: "amethyst",
      hp: 22,
      color: "#9900ff",
      description:
        "A four-storey neon block at the head of Carnaby Street, holding the grid's pattern. AMETHYST breaks the pattern in three phases — the rule, the meta-rule, then the block itself.",
    },
    hasSplat: false,
    splatSlug: null,
    tunnelSpeedMultiplier: 1.4,
    narrators: ["aura", "yow", "purp"],
  },
];

export function getZoneBySlug(slug: string): Zone | undefined {
  return zones.find((z) => z.slug === slug);
}

export function getZoneSlugs(): ZoneSlug[] {
  return zones.map((z) => z.slug);
}

export function isZoneSlug(value: string): value is ZoneSlug {
  return zones.some((z) => z.slug === value);
}

/** Base tunnel speed from the prototype's constants.ts. */
export const BASE_TUNNEL_SPEED = 12;

/** Resolve a zone's effective tunnel speed. */
export function zoneTunnelSpeed(zone: Zone): number {
  return BASE_TUNNEL_SPEED * zone.tunnelSpeedMultiplier;
}
