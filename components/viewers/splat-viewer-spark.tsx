"use client";

/**
 * components/viewers/splat-viewer-spark.tsx — `<SplatViewerSpark>`.
 *
 * Three.js-native 3D Gaussian Splat viewer for the public surface
 * (e.g. /research/cctv-3d-archive). Renders a `.ply` in a self-driven
 * three.js scene with built-in controls.
 *
 * # Why not actually Spark
 * The file is named for `@sparkjsdev/spark` (our `viz.splat-render`
 * default renderer) because that's the renderer-union id we standardise
 * on. The implementation here uses **@mkkellogg/gaussian-splats-3d**
 * instead — Spark 0.1.10's dist bundle has a webpack-5 asset-module
 * generator config that the current Next.js webpack rejects at compile
 * time. Both libraries are three.js-based; surface and props are
 * identical. When Spark ships a fix, this file goes back to it; the
 * page and capability surface stay unchanged.
 *
 * Implements the `viz.splat-render` capability's "spark-js" target
 * (see `lib/capabilities/viz/splat-render.ts`).
 */

import { useEffect, useRef } from "react";

import type { SplatViewerProps } from "lib/capabilities/viz/splat-render";

export default function SplatViewerSpark({
  record,
  aspect = 16 / 9,
  autoRotate = true,
  background = "#0a0a0f",
  lazy = true,
}: SplatViewerProps) {
  void lazy; // honoured by caller via IntersectionObserver; we render unconditionally when mounted
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    // Dynamic imports — keeps both deps out of the static module tree.
    // gsplat's Viewer constructor allocates GPU buffers; only ever runs
    // client-side.
    let dispose: (() => void) | null = null;
    void (async () => {
      const GaussianSplats3D = await import("@mkkellogg/gaussian-splats-3d");
      if (cancelled || !container) return;

      const viewer = new GaussianSplats3D.Viewer({
        cameraUp: [0, 1, 0],
        initialCameraPosition: [0, 0.3, 1.2],
        initialCameraLookAt: [0, 0, 0],
        rootElement: container,
        sphericalHarmonicsDegree: 0,
        sharedMemoryForWorkers: false,
        gpuAcceleratedSort: true,
        useBuiltInControls: true,
        selfDrivenMode: true,
      });

      try {
        await viewer.addSplatScene(record.plyUrl, {
          progressiveLoad: true,
          showLoadingUI: true,
        });
        if (cancelled) {
          viewer.dispose();
          return;
        }
        viewer.start();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("SplatViewerSpark: failed to load scene", err);
      }

      dispose = () => {
        try {
          viewer.stop();
          viewer.dispose();
        } catch {
          // best-effort cleanup
        }
      };
    })();

    return () => {
      cancelled = true;
      if (dispose) dispose();
    };
  }, [record.plyUrl]);

  void autoRotate; // mkkellogg viewer drives its own orbit; future option to wire here
  return (
    <div
      ref={containerRef}
      style={{ aspectRatio: aspect, background }}
      className="w-full overflow-hidden rounded-sm border border-warm-black-800"
    />
  );
}
