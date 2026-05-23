/**
 * lib/pixel-academy/rendering/office-state/furniture-rebuild.ts
 *
 * Rebuilds the furniture instance list with the auto-on overlay
 * applied: any electronics tile facing an active agent is swapped to
 * its ON variant (monitor lit, lamp glowing, etc.). Pure derivation
 * from the current `state.layout.furniture` + `state.characters`.
 *
 * Extracted from `office-state.ts` to keep the orchestrator under
 * the 300-line cap.
 */

import { Direction } from "../../types";
import {
  AUTO_ON_FACING_DEPTH,
  AUTO_ON_SIDE_DEPTH,
} from "../../constants";
import type { PlacedFurniture } from "../../types";
import {
  getCatalogEntry,
  getOnStateType,
} from "../../layout/furniture-catalog";
import { layoutToFurnitureInstances } from "../../layout/layout-serializer";
import type { OfficeState } from "../office-state";

export function rebuildFurnitureInstances(state: OfficeState): void {
  const autoOnTiles = collectAutoOnTiles(state);

  if (autoOnTiles.size === 0) {
    state.furniture = layoutToFurnitureInstances(state.layout.furniture);
    return;
  }

  const modifiedFurniture: PlacedFurniture[] = state.layout.furniture.map(
    (item) => {
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
    },
  );

  state.furniture = layoutToFurnitureInstances(modifiedFurniture);
}

function collectAutoOnTiles(state: OfficeState): Set<string> {
  const autoOnTiles = new Set<string>();
  for (const ch of state.characters.values()) {
    if (!ch.isActive || !ch.seatId) continue;
    const seat = state.seats.get(ch.seatId);
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
