/**
 * lib/capabilities/media/capture.ts — Capability `media.capture`: headless
 * photo + video + share primitive for HoloWalk's AR view.
 *
 * One-line role: composite a live video frame with an overlay canvas into a
 * single image or an MP4 video, then hand the result to the Web Share API
 * (or fall back to download).
 * Full purpose in capture.PURPOSE.md.
 */

import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_MEDIUM,
} from "mediabunny";

export type CaptureOptions = {
  /** Image format. Default 'jpeg' with quality 0.92. */
  imageFormat?: "png" | "jpeg";
  /** JPEG quality (0..1). Default 0.92. */
  imageQuality?: number;
};

export type RecordingHandle = {
  /** Stop recording and resolve with the final MP4 blob. */
  stop: () => Promise<Blob>;
  /** Cancel without producing output. */
  cancel: () => void;
  /** Whether recording is in progress. */
  isRecording: () => boolean;
  /** Rough byte size so far. */
  bytesWritten: () => number;
};

export type ShareOptions = {
  fileName: string;
  title?: string;
  text?: string;
};

/* ─── Composite canvas ─────────────────────────────────────────────────── */

// Module-scoped composite canvas. Re-used across `capturePhoto` and the
// record loop. Resized lazily when overlay dimensions change.
let compositeCanvas: HTMLCanvasElement | null = null;
let compositeCtx: CanvasRenderingContext2D | null = null;

function ensureCompositeCanvas(
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!compositeCanvas) {
    compositeCanvas = document.createElement("canvas");
  }
  if (compositeCanvas.width !== width || compositeCanvas.height !== height) {
    compositeCanvas.width = width;
    compositeCanvas.height = height;
    compositeCtx = null; // force fresh context on resize
  }
  if (!compositeCtx) {
    const ctx = compositeCanvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("media.capture: 2D context unavailable");
    compositeCtx = ctx;
  }
  return { canvas: compositeCanvas, ctx: compositeCtx };
}

function drawComposite(
  videoEl: HTMLVideoElement,
  overlayCanvas: HTMLCanvasElement,
): HTMLCanvasElement {
  const w = overlayCanvas.width;
  const h = overlayCanvas.height;
  const { canvas, ctx } = ensureCompositeCanvas(w, h);
  // 1) live video frame (object-fit: cover style — fill the box)
  if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
    ctx.drawImage(videoEl, 0, 0, w, h);
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
  }
  // 2) overlay (transparent pixels reveal the video underneath)
  ctx.drawImage(overlayCanvas, 0, 0, w, h);
  return canvas;
}

/* ─── Photo ─────────────────────────────────────────────────────────────── */

/** Composite video + overlay into a single image blob. */
export async function capturePhoto(
  videoEl: HTMLVideoElement,
  overlayCanvas: HTMLCanvasElement,
  options: CaptureOptions = {},
): Promise<Blob> {
  const canvas = drawComposite(videoEl, overlayCanvas);
  const format = options.imageFormat ?? "jpeg";
  const mime = format === "png" ? "image/png" : "image/jpeg";
  const quality = options.imageQuality ?? 0.92;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("media.capture: canvas.toBlob returned null"));
      },
      mime,
      quality,
    );
  });
}

/* ─── Recording ─────────────────────────────────────────────────────────── */

/** Start MP4 recording of the composite. Throws if WebCodecs is unavailable. */
export async function startRecording(
  videoEl: HTMLVideoElement,
  overlayCanvas: HTMLCanvasElement,
  options: { fps?: number; bitrate?: number } = {},
): Promise<RecordingHandle> {
  const support = probeRecordingSupport();
  if (!support.canRecord) {
    throw new Error(
      "media.capture: WebCodecs VideoEncoder not available on this device",
    );
  }
  const fps = options.fps ?? 30;
  const bitrate = options.bitrate ?? 2_500_000;
  const w = overlayCanvas.width;
  const h = overlayCanvas.height;

  // Prime composite canvas at the right size before handing it to Mediabunny.
  const { canvas } = ensureCompositeCanvas(w, h);

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
  let bytes = 0;
  let frameIndex = 0;
  const frameDuration = 1 / fps;
  const startTs = performance.now();
  let rafHandle: number | null = null;
  let stopResolver: ((blob: Blob) => void) | null = null;
  let stopRejecter: ((err: unknown) => void) | null = null;

  const captureLoop = async (): Promise<void> => {
    if (!recording) return;
    const elapsed = (performance.now() - startTs) / 1000;
    // Catch up: emit any frames whose timestamp <= elapsed.
    while (recording && frameIndex * frameDuration <= elapsed) {
      drawComposite(videoEl, overlayCanvas);
      const ts = frameIndex * frameDuration;
      try {
        await source.add(ts, frameDuration);
        bytes += Math.ceil(bitrate / fps / 8);
        frameIndex += 1;
      } catch (err) {
        recording = false;
        if (stopRejecter) stopRejecter(err);
        return;
      }
    }
    if (recording) {
      rafHandle = window.requestAnimationFrame(() => {
        void captureLoop();
      });
    }
  };

  rafHandle = window.requestAnimationFrame(() => {
    void captureLoop();
  });

  return {
    isRecording: () => recording,
    bytesWritten: () => bytes,
    cancel: () => {
      recording = false;
      if (rafHandle !== null) window.cancelAnimationFrame(rafHandle);
      void output.cancel();
      source.close();
      if (stopResolver) stopResolver(new Blob([], { type: "video/mp4" }));
    },
    stop: () => {
      if (!recording && stopResolver === null) {
        return Promise.resolve(new Blob([], { type: "video/mp4" }));
      }
      return new Promise<Blob>((resolve, reject) => {
        stopResolver = resolve;
        stopRejecter = reject;
        recording = false;
        if (rafHandle !== null) window.cancelAnimationFrame(rafHandle);
        void (async () => {
          try {
            source.close();
            await output.finalize();
            const buf = target.buffer;
            if (!buf) {
              reject(
                new Error("media.capture: BufferTarget produced no buffer"),
              );
              return;
            }
            bytes = buf.byteLength;
            resolve(new Blob([buf], { type: "video/mp4" }));
          } catch (err) {
            reject(err);
          }
        })();
      });
    },
  };
}

/* ─── Share ─────────────────────────────────────────────────────────────── */

/** Share via navigator.share, or fall back to download. */
export async function shareBlob(
  blob: Blob,
  options: ShareOptions,
): Promise<void> {
  const file = new File([blob], options.fileName, { type: blob.type });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  const canShareFiles =
    typeof nav.canShare === "function" && nav.canShare({ files: [file] });
  if (canShareFiles && typeof nav.share === "function") {
    try {
      await nav.share({
        files: [file],
        title: options.title,
        text: options.text,
      });
      return;
    } catch (err) {
      // User cancellation surfaces as AbortError; swallow it. Otherwise
      // fall through to download.
      const name = (err as { name?: string } | null)?.name;
      if (name === "AbortError") return;
    }
  }
  triggerDownload(blob, options.fileName);
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick to let the browser kick off the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/* ─── Probe ─────────────────────────────────────────────────────────────── */

/** Probe support for video recording on the current device. */
export function probeRecordingSupport(): {
  canRecord: boolean;
  mimeType?: string;
} {
  if (typeof window === "undefined") return { canRecord: false };
  const w = window as Window & { VideoEncoder?: unknown };
  if (typeof w.VideoEncoder === "undefined") return { canRecord: false };
  return { canRecord: true, mimeType: "video/mp4;codecs=avc1" };
}
