/**
 * lib/pixel-academy/rendering/renderer/seat-indicators.ts
 *
 * Highlight a single hovered seat tile in the colour appropriate to
 * its relationship with the selected agent:
 *   - own seat → blue
 *   - free    → green
 *   - busy    → red
 * Renders nothing when no agent is selected or no tile is hovered.
 */

import {
  SEAT_AVAILABLE_COLOR,
  SEAT_BUSY_COLOR,
  SEAT_OWN_COLOR,
} from "../../constants";
import { TILE_SIZE } from "../../types";
import type { Character, Seat } from "../../types";

export function renderSeatIndicators(
  ctx: CanvasRenderingContext2D,
  seats: Map<string, Seat>,
  characters: Map<number, Character>,
  selectedAgentId: number | null,
  hoveredTile: { col: number; row: number } | null,
  offsetX: number,
  offsetY: number,
  zoom: number,
): void {
  if (selectedAgentId === null || !hoveredTile) return;
  const selectedChar = characters.get(selectedAgentId);
  if (!selectedChar) return;

  for (const [uid, seat] of seats) {
    if (seat.seatCol !== hoveredTile.col || seat.seatRow !== hoveredTile.row) {
      continue;
    }

    const s = TILE_SIZE * zoom;
    const x = offsetX + seat.seatCol * s;
    const y = offsetY + seat.seatRow * s;

    if (selectedChar.seatId === uid) {
      ctx.fillStyle = SEAT_OWN_COLOR;
    } else if (!seat.assigned) {
      ctx.fillStyle = SEAT_AVAILABLE_COLOR;
    } else {
      ctx.fillStyle = SEAT_BUSY_COLOR;
    }
    ctx.fillRect(x, y, s, s);
    break;
  }
}
