/**
 * print-check-math.ts — Pure geometry helpers for print-check.
 */
import { PPI_ACCEPTABLE, PPI_RECOMMENDED, SIZE_INCHES } from "./print-check-types";
import type { PrintSize } from "./print-check-types";

export function swapForOrientation(w: number, h: number, orientation: number | undefined) {
  return orientation && orientation >= 5 && orientation <= 8
    ? { width: h, height: w }
    : { width: w, height: h };
}

/** Largest ISO-A size where both axes clear `ppi`. */
export function largestSizeAtPpi(shortPx: number, longPx: number, ppi: number): PrintSize {
  for (const size of ["A2","A3","A4","A5","A6"] as Array<Exclude<PrintSize,"screen-only">>) {
    const [s, l] = SIZE_INCHES[size];
    if (shortPx >= s * ppi && longPx >= l * ppi) return size;
  }
  return "screen-only";
}

/** Effective PPI when printed at size (short-edge basis). */
export function ppiAt(shortPx: number, size: PrintSize): number {
  if (size === "screen-only") return 0;
  return Math.round(shortPx / SIZE_INCHES[size][0]);
}

/** Reframed short-edge for a 90° FOV crop of an equirectangular. */
export function reframedShortPx(width: number, height: number): number {
  return Math.min(width / 4, height / 2);
}

/** 360 equirectangular reframe sizes at 90° FOV. */
export function equirectPrintSizes(width: number, height: number) {
  const ISO_A_ASPECT = Math.SQRT2;
  const short = reframedShortPx(width, height);
  const long  = Math.round(short * ISO_A_ASPECT);
  return {
    maxAfterReframe:         largestSizeAtPpi(short, long, PPI_ACCEPTABLE),
    recommendedAfterReframe: largestSizeAtPpi(short, long, PPI_RECOMMENDED),
  };
}
