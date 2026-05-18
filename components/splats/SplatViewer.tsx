"use client";

/**
 * <SplatViewer /> — Client-side Gaussian splat viewer.
 *
 * Wraps Spark.js (`@sparkjsdev/spark`) over Three.js. Accepts a URL
 * (registry-resolved blob URL or http(s) URL) or a user-picked
 * local file (turned into an object URL). The user can pick any
 * .ply / .splat / .ksplat / .spz / .sog file from their disk; the
 * bytes never upload, the viewer runs entirely in the browser.
 *
 * Spark.js: https://github.com/sparkjsdev/spark (MIT).
 */

import { useEffect, useRef, useState } from "react";

export type SplatViewerProps = {
  /** Registry-resolved URL (if loading a known asset). When absent
   *  the viewer opens with the file picker. */
  src?: string;
  /** Alt / accessible label. */
  alt?: string;
  /** Viewer height. */
  height?: string;
};

type ViewState =
  | { kind: "idle" }
  | { kind: "loading"; label: string }
  | { kind: "ready"; label: string }
  | { kind: "error"; message: string };

export default function SplatViewer({
  src,
  alt = "Gaussian splat",
  height = "60vh",
}: SplatViewerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [state, setState] = useState<ViewState>({ kind: "idle" });

  const boot = async (loadUrl: string, label: string) => {
    if (!hostRef.current) return;
    setState({ kind: "loading", label });
    // Tear down any previous scene.
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    try {
      // Spark.js's npm bundle uses a webpack asset-module config
      // (`generator: { filename }`) that Next 15.6 canary's webpack
      // rejects. We side-step by loading from esm.sh at runtime with
      // a webpackIgnore directive — webpack never parses the package
      // and the browser's native ESM loader fetches it on demand.
      const [THREE, SPARK] = await Promise.all([
        import("three"),
        import(
          /* webpackIgnore: true */ "https://esm.sh/@sparkjsdev/spark@0.1.10"
        ),
      ]);
      const host = hostRef.current;
      // Clear any leftover canvas.
      host.innerHTML = "";

      const width = host.clientWidth || 800;
      const heightPx = host.clientHeight || 600;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, heightPx);
      renderer.setClearColor(0x000000, 1);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        50,
        width / heightPx,
        0.1,
        500,
      );
      camera.position.set(0, 0.5, 3);

      // Pull SparkRenderer + SplatMesh defensively — Spark's named
      // exports moved between 0.x versions.
      const SparkRenderer =
        (SPARK as Record<string, unknown>)["SparkRenderer"] ??
        (SPARK as Record<string, unknown>)["default"];
      const SplatMesh =
        (SPARK as Record<string, unknown>)["SplatMesh"] ??
        (SPARK as Record<string, unknown>)["Splat"] ??
        (SPARK as Record<string, unknown>)["GaussianSplat"];

      if (typeof SplatMesh !== "function") {
        throw new Error(
          "@sparkjsdev/spark: SplatMesh constructor not found in package exports",
        );
      }

      const splat = new (SplatMesh as new (
        opts: Record<string, unknown>,
      ) => unknown)({ url: loadUrl });
      // @ts-expect-error SplatMesh extends Object3D in the runtime
      scene.add(splat);

      // Optional helper renderer pass if the package exposes one.
      let sparkPass: { update?: () => void } | null = null;
      if (typeof SparkRenderer === "function") {
        try {
          sparkPass = new (SparkRenderer as new (
            r: unknown,
            s: unknown,
            c: unknown,
          ) => { update?: () => void })(renderer, scene, camera);
        } catch {
          /* package surface differs by version; ignore */
        }
      }

      // Simple orbital drag controls (avoids extra OrbitControls dep).
      let yaw = 0;
      let pitch = 0.15;
      let distance = 3;
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        (e.target as Element).setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        yaw -= dx * 0.005;
        pitch = Math.max(
          -Math.PI / 2 + 0.1,
          Math.min(Math.PI / 2 - 0.1, pitch + dy * 0.005),
        );
      };
      const onUp = () => {
        dragging = false;
      };
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        distance = Math.max(0.4, Math.min(20, distance + e.deltaY * 0.005));
      };
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("wheel", onWheel, {
        passive: false,
      });

      // Animation loop.
      let frameId = 0;
      const tick = () => {
        camera.position.set(
          distance * Math.cos(pitch) * Math.sin(yaw),
          distance * Math.sin(pitch) + 0.5,
          distance * Math.cos(pitch) * Math.cos(yaw),
        );
        camera.lookAt(0, 0, 0);
        sparkPass?.update?.();
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(tick);
      };
      tick();

      const onResize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanupRef.current = () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("resize", onResize);
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerup", onUp);
        renderer.domElement.removeEventListener("wheel", onWheel);
        renderer.dispose();
        host.innerHTML = "";
      };

      setState({ kind: "ready", label });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // Boot whenever `src` is provided as a prop.
  useEffect(() => {
    if (src && state.kind === "idle") {
      void boot(src, alt);
    }
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const onPickFile = (file: File | undefined) => {
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    void boot(url, file.name);
  };

  return (
    <div className="splat-viewer-root">
      <div
        ref={hostRef}
        className="splat-viewer-host"
        style={{ height }}
        aria-label={alt}
      />
      <div className="splat-viewer-controls">
        {state.kind === "idle" && !src ? (
          <label className="splat-viewer-picker">
            <span>Pick a .ply / .splat / .ksplat / .spz / .sog file</span>
            <input
              type="file"
              accept=".ply,.splat,.ksplat,.spz,.sog"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
          </label>
        ) : null}
        {state.kind === "loading" ? (
          <span className="splat-viewer-status">
            Loading {state.label}…
          </span>
        ) : null}
        {state.kind === "ready" ? (
          <span className="splat-viewer-status">{state.label}</span>
        ) : null}
        {state.kind === "error" ? (
          <span className="splat-viewer-status splat-viewer-error">
            Failed: {state.message}
          </span>
        ) : null}
      </div>

      <style>{`
        .splat-viewer-root {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .splat-viewer-host {
          width: 100%;
          min-height: 320px;
          background: #000;
          border-radius: 0.5rem;
          overflow: hidden;
          touch-action: none;
        }
        .splat-viewer-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .splat-viewer-picker {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .splat-viewer-picker input {
          background: rgba(0, 0, 0, 0.35);
          color: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.4rem 0.65rem;
          border-radius: 0.4rem;
        }
        .splat-viewer-status {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.55);
        }
        .splat-viewer-error {
          color: #ff8585;
        }
      `}</style>
    </div>
  );
}
