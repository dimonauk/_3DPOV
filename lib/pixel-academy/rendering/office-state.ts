/**
 * lib/pixel-academy/rendering/office-state.ts — Office simulation
 * composed from focused subsystems.
 *
 * `OfficeState` is the composition layer: it wires
 * `SeatRegistry` + `CharacterStore` + `SubagentSystem` together and
 * exposes the methods callers know (`addAgent`, `update`, …).
 *
 * Subsystems:
 *
 *   ./seat-registry.ts      seats + blocked tiles, with domain methods
 *                           (findFree / findFreeNearest / assign / …)
 *   ./character-store.ts    characters Map + selection / hover state
 *   ./subagent-system.ts    parent↔sub-agent id space; composes
 *                           characters + seats to spawn
 *   ./bubble-rules.ts       pure transitions on a Character's bubble
 *   ./palette-picker.ts     stateless skin + hue-shift picker
 *   ./furniture-overlay.ts  pure derivation of ON-state furniture
 *   ./office-agents.ts      lifecycle helpers that cross subsystem
 *                           boundaries (spawn, despawn, walk, sit)
 *
 * Backward compatibility: the read-only fields callers used to reach
 * for directly (`state.seats`, `state.characters`, `state.blockedTiles`,
 * `state.subagentIdMap`, `state.subagentMeta`) remain exposed via
 * delegating getters so external draw / hit-test code does not
 * change. The mutable per-frame state (`selectedAgentId`,
 * `cameraFollowId`, `hoveredAgentId`, `hoveredTile`) lives on
 * CharacterStore and is exposed as getters + setters.
 */

import { MATRIX_EFFECT_DURATION } from "../types";
import type {
  Character,
  FurnitureInstance,
  OfficeLayout,
  Seat,
  TileType as TileTypeVal,
} from "../types";
import {
  createDefaultLayout,
  layoutToTileMap,
} from "../layout/layout-serializer";
import { getWalkableTiles } from "../layout/tile-map";
import { updateCharacter } from "./characters";

import {
  clearPermission as clearPermissionBubbleRule,
  dismiss as dismissBubbleRule,
  showPermission as showPermissionBubbleRule,
  showWaiting as showWaitingBubbleRule,
  tickWaiting as tickWaitingBubbleRule,
} from "./bubble-rules";
import { CharacterStore } from "./character-store";
import { buildFurnitureInstances } from "./furniture-overlay";
import {
  despawnAgent,
  reassignSeat as reassignSeatHelper,
  sendToSeat as sendToSeatHelper,
  spawnAgent,
  walkToTile as walkToTileHelper,
  type AgentSpawnOptions,
  type SpawnContext,
} from "./office-agents";
import { applyLayoutRebuild } from "./office-layout-rebuild";
import { SeatRegistry } from "./seat-registry";
import { SubagentSystem, type SubagentMeta } from "./subagent-system";

export class OfficeState {
  layout: OfficeLayout;
  tileMap: TileTypeVal[][];
  walkableTiles: Array<{ col: number; row: number }>;
  furniture: FurnitureInstance[];

  private _seats: SeatRegistry;
  private _characters: CharacterStore;
  private _subagents: SubagentSystem;

  constructor(layout?: OfficeLayout) {
    this.layout = layout ?? createDefaultLayout();
    this.tileMap = layoutToTileMap(this.layout);
    this._seats = new SeatRegistry(this.layout.furniture);
    this._characters = new CharacterStore();
    this.walkableTiles = getWalkableTiles(this.tileMap, this._seats.blocked);
    this.furniture = buildFurnitureInstances(
      this.layout.furniture,
      this._characters.values(),
      this._seats,
    );
    this._subagents = new SubagentSystem(
      this._characters,
      this._seats,
      () => this.walkableTiles,
    );
  }

  // ---- Backward-compat read-only field surface ------------------------
  /** Underlying seat Map — exposed for draw / pathfinding callers. */
  get seats(): Map<string, Seat> {
    return this._seats.map;
  }
  /** Underlying blocked-tile Set — exposed for pathfinding callers. */
  get blockedTiles(): Set<string> {
    return this._seats.blocked;
  }
  /** Underlying character Map — exposed for draw callers. */
  get characters(): Map<number, Character> {
    return this._characters.map;
  }
  /** Sub-agent parent-key → id map. */
  get subagentIdMap(): Map<string, number> {
    return this._subagents.idMap;
  }
  /** Sub-agent id → parent meta map. */
  get subagentMeta(): Map<number, SubagentMeta> {
    return this._subagents.meta;
  }

  // ---- Mutable selection / hover state (lives on CharacterStore) -------
  get selectedAgentId(): number | null {
    return this._characters.selectedAgentId;
  }
  set selectedAgentId(value: number | null) {
    this._characters.selectedAgentId = value;
  }
  get cameraFollowId(): number | null {
    return this._characters.cameraFollowId;
  }
  set cameraFollowId(value: number | null) {
    this._characters.cameraFollowId = value;
  }
  get hoveredAgentId(): number | null {
    return this._characters.hoveredAgentId;
  }
  set hoveredAgentId(value: number | null) {
    this._characters.hoveredAgentId = value;
  }
  get hoveredTile(): { col: number; row: number } | null {
    return this._characters.hoveredTile;
  }
  set hoveredTile(value: { col: number; row: number } | null) {
    this._characters.hoveredTile = value;
  }

