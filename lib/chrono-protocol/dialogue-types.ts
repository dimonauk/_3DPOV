/**
 * lib/chrono-protocol/dialogue-types.ts — Type-only module for the dialogue
 * system. Lives separately so `dialogue-lines.ts` (the content registry)
 * can import types without creating a circular dependency with the matcher
 * module.
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
