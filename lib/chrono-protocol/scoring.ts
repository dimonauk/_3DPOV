/**
 * Chrono-Protocol scoring.
 *
 * The 5-mode wheel's allies/enemies translate directly to score:
 *   - mode-correct match (used mode == enemy's weakness): 2x base.
 *   - ally-on-wheel (used mode is an ally of the enemy's weakness):
 *     1.25x base (the angle reads sympathetic; partial credit).
 *   - enemy-on-wheel (used mode is an enemy of the enemy's weakness):
 *     0.5x base (the angle reads adversarial; the hit lands soft).
 *   - same-mode (used == weakness — already covered by the
 *     mode-correct path).
 *
 * Combos compound: every five consecutive clears multiplies the next
 * event by an extra +0.1 (combo 10 = +0.2, combo 25 = +0.5, capped at
 * +1.0).
 *
 * Boss kills score on remaining-health: full hp at kill is a perfect
 * boss; the score interpolates linearly to a hp-zero floor.
 */

import {
  type ChronoMode,
  type ChronoModeSlug,
  getMode,
} from "../chrono-protocol";
import type { ZoneSlug } from "./zones";

export type ScoreEvent =
  | {
      kind: "enemy-defeated";
      modeUsed: ChronoModeSlug;
      enemyWeakness: ChronoModeSlug;
      enemyHp: number;
      /** True when the mode used reads ally-on-wheel relative to the enemy. */
      allyBonus: boolean;
    }
  | { kind: "combo-tick"; comboCount: number }
  | {
      kind: "mode-correct-match";
      targetMode: ChronoModeSlug;
      usedMode: ChronoModeSlug;
    }
  | { kind: "phase-cleared"; phase: number }
  | {
      kind: "boss-defeated";
      zone: ZoneSlug;
      remainingHealthRatio: number;
      bossHp: number;
    }
  | { kind: "perfect-run"; zone: ZoneSlug };

const ENEMY_BASE_SCORE = 50;
const COMBO_TICK_SCORE = 5;
const PHASE_CLEARED_SCORE = 250;
const BOSS_BASE_SCORE = 800;
const PERFECT_RUN_BONUS = 2000;

/**
 * Wheel-relation between two modes.
 *
 * 'same' when the used mode is the target's weakness exactly.
 * 'ally' when the used mode is adjacent to the target's weakness on the
 * wheel (a sympathetic angle).
 * 'enemy' when the used mode is a non-adjacent — adversarial.
 */
function wheelRelation(
  usedMode: ChronoModeSlug,
  targetWeakness: ChronoModeSlug,
): "same" | "ally" | "enemy" {
  if (usedMode === targetWeakness) return "same";
  const target: ChronoMode | undefined = getMode(targetWeakness);
  if (!target) return "enemy";
  if (target.allies.includes(usedMode)) return "ally";
  return "enemy";
}

function comboMultiplier(combo: number): number {
  const steps = Math.floor(combo / 5);
  return 1 + Math.min(1.0, steps * 0.1);
}

export function scoreEvent(event: ScoreEvent): number {
  switch (event.kind) {
    case "enemy-defeated": {
      const rel = wheelRelation(event.modeUsed, event.enemyWeakness);
      let mult = 1;
      if (rel === "same") mult = 2;
      else if (rel === "ally" || event.allyBonus) mult = 1.25;
      else mult = 0.5;
      return Math.round(ENEMY_BASE_SCORE * event.enemyHp * mult);
    }
    case "combo-tick":
      return Math.round(COMBO_TICK_SCORE * comboMultiplier(event.comboCount));
    case "mode-correct-match": {
      const rel = wheelRelation(event.usedMode, event.targetMode);
      if (rel === "same") return 100;
      if (rel === "ally") return 25;
      return 0;
    }
    case "phase-cleared":
      return PHASE_CLEARED_SCORE * event.phase;
    case "boss-defeated": {
      const ratio = Math.max(0, Math.min(1, event.remainingHealthRatio));
      const lerp = 0.4 + 0.6 * ratio;
      return Math.round(BOSS_BASE_SCORE * lerp * (event.bossHp / 14));
    }
    case "perfect-run":
      return PERFECT_RUN_BONUS;
  }
}

export function totalScore(events: readonly ScoreEvent[]): number {
  let sum = 0;
  for (const ev of events) sum += scoreEvent(ev);
  return sum;
}

/**
 * Returns the wheel-relation as a label for the HUD — "perfect",
 * "sympathetic", "off-angle". Useful for the per-hit floater that the
 * run-scene renders.
 */
export function relationLabel(
  usedMode: ChronoModeSlug,
  targetWeakness: ChronoModeSlug,
): "perfect" | "sympathetic" | "off-angle" {
  const rel = wheelRelation(usedMode, targetWeakness);
  if (rel === "same") return "perfect";
  if (rel === "ally") return "sympathetic";
  return "off-angle";
}
