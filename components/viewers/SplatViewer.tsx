"use client";

/**
 * components/viewers/SplatViewer.tsx — Router for the `viz.splat-render` capability.
 *
 * Pages don't import a specific renderer; they import `<SplatViewer>`
 * and pass a `record` + an optional `renderer` choice. This component
 * dispatches to the right implementation. Today that's the spark-js
 * target (implemented via @mkkellogg/gaussian-splats-3d while
 * @sparkjsdev/spark's webpack-asset-module-generator config blocks the
 * build — see splat-viewer-spark.tsx); when alternatives land they
 * slot in here without touching surface code.
 *
 * Throws synchronously when the renderer is incompatible with the
 * record's PLY flavour, so the page can render a fallback message
 * before mounting a useless WebGL context. `pickSplatRenderer` runs
 * the same gate (used by surfaces that want to decide the renderer
 * before rendering).
 */

import { pickSplatRenderer, type SplatViewerProps } from "lib/capabilities/viz/splat-render";

import SplatViewerSpark from "./splat-viewer-spark";

export function SplatViewer(props: SplatViewerProps) {
  const renderer = props.renderer ?? pickSplatRenderer(props.record);

  switch (renderer) {
    case "spark-js":
    case "gsplat-js":
      // Both web renderers currently route to the same component —
      // see splat-viewer-spark.tsx for the why. When they diverge,
      // add a second case here.
      return <SplatViewerSpark {...props} />;
    case "postshot-binary":
      // Bench-only renderer; web surfaces shouldn't pick this. Render
      // nothing rather than try to spawn a desktop binary from the
      // browser.
      return null;
  }
}

export default SplatViewer;
