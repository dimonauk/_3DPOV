/**
 * lib/type3d/font-mesh.ts — Typed wrapper around the font-mesh worker.
 *
 * Main-thread callers go through `generateFontMesh` rather than
 * touching the worker directly. The wrapper:
 *
 *   - lazily spins up the singleton worker via the shared
 *     `workers/registry.ts` infrastructure;
 *   - dispatches one request per call with a unique id;
 *   - awaits the matching reply and reconstitutes the typed
 *     arrays into a Three.js `BufferGeometry`;
 *   - bubbles worker errors as ordinary rejected promises so
 *     consumers can fall back to HTML.
 *
 * Dynamic-imports Three.js so a server-rendered page that never
 * actually instantiates a MeshText3D never pays the bundle weight.
 */

import { callWorker } from "../workers/client";
import type {
  FontKind,
  FontMeshRequest,
  FontMeshResult,
} from "./font-mesh.worker";

export type { FontKind } from "./font-mesh.worker";

export type GenerateFontMeshOptions = {
  text: string;
  font: FontKind;
  /** World-space cap-height. The renderer normalises to CSS px. */
  size: number;
  /** Extrusion depth in the same units. */
  depth: number;
  bevelSize?: number;
  bevelThickness?: number;
  curveSegments?: number;
  /** Optional soft deadline. Default 15 s — generous for the
   *  worst-case long hero string but tight enough that a
   *  stuck worker doesn't pin a render slot forever. */
  timeoutMs?: number;
};

export type GeneratedFontMesh = {
  /** A Three.js `BufferGeometry` ready to attach to a `Mesh`. */
  geometry: import("three").BufferGeometry;
  /** Bounding-box width in font units. */
  width: number;
  /** Bounding-box height in font units. */
  height: number;
  /** Bounding-box depth (the extrusion thickness). */
  depth: number;
};

/**
 * Generate an extruded glyph mesh for the given text + font.
 *
 * Returns the `BufferGeometry` already populated with positions,
 * normals, and uvs. The caller is responsible for `.dispose()`-ing
 * the geometry when the mesh leaves the scene.
 */
export async function generateFontMesh(
  options: GenerateFontMeshOptions,
): Promise<GeneratedFontMesh> {
  const {
    text,
    font,
    size,
    depth,
    bevelSize,
    bevelThickness,
    curveSegments,
    timeoutMs = 15_000,
  } = options;

  if (typeof window === "undefined") {
    throw new Error("[font-mesh] generateFontMesh is browser-only.");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("[font-mesh] cannot generate a mesh for empty text.");
  }

  const payload: FontMeshRequest = {
    text: trimmed,
    font,
    size,
    depth,
    bevelSize,
    bevelThickness,
    curveSegments,
  };

  const result = await callWorker<"font-mesh", FontMeshRequest, FontMeshResult>(
    "font-mesh",
    "build",
    payload,
    { timeoutMs },
  );

  // Dynamic-import Three so a page that doesn't render a
  // MeshText3D never ships the three core.
  const THREE = await import("three");

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(result.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(result.normals, 3),
  );
  if (result.uvs && result.uvs.length > 0) {
    geometry.setAttribute("uv", new THREE.BufferAttribute(result.uvs, 2));
  }
  if (result.indices && result.indices.length > 0) {
    geometry.setIndex(new THREE.BufferAttribute(result.indices, 1));
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return {
    geometry,
    width: result.width,
    height: result.height,
    depth: result.depth,
  };
}
