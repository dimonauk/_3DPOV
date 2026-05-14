/**
 * app/spatial/video/spatial-video-pipeline.ts — Per-frame pipeline.
 *
 * Decodes an uploaded video via HTMLVideoElement seek-and-draw, runs
 * Depth Anything V2 per sampled frame, generates a stereo pair, and
 * feeds the spatial-export recording handle. Pure pipeline functions —
 * the React surface owns lifecycle (cancellation flag, handle ref).
 */

import { estimateDepth } from "lib/capabilities/viz/depth-estimation";
import { generateStereoPair } from "lib/capabilities/viz/stereo-pair";
import {
  startSpatialRecording,
  type SpatialRecordingHandle,
} from "lib/capabilities/viz/spatial-export";

/** Sampling rate for the free in-browser path — keeps clip processing
 * tractable on phone hardware. 12fps is a perceptual floor for motion. */
export const TARGET_FPS = 12;

/** Hard cap on free-path clip length — beyond this, gently steer the
 * visitor toward the SHARP commission. */
export const MAX_FREE_DURATION_S = 8;

export type Progress = {
  framesDone: number;
  framesTotal: number;
  lastInferenceMs: number;
};

export type Result = {
  blob: Blob;
  downloadUrl: string;
  durationSeconds: number;
  framesTotal: number;
};

export async function processVideo(
  file: File,
  onProgress: (p: Progress) => void,
  handleRef: React.MutableRefObject<SpatialRecordingHandle | null>,
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.preload = "auto";

  try {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error("video metadata didn't load (5s)")),
        5000,
      );
      video.onloadedmetadata = () => {
        clearTimeout(t);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(t);
        reject(new Error("video failed to load"));
      };
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("invalid video duration");
    }
    if (duration > MAX_FREE_DURATION_S) {
      throw new Error(
        `clip is ${duration.toFixed(1)}s — free in-browser path caps at ${MAX_FREE_DURATION_S}s. Use the SHARP commission for full-length conversions.`,
      );
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) throw new Error("video has zero dimensions");

    const framesTotal = Math.max(1, Math.floor(duration * TARGET_FPS));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D context unavailable");

    const handle = await startSpatialRecording(w, h, {
      format: "sbs-mp4",
      fps: TARGET_FPS,
    });
    handleRef.current = handle;

    for (let i = 0; i < framesTotal; i++) {
      const t = i / TARGET_FPS;
      await seek(video, t);
      ctx.drawImage(video, 0, 0, w, h);
      const bitmap = await createImageBitmap(canvas);
      const t0 = performance.now();
      const depth = await estimateDepth(bitmap);
      const t1 = performance.now();
      const sourceImg = ctx.getImageData(0, 0, w, h);
      const pair = generateStereoPair(sourceImg, depth.depthMap);
      await handle.addFrame(pair, t);
      bitmap.close();
      onProgress({
        framesDone: i + 1,
        framesTotal,
        lastInferenceMs: t1 - t0,
      });
    }

    const blob = await handle.stop();
    handleRef.current = null;
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function seek(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("error", onError);
      reject(new Error(`seek to ${t.toFixed(2)}s failed`));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = t;
  });
}
