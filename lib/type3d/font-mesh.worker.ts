/**
 * lib/type3d/font-mesh.worker.ts — Glyph-mesh generation worker.
 *
 * Lives off the main thread so the cost of tessellating display
 * type into a `BufferGeometry` (a few hundred-thousand vertices
 * for a long hero string) never causes a dropped frame on the
 * page the user is reading. Accepts a `{ text, font, size, depth }`
 * envelope, fetches the typeface JSON once per font, runs
 * `TextGeometry` against it, then ships the raw typed-array
 * attributes back as transferables so the structured-clone is
 * effectively a pointer move.
 *
 * Fonts are served from `/fonts/3d/` — see the README in the
 * companion `components/type3d/` folder for the file naming.
 *
 * NOTE: the upstream `TextGeometry` example imports `BufferGeometry`
 * from `three`, which is fine inside a module worker. Three.js
 * itself is tree-shakeable so this worker only pulls geometry +
 * font code, not the renderer.
 */

import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { AnyWorkerRequest, WorkerResponse } from "../workers/types";

export type FontKind = "display" | "mono" | "sans";

export type FontMeshRequest = {
  text: string;
  font: FontKind;
  /** Size in font units — TextGeometry treats this as world-space
   *  height of a capital glyph. The main thread normalises to CSS
   *  pixels in the renderer. */
  size: number;
  /** Extrusion depth in the same units as `size`. */
  depth: number;
  /** Bevel radius. Default 0.6 of depth's tenth — a soft chamfer. */
  bevelSize?: number;
  bevelThickness?: number;
  /** Curve segments — higher is smoother but heavier. */
  curveSegments?: number;
};

export type FontMeshResult = {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  /** TextGeometry is non-indexed by default; we surface this so
   *  the main thread can call `setIndex` if a future pipeline
   *  decides to weld vertices. Currently always undefined. */
  indices?: Uint32Array;
  /** The bounding box width/height of the laid-out text, in the
   *  same font units. Lets the main thread auto-size the canvas
   *  to the geometry rather than guessing. */
  width: number;
  height: number;
  depth: number;
};

/** Resolved font path per kind. The display font is droid-serif
 *  for now — see the type3d README for the Cormorant Garamond
 *  conversion note. */
const FONT_PATHS: Record<FontKind, string> = {
  display: "/fonts/3d/display-droid-serif-regular.typeface.json",
  sans: "/fonts/3d/sans-droid-sans-regular.typeface.json",
  mono: "/fonts/3d/mono-droid-sans-mono-regular.typeface.json",
};

const FALLBACK_PATH = "/fonts/3d/fallback-helvetiker-regular.typeface.json";

/** Cache parsed Font objects in the worker so a chatty page (many
 *  MeshText3D components) only pays the network + parse cost once. */
const fontCache = new Map<string, Promise<Font>>();

async function loadFont(kind: FontKind): Promise<Font> {
  const path = FONT_PATHS[kind];
  const cached = fontCache.get(path);
  if (cached) return cached;
  const promise = fetchFont(path).catch(async (err) => {
    // Fall back to helvetiker if the requested face 404s — the
    // page should still render display type even when the upstream
    // font asset is missing.
    console.warn(
      `[font-mesh] failed to load ${path}, falling back to helvetiker:`,
      err,
    );
    return fetchFont(FALLBACK_PATH);
  });
  fontCache.set(path, promise);
  return promise;
}

async function fetchFont(path: string): Promise<Font> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`font ${path} → HTTP ${res.status}`);
  }
  const json = await res.json();
  return new Font(json);
}

async function buildGeometry(
  payload: FontMeshRequest,
): Promise<{ result: FontMeshResult; transfer: ArrayBuffer[] }> {
  const {
    text,
    font: fontKind,
    size,
    depth,
    bevelSize = depth * 0.04,
    bevelThickness = depth * 0.06,
    curveSegments = 6,
  } = payload;

  const font = await loadFont(fontKind);

  const geometry = new TextGeometry(text, {
    font,
    size,
    depth,
    curveSegments,
    bevelEnabled: bevelSize > 0,
    bevelSize,
    bevelThickness,
    bevelSegments: 2,
  });

  // Centre on x — the renderer pivots around 0 so a single
  // align="center" gives us the right framing. The y / z origins
  // stay at TextGeometry's default (baseline at 0).
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  const bb = geometry.boundingBox;
  const width = bb ? bb.max.x - bb.min.x : 0;
  const height = bb ? bb.max.y - bb.min.y : size;
  const builtDepth = bb ? bb.max.z - bb.min.z : depth;

  if (bb) {
    geometry.translate(-(bb.min.x + width / 2), -bb.min.y, -bb.min.z);
  }

  const positionAttr = geometry.getAttribute("position");
  const normalAttr = geometry.getAttribute("normal");
  const uvAttr = geometry.getAttribute("uv");

  // Copy into fresh typed arrays — TextGeometry may share the
  // underlying buffer with the geometry, and we want to dispose
  // the geometry below before shipping.
  const positions = new Float32Array(positionAttr.array as ArrayLike<number>);
  const normals = new Float32Array(normalAttr.array as ArrayLike<number>);
  const uvs = uvAttr
    ? new Float32Array(uvAttr.array as ArrayLike<number>)
    : new Float32Array(0);

  geometry.dispose();

  const result: FontMeshResult = {
    positions,
    normals,
    uvs,
    width,
    height,
    depth: builtDepth,
  };

  return {
    result,
    transfer: [positions.buffer, normals.buffer, uvs.buffer],
  };
}

self.onmessage = async (e: MessageEvent<AnyWorkerRequest>) => {
  const req = e.data;
  if (!req || req.kind !== "font-mesh") return;
  const respond = (
    body: Partial<WorkerResponse<"font-mesh", FontMeshResult>>,
    transfer: Transferable[] = [],
  ): void => {
    const message: WorkerResponse<"font-mesh", FontMeshResult> = {
      id: req.id,
      kind: "font-mesh",
      ...body,
    };
    (self as unknown as Worker).postMessage(message, transfer);
  };

  if (req.op !== "build") {
    respond({ error: `font-mesh: unknown op "${req.op}"` });
    return;
  }

  try {
    const { result, transfer } = await buildGeometry(
      req.payload as FontMeshRequest,
    );
    respond({ result }, transfer);
  } catch (err) {
    respond({
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
