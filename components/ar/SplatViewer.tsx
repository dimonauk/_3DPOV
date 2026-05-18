"use client";

/**
 * SplatViewer — Gaussian Splatting renderer for AR cards.
 *
 * Wraps @mkkellogg/gaussian-splats-3d's built-in Viewer in a React
 * component. Mounts on a div, owns its own three.js renderer and
 * camera, drives its own animation loop.
 *
 * Why 3DGS for AR cards:
 *   - Photoreal capture from a phone-camera video pass over an
 *     object/space. Use Luma, Polycam, SuperSplat, or train locally
 *     with INRIA's gaussian-splatting repo.
 *   - Renders in real-time on modern mobile (iPhone 12+, recent
 *     Android flagships) at 30-60fps for scenes under ~1M splats.
 *   - Far more lifelike than polygon meshes for organic forms,
 *     reflective surfaces, hair, fur, and atmospheric light.
 *
 * Supported file formats:
 *   - .ply  (raw INRIA output — slowest to load, no progressive)
 *   - .splat (antimatter15-style compressed — most common)
 *   - .ksplat (mkkellogg's own compressed format — fastest)
 *
 * To enable on a card, set `card.ar.splat = "/path/to/scene.ksplat"`.
 *
 * # WebXR
 *
 * The mkkellogg Viewer has built-in WebXR support — passing
 * webXRMode: AR triggers an "Enter AR" button on devices that
 * support immersive-ar sessions (Quest 3, recent Android Chrome).
 * Devices without WebXR-AR get the desktop preview only.
 */

import { useEffect, useRef } from "react";
import { createLogger, errToObject } from "lib/log";
import type { Card } from "lib/ar/types";

const log = createLogger("ar.SplatViewer");

type SplatViewerProps = { card: Card; splatUrl: string };

export default function SplatViewer({ card, splatUrl }: SplatViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      const [THREE, GaussianSplats3D] = await Promise.all([
        import("three"),
        import("@mkkellogg/gaussian-splats-3d"),
      ]);
      if (cancelled) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Detect WebXR-AR support so we can light up the AR button if available.
      // Computed up-front then `as number` to side-step a literal-type
      // narrowing under the package's .d.ts shim where `None: 0` and
      // `AR: 2` get treated as incompatible literal types.
      let arSupported = false;
      try {
        const xr = (navigator as { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
        arSupported = !!xr && (await xr.isSessionSupported("immersive-ar"));
      } catch {
        // No WebXR available — leave arSupported false.
      }
      const webXRMode: number = arSupported
        ? GaussianSplats3D.WebXRMode.AR
        : GaussianSplats3D.WebXRMode.None;

      const viewer = new GaussianSplats3D.Viewer({
        cameraUp: [0, 1, 0],
        initialCameraPosition: [0, 0.3, 1.2],
        initialCameraLookAt: [0, 0, 0],
        rootElement: container,
        sphericalHarmonicsDegree: 2,
        sharedMemoryForWorkers: false, // safer in iframes / various hosts
        ignoreDevicePixelRatio: false,
        gpuAcceleratedSort: true,
        enableSIMDInSort: true,
        dynamicScene: false,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
        webXRMode,
        renderMode: GaussianSplats3D.RenderMode.OnChange,
      });

      // Register the dispose hook BEFORE awaiting addSplatScene so an
      // exception (or a fast unmount) on that await doesn't orphan the
      // already-allocated Viewer + its WebGL context.
      disposeRef.current = () => {
        try {
          viewer.dispose();
        } catch {
          // ignore dispose errors on unmount
        }
      };

      try {
        await viewer.addSplatScene(splatUrl, {
          progressiveLoad: splatUrl.endsWith(".ply") || splatUrl.endsWith(".splat"),
          showLoadingUI: true,
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        });
        if (cancelled) return; // cleanup runs from the returned ref
        viewer.start();
      } catch (err) {
        log.error("failed to load scene", { err: errToObject(err) });
        // dispose hook already wired — cleanup will release the viewer.
      }
    })();

    return () => {
      cancelled = true;
      if (disposeRef.current) {
        disposeRef.current();
        disposeRef.current = null;
      }
    };
  }, [splatUrl]);

  return (
    <div className="splat-root">
      <div
        ref={containerRef}
        className="splat-canvas"
        style={{
          background: `linear-gradient(135deg, ${card.brand.primary}22, ${card.brand.secondary}22)`,
        }}
      />
      <div className="splat-caption">
        Gaussian Splat scene · drag to orbit · scroll to zoom
      </div>
      <style jsx>{`
        .splat-root {
          width: 100%;
          padding: 0 1rem;
        }
        .splat-canvas {
          width: 100%;
          height: 70vh;
          min-height: 400px;
          border-radius: 1rem;
          overflow: hidden;
          position: relative;
        }
        .splat-caption {
          margin-top: 0.5rem;
          text-align: center;
          font-size: 0.8rem;
          opacity: 0.6;
          font-family: system-ui, -apple-system, sans-serif;
        }
        @media (prefers-reduced-motion: no-preference) {
          .splat-canvas {
            animation: splat-float 5s ease-in-out infinite;
          }
          @keyframes splat-float {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-6px); }
          }
        }
      `}</style>
    </div>
  );
}
