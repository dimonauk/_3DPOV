/**
 * lib/pixel-academy/rendering/office-layout-rebuild.ts
 *
 * Applies a new OfficeLayout to an existing simulation: shifts
 * characters when the grid expands, runs a two-pass seat
 * reassignment that preserves existing assignments where possible,
 * and relocates any out-of-bounds floaters to a walkable tile.
 *
 * Pure orchestration helper — composes CharacterStore + SeatRegistry
 * through their public APIs. Lives outside `office-state.ts` to keep
 * the composition orchestrator under the 300-line cap.
 */

import { TILE_SIZE, type OfficeLayout } from "../types";
import type { CharacterStore } from "./character-store";
import type { SeatRegistry } from "./seat-registry";

export type RebuildContext = {
  characters: CharacterStore;
  seats: SeatRegistry;
  walkableTiles: Array<{ col: number; row: number }>;
};

export function applyLayoutRebuild(
  ctx: RebuildContext,
  newLayout: OfficeLayout,
  shift?: { col: number; row: number },
): void {
  if (shift && (shift.col !== 0 || shift.row !== 0)) {
    shiftCharacters(ctx, shift);
  }
  reassignSeats(ctx);
  relocateOutOfBounds(ctx, newLayout);
}

function shiftCharacters(
  ctx: RebuildContext,
  shift: { col: number; row: number },
): void {
  for (const ch of ctx.characters.values()) {
    ch.tileCol += shift.col;
    ch.tileRow += shift.row;
    ch.x += shift.col * TILE_SIZE;
    ch.y += shift.row * TILE_SIZE;
    ch.path = [];
    ch.moveProgress = 0;
  }
}

/**
 * Two-pass seat reassignment. Pass 1: keep every character whose
 * previous seat still exists in the new layout. Pass 2: fill any
 * remaining character into a free seat.
 */
function reassignSeats(ctx: RebuildContext): void {
  ctx.seats.releaseAll();

  for (const ch of ctx.characters.values()) {
    if (ch.seatId && ctx.seats.assign(ch.seatId)) {
      snapToSeat(ch, ctx.seats);
    } else {
      ch.seatId = null;
    }
  }

  for (const ch of ctx.characters.values()) {
    if (ch.seatId) continue;
    const free = ctx.seats.findFree();
    if (!free || !ctx.seats.assign(free)) continue;
    ch.seatId = free;
    snapToSeat(ch, ctx.seats);
  }
}

function snapToSeat(
  ch: { seatId: string | null; tileCol: number; tileRow: number; x: number; y: number; dir: number },
  seats: SeatRegistry,
): void {
  if (!ch.seatId) return;
  const seat = seats.get(ch.seatId);
  if (!seat) return;
  ch.tileCol = seat.seatCol;
  ch.tileRow = seat.seatRow;
  ch.x = seat.seatCol * TILE_SIZE + TILE_SIZE / 2;
  ch.y = seat.seatRow * TILE_SIZE + TILE_SIZE / 2;
  ch.dir = seat.facingDir;
}

function relocateOutOfBounds(
  ctx: RebuildContext,
  layout: OfficeLayout,
): void {
  if (ctx.walkableTiles.length === 0) return;
  for (const ch of ctx.characters.values()) {
    if (ch.seatId) continue;
    const oob =
      ch.tileCol < 0 ||
      ch.tileCol >= layout.cols ||
      ch.tileRow < 0 ||
      ch.tileRow >= layout.rows;
    if (!oob) continue;
    const spawn =
      ctx.walkableTiles[Math.floor(Math.random() * ctx.walkableTiles.length)]!;
    ch.tileCol = spawn.col;
    ch.tileRow = spawn.row;
    ch.x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    ch.y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
    ch.path = [];
    ch.moveProgress = 0;
  }
}
