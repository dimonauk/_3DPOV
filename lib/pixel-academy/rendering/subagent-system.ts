/**
 * lib/pixel-academy/rendering/subagent-system.ts
 *
 * Owns the sub-agent identity space: id ↔ (parent, tool) lookups, the
 * negative-id allocator. Doesn't own the character bodies themselves
 * — those live in CharacterStore — and doesn't own seats. It
 * COMPOSES those two systems through their public APIs to spawn /
 * despawn sub-agents.
 *
 * Public surface:
 *   constructor(characters, seats, walkableTiles)
 *   add(parentAgentId, parentToolId): number
 *   remove(parentAgentId, parentToolId)
 *   removeAll(parentAgentId)
 *   lookup(parentAgentId, parentToolId)
 *   readonly idMap   — raw "parent:tool" → id map for inspection
 *   readonly meta    — raw id → parent meta map for inspection
 *
 * The two raw-map getters exist for backwards-compat with code that
 * iterates them directly; the domain API (`add`/`remove`/...) is
 * what new callers should use.
 */

import { TILE_SIZE } from "../types";
import type { Character } from "../types";
import { createCharacter } from "./characters";
import { matrixEffectSeeds } from "./matrix-effect";
import type { CharacterStore } from "./character-store";
import type { SeatRegistry } from "./seat-registry";

export type SubagentMeta = { parentAgentId: number; parentToolId: string };

export class SubagentSystem {
  private _idMap: Map<string, number> = new Map();
  private _meta: Map<number, SubagentMeta> = new Map();
  private nextId = -1;

  constructor(
    private readonly characters: CharacterStore,
    private readonly seats: SeatRegistry,
    private readonly walkableTilesRef: () => Array<{ col: number; row: number }>,
  ) {}

  /** Read-only view of the parent-key → id map. */
  get idMap(): Map<string, number> {
    return this._idMap;
  }

  /** Read-only view of the id → parent meta map. */
  get meta(): Map<number, SubagentMeta> {
    return this._meta;
  }

  /**
   * Spawn (or return the existing) sub-agent for a parent + tool.
   * Places it at the free seat closest to the parent, or the closest
   * walkable tile if no seats are free.
   */
  add(parentAgentId: number, parentToolId: string): number {
    const key = `${parentAgentId}:${parentToolId}`;
    const existing = this._idMap.get(key);
    if (existing !== undefined) return existing;

    const id = this.nextId--;
    const parentCh = this.characters.get(parentAgentId);
    const palette = parentCh ? parentCh.palette : 0;
    const hueShift = parentCh ? parentCh.hueShift : 0;
    const parentCol = parentCh ? parentCh.tileCol : 0;
    const parentRow = parentCh ? parentCh.tileRow : 0;

    const bestSeatId = this.seats.findFreeNearest(parentCol, parentRow);
    const ch = bestSeatId
      ? this.placeAtSeat(id, palette, hueShift, bestSeatId)
      : this.placeAtNearestWalkable(id, palette, hueShift, parentCol, parentRow);

    ch.isSubagent = true;
    ch.parentAgentId = parentAgentId;
    ch.matrixEffect = "spawn";
    ch.matrixEffectTimer = 0;
    ch.matrixEffectSeeds = matrixEffectSeeds();
    this.characters.add(ch);

    this._idMap.set(key, id);
    this._meta.set(id, { parentAgentId, parentToolId });
    return id;
  }

  /** Despawn a specific sub-agent and clean up its bookkeeping. */
  remove(parentAgentId: number, parentToolId: string): void {
    const key = `${parentAgentId}:${parentToolId}`;
    const id = this._idMap.get(key);
    if (id === undefined) return;
    this.disposeAgentBody(id);
    this._idMap.delete(key);
    this._meta.delete(id);
  }

  /** Despawn every sub-agent for a given parent. */
  removeAll(parentAgentId: number): void {
    const toRemove: string[] = [];
    for (const [key, id] of this._idMap) {
      const meta = this._meta.get(id);
      if (!meta || meta.parentAgentId !== parentAgentId) continue;
      this.disposeAgentBody(id);
      this._meta.delete(id);
      toRemove.push(key);
    }
    for (const key of toRemove) this._idMap.delete(key);
  }

  lookup(parentAgentId: number, parentToolId: string): number | null {
    return this._idMap.get(`${parentAgentId}:${parentToolId}`) ?? null;
  }

  // ---- internal -------------------------------------------------------

  private placeAtSeat(
    id: number,
    palette: number,
    hueShift: number,
    seatId: string,
  ): Character {
    this.seats.assign(seatId);
    const seat = this.seats.get(seatId)!;
    return createCharacter(id, palette, seatId, seat, hueShift);
  }

  private placeAtNearestWalkable(
    id: number,
    palette: number,
    hueShift: number,
    nearCol: number,
    nearRow: number,
  ): Character {
    const tiles = this.walkableTilesRef();
    let spawn = { col: 1, row: 1 };
    if (tiles.length > 0) {
      let closest = tiles[0]!;
      let closestDist =
        Math.abs(closest.col - nearCol) + Math.abs(closest.row - nearRow);
      for (let i = 1; i < tiles.length; i++) {
        const tile = tiles[i]!;
        const d = Math.abs(tile.col - nearCol) + Math.abs(tile.row - nearRow);
        if (d < closestDist) {
          closest = tile;
          closestDist = d;
        }
      }
      spawn = closest;
    }
    const ch = createCharacter(id, palette, null, null, hueShift);
    ch.x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    ch.y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
    ch.tileCol = spawn.col;
    ch.tileRow = spawn.row;
    return ch;
  }

  /**
   * Release the seat (if any), start the despawn animation, and
   * clear bubble state. Does NOT delete the character — the frame
   * loop deletes it once the despawn timer completes.
   */
  private disposeAgentBody(id: number): void {
    const ch = this.characters.get(id);
    if (!ch) return;
    if (ch.matrixEffect === "despawn") return;
    if (ch.seatId) this.seats.release(ch.seatId);
    ch.matrixEffect = "despawn";
    ch.matrixEffectTimer = 0;
    ch.matrixEffectSeeds = matrixEffectSeeds();
    ch.bubbleType = null;
  }
}
