/**
 * lib/capabilities/viz/splat-render.ts — Capability `viz.splat-render`:
 * embed a 3D Gaussian Splat (`.ply`) in a viewport, via a pluggable
 * renderer that fits the page's surface.
 *
 * One-line role: viewer-agnostic splat embedding. Different pages want
 * different renderers (interactive on a product page, lightweight on
 * a journal entry, native viewer for studio bench review); this
 * capability picks the right one and normalises the React surface.
 *
 * Full purpose in splat-render.PURPOSE.md.
 *
 * # Renderers
 * Web side is intentionally single-engine (three.js) so the site keeps
 * one WebGL/WebGPU context, one set of dependencies, one mental model.
 * Two three.js gaussian-splat libraries are listed so we can A/B them
 * without surface code knowing; if neither holds up under load,
 * branching out (PlayCanvas SuperSplat in an iframe, splat.js, etc.)
 * happens here later.
 *
 * - "spark-js" — sparkjsdev/spark gaussian-splat renderer on three.js.
 *   Default for product surfaces. R3F-compatible.
 * - "gsplat-js" — `@mkkellogg/gaussian-splat-3d` on three.js. Alternative
 *   three.js implementation; useful when a surface needs slightly
 *   different camera / animation primitives or wants a second
 *   implementation to compare against.
 * - "postshot-binary" — open the file in Postshot via a system-level
 *   protocol handler. Studio-bench only; not for public surfaces.
 *
 * # PLY flavour requirements
 * Both web renderers require the standard INRIA-3DGS PLY layout.
 * SHARP's raw PLYs must be converted first via `convert_sharp_ply.py`
 * (in `D:/The_Hangar/engines/sharp-onnx/`) before they reach a web
 * target.
 *
 * # Posture
 * Foundation phase: types + props surface only. Concrete React
 * components for each renderer live alongside the targets they front
 * (`components/viewers/splat-spark.tsx` etc.) and are wired one at a
 * time as each integration stabilises.
 */

import type { SplatPlyFlavour, SplatRecord } from "./splat-generate";

export type SplatRenderer =
  | "spark-js"
  | "gsplat-js"
  | "postshot-binary";

/**
 * Capability tier of a renderer. Public surfaces only pick from `web`
 * renderers; studio-bench tooling can also pick `bench-only`.
 */
export type SplatRendererTier = "web" | "bench-only";

export const RENDERER_TIER: Readonly<Record<SplatRenderer, SplatRendererTier>> =
  {
    "spark-js": "web",
    "gsplat-js": "web",
    "postshot-binary": "bench-only",
  };

/**
 * Which PLY flavours each renderer can consume directly. Used to gate
 * whether the conversion path needs to run before the embed.
 */
export const RENDERER_FLAVOURS: Readonly<
  Record<SplatRenderer, readonly SplatPlyFlavour[]>
> = {
  "spark-js": ["standard-3dgs"],
  "gsplat-js": ["standard-3dgs"],
  // Postshot 1.1.0 imports standard PLYs cleanly; SHARP's superset
  // header trips it. Treat as standard-only for safety.
  "postshot-binary": ["standard-3dgs"],
};

export type SplatViewerProps = {
  /** The record to render. */
  record: Pick<SplatRecord, "plyUrl" | "plyFlavour" | "gaussianCount">;
  /** Which renderer to use. Default: "spark-js". */
  renderer?: SplatRenderer;
  /** Aspect ratio of the viewport (W/H). Default: 16/9. */
  aspect?: number;
  /** Auto-orbit camera when idle. Default: true. */
  autoRotate?: boolean;
  /** Caller-supplied background colour. Default: midnight (#0a0a0f). */
  background?: string;
  /** Render only when scrolled into view. Default: true. */
  lazy?: boolean;
};

export type SplatRenderError = {
  code:
    | "renderer-unsupported"
    | "flavour-mismatch"
    | "ply-fetch-failed"
    | "webgpu-required";
  message: string;
};

/**
 * Decide which renderer to use for a given record. Defaults to
 * "spark-js" on the web side; bench-only contexts (Electron-shell
 * studio tools, not the public site) can override to "postshot-binary".
 * Throws when the record's PLY flavour is incompatible with web
 * renderers — caller must convert through `convert_sharp_ply.py` first.
 */
export function pickSplatRenderer(
  record: Pick<SplatRecord, "plyFlavour">,
  context: { bench?: boolean } = {},
): SplatRenderer {
  if (record.plyFlavour !== "standard-3dgs") {
    const detail: SplatRenderError = {
      code: "flavour-mismatch",
      message: `viz.splat-render: ${record.plyFlavour} cannot be rendered by any web target — convert to standard-3dgs first`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }
  return context.bench ? "postshot-binary" : "spark-js";
}
