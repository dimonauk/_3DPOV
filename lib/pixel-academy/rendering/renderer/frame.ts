/**
 * lib/pixel-academy/rendering/renderer/frame.ts
 *
 * Top-level frame composer. Clears the canvas, computes the world
 * offset, then calls every render pass in z-order:
 *
 *   1. tiles (floor + walls)
 *   2. seat indicators
 *   3. scene (walls + furniture + characters, z-sorted)
 *   4. bubbles
 *   5. editor overlays (when an EditorRenderState is provided)
 *
 * Mutates `editor.deleteButtonBounds` / `editor.rotateButtonBounds`
 * each frame so the click handler can hit-test against the exact
 * pixels that landed on the canvas.
 */

import { TILE_SIZE } from "../../types";
import type {
  Character,
  FloorColor,
  FurnitureInstance,
  TileType as TileTypeVal,
} from "../../types";
import { getWallInstances, hasWallSprites } from "../../wall-tiles";

import { renderBubbles } from "./bubbles";
import {
  renderGhostBorder,
  renderGhostPreview,
  renderGridOverlay,
  renderSelectionHighlight,
} from "./editor-overlays";
import { renderDeleteButton, renderRotateButton } from "./editor-buttons";
import { renderScene } from "./scene";
import { renderSeatIndicators } from "./seat-indicators";
import { renderTileGrid } from "./tiles";
import type {
  EditorRenderState,
  SelectionRenderState,
} from "./types";

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  tileMap: TileTypeVal[][],
  furniture: FurnitureInstance[],
  characters: Character[],
  zoom: number,
  panX: number,
  panY: number,
  selection?: SelectionRenderState,
  editor?: EditorRenderState,
  tileColors?: Array<FloorColor | null>,
  layoutCols?: number,
  layoutRows?: number,
): { offsetX: number; offsetY: number } {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const cols = layoutCols ?? (tileMap.length > 0 ? tileMap[0]!.length : 0);
  const rows = layoutRows ?? tileMap.length;

  // Centre + pan, integer device pixels.
  const mapW = cols * TILE_SIZE * zoom;
  const mapH = rows * TILE_SIZE * zoom;
  const offsetX = Math.floor((canvasWidth - mapW) / 2) + Math.round(panX);
  const offsetY = Math.floor((canvasHeight - mapH) / 2) + Math.round(panY);

  renderTileGrid(ctx, tileMap, offsetX, offsetY, zoom, tileColors, layoutCols);

  if (selection) {
    renderSeatIndicators(
      ctx,
      selection.seats,
      selection.characters,
      selection.selectedAgentId,
      selection.hoveredTile,
      offsetX,
      offsetY,
      zoom,
    );
  }

  // Walls + furniture share the z-sort buffer with characters.
  const wallInstances = hasWallSprites()
    ? getWallInstances(tileMap, tileColors, layoutCols)
    : [];
  const allFurniture =
    wallInstances.length > 0 ? [...wallInstances, ...furniture] : furniture;

  const selectedId = selection?.selectedAgentId ?? null;
  const hoveredId = selection?.hoveredAgentId ?? null;
  renderScene(
    ctx,
    allFurniture,
    characters,
    offsetX,
    offsetY,
    zoom,
    selectedId,
    hoveredId,
  );

  renderBubbles(ctx, characters, offsetX, offsetY, zoom);

  if (editor) {
    if (editor.showGrid) {
      renderGridOverlay(ctx, offsetX, offsetY, zoom, cols, rows, tileMap);
    }
    if (editor.showGhostBorder) {
      renderGhostBorder(
        ctx,
        offsetX,
        offsetY,
        zoom,
        cols,
        rows,
        editor.ghostBorderHoverCol,
        editor.ghostBorderHoverRow,
      );
    }
    if (editor.ghostSprite && editor.ghostCol >= 0) {
      renderGhostPreview(
        ctx,
        editor.ghostSprite,
        editor.ghostCol,
        editor.ghostRow,
        editor.ghostValid,
        offsetX,
        offsetY,
        zoom,
      );
    }
    if (editor.hasSelection) {
      renderSelectionHighlight(
        ctx,
        editor.selectedCol,
        editor.selectedRow,
        editor.selectedW,
        editor.selectedH,
        offsetX,
        offsetY,
        zoom,
      );
      editor.deleteButtonBounds = renderDeleteButton(
        ctx,
        editor.selectedCol,
        editor.selectedRow,
        editor.selectedW,
        editor.selectedH,
        offsetX,
        offsetY,
        zoom,
      );
      if (editor.isRotatable) {
        editor.rotateButtonBounds = renderRotateButton(
          ctx,
          editor.selectedCol,
          editor.selectedRow,
          editor.selectedW,
          editor.selectedH,
          offsetX,
          offsetY,
          zoom,
        );
      } else {
        editor.rotateButtonBounds = null;
      }
    } else {
      editor.deleteButtonBounds = null;
      editor.rotateButtonBounds = null;
    }
  }

  return { offsetX, offsetY };
}
