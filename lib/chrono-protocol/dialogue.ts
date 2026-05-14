/**
 * Chrono-Protocol dialogue system — picker, matcher, and HUD constants.
 *
 * The prototype runs a Gemini-prompted SYSTEM_INSTRUCTION that generates
 * dialogue on the fly from the player's telemetry. The site starts with
 * a static-canon bank of ~30 lines (see `./dialogue-lines.ts`) covering
 * the trigger surface area; subsequent waves swap in LLM generation
 * against the same trigger system.
 *
 * Voice rules:
 *   - Aura — Maternal, regal, calm. Uses "We", "The Protocol".
 *   - Yow  — Autistic-coded. Pattern recognition, warning, cynical, paranoid.
 *   - Purp — ADHD-coded. Cyberpunk-London slang: innit, bruv, glitch, preem.
 *     Velocity, distractibility, the next shiny thing.
 *
 * Triggers are evaluated against PlayerTelemetry + the active zone + the
 * last few speakers (to avoid two lines from the same construct back-to-
 * back). pickDialogue() applies priority + a recency penalty.
 *
 * Types live in `./dialogue-types`; the line bank in `./dialogue-lines`.
 * Both are re-exported here so the public import path stays stable.
 */

export type {
  Construct,
  DialogueLine,
  DialogueSampler,
  DialogueTrigger,
} from "./dialogue-types";

export { dialogueLines } from "./dialogue-lines";

import { dialogueLines } from "./dialogue-lines";
import type {
  Construct,
  DialogueLine,
  DialogueSampler,
} from "./dialogue-types";

const DEFAULT_SPEAKER_PENALTY = 25;

function matchesTrigger(line: DialogueLine, s: DialogueSampler): boolean {
  switch (line.trigger.kind) {
    case "health-below":
      return s.health < line.trigger.threshold;
    case "speed-above":
      return s.speedMultiplier > line.trigger.threshold;
    case "combo-above":
      return s.combo > line.trigger.threshold;
    case "mode-changed":
      return s.lastModeChange === line.trigger.to;
    case "zone-entered":
      return s.zone === line.trigger.zone;
    case "boss-defeated":
      return s.bossDefeatedThisTick === line.trigger.zone;
    case "player-died":
      return s.playerDiedThisTick;
    case "phase-start":
      return s.phaseStartedThisTick === line.trigger.phase;
  }
}

/**
 * Pick the highest-priority dialogue line for the current tick. Applies
 * a recency penalty to lines whose speaker is in recentSpeakers — the
 * most-recent speaker takes a -25, the second-most a -13, etc.
 *
 * Returns null if no line matches.
 */
export function pickDialogue(s: DialogueSampler): DialogueLine | null {
  let best: DialogueLine | null = null;
  let bestScore = -Infinity;
  for (const line of dialogueLines) {
    if (!matchesTrigger(line, s)) continue;
    const idx = s.recentSpeakers.lastIndexOf(line.speaker);
    let penalty = 0;
    if (idx !== -1) {
      const distance = s.recentSpeakers.length - 1 - idx;
      penalty = Math.max(0, DEFAULT_SPEAKER_PENALTY - distance * 12);
    }
    const score = line.priority - penalty;
    if (score > bestScore) {
      best = line;
      bestScore = score;
    }
  }
  return best;
}

/** Display labels for each construct, all-caps register for the HUD. */
export const CONSTRUCT_LABEL: Record<Construct, string> = {
  aura: "AURA",
  yow: "YOW",
  purp: "PURP",
};

/** Tint colour for each construct's HUD bubble. */
export const CONSTRUCT_TINT: Record<Construct, string> = {
  aura: "#fff5cc",
  yow: "#ffcc00",
  purp: "#9900ff",
};
