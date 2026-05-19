/**
 * lib/workers/hand-landmark.worker.ts — MediaPipe HandLandmarker in
 * a worker.
 *
 * Same shape as face-mesh.worker.ts. Main thread posts an
 * ImageBitmap, worker runs detection, replies with the first
 * detected hand's landmarks. Mapping landmarks → ViewerPose is
 * the consumer's responsibility.
 *
 * Heavier than face detection — HandLandmarker is the
 * second-tier fallback for tracking-by-camera and only runs if
 * face detection fails (e.g. the user is reaching toward the
 * screen with no face in frame). The frame source detunes to
 * 15fps when this worker is the active path; the registry's
 * detune logic lives in lib/tracking/sources/mediapipe-hand.ts.
 *
 * Wire ops:
 *   - "frame" payload { bitmap: ImageBitmap, timestamp: number }
 *           result   HandLandmarkerWorkerResult
 *   - "stop"  payload {}
 *           result   { ok: true }
 */

/// <reference lib="webworker" />

import type { AnyWorkerRequest, WorkerResponse } from "./types";

const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type HandLandmarkerWorkerResult = {
  /** First detected hand's normalised landmarks, or null if none found. */
  landmarks: { x: number; y: number; z: number }[] | null;
};

type VisionMod = typeof import("@mediapipe/tasks-vision");

let visionMod: VisionMod | null = null;
let landmarker: import("@mediapipe/tasks-vision").HandLandmarker | null = null;
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
    landmarker = await visionMod.HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: HAND_MODEL_URL,
        delegate: "GPU",
      },
      numHands: 1,
      runningMode: "VIDEO",
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
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
  landmarks?: { x: number; y: number; z: number }[][];
};

async function runFrame(
  bitmap: ImageBitmap,
  timestamp: number,
): Promise<HandLandmarkerWorkerResult> {
  await ensureInit();
  if (!landmarker) {
    throw new Error("hand landmarker init failed");
  }
  const result = landmarker.detectForVideo(bitmap, timestamp) as FrameResult;
  bitmap.close();
  const hand = result.landmarks?.[0] ?? null;
  return {
    landmarks: hand ? hand.map((p) => ({ x: p.x, y: p.y, z: p.z })) : null,
  };
}

self.onmessage = (event: MessageEvent<AnyWorkerRequest>) => {
  const { id, kind, op, payload } = event.data;
  if (kind !== "hand-landmark") return;

  const send = (
    body:
      | { result: HandLandmarkerWorkerResult | { ok: true } }
      | { error: string },
  ): void => {
    const reply: WorkerResponse<"hand-landmark", unknown> = {
      id,
      kind: "hand-landmark",
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
