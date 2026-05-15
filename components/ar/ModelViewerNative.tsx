"use client";

/**
 * model-viewer wrapper for world-placement AR.
 *
 * On iOS: launches AR Quick Look with the USDZ.
 * On Android: launches Scene Viewer with the GLB.
 * On desktop: shows an interactive 3D preview.
 *
 * This is the iOS-safe fallback path because Safari has no WebXR. Users
 * tap the "Place in your space" button and their OS handles the rest
 * natively.
 *
 * # Animation defaults
 *
 * The card landings should feel alive. We compose three effects:
 *
 *   1. Gentle auto-rotation around Y (12°/s, immediate, no idle delay).
 *      Falls back to no rotation if `card.ar.autoRotate === false`.
 *   2. Autoplay for any baked-in GLTF animations — skeletal, morph,
 *      transform tracks all play automatically if the GLB has them.
 *      Static-mesh cards just rotate.
 *   3. A subtle vertical float on the whole viewer (translateY ±6px
 *      over 5s, ease-in-out, infinite). This is a CSS-only effect on
 *      the host element; it doesn't change the model's local
 *      transform so iOS Quick Look + Scene Viewer still see the
 *      original geometry.
 *
 * Defaults are tuned for "ambient" presence in a card landing, not
 * "look at me" presentation. The user can still drag to inspect; the
 * camera returns to auto-rotate after the default 3s of no input
 * (camera-controls behaviour).
 */

import { useEffect, useRef } from "react";
import type { Card } from "lib/ar/types";

// React 19: JSX namespace lives inside "react", not as a global.
// This declaration makes <model-viewer /> typecheck.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & Record<string, unknown>,
        HTMLElement
      >;
    }
  }
}

export default function ModelViewerNative({ card }: { card: Card }) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    // Web component import side-effects only — no top-level await needed.
    import("@google/model-viewer").catch((err) => {
      console.error("Failed to load model-viewer:", err);
    });
  }, []);

  // Build ar-modes: prefer WebXR where supported, then native Scene Viewer / Quick Look.
  // Order matters — model-viewer tries them left-to-right.
  const arModes = "scene-viewer webxr quick-look";

  const shouldRotate = card.ar.autoRotate !== false;

  return (
    <div className="mv-root">
      <model-viewer
        src={card.ar.model}
        ios-src={card.ar.modelUSDZ}
        alt={`3D model for ${card.name}`}
        ar="true"
        ar-modes={arModes}
        ar-scale="auto"
        camera-controls="true"
        // Pull camera back to 145% of the bounding-sphere radius. The
        // model-viewer default of 105% is too tight for dense geometry like
        // the protean-elite lineage where ribbons reach the bounding-box
        // corners — at 105% the camera frames the box itself, not the
        // farthest visible features, so the bottom of the model clips
        // below the viewer. 145% leaves comfortable margin without
        // making sparser models look distant.
        camera-orbit="0deg 75deg 145%"
        // Gentle auto-rotate — 12°/s is roughly a quarter of the default
        // 30°/s, reads as ambient rather than presentational.
        auto-rotate={shouldRotate ? "true" : undefined}
        auto-rotate-delay={shouldRotate ? "0" : undefined}
        rotation-per-second={shouldRotate ? "12deg" : undefined}
        // Autoplay any baked-in GLTF animations (skeletal/morph/transform).
        // No-op for static meshes; lights up rigged ones.
        autoplay="true"
        // Suppress the "drag to rotate" overlay — feels too prescriptive
        // when the model is already moving on its own.
        interaction-prompt="none"
        // Smoother camera return after the user lets go.
        interpolation-decay="200"
        shadow-intensity="0.9"
        environment-image="neutral"
        exposure="1.0"
        style={{
          width: "100%",
          height: "70vh",
          minHeight: "400px",
          background: `linear-gradient(135deg, ${card.brand.primary}22, ${card.brand.secondary}22)`,
          borderRadius: "1rem",
        }}
      >
        <button slot="ar-button" className="mv-ar-btn">
          📱 Place in your space
        </button>
      </model-viewer>

      <style jsx>{`
        .mv-root {
          width: 100%;
          padding: 0 1rem;
        }
        /* Subtle vertical float on the viewer itself. Doesn't affect the
           model's transform inside Quick Look / Scene Viewer — purely
           visual on the preview surface. */
        @keyframes mv-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .mv-root :global(model-viewer) {
            animation: mv-float 5s ease-in-out infinite;
            will-change: transform;
          }
        }
        :global(.mv-ar-btn) {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          background: ${card.brand.primary};
          color: ${card.brand.textOnBrand};
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 999px;
          font-weight: 700;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 4px 20px ${card.brand.primary}66;
        }
        :global(.mv-ar-btn:active) {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
}
