/**
 * lib/pixel-academy/rendering/bubble-rules.ts
 *
 * Pure functions that mutate the speech-bubble fields of a Character.
 * Bubble state lives ON the Character (bubbleType + bubbleTimer), so
 * this module doesn't own data of its own — it's a rule book for
 * legal bubble transitions, not a system.
 *
 * Two bubble kinds:
 *   "permission" — appears when the agent asks for a tool grant;
 *                  cleared explicitly when the operator answers.
 *   "waiting"    — appears with a built-in timer that ticks down in
 *                  the frame loop; dismissed early on click via a
 *                  fast-fade.
 */

import {
  DISMISS_BUBBLE_FAST_FADE_SEC,
  WAITING_BUBBLE_DURATION_SEC,
} from "../constants";
import type { Character } from "../types";

export function showPermission(ch: Character | undefined): void {
  if (!ch) return;
  ch.bubbleType = "permission";
  ch.bubbleTimer = 0;
}

export function clearPermission(ch: Character | undefined): void {
  if (!ch) return;
  if (ch.bubbleType === "permission") {
    ch.bubbleType = null;
    ch.bubbleTimer = 0;
  }
}

export function showWaiting(ch: Character | undefined): void {
  if (!ch) return;
  ch.bubbleType = "waiting";
  ch.bubbleTimer = WAITING_BUBBLE_DURATION_SEC;
}

/** Dismiss-on-click — permission goes instantly, waiting fast-fades. */
export function dismiss(ch: Character | undefined): void {
  if (!ch || !ch.bubbleType) return;
  if (ch.bubbleType === "permission") {
    ch.bubbleType = null;
    ch.bubbleTimer = 0;
  } else if (ch.bubbleType === "waiting") {
    ch.bubbleTimer = Math.min(ch.bubbleTimer, DISMISS_BUBBLE_FAST_FADE_SEC);
  }
}

/**
 * Frame-tick: bleed the waiting timer and clear when expired.
 * Returns whether the bubble was cleared this tick.
 */
export function tickWaiting(ch: Character, dt: number): boolean {
  if (ch.bubbleType !== "waiting") return false;
  ch.bubbleTimer -= dt;
  if (ch.bubbleTimer <= 0) {
    ch.bubbleType = null;
    ch.bubbleTimer = 0;
    return true;
  }
  return false;
}
