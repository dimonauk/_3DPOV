/**
 * lib/pixel-academy/rendering/seat-registry.ts
 *
 * Owns seat state for an office: the Seat objects (mutable assignment
 * flags) and the blocked-tile keys derived from non-seat furniture.
 * Hides Map / Set lookups behind a domain interface so callers say
 * `findFree()` / `assign(seatId)` instead of `for ... if !assigned`.
 *
 * Public surface:
 *   constructor(furniture)
 *   rebuild(furniture)
 *   readonly map      — raw Seat Map for iteration / drawing
 *   readonly blocked  — raw blocked-tile Set for pathfinding
 *   get(seatId)
 *   has(seatId)
 *   getAtTile(col, row)
 *   findFree()
 *   findFreeNearest(col, row)
 *   assign(seatId)
 *   release(seatId)
 *   releaseAll()
 *   tileKey(seatId)
 *   withTileUnblocked(key, fn)
 *
 * No imports from CharacterStore or any other office subsystem —
 * pure seat + blocked-tile concerns. The subagent and agent
 * subsystems compose this through its public API.
 */

import type { PlacedFurniture, Seat } from "../types";
import {
  getBlockedTiles,
  layoutToSeats,
} from "../layout/layout-serializer";

export class SeatRegistry {
  private _map: Map<string, Seat>;
  private _blocked: Set<string>;

  constructor(furniture: PlacedFurniture[]) {
    this._map = layoutToSeats(furniture);
    this._blocked = getBlockedTiles(furniture);
  }

  /** Raw seat Map — read-only access for drawing / iteration. */
  get map(): Map<string, Seat> {
    return this._map;
  }

  /** Raw blocked-tile Set — read-only access for pathfinding. */
  get blocked(): Set<string> {
    return this._blocked;
  }

  /** Replace internal state from a new furniture list. */
  rebuild(furniture: PlacedFurniture[]): void {
    this._map = layoutToSeats(furniture);
    this._blocked = getBlockedTiles(furniture);
  }

  get(seatId: string): Seat | undefined {
    return this._map.get(seatId);
  }

  has(seatId: string): boolean {
    return this._map.has(seatId);
  }

  /** Seat uid at a given tile position, or null. */
  getAtTile(col: number, row: number): string | null {
    for (const [uid, seat] of this._map) {
      if (seat.seatCol === col && seat.seatRow === row) return uid;
    }
    return null;
  }

  /** First unassigned seat in iteration order, or null. */
  findFree(): string | null {
    for (const [uid, seat] of this._map) {
      if (!seat.assigned) return uid;
    }
    return null;
  }

  /**
   * Closest unassigned seat to a given tile position using Manhattan
   * distance. Used by the subagent system to plant a new agent near
   * its parent. Returns null when every seat is assigned.
   */
  findFreeNearest(col: number, row: number): string | null {
    let bestSeatId: string | null = null;
    let bestDist = Infinity;
    for (const [uid, seat] of this._map) {
      if (seat.assigned) continue;
      const d = Math.abs(seat.seatCol - col) + Math.abs(seat.seatRow - row);
      if (d < bestDist) {
        bestDist = d;
        bestSeatId = uid;
      }
    }
    return bestSeatId;
  }

  /** Mark seat as assigned. Returns true on success, false if missing
   *  or already assigned. */
  assign(seatId: string): boolean {
    const seat = this._map.get(seatId);
    if (!seat || seat.assigned) return false;
    seat.assigned = true;
    return true;
  }

  /** Mark seat as unassigned. No-op when missing. */
  release(seatId: string): void {
    const seat = this._map.get(seatId);
    if (seat) seat.assigned = false;
  }

  /** Release every seat. Used during layout rebuilds before
   *  reassigning characters. */
  releaseAll(): void {
    for (const seat of this._map.values()) seat.assigned = false;
  }

  /** Blocked-tile key for a seat (e.g. "5,3"), or null. */
  tileKey(seatId: string): string | null {
    const seat = this._map.get(seatId);
    if (!seat) return null;
    return `${seat.seatCol},${seat.seatRow}`;
  }

  /** Temporarily remove a tile from the blocked set, run fn, restore.
   *  Caller passes a key (typically from tileKey) — pass null to skip
   *  the unblock and just run fn. */
  withTileUnblocked<T>(key: string | null, fn: () => T): T {
    if (key) this._blocked.delete(key);
    const result = fn();
    if (key) this._blocked.add(key);
    return result;
  }
}
