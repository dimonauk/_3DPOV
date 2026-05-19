/**
 * lib/tracking/sources/mediapipe-hand.ts — Browser hand-tracking
 * via MediaPipe HandLandmarker as a viewer-pose source.
 *
 * Second-tier camera fallback when face landmarking fails (face
 * outside frame, partial occlusion). Uses the palm centre — the
 * midpoint of the wrist and middle MCP — to approximate where
 * the viewer's attention is focused on the screen, mirroring the
 * mapping the hand-locked AR scene already uses.
 *
 * Heavier than face detection. Initial fps 15 (face runs 30); we
 * trade frame rate for a more stable signal when the camera is
 * the only thing keeping the chain alive.
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

import type { HandLandmarkerWorkerResult } from "lib/workers/hand-landmark.worker";

// MediaPipe HandLandmarker indices (model card).
const LM_WRIST = 0;
const LM_MIDDLE_MCP = 9;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function landmarksToPose(
  result: HandLandmarkerWorkerResult,
  timestamp: number,
): ViewerPose | null {
  const lm = result.landmarks;
  if (!lm) return null;
  const wrist = lm[LM_WRIST];
  const mcp = lm[LM_MIDDLE_MCP];
  if (!wrist || !mcp) return null;

  const midX = (wrist.x + mcp.x) / 2;
  const midY = (wrist.y + mcp.y) / 2;

  // Mirror X (webcam is a mirror of the user).
  const x = clamp(-((midX - 0.5) * 2), -1, 1);
  const y = clamp(-((midY - 0.5) * 2), -1, 1);

  // Z is taken from MediaPipe's z (relative to the wrist) on the
  // middle MCP — negative = closer to the camera. Normalise to
  // ViewerPose's [0, 1] where 0 = at screen, 1 = arm's length.
  const rawZ = mcp.z ?? 0;
  const z = clamp(0.5 - rawZ * 2, 0, 1);

  return {
    x,
    y,
    z,
    timestamp,
    source: "mediapipe-hand",
  };
}

function createMediaPipeHandTracker(): TrackingTracker {
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
    source: "mediapipe-hand",
    available: async () => {
      if (typeof window === "undefined") return false;
      if (readConsent() !== "granted") return false;
      return hasVideoInput();
    },
    init: async () => {
      // Lazy worker init on first frame.
    },
    start: async () => {
      if (started) return;
      started = true;
      try {
        loop = await startMediaPipeLoop<HandLandmarkerWorkerResult>({
          workerKind: "hand-landmark",
          op: "frame",
          initialFps: 15,
          detunedFps: 10,
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

registerTracker("mediapipe-hand", createMediaPipeHandTracker);
