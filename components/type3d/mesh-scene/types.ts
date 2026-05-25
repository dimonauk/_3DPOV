/**
 * components/type3d/mesh-scene/types.ts — Shared types for the mesh
 * scene system.
 *
 * - ViewerPose: head/eye tracking sample, normalised to viewport.
 * - GlyphRegistration: what a `<MeshProseLayer>` hands the provider.
 * - MeshSceneContextValue: the context value provider exposes.
 * - WebGPURendererLike: structural type for Three's WebGPU renderer
 *   (the @types/three 0.171 package doesn't re-export it).
 */

export type ViewerPose = {
  /** Head x in -1..1 normalised viewport units. */
  x: number;
  /** Head y in -1..1 normalised viewport units. */
  y: number;
  /** Head distance from screen in normalised units (0 close, 1 far). */
  z: number;
};

export type GlyphRegistration = {
  /** Three.Object3D — kept opaque to avoid eager three import. */
  group: unknown;
  /** Returns the anchor element's DOMRect (or null if detached). */
  getRect: () => DOMRect | null;
  /** Optional per-layer per-frame hook for material tick etc. */
  tick?: (elapsed: number) => void;
};

export type MeshSceneContextValue = {
  /**
   * Register a Three.Object3D into the shared scene. The provider
   * parks the group at the position of `getRect()` once per frame
   * so scroll / resize track without an external observer per layer.
   * Returns an unregister function — call on unmount.
   */
  addGlyphGroup(reg: GlyphRegistration): () => void;
  /** Active viewer pose, null if no tracking source attached. */
  viewerPose: ViewerPose | null;
  /** True if the scene is live (canvas + renderer mounted). */
  ready: boolean;
};

export type WebGPURendererLike = {
  setPixelRatio: (ratio: number) => void;
  setSize: (w: number, h: number, updateStyle?: boolean) => void;
  setClearColor: (color: number, alpha?: number) => void;
  render: (
    scene: import("three").Scene,
    camera: import("three").Camera,
  ) => Promise<void> | void;
  dispose: () => void;
};

export type RendererInstance =
  | import("three").WebGLRenderer
  | WebGPURendererLike;

export type Three = typeof import("three");

// ---------------------------------------------------------------------
// Camera / loop constants — shared between the init hook and the
// render-frame helper. Keeping them in `types.ts` is mildly awkward
// but they're effectively part of the contract.
// ---------------------------------------------------------------------

export const FOV_DEG = 35;
export const CAMERA_BASE_Z = 6;
export const CAMERA_LERP = 0.08;
