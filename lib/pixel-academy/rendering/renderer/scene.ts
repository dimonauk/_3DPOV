/**
 * lib/pixel-academy/rendering/renderer/scene.ts
 *
 * Z-sorted scene pass: walls + furniture + characters, plus the
 * optional outline overlay for selected / hovered agents. Each
 * draw is buffered as a ZDrawable; the buffer is sorted by zY at
 * the end so lower-on-screen items render in front.
 *
 * ZDrawable is module-private — the public surface is just the
 * `renderScene` function.
 */

import {
  CHARACTER_Z_SORT_OFFSET,
  HOVERED_OUTLINE_ALPHA,
  OUTLINE_Z_SORT_OFFSET,
  SELECTED_OUTLINE_ALPHA,
  CHARACTER_SITTING_OFFSET_PX,
} from "../../constants";
import { TILE_SIZE, CharacterState } from "../../types";
import type { Character, FurnitureInstance } from "../../types";
import { getCachedSprite, getOutlineSprite } from "../../sprites/sprite-cache";
import { getCharacterSprites } from "../../sprites/sprite-data";
import { getCharacterSprite } from "../characters";
import { renderMatrixEffect } from "../matrix-effect";

interface ZDrawable {
  zY: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  furniture: FurnitureInstance[],
  characters: Character[],
  offsetX: number,
  offsetY: number,
  zoom: number,
  selectedAgentId: number | null,
  hoveredAgentId: number | null,
): void {
  const drawables: ZDrawable[] = [];

  // Furniture
  for (const f of furniture) {
    const cached = getCachedSprite(f.sprite, zoom);
    const fx = offsetX + f.x * zoom;
    const fy = offsetY + f.y * zoom;
    drawables.push({
      zY: f.zY,
      draw: (c) => {
        c.drawImage(cached, fx, fy);
      },
    });
  }

  // Characters
  for (const ch of characters) {
    const sprites = getCharacterSprites(ch.palette, ch.hueShift);
    const spriteData = getCharacterSprite(ch, sprites);
    const cached = getCachedSprite(spriteData, zoom);
    const sittingOffset =
      ch.state === CharacterState.TYPE ? CHARACTER_SITTING_OFFSET_PX : 0;
    const drawX = Math.round(offsetX + ch.x * zoom - cached.width / 2);
    const drawY = Math.round(
      offsetY + (ch.y + sittingOffset) * zoom - cached.height,
    );

    // Sort characters by tile-bottom so they render in front of
    // same-row furniture (chairs) but behind lower-row furniture
    // (desks, bookshelves that occlude from below).
    const charZY = ch.y + TILE_SIZE / 2 + CHARACTER_Z_SORT_OFFSET;

    if (ch.matrixEffect) {
      const mDrawX = drawX;
      const mDrawY = drawY;
      const mSpriteData = spriteData;
      const mCh = ch;
      drawables.push({
        zY: charZY,
        draw: (c) => {
          renderMatrixEffect(c, mCh, mSpriteData, mDrawX, mDrawY, zoom);
        },
      });
      continue;
    }

    const isSelected =
      selectedAgentId !== null && ch.id === selectedAgentId;
    const isHovered = hoveredAgentId !== null && ch.id === hoveredAgentId;
    if (isSelected || isHovered) {
      const outlineAlpha = isSelected
        ? SELECTED_OUTLINE_ALPHA
        : HOVERED_OUTLINE_ALPHA;
      const outlineData = getOutlineSprite(spriteData);
      const outlineCached = getCachedSprite(outlineData, zoom);
      const olDrawX = drawX - zoom;
      const olDrawY = drawY - zoom;
      drawables.push({
        zY: charZY - OUTLINE_Z_SORT_OFFSET,
        draw: (c) => {
          c.save();
          c.globalAlpha = outlineAlpha;
          c.drawImage(outlineCached, olDrawX, olDrawY);
          c.restore();
        },
      });
    }

    drawables.push({
      zY: charZY,
      draw: (c) => {
        c.drawImage(cached, drawX, drawY);
      },
    });
  }

  drawables.sort((a, b) => a.zY - b.zY);
  for (const d of drawables) d.draw(ctx);
}
