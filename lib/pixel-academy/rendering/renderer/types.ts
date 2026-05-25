/**
 * lib/pixel-academy/rendering/renderer/types.ts
 *
 * Shared types exposed by the renderer family. Each render function
 * lives in its own module; this is the type registry callers import
 * to compose `renderFrame`.
 */

import type {
  Character,
  Seat,
  SpriteData,
} from "../../types";

export interface ButtonBounds {
  /** Center X in device pixels. */
  cx: number;
  /** Center Y in device pixels. */
  cy: number;
  /** Radius in device pixels. */
  radius: number;
}

export type DeleteButtonBounds = ButtonBounds;
export type RotateButtonBounds = ButtonBounds;

export interface EditorRenderState {
  showGrid: boolean;
  ghostSprite: SpriteData | null;
  ghostCol: number;
  ghostRow: number;
  ghostValid: boolean;
  selectedCol: number;
  selectedRow: number;
  selectedW: number;
  selectedH: number;
  hasSelection: boolean;
  isRotatable: boolean;
  /** Updated each frame by renderDeleteButton. */
  deleteButtonBounds: DeleteButtonBounds | null;
  /** Updated each frame by renderRotateButton. */
  rotateButtonBounds: RotateButtonBounds | null;
  /** Whether to show ghost border (expansion tiles outside grid). */
  showGhostBorder: boolean;
  /** Hovered ghost border tile col (-1 to cols). */
  ghostBorderHoverCol: number;
  /** Hovered ghost border tile row (-1 to rows). */
  ghostBorderHoverRow: number;
}

export interface SelectionRenderState {
  selectedAgentId: number | null;
  hoveredAgentId: number | null;
  hoveredTile: { col: number; row: number } | null;
  seats: Map<string, Seat>;
  characters: Map<number, Character>;
}
