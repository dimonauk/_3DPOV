/**
 * lib/pixel-academy/rendering/renderer/tiles.ts
 *
 * Floor + wall base-colour pass. Iterates the tile map, draws either
 * a colorised floor sprite or a solid fill per tile. Skips VOID
 * tiles entirely (transparent).
 */

import { TILE_SIZE, TileType } from "../../types";
import type {
  FloorColor,
  TileType as TileTypeVal,
} from "../../types";
import { FALLBACK_FLOOR_COLOR } from "../../constants";
import {
  getColorizedFloorSprite,
  hasFloorSprites,
  WALL_COLOR,
} from "../../floor-tiles";
import { wallColorToHex } from "../../wall-tiles";
import { getCachedSprite } from "../../sprites/sprite-cache";

export function renderTileGrid(
  ctx: CanvasRenderingContext2D,
  tileMap: TileTypeVal[][],
  offsetX: number,
  offsetY: number,
  zoom: number,
  tileColors?: Array<FloorColor | null>,
  cols?: number,
): void {
  const s = TILE_SIZE * zoom;
  const useSpriteFloors = hasFloorSprites();
  const tmRows = tileMap.length;
  const tmCols = tmRows > 0 ? tileMap[0]!.length : 0;
  const layoutCols = cols ?? tmCols;

  for (let r = 0; r < tmRows; r++) {
    for (let c = 0; c < tmCols; c++) {
      const tile = tileMap[r]![c]!;
      if (tile === TileType.VOID) continue;

      if (tile === TileType.WALL || !useSpriteFloors) {
        if (tile === TileType.WALL) {
          const colorIdx = r * layoutCols + c;
          const wallColor = tileColors?.[colorIdx];
          ctx.fillStyle = wallColor ? wallColorToHex(wallColor) : WALL_COLOR;
        } else {
          ctx.fillStyle = FALLBACK_FLOOR_COLOR;
        }
        ctx.fillRect(offsetX + c * s, offsetY + r * s, s, s);
        continue;
      }

      const colorIdx = r * layoutCols + c;
      const color = tileColors?.[colorIdx] ?? { h: 0, s: 0, b: 0, c: 0 };
      const sprite = getColorizedFloorSprite(tile, color);
      const cached = getCachedSprite(sprite, zoom);
      ctx.drawImage(cached, offsetX + c * s, offsetY + r * s);
    }
  }
}
