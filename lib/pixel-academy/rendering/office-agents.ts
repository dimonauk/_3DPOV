/**
 * lib/pixel-academy/rendering/office-agents.ts
 *
 * Agent lifecycle that crosses subsystem boundaries: spawning needs
 * a seat AND a character body; despawning needs both released. Pure
 * orchestration helpers that compose `CharacterStore` + `SeatRegistry`
 * through their public APIs — no shared mutable state, no internal
 * field access.
 *
 * Movement (walkToTile / seat reassignment / sendToSeat) also lives
 * here because all three coordinate pathfinding against seats +
 * blocked tiles.
 */

import {
  INACTIVE_SEAT_TIMER_MIN_SEC,
  INACTIVE_SEAT_TIMER_RANGE_SEC,
} from "../constants";
import {
  CharacterState,
  Direction,
  TILE_SIZE,
  type Character,
  type TileType as TileTypeVal,
} from "../types";
import { createCharacter } from "./characters";
import { matrixEffectSeeds } from "./matrix-effect";
import { findPath, isWalkable } from "../layout/tile-map";
import type { CharacterStore } from "./character-store";
import type { SeatRegistry } from "./seat-registry";
import { pickDiversePalette } from "./palette-picker";

export type SpawnContext = {
  characters: CharacterStore;
  seats: SeatRegistry;
  walkableTiles: Array<{ col: number; row: number }>;
};

export type AgentSpawnOptions = {
  preferredPalette?: number;
  preferredHueShift?: number;
  preferredSeatId?: string;
  skipSpawnEffect?: boolean;
  folderName?: string;
};

export function spawnAgent(
  ctx: SpawnContext,
  id: number,
  opts: AgentSpawnOptions = {},
): void {
  if (ctx.characters.has(id)) return;

  let palette: number;
  let hueShift: number;
  if (opts.preferredPalette !== undefined) {
    palette = opts.preferredPalette;
    hueShift = opts.preferredHueShift ?? 0;
  } else {
    const pick = pickDiversePalette(ctx.characters.values());
    palette = pick.palette;
    hueShift = pick.hueShift;
  }

  let seatId: string | null = null;
  if (opts.preferredSeatId && ctx.seats.assign(opts.preferredSeatId)) {
    seatId = opts.preferredSeatId;
  } else {
    const free = ctx.seats.findFree();
    if (free && ctx.seats.assign(free)) seatId = free;
  }

  let ch: Character;
  if (seatId) {
    ch = createCharacter(id, palette, seatId, ctx.seats.get(seatId)!, hueShift);
  } else {
    const spawn =
      ctx.walkableTiles.length > 0
        ? ctx.walkableTiles[
            Math.floor(Math.random() * ctx.walkableTiles.length)
          ]!
        : { col: 1, row: 1 };
    ch = createCharacter(id, palette, null, null, hueShift);
    ch.x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    ch.y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
    ch.tileCol = spawn.col;
    ch.tileRow = spawn.row;
  }

  if (opts.folderName) ch.folderName = opts.folderName;
  if (!opts.skipSpawnEffect) {
    ch.matrixEffect = "spawn";
    ch.matrixEffectTimer = 0;
    ch.matrixEffectSeeds = matrixEffectSeeds();
  }
  ctx.characters.add(ch);
}

/**
 * Start the despawn animation. Releases the seat immediately so it
 * can be reused, but keeps the character body around until the
 * matrix-effect timer completes (the frame loop deletes it then).
 */
export function despawnAgent(ctx: SpawnContext, id: number): void {
  const ch = ctx.characters.get(id);
  if (!ch) return;
  if (ch.matrixEffect === "despawn") return;
  if (ch.seatId) ctx.seats.release(ch.seatId);
  if (ctx.characters.selectedAgentId === id) ctx.characters.selectedAgentId = null;
  if (ctx.characters.cameraFollowId === id) ctx.characters.cameraFollowId = null;
  ch.matrixEffect = "despawn";
  ch.matrixEffectTimer = 0;
  ch.matrixEffectSeeds = matrixEffectSeeds();
  ch.bubbleType = null;
}

/** Reassign an agent from their current seat to a new seat. */
export function reassignSeat(
  ctx: SpawnContext,
  tileMap: TileTypeVal[][],
  agentId: number,
  newSeatId: string,
): void {
  const ch = ctx.characters.get(agentId);
  if (!ch) return;
  if (ch.seatId) ctx.seats.release(ch.seatId);
  if (!ctx.seats.assign(newSeatId)) return;
  ch.seatId = newSeatId;
  const seat = ctx.seats.get(newSeatId)!;
  pathOrSit(ctx, tileMap, ch, seat.seatCol, seat.seatRow, seat.facingDir);
}

/** Send an agent back to their currently assigned seat. */
export function sendToSeat(
  ctx: SpawnContext,
  tileMap: TileTypeVal[][],
  agentId: number,
): void {
  const ch = ctx.characters.get(agentId);
  if (!ch || !ch.seatId) return;
  const seat = ctx.seats.get(ch.seatId);
  if (!seat) return;
  pathOrSit(ctx, tileMap, ch, seat.seatCol, seat.seatRow, seat.facingDir);
}

/** Right-click walk: move to a walkable tile (or own seat tile). */
export function walkToTile(
  ctx: SpawnContext,
  tileMap: TileTypeVal[][],
  agentId: number,
  col: number,
  row: number,
): boolean {
  const ch = ctx.characters.get(agentId);
  if (!ch || ch.isSubagent) return false;
  if (!isWalkable(col, row, tileMap, ctx.seats.blocked)) {
    const key = ch.seatId ? ctx.seats.tileKey(ch.seatId) : null;
    if (!key || key !== `${col},${row}`) return false;
  }
  const key = ch.seatId ? ctx.seats.tileKey(ch.seatId) : null;
  const path = ctx.seats.withTileUnblocked(key, () =>
    findPath(ch.tileCol, ch.tileRow, col, row, tileMap, ctx.seats.blocked),
  );
  if (path.length === 0) return false;
  ch.path = path;
  ch.moveProgress = 0;
  ch.state = CharacterState.WALK;
  ch.frame = 0;
  ch.frameTimer = 0;
  return true;
}

// ---------------------------------------------------------------------
// Shared sub-helper: try to pathfind to a seat; if already there,
// sit down with the seat's facing direction.
// ---------------------------------------------------------------------

function pathOrSit(
  ctx: SpawnContext,
  tileMap: TileTypeVal[][],
  ch: Character,
  targetCol: number,
  targetRow: number,
  facingDir: Direction,
): void {
  const key = ch.seatId ? ctx.seats.tileKey(ch.seatId) : null;
  const path = ctx.seats.withTileUnblocked(key, () =>
    findPath(ch.tileCol, ch.tileRow, targetCol, targetRow, tileMap, ctx.seats.blocked),
  );
  if (path.length > 0) {
    ch.path = path;
    ch.moveProgress = 0;
    ch.state = CharacterState.WALK;
    ch.frame = 0;
    ch.frameTimer = 0;
  } else {
    ch.state = CharacterState.TYPE;
    ch.dir = facingDir;
    ch.frame = 0;
    ch.frameTimer = 0;
    if (!ch.isActive) {
      ch.seatTimer =
        INACTIVE_SEAT_TIMER_MIN_SEC +
        Math.random() * INACTIVE_SEAT_TIMER_RANGE_SEC;
    }
  }
}
