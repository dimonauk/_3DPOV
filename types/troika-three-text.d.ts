// Ambient declaration for troika-three-text 0.52.x.
// No @types/troika-three-text exists upstream; this types only
// the surface MeshProseLayer + sdf-text.ts actually use.
//
// If you start using more troika features (gradients, custom
// shaders, getCaretAtPoint, etc.), extend here.

declare module "troika-three-text" {
  import type { Mesh, Material } from "three";

  /**
   * troika's Text mesh. It's a Three.js `Mesh` subclass with a
   * handful of layout properties that drive the SDF shader and
   * an async `sync()` step that flushes the layout to the GPU.
   */
  export class Text extends Mesh {
    text: string;
    font: string | null;
    fontSize: number;
    maxWidth: number;
    lineHeight: number;
    letterSpacing: number;
    color: number | string;
    anchorX: number | string;
    anchorY: number | string;
    material: Material;
    /**
     * Schedule a layout pass. The callback fires when the SDF
     * worker has produced the geometry and uploaded the texture.
     */
    sync(callback?: () => void): void;
    /** Releases the geometry, material, and any cached glyph data. */
    dispose(): void;
  }

  /**
   * Preload a font face so the first `Text` that uses it doesn't
   * pay the SDF generation cost on its first sync.
   */
  export function preloadFont(
    options: {
      font: string;
      characters?: string;
      sdfGlyphSize?: number;
    },
    callback?: (err: Error | null) => void,
  ): void;
}
