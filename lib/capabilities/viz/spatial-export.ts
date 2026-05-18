/**
 * lib/capabilities/viz/spatial-export.ts — Capability `viz.spatial-export`:
 * cross-platform spatial export of `StereoPair` frames.
 *
 * One-line role: take stereo pairs from `viz.stereo-pair` and turn
 * them into still photos or MP4 videos in side-by-side / over-under
 * layouts — the lingua franca for Quest 3 browser, Vision Pro Safari,
 * and every SBS-aware desktop player.
 * Full purpose in spatial-export.PURPOSE.md.
 */

import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_MEDIUM,
} from "mediabunny";

import type { StereoPair } from "lib/capabilities/viz/stereo-pair";
import { exportStereoToUsdz } from "lib/capabilities/viz/usdz-export";
import { createLogger, errToObject } from "lib/log";

const log = createLogger("viz.spatial-export");

export type SpatialFormat = "sbs-mp4" | "ou-mp4" | "usdz-stereo";

export type SpatialPhotoOptions = {
  format: SpatialFormat;
  filename?: string;
};

export type SpatialVideoOptions = {
  format: Exclude<SpatialFormat, "usdz-stereo">;
  fps?: number;
  bitrate?: number;
  filename?: string;
};

export type SpatialRecordingHandle = {
  /** Push one stereo frame at the given timestamp (seconds from start). */
  addFrame: (pair: StereoPair, t: number) => Promise<void>;
  /** Finalise + return the video blob. */
  stop: () => Promise<Blob>;
  /** Cancel without producing output. */
  cancel: () => void;
};

/* ─── Composite primitives ──────────────────────────────────────────────── */

/**
 * Build the composite canvas for a SBS / OU layout. Allocated once
 * per recording handle (not module-scoped, because two recordings
 * could run side by side and would otherwise stomp each other).
 */
function makeCompositeCanvas(
  pairWidth: number,
  pairHeight: number,
  format: SpatialFormat,
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  layout: "sbs" | "ou";
} {
  const layout = format === "ou-mp4" ? "ou" : "sbs";
  const canvas = document.createElement("canvas");
  if (layout === "sbs") {
    canvas.width = pairWidth * 2;
    canvas.height = pairHeight;
  } else {
    canvas.width = pairWidth;
    canvas.height = pairHeight * 2;
  }
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("viz.spatial-export: 2D context unavailable");
  return { canvas, ctx, layout };
}

/**
 * Paint one stereo pair onto an existing composite canvas. The two
 * halves are drawn via a temp canvas — `putImageData` is the only
 * way to land an `ImageData` into a 2D context, and it does not
 * honour the destination position the same way `drawImage` does
 * (it always lands at the raw pixel coords), so we route through a
 * scratch canvas to keep the layout maths trivial.
 */
function paintPairOnto(
  ctx: CanvasRenderingContext2D,
  pair: StereoPair,
  layout: "sbs" | "ou",
  scratch: HTMLCanvasElement,
  scratchCtx: CanvasRenderingContext2D,
): void {
  scratch.width = pair.width;
  scratch.height = pair.height;

  scratchCtx.putImageData(pair.left, 0, 0);
  ctx.drawImage(scratch, 0, 0);

  scratchCtx.putImageData(pair.right, 0, 0);
  if (layout === "sbs") {
    ctx.drawImage(scratch, pair.width, 0);
  } else {
    ctx.drawImage(scratch, 0, pair.height);
  }
}

/* ─── Still photo ───────────────────────────────────────────────────────── */

/** Export a single stereo pair as a still spatial image. */
export async function exportSpatialPhoto(
  pair: StereoPair,
  options: SpatialPhotoOptions,
): Promise<Blob> {
  if (options.format === "usdz-stereo") {
    return exportStereoToUsdz(pair, { filename: options.filename });
  }

  const { canvas, ctx, layout } = makeCompositeCanvas(
    pair.width,
    pair.height,
    options.format,
  );
  const scratch = document.createElement("canvas");
  const scratchCtx = scratch.getContext("2d");
  if (!scratchCtx) {
    throw new Error("viz.spatial-export: scratch 2D context unavailable");
  }
  paintPairOnto(ctx, pair, layout, scratch, scratchCtx);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else
          reject(
            new Error("viz.spatial-export: canvas.toBlob returned null"),
          );
      },
      "image/jpeg",
      0.92,
    );
  });
}

/* ─── Video recording ───────────────────────────────────────────────────── */

