/**
 * lib/capabilities/viz/heatmap-equirect.ts — Capability
 * `viz.heatmap-equirect`: render an equirectangular (2:1) heatmap /
 * foveal mask / scanpath visualisation from a GazeSample stream.
 *
 * Composes:
 *   - `lib/capabilities/input/gaze.ts` — sample source
 *   - `lib/math/spherical.ts` — yaw/pitch → UV mapping
 *   - `lib/algorithms/heatmap.ts` — the 2D rasteriser
 *
 * Atomised from D:/.github/Shadrerapp/src/apps/GazeHeatmap/components/
 * HeatmapViewport.tsx (Apache-2.0) per docs/SHADRERAPP_MIGRATION.md.
 * React component shell stripped — the headless `renderToCanvas()`
 * function does the work; the chamber owns the canvas element and
 * playback state.
 *
 * # Three analysis modes
 *
 * - `HEATMAP` — gaussian intensity accumulation through HeatmapGenerator
 *   with a configurable colour ramp. The default canvas treatment.
 * - `FOVEAL_VIEW` — inverse mask: darken everything, knock out the
 *   pixels the viewer actually fixated. Shows what they *did* see.
 * - `SCANPATH` — dashed path connecting samples in order + filled
 *   node dots. Trace-style; good for short replays.
 */

import { HeatmapGenerator, type ColorStop, type HeatmapPoint } from "lib/algorithms/heatmap";
import { degreesToUv } from "lib/math/spherical";
import type { GazeSample } from "./../input/gaze";

export type TemporalWeighting = "uniform" | "recent" | "early";
export type AnalysisMode = "HEATMAP" | "FOVEAL_VIEW" | "SCANPATH";

export type RenderEquirectOptions = {
  /** Samples to render — typically pre-filtered to the visible timeRange. */
  samples: readonly GazeSample[];
  /** Optional background image (equirect, drawn first). */
  background?: HTMLImageElement | null;
  /** Time range matching `samples` first/last `t`. Used for weighting. */
  timeRange: readonly [number, number];
  /** Blob radius for the gaussian falloff, in degrees of arc. */
  blobRadiusDegrees: number;
  /** Weight each sample uniformly / favour recent / favour early. */
  temporalWeighting?: TemporalWeighting;
  /** HEATMAP | FOVEAL_VIEW | SCANPATH. */
  mode: AnalysisMode;
  /** Colour ramp for HEATMAP. Required for HEATMAP mode. */
  colorRamp?: ColorStop[];
  /** Scanpath colours when mode === SCANPATH. */
  scanpathColors?: { line: string; node: string; nodeFinal: string };
};

const DEFAULT_RAMP: ColorStop[] = [
  { p: 0.0, c: "rgba(0,0,255,0)" },
  { p: 0.4, c: "rgba(0,255,255,0.7)" },
  { p: 0.7, c: "rgba(255,255,0,0.9)" },
  { p: 1.0, c: "rgba(255,0,0,1)" },
];

const DEFAULT_SCANPATH_COLORS = {
  line: "#00ffff",
  node: "rgba(0, 255, 255, 0.3)",
  nodeFinal: "#00ffff",
};

function pointsForCanvas(
  samples: readonly GazeSample[],
  width: number,
  height: number,
  timeRange: readonly [number, number],
  weighting: TemporalWeighting,
): HeatmapPoint[] {
  const minT = timeRange[0];
  const dur = timeRange[1] - timeRange[0];
  return samples.map((s) => {
    const [u, v] = degreesToUv(s.yaw_deg, s.pitch_deg);
    let weight = 1.0;
    if (weighting === "recent" && dur > 0) weight = (s.t - minT) / dur;
    else if (weighting === "early" && dur > 0) weight = 1.0 - (s.t - minT) / dur;
    return { x: u * width, y: v * height, weight };
  });
}

export function renderEquirectToCanvas(
  ctx: CanvasRenderingContext2D,
  options: RenderEquirectOptions,
): void {
  const { width, height } = ctx.canvas;
  const {
    samples,
    background,
    timeRange,
    blobRadiusDegrees,
    temporalWeighting = "uniform",
    mode,
    colorRamp,
    scanpathColors = DEFAULT_SCANPATH_COLORS,
  } = options;

  // Background pass.
  ctx.clearRect(0, 0, width, height);
  if (background) {
    ctx.drawImage(background, 0, 0, width, height);
  } else {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);
  }

  if (samples.length === 0) return;

  const points = pointsForCanvas(samples, width, height, timeRange, temporalWeighting);
  const radiusPx = (blobRadiusDegrees / 360) * width;

  if (mode === "HEATMAP") {
    const gen = new HeatmapGenerator(colorRamp ?? DEFAULT_RAMP);
    gen.render(ctx, points, radiusPx, 0.85);
    return;
  }

  if (mode === "FOVEAL_VIEW") {
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    for (const p of points) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radiusPx * 2);
      grad.addColorStop(0, `rgba(0,0,0,${p.weight})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radiusPx * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // SCANPATH
  ctx.strokeStyle = scanpathColors.line;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    ctx.fillStyle =
      i === points.length - 1 ? scanpathColors.nodeFinal : scanpathColors.node;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
