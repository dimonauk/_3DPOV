/**
 * lib/workers/face-mesh.worker.ts — MediaPipe FaceLandmarker in a worker.
 *
 * The main thread captures `<video>` frames into ImageBitmaps and
 * posts them here. The worker runs FaceLandmarker.detectForVideo()
 * and replies with the raw landmark array. Mapping landmarks →
 * ViewerPose stays main-thread (it's cheap arithmetic on a few
 * point pairs) so the worker boundary stays narrow and
 * deserialisation cost low.
 *
 * Lifecycle:
 *   - Lazy init on first "frame" message. The WASM bundle and
 *     model load only when a consumer needs face tracking.
 *   - "stop" message closes the landmarker and frees the WASM
 *     instance.
 *
 * Wire ops:
 *   - "frame" payload { bitmap: ImageBitmap, timestamp: number }
 *           result   FaceLandmarkerWorkerResult
 *   - "stop"  payload {}
 *           result   { ok: true }
 */

/// <reference lib="webworker" />

import type { AnyWorkerRequest, WorkerResponse } from "./types";

// Hosted MediaPipe bundle. Mirrors the constants used in
// components/ar/webcam-ar/types.ts so the two pipelines stay
// pinned to the same CDN version.
const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export type FaceLandmarkerWorkerResult = {
  /** First detected face's normalised landmarks, or null if none found. */
  landmarks: { x: number; y: number; z: number }[] | null;
  /** Transformation matrix (4x4 row-major), or null if not produced. */
  facialTransformationMatrix: number[] | null;
};

type VisionMod = typeof import("@mediapipe/tasks-vision");

let visionMod: VisionMod | null = null;
let landmarker: import("@mediapipe/tasks-vision").FaceLandmarker | null = null;
let initInFlight: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (landmarker) return;
  if (initInFlight) {
    await initInFlight;
    return;
  }
  initInFlight = (async () => {
    visionMod = (await import(
      "@mediapipe/tasks-vision"
    )) as unknown as VisionMod;
    const vision = await visionMod.FilesetResolver.forVisionTasks(
      MEDIAPIPE_WASM_URL,
    );
    landmarker = await visionMod.FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: FACE_MODEL_URL,
        delegate: "GPU",
      },
      numFaces: 1,
      runningMode: "VIDEO",
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  })();
  try {
    await initInFlight;
  } finally {
    initInFlight = null;
  }
}

function closeLandmarker(): void {
  if (!landmarker) return;
  try {
    landmarker.close();
  } catch {
    // ignore
  }
  landmarker = null;
}

type FrameResult = {
  faceLandmarks?: { x: number; y: number; z: number }[][];
  facialTransformationMatrixes?: { data: number[] }[];
};

async function runFrame(
  bitmap: ImageBitmap,
  timestamp: number,
): Promise<FaceLandmarkerWorkerResult> {
  await ensureInit();
  if (!landmarker) {
    throw new Error("face landmarker init failed");
  }
  // Workers don't have access to HTMLVideoElement, so detectForVideo
  // is called with the ImageBitmap directly. MediaPipe accepts both.
  const result = landmarker.detectForVideo(bitmap, timestamp) as FrameResult;
  bitmap.close();
  const face = result.faceLandmarks?.[0] ?? null;
  const matrix =
    result.facialTransformationMatrixes?.[0]?.data ?? null;
  return {
    landmarks: face ? face.map((p) => ({ x: p.x, y: p.y, z: p.z })) : null,
    facialTransformationMatrix: matrix,
  };
}

self.onmessage = (event: MessageEvent<AnyWorkerRequest>) => {
  const { id, kind, op, payload } = event.data;
  if (kind !== "face-mesh") return;

  const send = (
    body:
      | { result: FaceLandmarkerWorkerResult | { ok: true } }
      | { error: string },
  ): void => {
    const reply: WorkerResponse<"face-mesh", unknown> = {
      id,
      kind: "face-mesh",
      ...body,
    };
    (self as DedicatedWorkerGlobalScope).postMessage(reply);
  };

  if (op === "frame") {
    const { bitmap, timestamp } = payload as {
      bitmap: ImageBitmap;
      timestamp: number;
    };
    runFrame(bitmap, timestamp)
      .then((result) => send({ result }))
      .catch((err) => send({ error: err instanceof Error ? err.message : String(err) }));
    return;
  }

  if (op === "stop") {
    closeLandmarker();
    send({ result: { ok: true } });
    return;
  }

  send({ error: `unknown op "${op}"` });
};

export {};