  getLayout(): OfficeLayout {
    return this.layout;
  }

  private get spawnContext(): SpawnContext {
    return {
      characters: this._characters,
      seats: this._seats,
      walkableTiles: this.walkableTiles,
    };
  }

  // ---- Layout rebuild -------------------------------------------------

  /** Rebuild all derived state from a new layout. Reassigns existing
   *  characters. `shift` applies a pixel offset when the grid expands
   *  left or up so characters stay in their world position. */
  rebuildFromLayout(
    layout: OfficeLayout,
    shift?: { col: number; row: number },
  ): void {
    this.layout = layout;
    this.tileMap = layoutToTileMap(layout);
    this._seats.rebuild(layout.furniture);
    this.walkableTiles = getWalkableTiles(this.tileMap, this._seats.blocked);
    this.furniture = buildFurnitureInstances(
      layout.furniture,
      this._characters.values(),
      this._seats,
    );
    applyLayoutRebuild(
      { characters: this._characters, seats: this._seats, walkableTiles: this.walkableTiles },
      layout,
      shift,
    );
  }

  // ---- Agent lifecycle -------------------------------------------------
  addAgent(
    id: number,
    preferredPalette?: number,
    preferredHueShift?: number,
    preferredSeatId?: string,
    skipSpawnEffect?: boolean,
    folderName?: string,
  ): void {
    const opts: AgentSpawnOptions = {
      preferredPalette,
      preferredHueShift,
      preferredSeatId,
      skipSpawnEffect,
      folderName,
    };
    spawnAgent(this.spawnContext, id, opts);
  }
  removeAgent(id: number): void {
    despawnAgent(this.spawnContext, id);
  }
  setAgentActive(id: number, active: boolean): void {
    const ch = this._characters.get(id);
    if (!ch) return;
    ch.isActive = active;
    if (!active) {
      // Sentinel -1: signals turn just ended, skip next seat rest timer.
      ch.seatTimer = -1;
      ch.path = [];
      ch.moveProgress = 0;
    }
    this.furniture = buildFurnitureInstances(
      this.layout.furniture,
      this._characters.values(),
      this._seats,
    );
  }
  setAgentTool(id: number, tool: string | null): void {
    const ch = this._characters.get(id);
    if (ch) ch.currentTool = tool;
  }

  // ---- Seats ----------------------------------------------------------
  getSeatAtTile(col: number, row: number): string | null {
    return this._seats.getAtTile(col, row);
  }
  reassignSeat(agentId: number, seatId: string): void {
    reassignSeatHelper(this.spawnContext, this.tileMap, agentId, seatId);
  }
  sendToSeat(agentId: number): void {
    sendToSeatHelper(this.spawnContext, this.tileMap, agentId);
  }
  walkToTile(agentId: number, col: number, row: number): boolean {
    return walkToTileHelper(this.spawnContext, this.tileMap, agentId, col, row);
  }

  // ---- Sub-agents -----------------------------------------------------
  addSubagent(parentAgentId: number, parentToolId: string): number {
    return this._subagents.add(parentAgentId, parentToolId);
  }
  removeSubagent(parentAgentId: number, parentToolId: string): void {
    this._subagents.remove(parentAgentId, parentToolId);
  }
  removeAllSubagents(parentAgentId: number): void {
    this._subagents.removeAll(parentAgentId);
  }
  getSubagentId(parentAgentId: number, parentToolId: string): number | null {
    return this._subagents.lookup(parentAgentId, parentToolId);
  }

  // ---- Bubbles --------------------------------------------------------
  showPermissionBubble(id: number): void {
    showPermissionBubbleRule(this._characters.get(id));
  }
  clearPermissionBubble(id: number): void {
    clearPermissionBubbleRule(this._characters.get(id));
  }
  showWaitingBubble(id: number): void {
    showWaitingBubbleRule(this._characters.get(id));
  }
  dismissBubble(id: number): void {
    dismissBubbleRule(this._characters.get(id));
  }

  // ---- Frame loop -----------------------------------------------------
  update(dt: number): void {
    const toDelete: number[] = [];
    for (const ch of this._characters.values()) {
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

      const key = ch.seatId ? this._seats.tileKey(ch.seatId) : null;
      this._seats.withTileUnblocked(key, () =>
        updateCharacter(
          ch,
          dt,
          this.walkableTiles,
          this._seats.map,
          this.tileMap,
          this._seats.blocked,
        ),
      );

      tickWaitingBubbleRule(ch, dt);
    }
    for (const id of toDelete) this._characters.remove(id);
  }

  // ---- Queries --------------------------------------------------------
  getCharacters(): Character[] {
    return this._characters.toArray();
  }
  getCharacterAt(worldX: number, worldY: number): number | null {
    return this._characters.at(worldX, worldY);
  }
}
