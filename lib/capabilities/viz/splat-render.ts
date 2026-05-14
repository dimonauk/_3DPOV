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
 * - "spark-js" — sparkjsdev/spark gaussian-splat renderer on three.js.
 *   In-process, fits naturally inside R3F scenes. Default for product
 *   surfaces.
 * - "supersplat-iframe" — PlayCanvas SuperSplat editor in an iframe.
 *   Useful for journal entries / research pages where the user wants
 *   to inspect / annotate. No local code to maintain.
 * - "postshot-binary" — open the file in Postshot via a system-level
 *   protocol handler. Studio-bench only; not for public surfaces.
 *
 * # PLY flavour requirements
 * Each renderer has different tolerance for non-standard PLY layouts.
 * Spark and SuperSplat require `standard-3dgs` flavour. SHARP's raw
 * PLYs must be converted first (`convert_sharp_ply.py`).
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
  | "supersplat-iframe"
  | "postshot-binary";

/**
 * Capability tier of a renderer. Public surfaces only pick from `web`
 * renderers; studio-bench tooling can also pick `bench-only`.
 */
export type SplatRendererTier = "web" | "bench-only";

export const RENDERER_TIER: Readonly<Record<SplatRenderer, SplatRendererTier>> =
  {
    "spark-js": "web",
    "supersplat-iframe": "web",
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
  "supersplat-iframe": ["standard-3dgs"],
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
 * Decide which renderer to use for a given record + surface context.
 * Returns "spark-js" by default; downgrades to "supersplat-iframe"
 * when the host page can't run an R3F scene (e.g. plain markdown
 * surface). Throws when the record's flavour is incompatible with
 * every web renderer.
 */
export function pickSplatRenderer(
  record: Pick<SplatRecord, "plyFlavour">,
  context: { hostHasR3F: boolean },
): SplatRenderer {
  if (record.plyFlavour !== "standard-3dgs") {
    const detail: SplatRenderError = {
      code: "flavour-mismatch",
      message: `viz.splat-render: ${record.plyFlavour} cannot be rendered by any web target — convert to standard-3dgs first`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }
  return context.hostHasR3F ? "spark-js" : "supersplat-iframe";
}
