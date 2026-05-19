/**
 * lib/tracking/index.ts — Public surface for the tracking module.
 *
 * Importing this barrel registers all five trackers as a
 * side-effect, then re-exports the registry API and types. A
 * consumer only needs:
 *
 *     import { subscribe, type ViewerPose } from "lib/tracking";
 *
 * Source modules each call `registerTracker()` at import time;
 * order here matches FALLBACK_CHAIN so a `tsc --noEmit` reader
 * can see the priority at a glance.
 */

import "./sources/kinect-bridge";
import "./sources/ultraleap";
import "./sources/mediapipe-face";
import "./sources/mediapipe-hand";
import "./sources/pointer-fallback";

export {
  subscribe,
  onActiveSourceChange,
  getActiveSource,
  getLastPose,
  setPreferredSource,
  reevaluate,
} from "./registry";
export type {
  ViewerPose,
  ViewerPoseHandler,
  TrackingSource,
  TrackingTracker,
} from "./types";
export { FALLBACK_CHAIN } from "./types";
export {
  readConsent,
  writeConsent,
  acquireWebcam,
  releaseWebcam,
  hasVideoInput,
  type ConsentDecision,
} from "./webcam";
