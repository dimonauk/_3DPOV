/**
 * app/atelier/dollhouse/dollhouse/types.ts — Imagen request /
 * response types specific to the dollhouse chamber.
 *
 * Extracted from dollhouse-client.tsx per ARCHITECTURE.md Rule 1.
 */

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type GeneratedImage = { mimeType: string; dataUrl: string };

export type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      images: GeneratedImage[];
      durationMs: number;
      promptUsed: string;
    }
  | {
      kind: "error";
      message: string;
      code?: string;
      retryAfterSec?: number;
    };
