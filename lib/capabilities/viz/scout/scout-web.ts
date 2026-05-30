/**
 * lib/capabilities/viz/scout/scout-web.ts — metadata-only capture heuristic.
 *
 * Pure, dependency-free, edge-safe. Given only the metadata a browser can read
 * (name, size, mime, optional camera hint) it produces a best-effort
 * ScoutReport. No file contents are inspected — for that, the desktop bench
 * sidecar (bench-client) does the real OpenCV pass.
 */

import type {
  ScoutIssue,
  ScoutReport,
  ScoutVerdict,
} from "lib/capabilities/viz/scout/types";

export interface ScoutMetadataInput {
  filename: string;
  size_bytes: number;
  mime?: string;
  camera_hint?: string;
}

const VIDEO_EXT = ["mp4", "mov", "m4v", "avi", "mkv", "webm", "insv", "360"];
const IMAGE_EXT = ["jpg", "jpeg", "png", "tif", "tiff", "heic", "heif", "webp", "dng", "raw"];
const MB = 1024 * 1024;

function ext(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

function kindOf(filename: string, mime?: string): "video" | "image" | "unknown" {
  const e = ext(filename);
  if (mime?.startsWith("video/") || VIDEO_EXT.includes(e)) return "video";
  if (mime?.startsWith("image/") || IMAGE_EXT.includes(e)) return "image";
  return "unknown";
}

export function scoutFromMetadata(input: ScoutMetadataInput): ScoutReport {
  const { filename, size_bytes, mime, camera_hint } = input;
  const kind = kindOf(filename, mime);
  const issues: ScoutIssue[] = [];
  let score = 70;

  if (!Number.isFinite(size_bytes) || size_bytes <= 0) {
    issues.push({
      severity: "error",
      where: "file",
      what: "File size is missing or zero.",
      action: "Re-upload the file; it may not have transferred.",
    });
    score = 0;
  }

  if (kind === "unknown") {
    issues.push({
      severity: "warn",
      where: "format",
      what: `Unrecognised file type "${ext(filename) || "?"}".`,
      action: "Use a standard video (mp4/mov) or image (jpg/png) capture.",
    });
    score -= 25;
  }

  if (kind === "image") {
    issues.push({
      severity: "warn",
      where: "coverage",
      what: "A single still image alone cannot reconstruct a 3D splat.",
      action: "Provide an orbiting video, or a folder of 30+ overlapping photos.",
    });
    score -= 20;
    if (size_bytes > 0 && size_bytes < MB) {
      issues.push({
        severity: "warn",
        where: "resolution",
        what: "Image is small (<1 MB), so detail is likely low.",
        action: "Shoot at full sensor resolution; avoid heavy compression.",
      });
      score -= 10;
    }
  }

  if (kind === "video") {
    if (size_bytes > 0 && size_bytes < 8 * MB) {
      issues.push({
        severity: "warn",
        where: "duration",
        what: "Video is small (<8 MB) — probably short or low-bitrate.",
        action: "Capture a slow, steady 20–40 s orbit covering all angles.",
      });
      score -= 10;
    } else if (size_bytes > 600 * MB) {
      issues.push({
        severity: "info",
        where: "size",
        what: "Large video (>600 MB) — processing will be slow.",
        action: "Trim to the orbit, or downscale to 1080–1440p before upload.",
      });
    } else if (size_bytes > 0) {
      score += 10;
    }
  }

  const hint = camera_hint?.toLowerCase() ?? "";
  const e = ext(filename);
  if (hint.includes("360") || e === "insv" || e === "360") {
    issues.push({
      severity: "info",
      where: "camera",
      what: "360 capture detected — needs equirect handling before splatting.",
      action: "Confirm the file is stitched (single equirect), not dual-fisheye raw.",
    });
  }
  if (hint.includes("drone") || hint.includes("aerial")) {
    issues.push({
      severity: "info",
      where: "camera",
      what: "Aerial capture — watch for motion blur and changing light.",
      action: "Prefer overcast light and slow yaw; lock exposure if you can.",
    });
  }

  score = Math.max(0, Math.min(100, score));
  const verdict: ScoutVerdict =
    score === 0 ? "unsuitable" : score >= 75 ? "good" : score >= 55 ? "usable" : "poor";

  const errs = issues.filter((i) => i.severity === "error").length;
  const warns = issues.filter((i) => i.severity === "warn").length;
  const summary =
    kind === "unknown"
      ? `Couldn't tell what kind of capture "${filename}" is from metadata alone.`
      : `Metadata-only scout of a ${kind} capture (${(size_bytes / MB).toFixed(1)} MB): ` +
        `verdict "${verdict}", ${errs} blocking and ${warns} advisory issue(s). ` +
        `Connect the desktop bench for a full frame-level analysis.`;

  const rank = { error: 0, warn: 1, info: 2 } as const;
  issues.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return { summary, issues, verdict, score, kind, source: filename, via: "metadata" };
}
