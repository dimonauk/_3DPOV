/**
 * lib/capabilities/viz/thumbnail-providers/_helpers.server.ts —
 * Shared utilities for the viz.thumbnail-splat providers.
 */

import "server-only";

import { createLogger } from "lib/log";

import type {
  ThumbnailSplatError,
  ThumbnailSplatInput,
} from "../thumbnail-splat";

export const log = createLogger("capability:viz.thumbnail-splat");

export function asError(
  code: ThumbnailSplatError["code"],
  message: string,
): Error {
  const detail: ThumbnailSplatError = { code, message };
  return Object.assign(new Error(message), detail);
}

/** Pick the splat URL the splat-real provider should hand to the headless
 *  browser. Mirrors `preferredSplatFormat` from splat-ar-deploy: smallest
 *  format wins. */
export function bestSplatUrl(
  record: ThumbnailSplatInput["record"],
): string {
  if (record.spzUrl) return record.spzUrl;
  if (record.ksplatUrl) return record.ksplatUrl;
  return record.plyUrl;
}

export function formatGaussianCount(count: number): string {
  // 1_179_648 → "1.18M gaussians"; 12_345 → "12.3K gaussians"
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(2)}M gaussians`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K gaussians`;
  }
  return `${count} gaussians`;
}
