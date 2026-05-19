"use client";

/**
 * components/ambient/AmbientField.tsx — opt-in ambient particle
 * backdrop.
 *
 * Mounts a fixed, full-viewport, pointer-events-none canvas behind
 * the page chrome. Dynamic-imports the heavy renderer modules
 * (three/webgpu + the TSL nodes, or the WebGL fallback) on mount —
 * pages that don't render this component pay no bundle weight.
 *
 * Hard rules (mirrored in components/ambient/README.md):
 *   - prefers-reduced-motion → render a static gradient, no canvas.
 *   - document.hidden → pause the loop, resume on visibility.
 *   - IntersectionObserver → pause when the wrapper is off-screen.
 *   - pointer-events: none → never blocks clicks.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AmbientRenderer,
  AmbientDensity,
  AmbientPalette,
} from "lib/ambient/config";

export type AmbientFieldProps = {
  density?: AmbientDensity;
  palette?: AmbientPalette;
  /** 0-1 — translates to the alpha exposure of each particle. */
  intensity?: number;
  /** Mouse attractor on/off. Default true. */
  interactive?: boolean;
  /** Optional className on the outer wrapper for ad-hoc z-index
   *  tweaks. The wrapper is already position: fixed; inset: 0. */
  className?: string;
};

export function AmbientField({
  density = "medium",
  palette = "pink",
  intensity = 0.6,
  interactive = true,
  className,
}: AmbientFieldProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<AmbientRenderer | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // prefers-reduced-motion: only static gradient on a reduced-motion
  // device. Re-evaluated on a media-query change so a settings flip
  // mid-session doesn't strand us in the wrong mode.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Bring up the renderer. All side-effects guarded by the cleanup —
  // a fast unmount during init() won't leak a GL context.
  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    let cancelled = false;
    let visible = true;
    let onScreen = true;
    let resizeObs: ResizeObserver | null = null;
    let intersectObs: IntersectionObserver | null = null;
    let onVis: (() => void) | null = null;
    let onMove: ((e: PointerEvent) => void) | null = null;
    let onLeave: (() => void) | null = null;

    (async () => {
      const { generateInitialParticles } = await import(
        "lib/workers/particle-init"
      );
      const { DENSITY_PRESETS, pickTargetFps } = await import(
        "lib/ambient/config"
      );

      const count = DENSITY_PRESETS[density];
      const targetFps = pickTargetFps();
      const { positions, velocities } = await generateInitialParticles({
        count,
        seed: ((density.charCodeAt(0) + palette.charCodeAt(0)) * 9973) | 0,
      });
      if (cancelled) return;

      const renderer = await buildRenderer();
      if (cancelled) {
        renderer?.dispose();
        return;
      }

      try {
        await renderer.init(canvas, {
          density,
          palette,
          intensity,
          interactive,
          targetFps,
          positions,
          velocities,
        });
      } catch (err) {
        // Don't crash the page if the renderer fails to init —
        // ambient decoration is, by definition, optional.
        // eslint-disable-next-line no-console
        console.warn("AmbientField: renderer init failed", err);
        renderer.dispose();
        return;
      }
      if (cancelled) {
        renderer.dispose();
        return;
      }
      rendererRef.current = renderer;

      const applySize = () => {
        const rect = wrapper.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        renderer.resize(rect.width, rect.height, dpr);
      };
      applySize();
      resizeObs = new ResizeObserver(applySize);
      resizeObs.observe(wrapper);

      const maybeRun = () => {
        if (visible && onScreen) renderer.start();
        else renderer.stop();
      };

      intersectObs = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          onScreen = entry.isIntersecting;
          maybeRun();
        },
        { threshold: 0 },
      );
      intersectObs.observe(wrapper);

      onVis = () => {
        visible = !document.hidden;
        maybeRun();
      };
      document.addEventListener("visibilitychange", onVis);

      if (interactive) {
        onMove = (e: PointerEvent) => {
          const rect = wrapper.getBoundingClientRect();
          const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
          renderer.setMouse(nx, ny, true);
        };
        onLeave = () => renderer.setMouse(0, 0, false);
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerleave", onLeave);
      }

      maybeRun();
    })();

    return () => {
      cancelled = true;
      if (resizeObs) resizeObs.disconnect();
      if (intersectObs) intersectObs.disconnect();
      if (onVis) document.removeEventListener("visibilitychange", onVis);
      if (onMove) window.removeEventListener("pointermove", onMove);
      if (onLeave) window.removeEventListener("pointerleave", onLeave);
      const r = rendererRef.current;
      rendererRef.current = null;
      r?.dispose();
    };
    // density/palette/intensity/interactive intentionally re-init the
    // renderer rather than mutating it — they're one-shot props.
  }, [density, palette, intensity, interactive, reducedMotion]);

  const baseStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: -1,
    }),
    [],
  );

  if (reducedMotion) {
    // Static low-intensity gradient. Pink-300 at top-left → mint-300
    // at bottom-right, on the warm-black plate. Same palette intent,
    // no motion, no canvas, no GPU.
    return (
      <div
        ref={wrapperRef}
        aria-hidden
        className={className}
        style={{
          ...baseStyle,
          background:
            "radial-gradient(60% 60% at 20% 20%, rgba(255,159,191,0.08), transparent 70%)," +
            "radial-gradient(60% 60% at 80% 80%, rgba(180,144,255,0.06), transparent 70%)," +
            "var(--color-warm-black-950, #0c0a12)",
        }}
      />
    );
  }

  return (
    <div ref={wrapperRef} aria-hidden className={className} style={baseStyle}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

/** Pick the WebGPU implementation if `navigator.gpu` exists, else
 *  fall back to WebGL. Both modules are dynamic-imported so the
 *  fallback bundle is tiny when we go the WebGPU route. */
async function buildRenderer(): Promise<AmbientRenderer> {
  const hasWebGPU =
    typeof navigator !== "undefined" && "gpu" in navigator;
  if (hasWebGPU) {
    try {
      const mod = await import("lib/ambient/renderer-webgpu");
      return new mod.WebGPUAmbientRenderer();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        "AmbientField: WebGPU module load failed, falling back to WebGL",
        err,
      );
    }
  }
  const mod = await import("lib/ambient/renderer-webgl");
  return new mod.WebGLAmbientRenderer();
}

export default AmbientField;
