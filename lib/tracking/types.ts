/**
 * lib/tracking/types.ts — Shared types for the viewer-pose tracking
 * fallback chain.
 *
 * The studio composes head/eye position from up to five different
 * input sources. The unified shape every source produces is a
 * ViewerPose — a 3D position (and optional Euler rotation) for
 * where the viewer's head sits in front of the monitor, in a
 * normalised coordinate system.
 *
 * Coordinate convention (normalised, monitor-relative):
 *
 *   x: -1 = far left of the screen plane, +1 = far right.
 *   y: -1 = bottom of the screen plane, +1 = top.
 *   z:  0 = at the screen, +1 = ~arm's-length back from it.
 *
 * Some sources cannot fill every field (the pointer fallback has
 * no real z, MediaPipe Face gives a decent yaw/pitch but rough
 * z). Consumers should treat missing rotation fields as 0 and
 * read the source tag to know how much to trust each axis.
 */

/**
 * The ordered set of input sources the studio knows about. Order
 * here ALSO matches the fallback chain — first source to declare
 * `available()` true wins, unless the operator overrides.
 */
export type TrackingSource =
  | "kinect"
  | "ultraleap"
  | "mediapipe-face"
  | "mediapipe-hand"
  | "pointer";

/**
 * A unified head/eye pose snapshot. Every source maps its native
 * representation into this shape before broadcasting.
 *
 * `timestamp` is `performance.now()` at the moment the source
 * produced the sample. Consumers compute latency against their
 * own clock; the registry never normalises it.
 */
export type ViewerPose = {
  /** Normalised X, -1 (left) .. +1 (right). */
  x: number;
  /** Normalised Y, -1 (bottom) .. +1 (top). */
  y: number;
  /** Normalised Z, 0 (at screen) .. ~1 (one body away). */
  z: number;
  /** Yaw in radians. Optional — sources may omit. */
  yaw?: number;
  /** Pitch in radians. Optional — sources may omit. */
  pitch?: number;
  /** Roll in radians. Optional — sources may omit. */
  roll?: number;
  /** performance.now() at sample time on the producing thread. */
  timestamp: number;
  /** Which source produced this sample. */
  source: TrackingSource;
};

/**
 * Handler that consumes a ViewerPose. Registered through the
 * registry or directly on an individual tracker. Handlers run
 * synchronously on the sample-producing tick — keep them cheap.
 */
export type ViewerPoseHandler = (pose: ViewerPose) => void;

/**
 * The interface every individual tracker satisfies. The registry
 * walks the fallback chain calling `available()` on each, picks
 * the first that resolves true, then `init()` + `start()`s it.
 *
 * Trackers OWN their resources (cameras, websockets, workers).
 * `stop()` must release every one of them; the registry treats it
 * as the only legal teardown path.
 */
export type TrackingTracker = {
  /** Stable identity for logging and selector state. */
  readonly source: TrackingSource;
  /** Resolve true if this source is reachable from the current device. */
  available: () => Promise<boolean>;
  /** Allocate any one-time resources (workers, WASM, sockets). Idempotent. */
  init: () => Promise<void>;
  /** Begin producing samples. Idempotent. */
  start: () => Promise<void>;
  /** Halt sampling and release any cameras / sockets / workers. Idempotent. */
  stop: () => Promise<void>;
  /** Subscribe to pose samples from this tracker. Returns unsubscribe. */
  onPose: (handler: ViewerPoseHandler) => () => void;
};

/**
 * The fallback ordering used by the registry when picking the
 * active source. Mutable here only so tests can swap it; runtime
 * code reads it as a frozen tuple.
 */
export const FALLBACK_CHAIN: readonly TrackingSource[] = Object.freeze([
  "kinect",
  "ultraleap",
  "mediapipe-face",
  "mediapipe-hand",
  "pointer",
]);
