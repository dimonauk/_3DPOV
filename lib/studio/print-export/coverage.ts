/**
 * lib/studio/print-export/coverage.ts — Pure pixel math.
 *
 * No Three, no WebGL, no canvas — all the helpers the export panel
 * uses to show "4961 × 7016" and "upscale needed?" banners without
 * spinning up a renderer.
 */

import type {
  CoverageReport,
  PaperSize,
  PrintOrientation,
  PrintPpi,
} from "./types";

const PAPER_SIZES_INCHES: Record<PaperSize, { w: number; h: number }> = {
  // ISO 216 — short × long inches.
  A4: { w: 8.27, h: 11.69 },
  A3: { w: 11.69, h: 16.54 },
  A2: { w: 16.54, h: 23.39 },
};

export function paperSizeInches(paper: PaperSize): { w: number; h: number } {
  return PAPER_SIZES_INCHES[paper];
}

/**
 * Convert paper + PPI + orientation to target pixel dimensions.
 *
 *   targetPixelDimensions("A2", 300, "landscape") → { w: 7016, h: 4961 }
 *   targetPixelDimensions("A2", 300, "portrait")  → { w: 4961, h: 7016 }
 */
export function targetPixelDimensions(
  paper: PaperSize,
  ppi: PrintPpi,
  orientation: PrintOrientation,
): { w: number; h: number } {
  const { w: shortIn, h: longIn } = paperSizeInches(paper);
  const shortPx = Math.round(shortIn * ppi);
  const longPx = Math.round(longIn * ppi);
  if (orientation === "landscape") return { w: longPx, h: shortPx };
  return { w: shortPx, h: longPx };
}

/**
 * Fraction of the print's pixel budget that's backed by real source
 * detail. 1.0 = perfect; <1.0 = the renderer must interpolate.
 *
 * The math: a full equirect is 360° wide. If the source is 8192 px
 * wide and the operator is reframing at 75° horizontally, the crop
 * carries 8192 * (75 / 360) ≈ 1707 source pixels of real detail. If
 * the print target is 4961 px wide, coverage = 1707 / 4961 ≈ 0.34.
 */
export function sourceCoverageFraction(
  sourceWidthPx: number,
  fovDeg: number,
): number {
  if (sourceWidthPx <= 0 || fovDeg <= 0) return 0;
  return (sourceWidthPx * fovDeg) / 360;
}

/**
 * Given a source-width × FOV pull and a target print width, return
 * the upscale factor needed to bring coverage to 1.0. Useful for
 * the Topaz Photo AI prompt: "set Photo AI to upscale 3.1×".
 */
export function recommendUpscaleFactor(
  sourceCoverage: number,
  targetWidth: number,
): number {
  if (sourceCoverage <= 0 || targetWidth <= 0) return 1;
  return Math.max(1, targetWidth / sourceCoverage);
}

/** Coverage report — what the panel uses to decide whether to show
 *  the "upscale needed" banner. */
export function coverageReport(
  sourceWidthPx: number,
  fovDeg: number,
  targetWidth: number,
): CoverageReport {
  const effectiveSourcePx = sourceCoverageFraction(sourceWidthPx, fovDeg);
  const coverage = targetWidth > 0 ? effectiveSourcePx / targetWidth : 0;
  const upscaleFactor = recommendUpscaleFactor(
    effectiveSourcePx,
    targetWidth,
  );
  return {
    effectiveSourcePx: Math.round(effectiveSourcePx),
    coverage,
    upscaleFactor,
    needsUpscale: coverage < 0.95,
  };
}
