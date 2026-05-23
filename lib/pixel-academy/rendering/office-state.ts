/**
 * lib/pixel-academy/rendering/office-state.ts — Office simulation state.
 *
 * The `OfficeState` class owns the game-world state: layout, tile map,
 * seats, blocked tiles, walkable tiles, characters (real + sub-agent),
 * selection / hover / camera-follow ids.
 *
 * Behaviour is split across siblings under `./office-state/`:
 *
 *   ./office-state/agents.ts            agent CRUD + movement
 *   ./office-state/seats.ts             seat lookup + reassignment
 *   ./office-state/subagents.ts         sub-agent lifecycle
 *   ./office-state/bubbles.ts           permission / waiting bubbles
 *   ./office-state/palette.ts           diverse-palette picker
 *   ./office-state/furniture-rebuild.ts auto-on overlay on electronics
 *
 * Each helper takes an `OfficeState` and mutates its public fields.
 * The class keeps thin delegating methods so the public API stays
 * exactly the same.
 */

import {
  CHARACTER_HIT_HALF_WIDTH,
  CHARACTER_HIT_HEIGHT,
  CHARACTER_SITTING_OFFSET_PX,
} from "../constants";
import {
  TILE_SIZE,
  MATRIX_EFFECT_DURATION,
  CharacterState,
} from "../types";
import type {
  Character,
  FurnitureInstance,
  OfficeLayout,
  Seat,
  TileType as TileTypeVal,
} from "../types";
import { updateCharacter } from "./characters";
import {
  createDefaultLayout,
  getBlockedTiles,
  layoutToFurnitureInstances,
  layoutToSeats,
  layoutToTileMap,
} from "../layout/layout-serializer";
import { getWalkableTiles } from "../layout/tile-map";

import * as agents from "./office-state/agents";
import * as bubbles from "./office-state/bubbles";
import { rebuildFurnitureInstances as rebuildFurnitureInstancesImpl } from "./office-state/furniture-rebuild";
import * as seats from "./office-state/seats";
import * as subagents from "./office-state/subagents";

export class OfficeState {
  layout: OfficeLayout;
  tileMap: TileTypeVal[][];
  seats: Map<string, Seat>;
  blockedTiles: Set<string>;
  furniture: FurnitureInstance[];
  walkableTiles: Array<{ col: number; row: number }>;
  characters: Map<number, Character> = new Map();
  selectedAgentId: number | null = null;
  cameraFollowId: number | null = null;
  hoveredAgentId: number | null = null;
  hoveredTile: { col: number; row: number } | null = null;
  /** Maps "parentId:toolId" → sub-agent character ID (negative). */
  subagentIdMap: Map<string, number> = new Map();
  /** Reverse lookup: sub-agent character ID → parent info. */
  subagentMeta: Map<
    number,
    { parentAgentId: number; parentToolId: string }
  > = new Map();
  private nextSubagentId = -1;

  /** Internal allocator used by `./office-state/subagents.ts`. */
  _takeNextSubagentId(): number {
    return this.nextSubagentId--;
  }

  constructor(layout?: OfficeLayout) {
    this.layout = layout || createDefaultLayout();
    this.tileMap = layoutToTileMap(this.layout);
    this.seats = layoutToSeats(this.layout.furniture);
    this.blockedTiles = getBlockedTiles(this.layout.furniture);
    this.furniture = layoutToFurnitureInstances(this.layout.furniture);
    this.walkableTiles = getWalkableTiles(this.tileMap, this.blockedTiles);
  }

  getLayout(): OfficeLayout {
    return this.layout;
  }

  /** Rebuild all derived state from a new layout. Reassigns existing characters.
   *  @param shift Optional pixel shift to apply when grid expands left/up. */
  rebuildFromLayout(
    layout: OfficeLayout,
    shift?: { col: number; row: number },
  ): void {
    this.layout = layout;
    this.tileMap = layoutToTileMap(layout);
    this.seats = layoutToSeats(layout.furniture);
    this.blockedTiles = getBlockedTiles(layout.furniture);
    rebuildFurnitureInstancesImpl(this);
    this.walkableTiles = getWalkableTiles(this.tileMap, this.blockedTiles);

    if (shift && (shift.col !== 0 || shift.row !== 0)) {
      for (const ch of this.characters.values()) {
        ch.tileCol += shift.col;
        ch.tileRow += shift.row;
        ch.x += shift.col * TILE_SIZE;
        ch.y += shift.row * TILE_SIZE;
        ch.path = [];
        ch.moveProgress = 0;
      }
    }

    // Reassign characters to new seats, preserving existing assignments
    // when possible.
    for (const seat of this.seats.values()) seat.assigned = false;

    for (const ch of this.characters.values()) {
      if (ch.seatId && this.seats.has(ch.seatId)) {
        const seat = this.seats.get(ch.seatId)!;
        if (!seat.assigned) {
          seat.assigned = true;
          // Snap character to seat position.
          ch.tileCol = seat.seatCol;
          ch.tileRow = seat.seatRow;
          ch.x = seat.seatCol * TILE_SIZE + TILE_SIZE / 2;
          ch.y = seat.seatRow * TILE_SIZE + TILE_SIZE / 2;
        } else {
          ch.seatId = null;
        }
      } else {
        ch.seatId = null;
      }
      if (!ch.seatId) this.relocateCharacterToWalkable(ch);
    }
  }

