/**
 * lib/pixel-academy/rendering/office-state/bubbles.ts
 *
 * Permission + waiting speech-bubble management for office agents.
 * Extracted from `office-state.ts` to keep the orchestrator under
 * the 300-line cap.
 */

import {
  DISMISS_BUBBLE_FAST_FADE_SEC,
  WAITING_BUBBLE_DURATION_SEC,
} from "../../constants";
import type { OfficeState } from "../office-state";

export function showPermissionBubble(state: OfficeState, id: number): void {
  const ch = state.characters.get(id);
  if (ch) {
    ch.bubbleType = "permission";
    ch.bubbleTimer = 0;
  }
}

export function clearPermissionBubble(state: OfficeState, id: number): void {
  const ch = state.characters.get(id);
  if (ch && ch.bubbleType === "permission") {
    ch.bubbleType = null;
    ch.bubbleTimer = 0;
  }
}

export function showWaitingBubble(state: OfficeState, id: number): void {
  const ch = state.characters.get(id);
  if (ch) {
    ch.bubbleType = "waiting";
    ch.bubbleTimer = WAITING_BUBBLE_DURATION_SEC;
  }
}

/** Dismiss bubble on click — permission: instant, waiting: quick fade. */
export function dismissBubble(state: OfficeState, id: number): void {
  const ch = state.characters.get(id);
  if (!ch || !ch.bubbleType) return;
  if (ch.bubbleType === "permission") {
    ch.bubbleType = null;
    ch.bubbleTimer = 0;
  } else if (ch.bubbleType === "waiting") {
    ch.bubbleTimer = Math.min(ch.bubbleTimer, DISMISS_BUBBLE_FAST_FADE_SEC);
  }
}
