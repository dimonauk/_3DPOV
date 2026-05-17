/**
 * lib/algorithms/heatmap.ts — Dependency-free 2D heatmap rasteriser
 * on a Canvas 2D context.
 *
 * Lifted from D:/.github/Shadrerapp/src/libs/heatmap-utils.ts
 * (Apache-2.0) per docs/SHADRERAPP_MIGRATION.md.
 *
 * # Usage
 *
 * ```ts
 * const gen = new HeatmapGenerator([
 *   { p: 0.0, c: "rgba(0,0,255,0)" },
 *   { p: 0.5, c: "rgba(0,255,0,1)" },
 *   { p: 1.0, c: "rgba(255,0,0,1)" },
 * ]);
 * gen.render(ctx, points, radius, alpha);
 * ```
 *
 * # Algorithm
 *
 * Two-pass: accumulate point intensities on a scratch canvas using
 * `lighter` composite + radial gradients, then walk the accumulated
 * buffer pixel-by-pixel mapping intensity to the colour ramp.
 *
 * # Why this is here and not in lib/capabilities/viz
 *
 * It's a pure algorithm (geometry in, colour out), not a typed
 * capability with a slice surface — same shape as
 * `lib/algorithms/spiral.ts`, `lib/algorithms/lsystem.ts` etc. The
 * `viz.heatmap-equirect` capability uses it; capabilities like
 * `media.capture` could pick it up too.
 */

export type HeatmapPoint = {
  x: number;
  y: number;
  /** 0..1 — weight scales the gaussian falloff at this point. */
  weight: number;
};

export type ColorStop = {
  /** 0..1 along the ramp. */
  p: number;
  /** Any CSS color string. */
  c: string;
};

export class HeatmapGenerator {
  private ramp: Uint8ClampedArray;

  constructor(stops: ColorStop[]) {
    this.ramp = this.buildRamp(stops);
  }

  private buildRamp(stops: ColorStop[]): Uint8ClampedArray {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("HeatmapGenerator: 2D canvas context unavailable");
    }
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    for (const stop of stops) {
      grad.addColorStop(stop.p, stop.c);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);
    return ctx.getImageData(0, 0, 256, 1).data;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    points: readonly HeatmapPoint[],
    radius: number,
    alpha = 0.8,
  ): void {
    const { width, height } = ctx.canvas;

    // 1. Accumulate intensity on a scratch canvas.
    const accCanvas = document.createElement("canvas");
    accCanvas.width = width;
    accCanvas.height = height;
    const accCtx = accCanvas.getContext("2d");
    if (!accCtx) return;
    accCtx.globalCompositeOperation = "lighter";

    for (const p of points) {
      const grad = accCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.12 * p.weight})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      accCtx.fillStyle = grad;
      accCtx.beginPath();
      accCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      accCtx.fill();
    }

    // 2. Walk the accumulated buffer and map intensity → ramp colour.
    const accPixels = accCtx.getImageData(0, 0, width, height).data;
    const targetData = ctx.getImageData(0, 0, width, height);
    const targetPixels = targetData.data;

    for (let i = 0; i < accPixels.length; i += 4) {
      const intensity = accPixels[i]! / 255;
      if (intensity <= 0.01) continue;

      const rIdx = Math.min(Math.floor(intensity * 255), 255) * 4;
      const r = this.ramp[rIdx]!;
      const g = this.ramp[rIdx + 1]!;
      const b = this.ramp[rIdx + 2]!;

      const lerp = Math.min(intensity * 1.5, alpha);
      targetPixels[i] = targetPixels[i]! * (1 - lerp) + r * lerp;
      targetPixels[i + 1] = targetPixels[i + 1]! * (1 - lerp) + g * lerp;
      targetPixels[i + 2] = targetPixels[i + 2]! * (1 - lerp) + b * lerp;
    }

    ctx.putImageData(targetData, 0, 0);
  }
}
