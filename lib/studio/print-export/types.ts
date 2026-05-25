/**
 * lib/studio/print-export/types.ts — Public shapes for the
 * print-export pipeline. Pure data; no React, no Three.
 */

import type { Keyframe, SourceAsset } from "lib/studio/types";

export type PaperSize = "A4" | "A3" | "A2";
export type PrintPpi = 150 | 200 | 220 | 300;
export type PrintFormat = "png" | "tiff";
export type PrintOrientation = "landscape" | "portrait";

export type PrintSpec = {
  paperSize: PaperSize;
  ppi: PrintPpi;
  format: PrintFormat;
  orientation: PrintOrientation;
};

export type PrintExportOpts = {
  /** The source asset. Must be an equirect image or video (others throw). */
  source: SourceAsset;
  /** Active keyframe — yaw / pitch / fov drive the reframe. */
  keyframe: Keyframe;
  /** Paper size, PPI, format, orientation. */
  spec: PrintSpec;
  /** Optional progress callback — fires once per tile completed. 0–1. */
  onProgress?: (ratio: number) => void;
  /** Optional abort signal for cancellation between tiles. */
  signal?: AbortSignal;
};

export type CoverageReport = {
  /**
   * Effective source-pixel width contributing to the rendered crop.
   * Derived from the equirect width and the active horizontal FOV.
   */
  effectiveSourcePx: number;
  /**
   * coverage = effectiveSourcePx / targetWidth. 1.0 means the print
   * has exactly as many pixels of real detail as the print needs.
   * Anything <1.0 means the renderer will be interpolating.
   */
  coverage: number;
  /**
   * Suggested external upscale factor to bring coverage to 1.0.
   * Caller pipes this into the Topaz Photo AI handoff copy.
   */
  upscaleFactor: number;
  /** True when the renderer will be inventing detail. */
  needsUpscale: boolean;
};
