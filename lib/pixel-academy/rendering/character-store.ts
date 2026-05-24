/**
 * lib/pixel-academy/rendering/character-store.ts
 *
 * Owns the population of agent characters drawn in the office, plus
 * the visitor-facing selection / hover / camera-follow state. Hides
 * the underlying Map behind a small domain interface.
 *
 * Public surface:
 *   readonly map  — raw Character Map for drawing
 *   selectedAgentId, cameraFollowId, hoveredAgentId, hoveredTile (mutable)
 *   add / remove / get / has / values / size
 *   at(worldX, worldY)  — hit-testing for click
 *
 * Knows nothing about seats, sub-agents, bubbles, or any other
 * office concern beyond "there is a character at this id". The
 * lifecycle helpers in `office-agents.ts` compose this with
 * `SeatRegistry` to spawn and despawn agents.
 */

import {
  CHARACTER_HIT_HALF_WIDTH,
  CHARACTER_HIT_HEIGHT,
  CHARACTER_SITTING_OFFSET_PX,
} from "../constants";
import { CharacterState, type Character } from "../types";

export class CharacterStore {
  private _map: Map<number, Character> = new Map();

  selectedAgentId: number | null = null;
  cameraFollowId: number | null = null;
  hoveredAgentId: number | null = null;
  hoveredTile: { col: number; row: number } | null = null;

  /** Raw Character Map — for the drawing pipeline. Read-only by
   *  convention; mutation goes through the dedicated methods. */
  get map(): Map<number, Character> {
    return this._map;
  }

  add(ch: Character): void {
    this._map.set(ch.id, ch);
  }

  remove(id: number): void {
    this._map.delete(id);
    if (this.selectedAgentId === id) this.selectedAgentId = null;
    if (this.cameraFollowId === id) this.cameraFollowId = null;
    if (this.hoveredAgentId === id) this.hoveredAgentId = null;
  }

  get(id: number): Character | undefined {
    return this._map.get(id);
  }

  has(id: number): boolean {
    return this._map.has(id);
  }

  size(): number {
    return this._map.size;
  }

  values(): IterableIterator<Character> {
    return this._map.values();
  }

  /** Snapshot copy for callers that need an array. */
  toArray(): Character[] {
    return Array.from(this._map.values());
  }

  /**
   * Hit-test: return the id of the topmost character whose sprite
   * contains the given world-space pixel, or null. Despawning
   * characters are skipped so a fading agent isn't accidentally
   * picked up by the click handler.
   */
  at(worldX: number, worldY: number): number | null {
    // Top-most (smaller y) wins — sort descending by y then iterate.
    const chars = this.toArray().sort((a, b) => b.y - a.y);
    for (const ch of chars) {
      if (ch.matrixEffect === "despawn") continue;
      const sittingOffset =
        ch.state === CharacterState.TYPE ? CHARACTER_SITTING_OFFSET_PX : 0;
      const anchorY = ch.y + sittingOffset;
      const left = ch.x - CHARACTER_HIT_HALF_WIDTH;
      const right = ch.x + CHARACTER_HIT_HALF_WIDTH;
      const top = anchorY - CHARACTER_HIT_HEIGHT;
      const bottom = anchorY;
      if (
        worldX >= left &&
        worldX <= right &&
        worldY >= top &&
        worldY <= bottom
      ) {
        return ch.id;
      }
    }
    return null;
  }
}
