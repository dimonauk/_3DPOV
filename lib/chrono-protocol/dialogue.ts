/**
 * Chrono-Protocol dialogue system — site-side canon for the three
 * constructs (Aura, Yow, Purp) and their reaction conditions.
 *
 * The prototype runs a Gemini-prompted SYSTEM_INSTRUCTION that
 * generates dialogue on the fly from the player's telemetry. The site
 * starts with a static-canon bank of ~30 lines covering the trigger
 * surface area; subsequent waves swap in LLM generation against the
 * same trigger system.
 *
 * Voice rules (from constants.ts and the bridge article):
 *   - Aura — Maternal, regal, calm. Uses "We", "The Protocol".
 *   - Yow  — Autistic-coded. Pattern recognition, warning, sees the
 *     rule that just landed. Cynical, paranoid.
 *   - Purp — ADHD-coded. Cyberpunk-London slang: innit, bruv, glitch,
 *     preem. Velocity, distractibility, the next shiny thing.
 *
 * Triggers are evaluated against PlayerTelemetry + the active zone +
 * the last few speakers (to avoid two lines from the same construct
 * back-to-back). The pickDialogue() helper applies priority + a
 * recency penalty.
 */

import type { ChronoModeSlug } from "../chrono-protocol";
import type { ZoneSlug } from "./zones";

export type Construct = "aura" | "yow" | "purp";

export type DialogueTrigger =
  | { kind: "health-below"; threshold: number }
  | { kind: "speed-above"; threshold: number }
  | { kind: "combo-above"; threshold: number }
  | { kind: "mode-changed"; to: ChronoModeSlug }
  | { kind: "zone-entered"; zone: ZoneSlug }
  | { kind: "boss-defeated"; zone: ZoneSlug }
  | { kind: "player-died" }
  | { kind: "phase-start"; phase: number };

export type DialogueLine = {
  /** Stable id for keyed rendering. */
  id: string;
  speaker: Construct;
  text: string;
  trigger: DialogueTrigger;
  /** Higher priority wins when multiple triggers fire on the same tick. */
  priority: number;
};

