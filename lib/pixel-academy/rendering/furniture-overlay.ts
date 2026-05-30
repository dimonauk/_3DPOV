/**
 * lib/pixel-academy/rendering/furniture-overlay.ts
 *
 * Pure derivation: given a base furniture list + an iterable of
 * characters + a seat registry, return the FurnitureInstance list
 * with active-agent overlays applied (electronics in the agent's
 * field of view get swapped to their ON variant).
 *
 * Stateless. Re-runnable. The office state calls this whenever it
 * needs to recompute the rendered furniture (active toggled, layout
 * changed, etc.).
 */

import {
  AUTO_ON_FACING_DEPTH,
  AUTO_ON_SIDE_DEPTH,
} from "../constants";
import { Direction } from "../types";
import type { Character, FurnitureInstance, PlacedFurniture } from "../types";
import {
  getCatalogEntry,
  getOnStateType,
} from "../layout/furniture-catalog";
import { layoutToFurnitureInstances } from "../layout/layout-serializer";
import type { SeatRegistry } from "./seat-registry";

export function buildFurnitureInstances(
  base: PlacedFurniture[],
  characters: Iterable<Character>,
  seats: SeatRegistry,
): FurnitureInstance[] {
  const autoOnTiles = collectAutoOnTiles(characters, seats);

  if (autoOnTiles.size === 0) {
    return layoutToFurnitureInstances(base);
  }

  const modified: PlacedFurniture[] = base.map((item) => {
    const entry = getCatalogEntry(item.type);
    if (!entry) return item;
    for (let dr = 0; dr < entry.footprintH; dr++) {
      for (let dc = 0; dc < entry.footprintW; dc++) {
        if (autoOnTiles.has(`${item.col + dc},${item.row + dr}`)) {
          const onType = getOnStateType(item.type);
          if (onType !== item.type) {
            return { ...item, type: onType };
          }
          return item;
        }
      }
    }
    return item;
  });

  return layoutToFurnitureInstances(modified);
}

function collectAutoOnTiles(
  characters: Iterable<Character>,
  seats: SeatRegistry,
): Set<string> {
  const autoOnTiles = new Set<string>();
  for (const ch of characters) {
    if (!ch.isActive || !ch.seatId) continue;
    const seat = seats.get(ch.seatId);
    if (!seat) continue;
    const dCol =
      seat.facingDir === Direction.RIGHT
        ? 1
        : seat.facingDir === Direction.LEFT
          ? -1
          : 0;
    const dRow =
      seat.facingDir === Direction.DOWN
        ? 1
        : seat.facingDir === Direction.UP
          ? -1
          : 0;
    for (let d = 1; d <= AUTO_ON_FACING_DEPTH; d++) {
      autoOnTiles.add(`${seat.seatCol + dCol * d},${seat.seatRow + dRow * d}`);
    }
    for (let d = 1; d <= AUTO_ON_SIDE_DEPTH; d++) {
      const baseCol = seat.seatCol + dCol * d;
      const baseRow = seat.seatRow + dRow * d;
      if (dCol !== 0) {
        autoOnTiles.add(`${baseCol},${baseRow - 1}`);
        autoOnTiles.add(`${baseCol},${baseRow + 1}`);
      } else {
        autoOnTiles.add(`${baseCol - 1},${baseRow}`);
        autoOnTiles.add(`${baseCol + 1},${baseRow}`);
      }
    }
  }
  return autoOnTiles;
}
