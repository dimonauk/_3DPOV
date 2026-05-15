"use client";

/**
 * Client-side device detection wrapper around the AR modes.
 *
 * The default mode the user lands on:
 *   - Mobile (iOS + Android): "room" — webcam-fed AR scene that
 *     composites the model into the user's actual space using
 *     getUserMedia + device orientation. The strongest immediate
 *     impression and works on every modern mobile browser.
 *   - Desktop: "desktop" — model-viewer 3D preview only (no
 *     camera AR makes sense on a laptop without a rear cam).
 *
 * Always-available tabs (where the device supports them):
 *   - Room AR     — webcam passthrough + 3D overlay + parallax
 *   - Card AR     — MindAR image-tracked AR (printed card scan)
 *   - Place in space — model-viewer Quick Look / Scene Viewer
 *   - 3D preview  — model-viewer canvas, no camera
 *
 * Conditional tabs (only when the card defines them):
 *   - Splat       — Gaussian Splatting via @mkkellogg/gaussian-splats-3d
 *   - Avatar      — VRM humanoid via @pixiv/three-vrm
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Card } from "lib/ar/types";

const MindARScene = dynamic(() => import("./MindARScene"), { ssr: false });
const ModelViewerNative = dynamic(() => import("./ModelViewerNative"), { ssr: false });
const WebcamARScene = dynamic(() => import("./WebcamARScene"), { ssr: false });
const SplatViewer = dynamic(() => import("./SplatViewer"), { ssr: false });
const VRMViewer = dynamic(() => import("./VRMViewer"), { ssr: false });

type Mode = "room" | "mindar" | "world" | "desktop" | "splat" | "vrm";

function detectDefaultMode(): Mode {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const isMobile = /iPad|iPhone|iPod|Android/.test(ua) && !(window as any).MSStream;
  if (isMobile) return "room"; // straight into webcam AR — the wow path
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

  const isMobile =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

  const hasSplat = Boolean(card.ar.splat);
  const hasVRM = Boolean(card.ar.vrm);

  return (
    <div className="ar-landing">
      <div className="ar-tabs" role="tablist">
        {isMobile && (
          <button
            role="tab"
            aria-selected={mode === "room"}
            className={mode === "room" ? "active" : ""}
            onClick={() => setMode("room")}
          >
            Room AR
          </button>
        )}
        {isMobile && (
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
        {mode === "room" && <WebcamARScene card={card} />}
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
          position: relative;
        }
      `}</style>
    </div>
  );
}
