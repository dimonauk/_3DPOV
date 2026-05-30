/**
 * lib/splatter/scout-web.ts — browser-friendly AI Scout.
 *
 * Heuristics-only sibling of the desktop's `splatter_engine.scout`.
 * Runs server-side in a Next.js route (no native deps); when the bench
 * is reachable, the API hands off to the bench for the full version
 * (which can sample video frames with OpenCV).
 *
 * Falls back to a metadata-only analysis when the bench is down:
 *   - file extension + size heuristics
 *   - optional LLM enrichment via lib/capabilities/agent/dialogue
 *     (BYOK Gemini, already wired)
 */

import type { ScoutReport, ScoutPipeline } from "./types";

export interface ScoutInputMeta {
  filename: string;
  size_bytes: number;
  mime?: string;
  camera_hint?: string;
}

const VIDEO_EXTS = new Set([".mp4", ".mov", ".insv", ".lrv", ".osv"]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".dng", ".tif", ".tiff"]);

export function scoutFromMetadata(meta: ScoutInputMeta): ScoutReport {
  const ext = (meta.filename.match(/\.[^.]+$/)?.[0] ?? "").toLowerCase();
  const camera = meta.camera_hint ?? cameraFromName(meta.filename);

  if (VIDEO_EXTS.has(ext)) {
    const isFisheyePair =
      ext === ".osv" || camera === "avata360" || camera === "osmo360";
    const sizeMb = meta.size_bytes / 1_000_000;
    const estimatedSeconds = Math.max(10, sizeMb / 6); // very rough
    const pipeline: ScoutPipeline = {
      source_kind: isFisheyePair ? "fisheye-pair" : "equirect-video",
      camera,
      frame_fps: 1.0,
      masks: isFisheyePair ? ["nadir"] : ["nadir", "sky"],
      sfm: estimatedSeconds > 60 ? "glomap" : "colmap",
      trainer: "brush",
      strategy: "auto",
      depth_prior: !isFisheyePair,
      expected_runtime_seconds: Math.max(120, estimatedSeconds * 60),
    };
    return {
      summary:
        `${meta.filename} (${sizeMb.toFixed(1)} MB, ~${Math.round(estimatedSeconds)}s) ` +
        `from ${camera}. Recommended: ${pipeline.source_kind} → ${pipeline.sfm} → ${pipeline.trainer}.`,
      issues: [
        {
          severity: "info",
          where: "global",
          what: "Browser-side analysis only — frame-level checks need the bench.",
          action: "Install the desktop app or sign in to access the bench for full analysis.",
        },
      ],
      recommended_pipeline: pipeline,
    };
  }

  if (IMAGE_EXTS.has(ext)) {
    return {
      summary:
        `${meta.filename} looks like a single image. Drop the whole folder to scout an image set.`,
      issues: [
        {
          severity: "warn",
          where: "global",
          what: "One image isn't enough — need 30+ for SfM.",
          action: "Drop the parent folder containing the full capture.",
        },
      ],
      recommended_pipeline: null,
    };
  }

  return {
    summary: `Unsupported file: ${meta.filename}`,
    issues: [
      {
        severity: "fail",
        where: "global",
        what: `Unknown extension ${ext}`,
        action: "Supply mp4 / mov / insv / osv, or a folder of images.",
      },
    ],
    recommended_pipeline: null,
  };
}

function cameraFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("avata")) return "avata360";
  if (lower.includes("osmo")) return "osmo360";
  if (lower.includes("insta360")) return "insta360-x";
  if (lower.includes("theta")) return "theta";
  if (lower.includes("gopro") || lower.startsWith("gx") || lower.startsWith("gs"))
    return "gopro-max";
  if (lower.endsWith(".osv")) return "avata360";
  return "generic";
}
