/**
 * components/ar/webcam-ar/types.ts — Types + constants for WebcamARScene.
 *
 * Extracted per ARCHITECTURE.md Rule 1. No React, no Three.js — pure
 * data + literal unions consumed by the orchestrator, the recording
 * helper, and the camera/XR setup paths.
 */

import type { Card } from "lib/ar/types";

export type WebcamARSceneProps = { card: Card };

export type ARStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "no-camera"
  | "loading-model"
  | "xr-active";

// MediaPipe hand landmark indices we care about. Names from the
// MediaPipe HandLandmarker model card.
export const LM_WRIST = 0;
export const LM_MIDDLE_MCP = 9;

// Hosted hand-landmarker model + WASM. Both are public-CDN; if
// offline use is needed, mirror these into public/ and update.
export const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";

export const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
