/**
 * scripts/cctv-fetch-types.ts — Types + config loader for cctv-fetch.
 *
 * Pure module: no I/O outside `loadConfig` (file read + JSON parse +
 * shape narrow). Used by the orchestrator + source resolvers + the
 * save layer.
 */

import { readFile } from "node:fs/promises";

export type FetchSource = {
  /** Stable id for this source — used in filenames. */
  id: string;
  /** Display name for logs. */
  name: string;
  /** Endpoint type. */
  kind: "tfl-jamcam" | "manual-list" | "placeholder";
  /** For tfl-jamcam: the JSON list endpoint. */
  endpoint?: string;
  /** For manual-list: an explicit list of image URLs to pull. */
  urls?: ManualUrl[];
  /** Toggle for the runtime. */
  enabled: boolean;
  /** Free-form note for the example config. */
  notes?: string;
};

export type ManualUrl = {
  cameraId: string;
  imageUrl: string;
  lat?: number;
  lng?: number;
  label?: string;
};

export type Config = {
  stagingDir: string;
  outputDir: string;
  maxImagesPerRun: number;
  sources: FetchSource[];
};

export type StagedSidecar = {
  cameraId: string;
  sourceUrl: string;
  source: "cctv-tfl" | "cctv-other" | "manual";
  fetchedAt: string;
  lat?: number;
  lng?: number;
  label?: string;
  contentHashSha256: string;
};

export type TflJamCam = {
  id: string;
  commonName?: string;
  lat?: number;
  lon?: number;
  additionalProperties?: Array<{
    key?: string;
    value?: string;
  }>;
};

export type Candidate = {
  cameraId: string;
  imageUrl: string;
  lat?: number;
  lng?: number;
  label?: string;
  splatSource: "cctv-tfl" | "cctv-other" | "manual";
};

export async function loadConfig(configPath: string): Promise<Config> {
  const text = await readFile(configPath, "utf8");
  const raw: unknown = JSON.parse(text);
  if (!isConfig(raw)) {
    throw new Error(
      `Config at ${configPath} did not match the expected shape.`,
    );
  }
  return raw;
}

function isConfig(x: unknown): x is Config {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  return (
    typeof obj.stagingDir === "string" &&
    typeof obj.outputDir === "string" &&
    typeof obj.maxImagesPerRun === "number" &&
    Array.isArray(obj.sources)
  );
}
