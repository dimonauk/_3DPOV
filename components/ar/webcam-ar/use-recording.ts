"use client";

/**
 * components/ar/webcam-ar/use-recording.ts — Client-side recording hook
 * for the WebcamARScene composite (camera video + Three.js canvas).
 *
 * Extracted from WebcamARScene.tsx. The hook owns the MediaRecorder,
 * the composite canvas, the rAF that copies frames, and the
 * `recording` state flag; the host passes the live video + scene
 * canvas refs in, and pushes errors back through `onError`. Nothing
 * is uploaded — the file is saved straight to the user's device via
 * an anchor `download` click.
 */

import { type RefObject, useRef, useState } from "react";

import type { Card } from "lib/ar/types";
import { createLogger, errToObject } from "lib/log";

const log = createLogger("ar.WebcamARScene.recording");

export type UseRecordingOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  sceneCanvasRef: RefObject<HTMLCanvasElement | null>;
  card: Card;
  onError: (message: string) => void;
};

export function useWebcamRecording({
  videoRef,
  sceneCanvasRef,
  card,
  onError,
}: UseRecordingOptions) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef(0);
  const compositeRef = useRef<HTMLCanvasElement | null>(null);

  const startRecording = async () => {
    const video = videoRef.current;
    const sceneCanvas = sceneCanvasRef.current;
    if (!video || !sceneCanvas) return;
    if (recorderRef.current) return; // already running

    const w = video.videoWidth || sceneCanvas.width;
    const h = video.videoHeight || sceneCanvas.height;
    if (!w || !h) {
      onError("Recording: camera video not ready yet, try again in a moment");
      return;
    }

    // Composite target — hidden offscreen canvas.
    const composite = document.createElement("canvas");
    composite.width = w;
    composite.height = h;
    const ctx = composite.getContext("2d");
    if (!ctx) {
      onError("Recording: 2D canvas context unavailable");
      return;
    }
    compositeRef.current = composite;

    const drawFrame = () => {
      try {
        ctx.drawImage(video, 0, 0, w, h);
        ctx.drawImage(sceneCanvas, 0, 0, w, h);
      } catch {
        // Frame draw can fail mid-teardown — ignore.
      }
      rafRef.current = requestAnimationFrame(drawFrame);
    };
    drawFrame();

    const stream = composite.captureStream(30);

    // Pick the best supported codec — prefer VP9, fall back to VP8.
    const Rec = (window as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
    if (!Rec) {
      onError("Recording: MediaRecorder not supported on this browser");
      cancelAnimationFrame(rafRef.current);
      compositeRef.current = null;
      return;
    }
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4;codecs=avc1",
    ];
    const mimeType =
      candidates.find((c) => Rec.isTypeSupported && Rec.isTypeSupported(c)) ?? "";

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new Rec(stream, { mimeType, videoBitsPerSecond: 4_000_000 })
        : new Rec(stream);
    } catch (err) {
      log.error("MediaRecorder ctor failed", { err: errToObject(err) });
      onError("Recording: " + ((err as Error).message ?? "couldn't start"));
      cancelAnimationFrame(rafRef.current);
      compositeRef.current = null;
      return;
    }

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      cancelAnimationFrame(rafRef.current);
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "video/webm",
      });
      const url = URL.createObjectURL(blob);
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      const a = document.createElement("a");
      a.href = url;
      a.download = `holoflow-ar-${card.slug}-${Date.now()}.${extension}`;
      a.click();
      // Revoke after a tick so the browser has time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
      chunksRef.current = [];
      compositeRef.current = null;
      recorderRef.current = null;
    };

    try {
      (window as { __holoflow_track?: (s: string, t: string) => void }).__holoflow_track?.(
        card.slug,
        "recording",
      );
    } catch {
      // analytics is best-effort
    }
    recorder.start(1_000); // 1s chunks — limits memory if the user records for a while
    recorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
    setRecording(false);
  };

  // Called by the host's stopCamera/teardown path. Synchronous — does
  // not wait for onstop to fire (the camera teardown will dispose the
  // scene canvas behind it anyway, so we just kill the timers + refs).
  const abortRecording = () => {
    if (recorderRef.current) {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore — was already stopped or torn down
      }
      recorderRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
    compositeRef.current = null;
    setRecording(false);
  };

  return { recording, startRecording, stopRecording, abortRecording };
}