export const dialogueLines: DialogueLine[] = [
  // ─── Aura — The Architect ────────────────────────────────────────
  {
    id: "aura-zone-leake",
    speaker: "aura",
    text: "We are in the Safehouse. Stand the angle. The Protocol holds the rest.",
    trigger: { kind: "zone-entered", zone: "leake-st-arches" },
    priority: 50,
  },
  {
    id: "aura-zone-royal",
    speaker: "aura",
    text: "The Royal Mile. We walked this sightline a hundred times. We know it.",
    trigger: { kind: "zone-entered", zone: "royal-mile" },
    priority: 50,
  },
  {
    id: "aura-zone-soho",
    speaker: "aura",
    text: "Soho Grid. Every thread we taught the body — we run them all now.",
    trigger: { kind: "zone-entered", zone: "soho-grid" },
    priority: 50,
  },
  {
    id: "aura-phase-1",
    speaker: "aura",
    text: "Phase one. We protect the integrity of the line.",
    trigger: { kind: "phase-start", phase: 1 },
    priority: 40,
  },
  {
    id: "aura-phase-2",
    speaker: "aura",
    text: "Phase two. Time is the second axis. Take it.",
    trigger: { kind: "phase-start", phase: 2 },
    priority: 40,
  },
  {
    id: "aura-phase-3",
    speaker: "aura",
    text: "Phase three. The Protocol expects the full weave now.",
    trigger: { kind: "phase-start", phase: 3 },
    priority: 40,
  },
  {
    id: "aura-mode-azure",
    speaker: "aura",
    text: "AZURE. The held breath. We sustain the gesture.",
    trigger: { kind: "mode-changed", to: "azure" },
    priority: 30,
  },
  {
    id: "aura-boss-leake",
    speaker: "aura",
    text: "The Safehouse is yours. We open the Mile.",
    trigger: { kind: "boss-defeated", zone: "leake-st-arches" },
    priority: 60,
  },
  {
    id: "aura-boss-royal",
    speaker: "aura",
    text: "The Spire is down. The grid opens. We move on.",
    trigger: { kind: "boss-defeated", zone: "royal-mile" },
    priority: 60,
  },
  {
    id: "aura-died",
    speaker: "aura",
    text: "We hold. Breathe. The Protocol restarts the line, not the runner.",
    trigger: { kind: "player-died" },
    priority: 70,
  },

  // ─── Yow — The Elder Construct (Autistic-coded) ──────────────────
  {
    id: "yow-pattern-1",
    speaker: "yow",
    text: "The pattern just landed. Three of these in eighteen seconds. I do not like it.",
    trigger: { kind: "speed-above", threshold: 1.2 },
    priority: 35,
  },
  {
    id: "yow-rule-veridian",
    speaker: "yow",
    text: "VERIDIAN. Now. The rule is the rule.",
    trigger: { kind: "mode-changed", to: "veridian" },
    priority: 45,
  },
  {
    id: "yow-health-low",
    speaker: "yow",
    text: "Health below thirty. This is the configuration I warned about.",
    trigger: { kind: "health-below", threshold: 30 },
    priority: 65,
  },
  {
    id: "yow-health-critical",
    speaker: "yow",
    text: "Twelve percent. The system is failing the documentation. Stop.",
    trigger: { kind: "health-below", threshold: 15 },
    priority: 80,
  },
  {
    id: "yow-zone-soho",
    speaker: "yow",
    text: "Soho. The grid is supposed to behave. This grid does not. Watch the corners.",
    trigger: { kind: "zone-entered", zone: "soho-grid" },
    priority: 55,
  },
  {
    id: "yow-combo-15",
    speaker: "yow",
    text: "Fifteen straight. That is a pattern. Do not break it.",
    trigger: { kind: "combo-above", threshold: 15 },
    priority: 40,
  },
  {
    id: "yow-died",
    speaker: "yow",
    text: "We deviated. The rule was clear. I will record where we deviated.",
    trigger: { kind: "player-died" },
    priority: 65,
  },
  {
    id: "yow-boss-soho",
    speaker: "yow",
    text: "The Monolith holds the grid's pattern. Break the pattern. That is the rule.",
    trigger: { kind: "boss-defeated", zone: "soho-grid" },
    priority: 55,
  },

  // ─── Purp — The Youth Construct (ADHD-coded) ─────────────────────
  {
    id: "purp-speed-fast",
    speaker: "purp",
    text: "Bruv, this one&rsquo;s preem. Send it.",
    trigger: { kind: "speed-above", threshold: 1.5 },
    priority: 45,
  },
  {
    id: "purp-mode-amethyst",
    speaker: "purp",
    text: "AMETHYST! Innit the colours? Switch! Switch!",
    trigger: { kind: "mode-changed", to: "amethyst" },
    priority: 40,
  },
  {
    id: "purp-mode-amber",
    speaker: "purp",
    text: "AMBER, fam. Tempo&rsquo;s up. Go faster.",
    trigger: { kind: "mode-changed", to: "amber" },
    priority: 35,
  },
  {
    id: "purp-mode-crimson",
    speaker: "purp",
    text: "CRIMSON. Yeah yeah yeah. Smash it.",
    trigger: { kind: "mode-changed", to: "crimson" },
    priority: 35,
  },
  {
    id: "purp-zone-soho",
    speaker: "purp",
    text: "Soho! Carnaby! Neon&rsquo;s buzzing innit. This is the proper one.",
    trigger: { kind: "zone-entered", zone: "soho-grid" },
    priority: 50,
  },
  {
    id: "purp-combo-10",
    speaker: "purp",
    text: "Ten in a row! You&rsquo;re glitching the matrix, fam.",
    trigger: { kind: "combo-above", threshold: 10 },
    priority: 35,
  },
  {
    id: "purp-combo-30",
    speaker: "purp",
    text: "Thirty! Bruv! Thirty! I cannot. I cannot.",
    trigger: { kind: "combo-above", threshold: 30 },
    priority: 55,
  },
  {
    id: "purp-died",
    speaker: "purp",
    text: "Ah nah, that was sick though. Go again. Go again, fam.",
    trigger: { kind: "player-died" },
    priority: 50,
  },
  {
    id: "purp-boss-royal",
    speaker: "purp",
    text: "Spire&rsquo;s gone! Did you see the way it folded? Did you see?!",
    trigger: { kind: "boss-defeated", zone: "royal-mile" },
    priority: 55,
  },
  {
    id: "purp-speed-very-fast",
    speaker: "purp",
    text: "Two-times baseline! That&rsquo;s naughty. I love it.",
    trigger: { kind: "speed-above", threshold: 2.0 },
    priority: 50,
  },
  {
    id: "purp-phase-3",
    speaker: "purp",
    text: "Phase three! The big one! Send it bruv!",
    trigger: { kind: "phase-start", phase: 3 },
    priority: 35,
  },
];

/**
 * Sampler input for pickDialogue. Mirrors the fields the trigger types
 * need; the caller wires this up from PlayerTelemetry plus the active
 * zone.
 */
export type DialogueSampler = {
  health: number;
  maxHealth: number;
  /** Speed multiplier. 1.0 is baseline. */
  speedMultiplier: number;
  combo: number;
  currentMode: ChronoModeSlug;
  /** Most-recent mode change, if any, since the last pickDialogue call. */
  lastModeChange: ChronoModeSlug | null;
  zone: ZoneSlug;
  /** Set to a zone slug on the tick the boss dies. */
  bossDefeatedThisTick: ZoneSlug | null;
  /** True on the tick health hit zero. */
  playerDiedThisTick: boolean;
  /** Set to the phase number on the tick the phase opens. */
  phaseStartedThisTick: number | null;
  /** Recent speakers — used to avoid two-in-a-row. */
  recentSpeakers: Construct[];
};

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
 * most-recent speaker takes a -25, the second-most a -12, etc.
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
