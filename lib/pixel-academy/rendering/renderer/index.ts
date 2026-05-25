/**
 * lib/pixel-academy/rendering/renderer/index.ts — Public surface of
 * the renderer family.
 *
 * Re-exports every render function plus the shared types so existing
 * callers (lib/pixel-academy/index.ts → `export * from
 * "./rendering/renderer"`) continue to find what they need at this
 * import path.
 *
 * Implementation layout:
 *   ./tiles.ts            renderTileGrid
 *   ./scene.ts            renderScene (z-sorted)
 *   ./seat-indicators.ts  renderSeatIndicators
 *   ./bubbles.ts          renderBubbles
 *   ./editor-overlays.ts  renderGridOverlay + renderGhostBorder +
 *                         renderGhostPreview + renderSelectionHighlight
 *   ./editor-buttons.ts   renderDeleteButton + renderRotateButton
 *   ./frame.ts            renderFrame (top-level orchestrator)
 *   ./types.ts            EditorRenderState, SelectionRenderState,
 *                         ButtonBounds + Delete/Rotate aliases
 */

export { renderBubbles } from "./bubbles";
export {
  renderGhostBorder,
  renderGhostPreview,
  renderGridOverlay,
  renderSelectionHighlight,
} from "./editor-overlays";
export {
  renderDeleteButton,
  renderRotateButton,
} from "./editor-buttons";
export { renderFrame } from "./frame";
export { renderScene } from "./scene";
export { renderSeatIndicators } from "./seat-indicators";
export { renderTileGrid } from "./tiles";

export type {
  ButtonBounds,
  DeleteButtonBounds,
  EditorRenderState,
  RotateButtonBounds,
  SelectionRenderState,
} from "./types";
