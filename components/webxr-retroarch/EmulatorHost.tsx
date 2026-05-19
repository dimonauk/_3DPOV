"use client";

/**
 * components/webxr-retroarch/EmulatorHost.tsx — Boots EmulatorJS into
 * a hidden DOM div + exposes the canvas to the parent scene.
 *
 * EmulatorJS wants a real DOM container and a real `<canvas>`. R3F's
 * Canvas owns its own canvas and can't be shared. So the pattern: keep
 * EmulatorJS rendering off-screen in a detached div, find its canvas,
 * hand it to the parent for the texture-bridge.
 *
 * Audio still plays — Web Audio doesn't care about DOM visibility. The
 * future pass routes EmulatorJS audio through the studio's spatial
 * audio bus (`lib/game/audio-bus.ts`); for now EmulatorJS uses its own
 * AudioContext, which is fine but not spatialised.
 *
 * EmulatorJS doesn't expose a clean teardown — switching systems
 * mid-session needs a page reload. Documented.
 */

import { useEffect, useRef, useState } from "react";

import type { EmulatorSystem } from "lib/emulator/systems";

const EMULATORJS_CDN = "https://cdn.emulatorjs.org/stable/data/";

declare global {
  interface Window {
    EJS_player?: string;
    EJS_core?: string;
    EJS_gameUrl?: string;
    EJS_pathtodata?: string;
    EJS_startOnLoaded?: boolean;
    EJS_biosUrl?: string;
    EJS_gameName?: string;
  }
}

export type EmulatorHostProps = {
  system: EmulatorSystem;
  romUrl: string;
  romName: string;
  biosUrl?: string;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
};

export function EmulatorHost({
  system,
  romUrl,
  romName,
  biosUrl,
  onCanvasReady,
}: EmulatorHostProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [status, setStatus] = useState<"booting" | "ready" | "failed">(
    "booting",
  );

  useEffect(() => {
    if (!hostRef.current) return;
    window.EJS_player = "#ejs-host-vr";
    window.EJS_core = system.coreSlug;
    window.EJS_gameUrl = romUrl;
    window.EJS_pathtodata = EMULATORJS_CDN;
    window.EJS_startOnLoaded = true;
    window.EJS_gameName = romName || system.label;
    if (biosUrl) window.EJS_biosUrl = biosUrl;

    if (!scriptLoadedRef.current) {
      const script = document.createElement("script");
      script.src = `${EMULATORJS_CDN}loader.js`;
      script.async = true;
      script.onerror = () => setStatus("failed");
      document.body.appendChild(script);
      scriptLoadedRef.current = true;
    }

    // Poll the hidden host for the canvas. EmulatorJS adds it
    // asynchronously after the WASM core finishes downloading — up to
    // ~15 s on coffee-shop Wi-Fi.
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts++;
      const canvas = hostRef.current?.querySelector<HTMLCanvasElement>(
        "canvas.ejs_canvas, canvas",
      );
      if (canvas) {
        window.clearInterval(interval);
        setStatus("ready");
        onCanvasReady(canvas);
        return;
      }
      if (attempts > 60) {
        window.clearInterval(interval);
        setStatus("failed");
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [romUrl]);

  return (
    <>
      {/* Hidden host. position: absolute; top: -9999px rather than
          display: none — some Chromium builds skip compositing
          detached subtrees and the canvas never gets upgraded. */}
      <div
        ref={hostRef}
        id="ejs-host-vr"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "640px",
          height: "480px",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      />
      {status === "failed" && (
        <div
          role="alert"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            padding: "0.6rem 0.8rem",
            background: "rgba(40, 6, 18, 0.92)",
            border: "1px solid #ff6fb5",
            color: "#ffd4e3",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.7rem",
            borderRadius: 4,
          }}
        >
          EmulatorJS failed to boot — check the network tab, then reload.
          The CDN is occasionally rate-limited on free hosting plans.
        </div>
      )}
    </>
  );
}

export default EmulatorHost;
