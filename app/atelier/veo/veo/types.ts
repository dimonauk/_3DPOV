/**
 * app/atelier/veo/veo/types.ts — Wire shapes + poll constants for
 * the Veo 3 chamber.
 *
 * Extracted from veo-client.tsx per ARCHITECTURE.md Rule 1.
 */

export type AspectRatio = "16:9" | "9:16";

export type GeneratedVideo = { mimeType: string; dataUrl: string };

export type OutputState =
  | { kind: "idle" }
  | {
      kind: "running";
      startedAt: number;
      jobId: string;
      etaSeconds: number;
    }
  | {
      kind: "ready";
      videos: GeneratedVideo[];
      durationMs: number;
      promptUsed: string;
    }
  | {
      kind: "error";
      message: string;
      code?: string;
      retryAfterSec?: number;
    };

export const POLL_INTERVAL_MS = 5000;
// 4 minutes — Veo usually returns in 60-120s
export const POLL_TIMEOUT_MS = 4 * 60 * 1000;
