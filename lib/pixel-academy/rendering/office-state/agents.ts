/**
 * lib/pixel-academy/rendering/office-state/agents.ts
 *
 * Agent lifecycle: addAgent / removeAgent / setAgentActive /
 * setAgentTool / walkToTile. Extracted from `office-state.ts` to
 * keep the orchestrator under the 300-line cap.
 */

import { TILE_SIZE, CharacterState } from "../../types";
import type { Character } from "../../types";
import { createCharacter } from "../characters";
import { matrixEffectSeeds } from "../matrix-effect";
import { findPath, isWalkable } from "../../layout/tile-map";
import { pickDiversePalette } from "./palette";
import { ownSeatKey, withOwnSeatUnblocked, findFreeSeat } from "./seats";
import { rebuildFurnitureInstances } from "./furniture-rebuild";
import type { OfficeState } from "../office-state";

export function addAgent(
  state: OfficeState,
  id: number,
  preferredPalette?: number,
  preferredHueShift?: number,
  preferredSeatId?: string,
  skipSpawnEffect?: boolean,
  folderName?: string,
): void {
  if (state.characters.has(id)) return;

  let palette: number;
  let hueShift: number;
  if (preferredPalette !== undefined) {
    palette = preferredPalette;
    hueShift = preferredHueShift ?? 0;
  } else {
    const pick = pickDiversePalette(state);
    palette = pick.palette;
    hueShift = pick.hueShift;
  }

  let seatId: string | null = null;
  if (preferredSeatId && state.seats.has(preferredSeatId)) {
    const seat = state.seats.get(preferredSeatId)!;
    if (!seat.assigned) {
      seatId = preferredSeatId;
    }
  }
  if (!seatId) {
    seatId = findFreeSeat(state);
  }

  let ch: Character;
  if (seatId) {
    const seat = state.seats.get(seatId)!;
    seat.assigned = true;
    ch = createCharacter(id, palette, seatId, seat, hueShift);
  } else {
    const spawn =
      state.walkableTiles.length > 0
        ? state.walkableTiles[
            Math.floor(Math.random() * state.walkableTiles.length)
          ]!
        : { col: 1, row: 1 };
    ch = createCharacter(id, palette, null, null, hueShift);
    ch.x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    ch.y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
    ch.tileCol = spawn.col;
    ch.tileRow = spawn.row;
  }

  if (folderName) ch.folderName = folderName;
  if (!skipSpawnEffect) {
    ch.matrixEffect = "spawn";
    ch.matrixEffectTimer = 0;
    ch.matrixEffectSeeds = matrixEffectSeeds();
  }
  state.characters.set(id, ch);
}

export function removeAgent(state: OfficeState, id: number): void {
  const ch = state.characters.get(id);
  if (!ch) return;
  if (ch.matrixEffect === "despawn") return; // already despawning
  if (ch.seatId) {
    const seat = state.seats.get(ch.seatId);
    if (seat) seat.assigned = false;
  }
  if (state.selectedAgentId === id) state.selectedAgentId = null;
  if (state.cameraFollowId === id) state.cameraFollowId = null;
  ch.matrixEffect = "despawn";
  ch.matrixEffectTimer = 0;
  ch.matrixEffectSeeds = matrixEffectSeeds();
  ch.bubbleType = null;
}

export function setAgentActive(
  state: OfficeState,
  id: number,
  active: boolean,
): void {
  const ch = state.characters.get(id);
  if (!ch) return;
  ch.isActive = active;
  if (!active) {
    // Sentinel -1: signals turn just ended, skip next seat rest timer.
    // Prevents the WALK handler from setting a 2-4 min rest on arrival.
    ch.seatTimer = -1;
    ch.path = [];
    ch.moveProgress = 0;
  }
  rebuildFurnitureInstances(state);
}

export function setAgentTool(
  state: OfficeState,
  id: number,
  tool: string | null,
): void {
  const ch = state.characters.get(id);
  if (ch) ch.currentTool = tool;
}

/** Walk an agent to an arbitrary walkable tile (right-click command). */
export function walkToTile(
  state: OfficeState,
  agentId: number,
  col: number,
  row: number,
): boolean {
  const ch = state.characters.get(agentId);
  if (!ch || ch.isSubagent) return false;
  if (!isWalkable(col, row, state.tileMap, state.blockedTiles)) {
    const key = ownSeatKey(state, ch);
    if (!key || key !== `${col},${row}`) return false;
  }
  const path = withOwnSeatUnblocked(state, ch, () =>
    findPath(
      ch.tileCol,
      ch.tileRow,
      col,
      row,
      state.tileMap,
      state.blockedTiles,
    ),
  );
  if (path.length === 0) return false;
  ch.path = path;
  ch.moveProgress = 0;
  ch.state = CharacterState.WALK;
  ch.frame = 0;
  ch.frameTimer = 0;
  return true;
}
