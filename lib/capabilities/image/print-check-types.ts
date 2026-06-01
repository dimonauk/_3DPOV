/**
 * print-check-types.ts — Types, constants and size tables for print-check.
 */

export type PrintSize = "screen-only" | "A6" | "A5" | "A4" | "A3" | "A2";
export const PRINT_SIZES: readonly PrintSize[] = ["screen-only","A6","A5","A4","A3","A2"] as const;

/** Short × long axis in inches. */
export const SIZE_INCHES: Record<Exclude<PrintSize,"screen-only">,[number,number]> = {
  A6:[4.13,5.83], A5:[5.83,8.27], A4:[8.27,11.69], A3:[11.69,16.54], A2:[16.54,23.39],
};

export const PPI_RECOMMENDED = 300;
export const PPI_ACCEPTABLE  = 240;
export const PPI_FLOOR       = 180;

export type PrintCheckInput = {
  width: number; height: number;
  format?: string;
  bitDepth?: number;
  colorSpace?: "srgb"|"adobe-rgb"|"display-p3"|"prophoto-rgb"|"cmyk"|"lab"|"unknown";
  hasIccProfile?: boolean;
  chromaSubsampling?: string;
  fileSizeBytes?: number;
  exifOrientation?: number;
  isEquirectangular?: boolean;
};

export type PrintCheckVerdict = {
  printable: boolean;
  maxPrintableSize: PrintSize;
  recommendedSize: PrintSize;
  effectivePpiAtMax: number;
  effectivePpiAtRecommended: number;
  isLikelyWebDownscale: boolean;
  needsReframe: boolean;
  isTrainingEligible: boolean;
  warnings: string[];
  errors: string[];
};