  private relocateCharacterToWalkable(ch: Character): void {
    if (this.walkableTiles.length === 0) return;
    const spawn =
      this.walkableTiles[Math.floor(Math.random() * this.walkableTiles.length)]!;
    ch.tileCol = spawn.col;
    ch.tileRow = spawn.row;
    ch.x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    ch.y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
    ch.path = [];
    ch.moveProgress = 0;
  }

  // ---- Agent CRUD + movement (./office-state/agents.ts) ----------------
  addAgent(
    id: number,
    preferredPalette?: number,
    preferredHueShift?: number,
    preferredSeatId?: string,
    skipSpawnEffect?: boolean,
    folderName?: string,
  ): void {
    agents.addAgent(
      this,
      id,
      preferredPalette,
      preferredHueShift,
      preferredSeatId,
      skipSpawnEffect,
      folderName,
    );
  }
  removeAgent(id: number): void {
    agents.removeAgent(this, id);
  }
  setAgentActive(id: number, active: boolean): void {
    agents.setAgentActive(this, id, active);
  }
  setAgentTool(id: number, tool: string | null): void {
    agents.setAgentTool(this, id, tool);
  }
  walkToTile(agentId: number, col: number, row: number): boolean {
    return agents.walkToTile(this, agentId, col, row);
  }

  // ---- Seats (./office-state/seats.ts) ---------------------------------
  getSeatAtTile(col: number, row: number): string | null {
    return seats.getSeatAtTile(this, col, row);
  }
  reassignSeat(agentId: number, seatId: string): void {
    seats.reassignSeat(this, agentId, seatId);
  }
  sendToSeat(agentId: number): void {
    seats.sendToSeat(this, agentId);
  }

  // ---- Sub-agents (./office-state/subagents.ts) ------------------------
  addSubagent(parentAgentId: number, parentToolId: string): number {
    return subagents.addSubagent(this, parentAgentId, parentToolId);
  }
  removeSubagent(parentAgentId: number, parentToolId: string): void {
    subagents.removeSubagent(this, parentAgentId, parentToolId);
  }
  removeAllSubagents(parentAgentId: number): void {
    subagents.removeAllSubagents(this, parentAgentId);
  }
  getSubagentId(parentAgentId: number, parentToolId: string): number | null {
    return subagents.getSubagentId(this, parentAgentId, parentToolId);
  }

  // ---- Bubbles (./office-state/bubbles.ts) -----------------------------
  showPermissionBubble(id: number): void {
    bubbles.showPermissionBubble(this, id);
  }
  clearPermissionBubble(id: number): void {
    bubbles.clearPermissionBubble(this, id);
  }
  showWaitingBubble(id: number): void {
    bubbles.showWaitingBubble(this, id);
  }
  dismissBubble(id: number): void {
    bubbles.dismissBubble(this, id);
  }

  // ---- Frame loop ------------------------------------------------------
  update(dt: number): void {
    const toDelete: number[] = [];
    for (const ch of this.characters.values()) {
      if (ch.matrixEffect) {
        ch.matrixEffectTimer += dt;
        if (ch.matrixEffectTimer >= MATRIX_EFFECT_DURATION) {
          if (ch.matrixEffect === "spawn") {
            ch.matrixEffect = null;
            ch.matrixEffectTimer = 0;
            ch.matrixEffectSeeds = [];
          } else {
            toDelete.push(ch.id);
          }
        }
        continue;
      }

      seats.withOwnSeatUnblocked(this, ch, () =>
        updateCharacter(
          ch,
          dt,
          this.walkableTiles,
          this.seats,
          this.tileMap,
          this.blockedTiles,
        ),
      );

      if (ch.bubbleType === "waiting") {
        ch.bubbleTimer -= dt;
        if (ch.bubbleTimer <= 0) {
          ch.bubbleType = null;
          ch.bubbleTimer = 0;
        }
      }
    }
    for (const id of toDelete) {
      this.characters.delete(id);
    }
  }

  // ---- Queries ---------------------------------------------------------
  getCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  /** Character at pixel position (hit testing). Returns id or null. */
  getCharacterAt(worldX: number, worldY: number): number | null {
    const chars = this.getCharacters().sort((a, b) => b.y - a.y);
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
