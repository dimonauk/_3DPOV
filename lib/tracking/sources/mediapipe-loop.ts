/**
 * lib/tracking/sources/mediapipe-loop.ts — Shared frame-capture loop
 * for the MediaPipe trackers.
 *
 * Captures a frame from the shared webcam <video>, converts it to
 * an ImageBitmap, ships it to the worker via callWorker, and times
 * the next tick so we stay under the configured frame budget. If
 * the previous frame's inference is still in flight, the next tick
 * is skipped — we never queue more than one frame per worker.
 *
 * Pressure detection: if 5 consecutive frames take longer than the
 * configured target frame time, the loop detunes from 30fps to
 * 15fps. The cap can be reset by stopping and restarting the loop.
 */

import { callWorker } from "lib/workers/client";
import type { WorkerKind } from "lib/workers/types";

import { acquireWebcam, releaseWebcam } from "../webcam";

export type MediaPipeLoopOptions<TResult> = {
  /** Worker kind to call into. */
  workerKind: WorkerKind;
  /** Verb to dispatch on the worker. */
  op: string;
  /** Handler invoked with the worker's reply, plus timestamp. */
  onResult: (result: TResult, timestamp: number) => void;
  /** Initial target frames per second. Default 30. */
  initialFps?: number;
  /** Lower fps used when sustained pressure is detected. Default 15. */
  detunedFps?: number;
};

export type MediaPipeLoopHandle = {
  stop: () => Promise<void>;
};

/**
 * Start the capture → infer → callback loop. Acquires the
 * webcam (refcounted via lib/tracking/webcam) on entry and
 * releases it on stop.
 */
export async function startMediaPipeLoop<TResult>(
  options: MediaPipeLoopOptions<TResult>,
): Promise<MediaPipeLoopHandle> {
  const { workerKind, op, onResult } = options;
  const initialFps = options.initialFps ?? 30;
  const detunedFps = options.detunedFps ?? 15;

  let video: HTMLVideoElement;
  try {
    video = await acquireWebcam();
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }

  let alive = true;
  let busy = false;
  let consecutiveSlow = 0;
  let currentFps = initialFps;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const scheduleNext = (): void => {
    if (!alive) return;
    if (timer !== null) return;
    const intervalMs = Math.max(1, Math.round(1000 / currentFps));
    timer = setTimeout(() => {
      timer = null;
      void tick();
    }, intervalMs);
  };

  const tick = async (): Promise<void> => {
    if (!alive) return;
    if (busy) {
      scheduleNext();
      return;
    }
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      scheduleNext();
      return;
    }
    busy = true;
    const frameStart = performance.now();
    try {
      const bitmap = await createImageBitmap(video);
      const result = await callWorker<typeof workerKind, unknown, TResult>(
        workerKind,
        op,
        { bitmap, timestamp: frameStart },
        { transfer: [bitmap], timeoutMs: 5_000 },
      );
      onResult(result, frameStart);
    } catch {
      // Single-frame failures are normal during init or when the
      // tab is hidden. Swallow and try again on the next tick.
    } finally {
      busy = false;
      const elapsed = performance.now() - frameStart;
      const budget = 1000 / currentFps;
      if (elapsed > budget * 1.5) {
        consecutiveSlow += 1;
        if (consecutiveSlow >= 5 && currentFps > detunedFps) {
          currentFps = detunedFps;
        }
      } else {
        consecutiveSlow = 0;
      }
      scheduleNext();
    }
  };

  scheduleNext();

  return {
    stop: async () => {
      alive = false;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        await callWorker(workerKind, "stop", {}, { timeoutMs: 1_000 });
      } catch {
        // ignore — worker may already be terminated
      }
      releaseWebcam();
    },
  };
}
