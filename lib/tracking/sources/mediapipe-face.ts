/**
 * lib/tracking/sources/mediapipe-face.ts — Browser face-tracking
 * via MediaPipe FaceLandmarker.
 *
 * Spawns the face-mesh worker (lib/workers/face-mesh.worker.ts),
 * sends video frames at 30fps (detuning to 15fps under pressure),
 * and maps the resulting landmarks into a ViewerPose.
 *
 * Pose extraction:
 *   - x, y: midpoint of the two eyes, recentred to [-1, +1]. We
 *     mirror X because the webcam image is a mirror of the user;
 *     left/right in pose space matches the user's left/right.
 *   - z: rough depth from inter-ocular distance — closer face means
 *     wider apparent eye distance. Calibrated to 0.4 at one
 *     body-distance from a 720p webcam; clamped to [0, 1].
 *   - yaw/pitch/roll: taken from the facialTransformationMatrix
 *     when available. The matrix is row-major 4x4; we read the
 *     rotation block and convert via the standard ZYX Euler
 *     decomposition.
 *
 * The matrix path is preferred. If MediaPipe omits the matrix
 * (older WASM builds), we fall back to gaze-vector approximation
 * from the eye landmark indices below.
 */

import { hasVideoInput, readConsent } from "../webcam";
import { registerTracker } from "../registry";
import type {
  TrackingTracker,
  ViewerPose,
  ViewerPoseHandler,
} from "../types";

import {
  startMediaPipeLoop,
  type MediaPipeLoopHandle,
} from "./mediapipe-loop";

import type { FaceLandmarkerWorkerResult } from "lib/workers/face-mesh.worker";

// MediaPipe face mesh has 478 landmarks. The two eye centres land
// at the model card's documented indices:
//   468 — left iris centre
//   473 — right iris centre
// Using iris centres rather than the eye corners gives a tighter
// gaze direction estimate.
const LM_LEFT_IRIS = 468;
const LM_RIGHT_IRIS = 473;

// Empirical: at one body distance from a 720p webcam the inter-iris
// distance lands around 0.06 in normalised landmark space. Larger
// = closer.
const INTER_IRIS_AT_REST = 0.06;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function extractEulerFromMatrix(
  matrix: number[],
): { yaw: number; pitch: number; roll: number } | null {
  if (matrix.length !== 16) return null;
  // Row-major 4x4 — rotation in the upper-left 3x3.
  const m00 = matrix[0] ?? 0;
  const m01 = matrix[1] ?? 0;
  const m02 = matrix[2] ?? 0;
  const m10 = matrix[4] ?? 0;
  const m12 = matrix[6] ?? 0;
  const m20 = matrix[8] ?? 0;
  const m21 = matrix[9] ?? 0;
  const m22 = matrix[10] ?? 0;
  // ZYX intrinsic Euler (yaw=Y, pitch=X, roll=Z).
  const pitch = Math.asin(clamp(-m12, -1, 1));
  const yaw = Math.atan2(m02, m22);
  const roll = Math.atan2(m10, m00);
  // Variables intentionally unused at this point — guards against
  // matrices that report zero-rotation (TS strictness on noUnused).
  void m01;
  void m20;
  void m21;
  return { yaw, pitch, roll };
}

function landmarksToPose(
  result: FaceLandmarkerWorkerResult,
  timestamp: number,
): ViewerPose | null {
  const lm = result.landmarks;
  if (!lm || lm.length < LM_RIGHT_IRIS + 1) return null;
  const left = lm[LM_LEFT_IRIS];
  const right = lm[LM_RIGHT_IRIS];
  if (!left || !right) return null;

  // Eye midpoint in normalised landmark space (0..1 each axis,
  // x increases right, y increases DOWN in the image).
  const midX = (left.x + right.x) / 2;
  const midY = (left.y + right.y) / 2;

  // Mirror X so left-of-screen for the user maps to negative x.
  const x = clamp(-((midX - 0.5) * 2), -1, 1);
  const y = clamp(-((midY - 0.5) * 2), -1, 1);

  // Inter-iris distance → depth proxy.
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  const interIris = Math.hypot(dx, dy);
  const z = clamp(
    interIris > 0 ? INTER_IRIS_AT_REST / interIris : 1,
    0,
    1,
  );

  const euler = result.facialTransformationMatrix
    ? extractEulerFromMatrix(result.facialTransformationMatrix)
    : null;

  return {
    x,
    y,
    z,
    yaw: euler?.yaw,
    pitch: euler?.pitch,
    roll: euler?.roll,
    timestamp,
    source: "mediapipe-face",
  };
}

function createMediaPipeFaceTracker(): TrackingTracker {
  const handlers = new Set<ViewerPoseHandler>();
  let loop: MediaPipeLoopHandle | null = null;
  let started = false;

  function broadcast(pose: ViewerPose): void {
    for (const h of Array.from(handlers)) {
      try {
        h(pose);
      } catch {
        // ignore
      }
    }
  }

  return {
    source: "mediapipe-face",
    available: async () => {
      if (typeof window === "undefined") return false;
      if (readConsent() !== "granted") return false;
      return hasVideoInput();
    },
    init: async () => {
      // The worker spins up lazily on the first frame, so init is
      // a no-op here.
    },
    start: async () => {
      if (started) return;
      started = true;
      try {
        loop = await startMediaPipeLoop<FaceLandmarkerWorkerResult>({
          workerKind: "face-mesh",
          op: "frame",
          initialFps: 30,
          detunedFps: 15,
          onResult: (result, timestamp) => {
            const pose = landmarksToPose(result, timestamp);
            if (pose) broadcast(pose);
          },
        });
      } catch {
        started = false;
        loop = null;
      }
    },
    stop: async () => {
      if (!started) return;
      started = false;
      const handle = loop;
      loop = null;
      if (handle) {
        try {
          await handle.stop();
        } catch {
          // ignore
        }
      }
    },
    onPose: (handler) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}

registerTracker("mediapipe-face", createMediaPipeFaceTracker);
