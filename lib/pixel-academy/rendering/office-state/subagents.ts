/**
 * lib/pixel-academy/rendering/office-state/subagents.ts
 *
 * Sub-agent CRUD + seat assignment. A sub-agent is a child character
 * spawned by a tool call from a parent agent. It uses the parent's
 * palette and lives in `state.characters` with a negative id.
 *
 * Extracted from `office-state.ts` to keep the orchestrator under
 * the 300-line cap. All functions take the OfficeState by reference
 * and mutate its public fields in place.
 */

import { TILE_SIZE } from "../../types";
import type { Character } from "../../types";
import { createCharacter } from "../characters";
import { matrixEffectSeeds } from "../matrix-effect";
import type { OfficeState } from "../office-state";

/**
 * Create a sub-agent character with the parent's palette, place it
 * at the free seat closest to the parent (or the closest walkable
 * tile if no seats are free), and return its id. Idempotent for the
 * same (parent, toolId) pair — re-calling returns the existing id.
 */
export function addSubagent(
  state: OfficeState,
  parentAgentId: number,
  parentToolId: string,
): number {
  const key = `${parentAgentId}:${parentToolId}`;
  if (state.subagentIdMap.has(key)) return state.subagentIdMap.get(key)!;

  const id = state._takeNextSubagentId();
  const parentCh = state.characters.get(parentAgentId);
  const palette = parentCh ? parentCh.palette : 0;
  const hueShift = parentCh ? parentCh.hueShift : 0;

  const parentCol = parentCh ? parentCh.tileCol : 0;
  const parentRow = parentCh ? parentCh.tileRow : 0;
  const dist = (c: number, r: number) =>
    Math.abs(c - parentCol) + Math.abs(r - parentRow);

  let bestSeatId: string | null = null;
  let bestDist = Infinity;
  for (const [uid, seat] of state.seats) {
    if (!seat.assigned) {
      const d = dist(seat.seatCol, seat.seatRow);
      if (d < bestDist) {
        bestDist = d;
        bestSeatId = uid;
      }
    }
  }

  let ch: Character;
  if (bestSeatId) {
    const seat = state.seats.get(bestSeatId)!;
    seat.assigned = true;
    ch = createCharacter(id, palette, bestSeatId, seat, hueShift);
  } else {
    let spawn = { col: 1, row: 1 };
    if (state.walkableTiles.length > 0) {
      let closest = state.walkableTiles[0]!;
      let closestDist = dist(closest.col, closest.row);
      for (let i = 1; i < state.walkableTiles.length; i++) {
        const tile = state.walkableTiles[i]!;
        const d = dist(tile.col, tile.row);
        if (d < closestDist) {
          closest = tile;
          closestDist = d;
        }
      }
      spawn = closest;
    }
    ch = createCharacter(id, palette, null, null, hueShift);
    ch.x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    ch.y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
    ch.tileCol = spawn.col;
    ch.tileRow = spawn.row;
  }
  ch.isSubagent = true;
  ch.parentAgentId = parentAgentId;
  ch.matrixEffect = "spawn";
  ch.matrixEffectTimer = 0;
  ch.matrixEffectSeeds = matrixEffectSeeds();
  state.characters.set(id, ch);

  state.subagentIdMap.set(key, id);
  state.subagentMeta.set(id, { parentAgentId, parentToolId });
  return id;
}

/** Remove a specific sub-agent and free its seat. */
export function removeSubagent(
  state: OfficeState,
  parentAgentId: number,
  parentToolId: string,
): void {
  const key = `${parentAgentId}:${parentToolId}`;
  const id = state.subagentIdMap.get(key);
  if (id === undefined) return;

  const ch = state.characters.get(id);
  if (ch) {
    if (ch.matrixEffect === "despawn") {
      state.subagentIdMap.delete(key);
      state.subagentMeta.delete(id);
      return;
    }
    if (ch.seatId) {
      const seat = state.seats.get(ch.seatId);
      if (seat) seat.assigned = false;
    }
    ch.matrixEffect = "despawn";
    ch.matrixEffectTimer = 0;
    ch.matrixEffectSeeds = matrixEffectSeeds();
    ch.bubbleType = null;
  }
  state.subagentIdMap.delete(key);
  state.subagentMeta.delete(id);
  if (state.selectedAgentId === id) state.selectedAgentId = null;
  if (state.cameraFollowId === id) state.cameraFollowId = null;
}

/** Remove every sub-agent belonging to a parent agent. */
export function removeAllSubagents(
  state: OfficeState,
  parentAgentId: number,
): void {
  const toRemove: string[] = [];
  for (const [key, id] of state.subagentIdMap) {
    const meta = state.subagentMeta.get(id);
    if (meta && meta.parentAgentId === parentAgentId) {
      const ch = state.characters.get(id);
      if (ch) {
        if (ch.matrixEffect === "despawn") {
          state.subagentMeta.delete(id);
          toRemove.push(key);
          continue;
        }
        if (ch.seatId) {
          const seat = state.seats.get(ch.seatId);
          if (seat) seat.assigned = false;
        }
        ch.matrixEffect = "despawn";
        ch.matrixEffectTimer = 0;
        ch.matrixEffectSeeds = matrixEffectSeeds();
        ch.bubbleType = null;
      }
      state.subagentMeta.delete(id);
      if (state.selectedAgentId === id) state.selectedAgentId = null;
      if (state.cameraFollowId === id) state.cameraFollowId = null;
      toRemove.push(key);
    }
  }
  for (const key of toRemove) {
    state.subagentIdMap.delete(key);
  }
}

/** Look up the sub-agent id for a given parent+toolId, or null. */
export function getSubagentId(
  state: OfficeState,
  parentAgentId: number,
  parentToolId: string,
): number | null {
  return state.subagentIdMap.get(`${parentAgentId}:${parentToolId}`) ?? null;
}
