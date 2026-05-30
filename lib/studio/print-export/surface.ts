/**
 * lib/studio/print-export/surface.ts — Compositing surface.
 *
 * Targets the high-resolution composite for the print output:
 * OffscreenCanvas when available (faster + lets the worker path
 * land later), HTMLCanvasElement otherwise. The `surfaceToBlob`
 * helper picks the right encoding path.
 *
 * TIFF is gated until the `tiff` npm package is added — the panel
 * disables that option, but a programmatic caller gets a clear
 * error from here.
 */

import type { PrintFormat } from "./types";

const SAFE_TILE_PX = 2048;
const SINGLE_PASS_LIMIT_PX = 4096;

export { SAFE_TILE_PX, SINGLE_PASS_LIMIT_PX };

export type CanvasSurface =
  | {
      kind: "offscreen";
      canvas: OffscreenCanvas;
      ctx: OffscreenCanvasRenderingContext2D;
    }
  | {
      kind: "html";
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
    };

/**
 * Detect whether OffscreenCanvas is usable as the compositing
 * target. Some older browsers ship the class but not
 * `convertToBlob`, so we probe.
 */
export function detectOffscreen(): boolean {
  if (typeof OffscreenCanvas === "undefined") return false;
  try {
    const probe = new OffscreenCanvas(2, 2);
    const c = probe as unknown as {
      convertToBlob?: (init?: { type?: string }) => Promise<Blob>;
    };
    return typeof c.convertToBlob === "function";
  } catch {
    return false;
  }
}

export function makeSurface(width: number, height: number): CanvasSurface {
  if (detectOffscreen()) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      return { kind: "offscreen", canvas, ctx };
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(
      "print-export: failed to create 2D compositing context",
    );
  }
  return { kind: "html", canvas, ctx };
}

export async function surfaceToBlob(
  surface: CanvasSurface,
  format: PrintFormat,
): Promise<Blob> {
  if (format === "tiff") {
    throw new Error(
      "print-export: TIFF output not yet wired (needs the `tiff` npm package).",
    );
  }
  if (surface.kind === "offscreen") {
    const c = surface.canvas as unknown as {
      convertToBlob: (init?: { type?: string }) => Promise<Blob>;
    };
    return c.convertToBlob({ type: "image/png" });
  }
  return new Promise<Blob>((resolve, reject) => {
    surface.canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("print-export: canvas.toBlob returned null"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}
