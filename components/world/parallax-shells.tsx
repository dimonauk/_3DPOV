"use client";

/**
 * components/world/parallax-shells.tsx — 10-shell Russian-doll parallax wrapper (CSS 3D v0.1).
 *
 * One-line role: render up to 10 content slots as concentric layers with translateZ depth + scale + head-pose-driven offset.
 * Full purpose in parallax-shells.PURPOSE.md.
 *
 * v0.1 is CSS 3D — translate3d + scale per shell, perspective on the container.
 * The WebGPU TSL port (Wave D) preserves the same prop surface: same shells
 * array, same per-shell parallax math, different renderer.
 */

import { type CSSProperties, type ReactNode } from "react";
import { useWorldStore, shellScale, type ShellIndex } from "lib/state/world";

const SHELL_INDICES: ShellIndex[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type ParallaxShellsProps = {
  /**
   * Content per shell. Index 0 = shell 1 (innermost, deepest). Index 9 =
   * shell 10 (outermost, closest to viewer). Pass `null` for empty
   * shells. Length must be 10.
   */
  shells: readonly (ReactNode | null)[];
  /** Pixel depth step between adjacent shells. Default 120. */
  depthStep?: number;
  /** CSS perspective value on the container. Default "1400px". */
  perspective?: string;
  /** Container className. */
  className?: string;
};

/**
 * The Russian-doll wrapper. Renders ten absolutely-positioned content
 * layers with per-shell `transform: translate3d(...) scale(...)`. Each
 * shell's parallax offset is read from `lib/state/world.parallax[n]`.
 * Scale is derived from `shellScale(n)` — shell 10 at 100%, shell 1 at
 * 10%, stepping by 10%.
 */
export function ParallaxShells({
  shells,
  depthStep = 120,
  perspective = "1400px",
  className = "",
}: ParallaxShellsProps) {
  const parallax = useWorldStore((s) => s.parallax);
  const visibleShells = useWorldStore((s) => s.visibleShells);

  const containerStyle: CSSProperties = {
    perspective,
    perspectiveOrigin: "center center",
  };
  const stageStyle: CSSProperties = {
    transformStyle: "preserve-3d",
  };

  return (
    <div className={`relative ${className}`} style={containerStyle}>
      <div className="absolute inset-0" style={stageStyle}>
        {SHELL_INDICES.map((n) => {
          if (!visibleShells.includes(n)) return null;
          const idx = n - 1;
          const content = shells[idx];
          if (content === null || content === undefined) return null;
          const scale = shellScale(n);
          const z = -(10 - n) * depthStep;
          const offset = parallax[n];
          const style: CSSProperties = {
            transform: `translate3d(${offset.x}px, ${offset.y}px, ${z}px) scale(${scale})`,
            transformOrigin: "center center",
            willChange: "transform",
          };
          return (
            <div
              key={n}
              className="pointer-events-auto absolute inset-0"
              style={style}
              data-shell={n}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
