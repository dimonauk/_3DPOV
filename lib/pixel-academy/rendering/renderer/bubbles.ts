/**
 * lib/pixel-academy/rendering/renderer/bubbles.ts
 *
 * Speech-bubble overlay layer. Renders permission / waiting bubble
 * sprites above each character that has a `bubbleType` set. Waiting
 * bubbles fade out in the last `BUBBLE_FADE_DURATION_SEC`.
 */

import {
  BUBBLE_FADE_DURATION_SEC,
  BUBBLE_SITTING_OFFSET_PX,
  BUBBLE_VERTICAL_OFFSET_PX,
} from "../../constants";
import { CharacterState } from "../../types";
import type { Character } from "../../types";
import { getCachedSprite } from "../../sprites/sprite-cache";
import {
  BUBBLE_PERMISSION_SPRITE,
  BUBBLE_WAITING_SPRITE,
} from "../../sprites/sprite-data";

export function renderBubbles(
  ctx: CanvasRenderingContext2D,
  characters: Character[],
  offsetX: number,
  offsetY: number,
  zoom: number,
): void {
  for (const ch of characters) {
    if (!ch.bubbleType) continue;

    const sprite =
      ch.bubbleType === "permission"
        ? BUBBLE_PERMISSION_SPRITE
        : BUBBLE_WAITING_SPRITE;

    let alpha = 1.0;
    if (
      ch.bubbleType === "waiting" &&
      ch.bubbleTimer < BUBBLE_FADE_DURATION_SEC
    ) {
      alpha = ch.bubbleTimer / BUBBLE_FADE_DURATION_SEC;
    }

    const cached = getCachedSprite(sprite, zoom);
    const sittingOff =
      ch.state === CharacterState.TYPE ? BUBBLE_SITTING_OFFSET_PX : 0;
    const bubbleX = Math.round(offsetX + ch.x * zoom - cached.width / 2);
    const bubbleY = Math.round(
      offsetY +
        (ch.y + sittingOff - BUBBLE_VERTICAL_OFFSET_PX) * zoom -
        cached.height -
        1 * zoom,
    );

    ctx.save();
    if (alpha < 1.0) ctx.globalAlpha = alpha;
    ctx.drawImage(cached, bubbleX, bubbleY);
    ctx.restore();
  }
}
