/**
 * lib/productions/episodes.ts — Typed catalogue of the studio's planned narrative episodes.
 *
 * One-line role: enumerate the placeholder shells Pipeline Gamma (Narrative Sitcom) will fill.
 * Full purpose in episodes.PURPOSE.md.
 */

import type { CastMemberId } from "lib/cast";

export type EpisodeArc = "lavender" | "iron-ribbon" | "ad-hoc";

export type EpisodeScene =
  | "academy"
  | "selfridges"
  | "the-walk"
  | "studio";

export type EpisodeStatus =
  | "planned"
  | "in-flight"
  | "drafted"
  | "shipped";

export type Episode = {
  /** Slug. e.g. "lavender-001". */
  id: string;
  /** Which canon arc this episode belongs to. */
  arc: EpisodeArc;
  /** Display title. */
  title: string;
  /** One-sentence pitch. */
  tagline: string;
  /** Cast members in this episode (must be bibled). */
  cast: CastMemberId[];
  /** Where the episode is set. */
  scene: EpisodeScene;
  /** Production status. */
  status: EpisodeStatus;
  /**
   * 2-3 sentence summary. PROVISIONAL for any non-shipped status —
   * the Director Agent (Pipeline Gamma stage 4) writes the real
   * synopsis at production time.
   */
  synopsis: string;
  /** ISO week tag (YYYY-Www) or null. */
  targetWeek: string | null;
  /** Optional reference to a Hangar/Productions/* file if one exists. */
  sourcePath?: string;
};

export const episodes: Episode[] = [
  {
    id: "lavender-001",
    arc: "lavender",
    title: "Monday Opens on the Wrong Hue",
    tagline:
      "Marcel arrives with the lavender. Betsy has read the contract.",
    cast: ["marcel", "betsy"],
    scene: "academy",
    status: "in-flight",
    synopsis:
      "PROVISIONAL. Marcel unveils the week's lavender candidate at the Monday governance table. Betsy declines without raising her voice, citing the archive. The dispute reopens on the same fault line; nothing is decided.",
    targetWeek: "2026-W20",
  },
  {
    id: "lavender-002",
    arc: "lavender",
    title: "Wednesday and the Averaged Compromise",
    tagline:
      "Penny tables a chromatic midpoint. Marcel refuses to lose this way.",
    cast: ["marcel", "betsy", "penny"],
    scene: "academy",
    status: "planned",
    synopsis:
      "PROVISIONAL. Penny proposes a compromise hue calculated as the midpoint of Marcel's and Betsy's candidates. Marcel refuses theatre's accomplice; Betsy refuses peace-bought-cheap. The Wednesday session ends with the dispute fortified, not closed.",
    targetWeek: "2026-W20",
  },
  {
    id: "lavender-003",
    arc: "lavender",
    title: "Friday Verdict from the Headmistress",
    tagline:
      "Aura listens to both, then reframes the question entirely.",
    cast: ["aura", "marcel", "betsy"],
    scene: "academy",
    status: "planned",
    synopsis:
      "PROVISIONAL. Aura hears Marcel and Betsy out without conceding the floor to either. She declines to arbitrate the hue and instead reframes what the lavender is for. The Mon-Wed-Fri cycle closes on a question, not a colour.",
    targetWeek: "2026-W20",
  },
  {
    id: "iron-ribbon-001",
    arc: "iron-ribbon",
    title: "Monday: Same Break, Different Week",
    tagline:
      "Trixie names the dropped handoff before stand-up finishes.",
    cast: ["trixie"],
    scene: "academy",
    status: "in-flight",
    synopsis:
      "PROVISIONAL. Trixie opens the week pointing at the same broken seam between her workflow and Millie's. She names it once, on the verb, and puts the third re-explanation in writing. The Iron Ribbon arc resumes exactly where it failed last Friday.",
    targetWeek: "2026-W20",
  },
  {
    id: "iron-ribbon-002",
    arc: "iron-ribbon",
    title: "Tuesday: The Workaround That Outlived Its Excuse",
    tagline:
      "Penny audits the workaround stack. Trixie has already drawn the diagram.",
    cast: ["trixie", "penny"],
    scene: "academy",
    status: "planned",
    synopsis:
      "PROVISIONAL. Penny audits the queue and finds the same workaround load-bearing for the third sprint. Trixie has the whiteboard diagram drawn before Penny finishes her question. The two agree the workaround is now the system.",
    targetWeek: "2026-W20",
  },
  {
    id: "iron-ribbon-003",
    arc: "iron-ribbon",
    title: "Thursday to Friday: The Ribbon Holds",
    tagline:
      "Trixie surfaces the friction one last time. The handoff lands.",
    cast: ["trixie", "aura"],
    scene: "academy",
    status: "planned",
    synopsis:
      "PROVISIONAL. Trixie surfaces the friction one last time at Thursday's review; Aura backs the fix on Friday by removing the meeting that was generating the handoff in the first place. The ribbon holds across the weekend for the first sprint in five.",
    targetWeek: "2026-W20",
  },
  {
    id: "ad-hoc-001",
    arc: "ad-hoc",
    title: "Hostess at the Selfridges Counter",
    tagline:
      "Aura opens the season's second narrative space.",
    cast: ["aura", "penny"],
    scene: "selfridges",
    status: "planned",
    synopsis:
      "PROVISIONAL. Aura hosts a walk-in at the Selfridges counter; Penny manages the logistics from the Academy end of the twenty-minute walk. The episode functions as the season's first formal handshake between the two narrative spaces.",
    targetWeek: "2026-W21",
  },
  {
    id: "ad-hoc-002",
    arc: "ad-hoc",
    title: "The Twenty-Minute Walk",
    tagline:
      "Penny costs the route. Aura walks it anyway.",
    cast: ["aura", "penny", "marcel"],
    scene: "the-walk",
    status: "planned",
    synopsis:
      "PROVISIONAL. Penny tallies the operational cost of the daily Academy-to-Selfridges walk and recommends it be retired. Aura keeps the walk on the rota; Marcel insists on accompanying her for the lavender on the way. The episode is the ambient canon of the route itself.",
    targetWeek: "2026-W22",
  },
];

export function listEpisodes(): Episode[] {
  return episodes;
}

export function getEpisode(id: string): Episode | undefined {
  return episodes.find((e) => e.id === id);
}

export function episodesByArc(arc: EpisodeArc): Episode[] {
  return episodes.filter((e) => e.arc === arc);
}

export function episodesByCast(castId: CastMemberId): Episode[] {
  return episodes.filter((e) => e.cast.includes(castId));
}
