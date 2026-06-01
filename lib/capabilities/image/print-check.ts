/**
 * print-check.ts — printCheck(), printCheckFromDriveMeta(), summarisePrintVerdict().
 * Types → print-check-types.ts  ·  Math helpers → print-check-math.ts
 */
export type { PrintCheckInput, PrintCheckVerdict, PrintSize } from "./print-check-types";
export { PPI_ACCEPTABLE, PPI_FLOOR, PPI_RECOMMENDED, PRINT_SIZES } from "./print-check-types";

import { PPI_ACCEPTABLE, PPI_FLOOR, PPI_RECOMMENDED } from "./print-check-types";
import type { PrintCheckInput, PrintCheckVerdict, PrintSize } from "./print-check-types";
import { equirectPrintSizes, largestSizeAtPpi, ppiAt, reframedShortPx, swapForOrientation } from "./print-check-math";

const ISO_A_ASPECT   = Math.SQRT2;
const ASPECT_TOL     = 0.05;

export function printCheck(input: PrintCheckInput): PrintCheckVerdict {
  const warnings: string[] = [], errors: string[] = [];
  if (!Number.isFinite(input.width) || !Number.isFinite(input.height) || input.width <= 0 || input.height <= 0)
    return { printable:false, maxPrintableSize:"screen-only", recommendedSize:"screen-only", effectivePpiAtMax:0, effectivePpiAtRecommended:0, isLikelyWebDownscale:false, needsReframe:false, isTrainingEligible:false, warnings, errors:["Image dimensions are missing or invalid."] };

  const { width, height } = swapForOrientation(input.width, input.height, input.exifOrientation);
  const shortPx = Math.min(width, height), longPx = Math.max(width, height);

  if (input.colorSpace === "cmyk") errors.push("CMYK not supported — convert to sRGB or Adobe RGB.");
  if (input.colorSpace === "lab")  errors.push("Lab not supported — convert to sRGB or Adobe RGB.");

  const maxAcceptable  = largestSizeAtPpi(shortPx, longPx, PPI_ACCEPTABLE);
  const maxRecommended = largestSizeAtPpi(shortPx, longPx, PPI_RECOMMENDED);
  const maxFloor       = largestSizeAtPpi(shortPx, longPx, PPI_FLOOR);

  if (!input.isEquirectangular && Math.abs(longPx / shortPx - ISO_A_ASPECT) > ASPECT_TOL)
    warnings.push(`Aspect ratio ${(longPx/shortPx).toFixed(2)} differs from ISO A-series (1.41) — will require crop or border.`);
  if (input.hasIccProfile === false)
    warnings.push("No embedded ICC profile — driver will assume sRGB, may print muted on premium paper.");
  if (input.colorSpace === "srgb" && maxAcceptable !== "screen-only")
    warnings.push("sRGB image — Canon PRO-1100 expects Adobe RGB for full gamut on glossy paper.");
  if (input.colorSpace === "prophoto-rgb")
    warnings.push("ProPhoto RGB — soft-clipping possible on perceptual rendering intent.");
  if (typeof input.bitDepth === "number" && input.bitDepth < 16 && (maxAcceptable === "A3" || maxAcceptable === "A2"))
    warnings.push(`${input.bitDepth}-bit at ${maxAcceptable} risks banding — 16-bit TIFF recommended for A3+.`);
  if (input.format === "jpeg") {
    if (input.chromaSubsampling === "4:2:0" && (maxAcceptable === "A3" || maxAcceptable === "A2"))
      warnings.push("JPEG 4:2:0 — soft edges at A3+; prefer 4:4:4 or TIFF.");
    if (maxAcceptable === "A2")
      warnings.push("Lossy JPEG at A2 — visible at close inspection. TIFF or PNG recommended.");
  }
  if (input.format === "gif")
    warnings.push("GIF is 256-colour — will look posterised above A5.");
  if (input.format === "webp" || input.format === "avif")
    warnings.push(`${input.format.toUpperCase()} is web-first lossy — export from the original.`);
  if (maxFloor === "screen-only")
    warnings.push("Below the 180 PPI floor even on A6 — this is a thumbnail or screen-only file.");

  const isLikelyWebDownscale = maxAcceptable === "screen-only" || maxAcceptable === "A6" || maxAcceptable === "A5";

  let maxAfterReframe   = maxAcceptable;
  let recAfterReframe   = maxRecommended;
  if (input.isEquirectangular) {
    const rf = equirectPrintSizes(width, height);
    maxAfterReframe = rf.maxAfterReframe; recAfterReframe = rf.recommendedAfterReframe;
    warnings.push("360 equirectangular — reframe before printing. Max size shown reflects 90° FOV; tighter crop yields smaller print.");
  }

  const effShort = input.isEquirectangular ? reframedShortPx(width, height) : shortPx;
  return {
    printable: errors.length === 0 && maxAfterReframe !== "screen-only",
    maxPrintableSize: maxAfterReframe, recommendedSize: recAfterReframe,
    effectivePpiAtMax: ppiAt(effShort, maxAfterReframe),
    effectivePpiAtRecommended: ppiAt(effShort, recAfterReframe),
    isLikelyWebDownscale, needsReframe: Boolean(input.isEquirectangular),
    isTrainingEligible: Boolean(input.isEquirectangular) && longPx >= 5000 && !isLikelyWebDownscale,
    warnings, errors,
  };
}

const KNOWN_360_MAKES = new Set(["DJI","Insta360","RICOH","GoPro","Garmin","Kandao","Xiaomi"]);

export type DriveMetaForCheck = {
  width?: number; height?: number; rotation?: number;
  cameraMake?: string; cameraModel?: string; fileName?: string; fileSizeBytes?: number;
};

export function printCheckFromDriveMeta(meta: DriveMetaForCheck): PrintCheckVerdict {
  if (typeof meta.width !== "number" || typeof meta.height !== "number")
    return { printable:false, maxPrintableSize:"screen-only", recommendedSize:"screen-only", effectivePpiAtMax:0, effectivePpiAtRecommended:0, isLikelyWebDownscale:false, needsReframe:false, isTrainingEligible:false, warnings:["Drive didn't report dimensions — needs a deeper check."], errors:[] };
  const aspect = Math.max(meta.width,meta.height) / Math.min(meta.width,meta.height);
  const isEquirectangular = Math.abs(aspect-2) < 0.02 && Math.max(meta.width,meta.height) >= 4096 && (!meta.cameraMake || KNOWN_360_MAKES.has(meta.cameraMake));
  const exifOrientation = meta.rotation === 90 ? 6 : meta.rotation === 180 ? 3 : meta.rotation === 270 ? 8 : 1;
  return printCheck({ width:meta.width, height:meta.height, isEquirectangular, exifOrientation });
}

export function summarisePrintVerdict(v: PrintCheckVerdict): string {
  if (!v.printable) return v.errors.length > 0 ? v.errors[0]! : "Screen-only — too small to print";
  const prefix = v.needsReframe ? "After reframe, prints up to" : "Prints up to";
  return v.recommendedSize === v.maxPrintableSize
    ? `${prefix} ${v.maxPrintableSize} at ${v.effectivePpiAtMax} PPI`
    : `${prefix} ${v.maxPrintableSize} (acceptable) · ${v.recommendedSize} recommended`;
}