/**
 * Begin a spatial video recording. Returns a writer that takes one
 * `StereoPair` per frame and finalises into an MP4 `Blob`. The
 * Mediabunny pattern matches `media.capture.startRecording` — a single
 * `CanvasSource` driven by a composite canvas, encoded as `avc1` for
 * hardware acceleration on iOS / Android / desktop.
 *
 * The composite layout is decided up front: `sbs-mp4` produces a
 * `2W × H` canvas (left half | right half); `ou-mp4` produces a
 * `W × 2H` canvas (left top / right bottom). Either is recognised by
 * Quest 3 browser and Vision Pro Safari as stereoscopic content.
 */
export async function startSpatialRecording(
  width: number,
  height: number,
  options: SpatialVideoOptions,
): Promise<SpatialRecordingHandle> {
  const probe = probeSpatialFormats();
  if (!probe.sbsMp4 && !probe.ouMp4) {
    throw new Error(
      "viz.spatial-export: WebCodecs VideoEncoder unavailable on this device",
    );
  }
  const fps = options.fps ?? 30;
  const bitrate = options.bitrate ?? 4_000_000;
  const { canvas, ctx, layout } = makeCompositeCanvas(
    width,
    height,
    options.format,
  );
  const scratch = document.createElement("canvas");
  const scratchCtx = scratch.getContext("2d");
  if (!scratchCtx) {
    throw new Error(
      "viz.spatial-export: scratch 2D context unavailable",
    );
  }

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  });
  const source = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: bitrate || QUALITY_MEDIUM,
  });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();

  let recording = true;
  const frameDuration = 1 / fps;

  return {
    addFrame: async (pair, t) => {
      if (!recording) return;
      if (pair.width !== width || pair.height !== height) {
        throw new Error(
          "viz.spatial-export: frame dimensions diverge from recording size",
        );
      }
      paintPairOnto(ctx, pair, layout, scratch, scratchCtx);
      await source.add(t, frameDuration);
    },
    cancel: () => {
      if (!recording) return;
      recording = false;
      // Mediabunny's output.cancel() is async but returning a Promise
      // here would change the contract (callers expect cancel() to be
      // synchronous fire-and-forget). Log the eventual outcome so a
      // silent cancel failure surfaces in DevTools rather than hiding.
      output.cancel().catch((err) => {
        log.warn("output.cancel rejected", { err: errToObject(err) });
      });
      source.close();
    },
    /**
     * Finalise the recording into an MP4 blob.
     *
     * **Idempotent:** calling stop() after a previous stop() or
     * cancel() returns an empty `video/mp4` blob — NOT a partial
     * recording. Callers that need to detect "nothing to save" should
     * check `blob.size > 0` before sharing, or guard the second call
     * at their layer.
     */
    stop: async () => {
      if (!recording) {
        return new Blob([], { type: "video/mp4" });
      }
      recording = false;
      source.close();
      await output.finalize();
      const buf = target.buffer;
      if (!buf) {
        throw new Error(
          "viz.spatial-export: BufferTarget produced no buffer",
        );
      }
      return new Blob([buf], { type: "video/mp4" });
    },
  };
}

/* ─── Probe ─────────────────────────────────────────────────────────────── */

/**
 * Probe which spatial formats this device can produce. SBS and OU MP4
 * both need `window.VideoEncoder` (WebCodecs); the USDZ stereo path
 * only needs the same DOM globals USDZExporter relies on.
 */
export function probeSpatialFormats(): {
  sbsMp4: boolean;
  ouMp4: boolean;
  usdzStereo: boolean;
  recommended: SpatialFormat;
} {
  const hasDom = typeof document !== "undefined";
  const hasEncoder =
    typeof window !== "undefined" &&
    typeof (window as Window & { VideoEncoder?: unknown }).VideoEncoder !==
      "undefined";
  const sbsMp4 = hasDom && hasEncoder;
  const ouMp4 = sbsMp4;
  const usdzStereo = hasDom;

  // Recommendation order: SBS-MP4 (broadest player support) →
  // OU-MP4 (smaller canvases, friendlier to mobile decoders) →
  // USDZ stereo (still photo only, but works without WebCodecs).
  const recommended: SpatialFormat = sbsMp4
    ? "sbs-mp4"
    : ouMp4
      ? "ou-mp4"
      : "usdz-stereo";

  return { sbsMp4, ouMp4, usdzStereo, recommended };
}
