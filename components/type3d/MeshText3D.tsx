"use client";

/**
 * components/type3d/MeshText3D.tsx — 3D-mesh display type.
 *
 * Drop-in upgrade for hero-scale `<h1>` titles, edition numerals,
 * foil headers, section openers — anything in the display register
 * that benefits from being an actual extruded mesh instead of a
 * font glyph. Body prose stays HTML.
 *
 * Hard rules this component honours:
 *
 *   1. The text always renders inside an offscreen `<span class="sr-only">`
 *      so screen readers, search bots, and select-to-copy all
 *      work the same as for an HTML heading. The mesh is `aria-hidden`.
 *   2. Three.js is dynamic-imported via the renderer module — a
 *      page that doesn't mount any MeshText3D never ships three.
 *   3. The render loop pauses when the canvas leaves the viewport
 *      or the tab is hidden.
 *   4. Reduced-motion users get the mesh, just no idle drift.
 *   5. If WebGL/WebGPU is unavailable, the HTML fallback (the
 *      `.sr-only` span promoted to a visible display-serif span)
 *      shows instead — the page never goes blank.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type MeshText3DProps = {
  /** The text to render as 3D mesh letters. */
  children: string;
  /** Font family — defaults to "display" (Cormorant-equivalent
   *  serif) which the studio uses for hero type. "mono" for
   *  JetBrains-equivalent mono. */
  font?: "display" | "mono" | "sans";
  /** Visual size hint in CSS px. Drives both the world-space
   *  font size and the laid-out canvas height. */
  size?: number;
  /** Extrusion depth — how thick the letters are. Default 12. */
  depth?: number;
  /** Material treatment. */
  material?: "foil" | "chrome" | "matte" | "glass";
  /** Idle motion. */
  motion?: "still" | "drift" | "tilt-on-hover";
  /** Alignment for the layout. Default "left". */
  align?: "left" | "center" | "right";
  /** Tag the screen-reader copy renders as. Default "div". */
  tag?: "h1" | "h2" | "h3" | "div";
  /** Optional className applied to the outer wrapper — lets the
   *  caller add Tailwind utilities for margin / colour-on-fallback. */
  className?: string;
};

const alignToFlex: Record<NonNullable<MeshText3DProps["align"]>, string> = {
  left: "justify-start text-left",
  center: "justify-center text-center",
  right: "justify-end text-right",
};

export function MeshText3D({
  children,
  font = "display",
  size = 96,
  depth = 12,
  material = "foil",
  motion = "drift",
  align = "left",
  tag = "div",
  className,
}: MeshText3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<{ dispose: () => void } | null>(null);
  const [meshReady, setMeshReady] = useState(false);
  const [meshFailed, setMeshFailed] = useState(false);
  const headingId = useId();

  const prefersReducedMotion = useReducedMotionFlag();
  const supportsWebGfx = useGfxSupportFlag();

  // Stable text — children should already be a string per the
  // type, but coerce defensively so React arrays don't crash.
  const text = useMemo(() => String(children), [children]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    if (!supportsWebGfx) {
      setMeshFailed(true);
      return;
    }

    let cancelled = false;
    let renderer: import("../../lib/type3d/renderer").MeshTextRenderer | null = null;
    let intersectionObs: IntersectionObserver | null = null;
    let visible = false;
    let tabVisible =
      typeof document !== "undefined" ? !document.hidden : true;
    let resizeObs: ResizeObserver | null = null;

    const sync = (): void => {
      if (!renderer) return;
      if (visible && tabVisible) renderer.start();
      else renderer.stop();
    };

    const onVisibility = (): void => {
      tabVisible = !document.hidden;
      sync();
    };

    (async () => {
      try {
        const { MeshTextRenderer } = await import(
          "../../lib/type3d/renderer"
        );
        if (cancelled) return;
        renderer = new MeshTextRenderer();
        await renderer.init(canvas, {
          font,
          size,
          depth,
          material,
          motion,
          align,
          reducedMotion: prefersReducedMotion,
        });
        if (cancelled) {
          renderer.dispose();
          return;
        }
        await renderer.setText(text);
        if (cancelled) {
          renderer.dispose();
          return;
        }
        rendererRef.current = renderer;
        setMeshReady(true);

        intersectionObs = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              visible = entry.isIntersecting;
            }
            sync();
          },
          { threshold: 0.01 },
        );
        intersectionObs.observe(wrapper);

        resizeObs = new ResizeObserver(() => {
          renderer?.handleResize();
        });
        resizeObs.observe(canvas);

        document.addEventListener("visibilitychange", onVisibility);
      } catch (err) {
        console.warn("[MeshText3D] init failed, using HTML fallback:", err);
        if (!cancelled) setMeshFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      intersectionObs?.disconnect();
      resizeObs?.disconnect();
      renderer?.dispose();
      rendererRef.current = null;
    };
  }, [
    text,
    font,
    size,
    depth,
    material,
    motion,
    align,
    prefersReducedMotion,
    supportsWebGfx,
  ]);

  const showFallback = meshFailed || !supportsWebGfx;
  const Tag = tag;

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative flex w-full items-center",
        alignToFlex[align],
        className,
      )}
      data-mesh-state={
        showFallback ? "fallback" : meshReady ? "ready" : "loading"
      }
    >
      {/* Screen-reader / SEO copy. Always present, visually hidden
          when the mesh is up, promoted to a visible display-serif
          fallback when the mesh can't render. */}
      <Tag
        id={headingId}
        className={
          showFallback
            ? "font-display text-4xl leading-[0.95] md:text-6xl lg:text-7xl"
            : "sr-only"
        }
        style={
          showFallback ? { fontFamily: "var(--font-display)" } : undefined
        }
      >
        {text}
      </Tag>

      {/* The mesh canvas. Hidden until both the mesh is ready AND
          we haven't fallen back. `aria-hidden` because the
          screen-reader copy above already carries the text. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "block max-w-full",
          showFallback || !meshReady ? "hidden" : "",
        )}
        style={{ height: `${size}px` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function useReducedMotionFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setFlag(mq.matches);
    const onChange = (e: MediaQueryListEvent): void => setFlag(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return flag;
}

function useGfxSupportFlag(): boolean {
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = navigator as Navigator & { gpu?: unknown };
    if (typeof nav.gpu !== "undefined") {
      setSupported(true);
      return;
    }
    // Probe WebGL — `getContext("webgl")` returning null means
    // either software-disabled or a browser too old to ship a
    // 3D mesh experience to. Fall back to HTML.
    try {
      const probe = document.createElement("canvas");
      const ctx =
        probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl");
      setSupported(Boolean(ctx));
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}
