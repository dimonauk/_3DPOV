"use client";

/**
 * model-viewer wrapper for world-placement AR.
 *
 * On iOS: launches AR Quick Look with the USDZ.
 * On Android: launches Scene Viewer with the GLB.
 * On desktop: shows an interactive 3D preview.
 *
 * This is the iOS-safe fallback path because Safari has no WebXR. Users tap
 * the "Place in your space" button and their OS handles the rest natively.
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

  // Build ar-modes: prefer WebXR where supported, then native (Scene Viewer / Quick Look)
  // Order matters — model-viewer tries them left-to-right.
  const arModes = "scene-viewer webxr quick-look";

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
        auto-rotate={card.ar.autoRotate ? "true" : undefined}
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
