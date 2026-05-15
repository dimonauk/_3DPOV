"use client";

/**
 * Client-side device detection wrapper around the AR modes.
 *
 * Picks a sensible default based on user-agent:
 *   - iOS: model-viewer (Quick Look) — Safari has no WebXR, MindAR is glitchy
 *   - Mobile non-iOS: MindAR by default, model-viewer as secondary tab
 *   - Desktop: model-viewer 3D preview only (no camera AR makes sense)
 *
 * Additional modes appear conditionally if the card defines them:
 *   - "splat" — Gaussian Splatting via @mkkellogg/gaussian-splats-3d.
 *     Photoreal capture-based scenes. WebXR-AR when supported.
 *   - "vrm"   — VRM humanoid avatar via @pixiv/three-vrm. Idle
 *     breathing + head-tracking. Best for companion presenters
 *     (Aura) or brand mascots.
 *
 * Either mode is reachable via tabs at the top.
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Card } from "lib/ar/types";

const MindARScene = dynamic(() => import("./MindARScene"), { ssr: false });
const ModelViewerNative = dynamic(() => import("./ModelViewerNative"), { ssr: false });
const SplatViewer = dynamic(() => import("./SplatViewer"), { ssr: false });
const VRMViewer = dynamic(() => import("./VRMViewer"), { ssr: false });

type Mode = "mindar" | "world" | "desktop" | "splat" | "vrm";

function detectDefaultMode(): Mode {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  if (isIOS) return "world"; // Quick Look + 3D preview, no MindAR
  if (isAndroid) return "mindar";
  return "desktop";
}

export default function ARLandingClient({ card }: { card: Card }) {
  const [mode, setMode] = useState<Mode>("desktop");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(detectDefaultMode());
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ minHeight: "60vh" }} aria-hidden />;
  }

  const hasSplat = Boolean(card.ar.splat);
  const hasVRM = Boolean(card.ar.vrm);

  return (
    <div className="ar-landing">
      <div className="ar-tabs" role="tablist">
        {mode !== "desktop" && (
          <button
            role="tab"
            aria-selected={mode === "mindar"}
            className={mode === "mindar" ? "active" : ""}
            onClick={() => setMode("mindar")}
          >
            Card AR
          </button>
        )}
        <button
          role="tab"
          aria-selected={mode === "world"}
          className={mode === "world" ? "active" : ""}
          onClick={() => setMode("world")}
        >
          Place in space
        </button>
        <button
          role="tab"
          aria-selected={mode === "desktop"}
          className={mode === "desktop" ? "active" : ""}
          onClick={() => setMode("desktop")}
        >
          3D preview
        </button>
        {hasSplat && (
          <button
            role="tab"
            aria-selected={mode === "splat"}
            className={mode === "splat" ? "active" : ""}
            onClick={() => setMode("splat")}
          >
            Splat
          </button>
        )}
        {hasVRM && (
          <button
            role="tab"
            aria-selected={mode === "vrm"}
            className={mode === "vrm" ? "active" : ""}
            onClick={() => setMode("vrm")}
          >
            Avatar
          </button>
        )}
      </div>

      <div className="ar-stage">
        {mode === "mindar" && <MindARScene card={card} />}
        {(mode === "world" || mode === "desktop") && <ModelViewerNative card={card} />}
        {mode === "splat" && hasSplat && <SplatViewer card={card} splatUrl={card.ar.splat!} />}
        {mode === "vrm" && hasVRM && <VRMViewer card={card} vrmUrl={card.ar.vrm!} />}
      </div>

      <style jsx>{`
        .ar-landing {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .ar-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.5rem;
          margin-bottom: 1rem;
          justify-content: center;
        }
        .ar-tabs button {
          background: transparent;
          color: inherit;
          border: 1px solid currentColor;
          opacity: 0.55;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .ar-tabs button.active {
          opacity: 1;
          background: ${card.brand.primary};
          color: ${card.brand.textOnBrand};
          border-color: ${card.brand.primary};
        }
        .ar-stage {
          min-height: 60vh;
        }
      `}</style>
    </div>
  );
}
