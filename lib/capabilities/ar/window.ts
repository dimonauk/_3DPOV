/**
 * lib/capabilities/ar/window.ts — Capability `ar.window`: headless magic-window AR primitive.
 *
 * One-line role: rear-camera stream helpers + pure GPS→ENU→scene-space transform maths for HoloWalk's `/holo-walk/[id]/ar` route.
 * Full purpose in window.PURPOSE.md.
 *
 * Headless: no DOM beyond browser globals (HTMLVideoElement, MediaStream),
 * no React imports, no zustand reads. Viewer + target come in as arguments
 * so the component layer can pull from the `geo` slice and the trail
 * catalogue however it likes.
 */

export type ARTransform = {
  /** Object world position for the target, in scene units relative to viewer at origin. East / Up / -North. */
  targetPos: readonly [number, number, number];
  /** Heading from viewer to target (compass degrees, 0=north clockwise). */
  bearing: number;
  /** Distance from viewer to target in metres. */
  distanceMeters: number;
  /** True if the visitor is within the location's renderToM range — they have arrived; sculpture should hide. */
  arrived: boolean;
  /** True if visitor is outside the renderFromM — too far; sculpture should fade out. */
  outOfRange: boolean;
};

export type ARWindowOptions = {
  /** Constraint overrides for getUserMedia. */
  videoConstraints?: MediaTrackConstraints;
};

/**
 * Typed error surface for `requestCameraStream`. Code values are stable;
 * the message is the underlying error's text for diagnostics.
 */
export type ARCameraErrorCode =
  | "permission-denied"
  | "no-camera"
  | "unavailable";

export class ARCameraError extends Error {
  readonly code: ARCameraErrorCode;
  constructor(code: ARCameraErrorCode, message: string) {
    super(message);
    this.name = "ARCameraError";
    this.code = code;
  }
}

/** WGS84 equatorial radius (metres). Matches the maths brief exactly. */
const EARTH_R_M = 6_378_137;
/** Default ground-to-eye height in metres for the sculpture's vertical placement. */
const DEFAULT_GROUND_HEIGHT_M = 1.6;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Request the rear-facing camera with iOS-friendly defaults. Pinning width
 * to 1920 dodges the iOS Safari ultra-wide trap (auto-selecting the 0.5×
 * lens when only `facingMode: environment` is requested).
 */
export async function requestCameraStream(
  options: ARWindowOptions = {},
): Promise<MediaStream> {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.mediaDevices === "undefined" ||
    typeof navigator.mediaDevices.getUserMedia !== "function"
  ) {
    throw new ARCameraError(
      "unavailable",
      "navigator.mediaDevices.getUserMedia is not available in this environment",
    );
  }

  const videoConstraints: MediaTrackConstraints = options.videoConstraints ?? {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  };

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : String(err);
    if (name === "NotAllowedError" || name === "SecurityError") {
      throw new ARCameraError("permission-denied", message);
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
      throw new ARCameraError("no-camera", message);
    }
    throw new ARCameraError("unavailable", message);
  }
}

/**
 * Wire a `MediaStream` onto a `<video>` element with iOS Safari's autoplay
 * rules respected: `playsInline` so the video plays in-place rather than
 * going full-screen, `muted` so autoplay is permitted, `autoplay` for the
 * non-iOS path. The caller is expected to have invoked this from inside a
 * user gesture so the awaited `play()` resolves rather than rejecting.
 */
export async function attachStreamToVideo(
  stream: MediaStream,
  videoEl: HTMLVideoElement,
): Promise<void> {
  videoEl.srcObject = stream;
  videoEl.muted = true;
  videoEl.defaultMuted = true;
  videoEl.playsInline = true;
  videoEl.autoplay = true;
  videoEl.setAttribute("playsinline", "true");
  videoEl.setAttribute("webkit-playsinline", "true");
  videoEl.setAttribute("muted", "");
  await videoEl.play();
}

/**
 * Stop all tracks on the stream. Idempotent: a null/undefined input or a
 * stream whose tracks are already stopped is a no-op.
 */
export function releaseStream(stream: MediaStream | null | undefined): void {
  if (stream === null || typeof stream === "undefined") return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // Track already ended; nothing to do.
    }
  }
}

/**
 * Pure math: viewer GPS + heading + target GPS → scene-space transform.
 *
 * Coordinate convention (matches Three.js right-handed default with the
 * camera looking down -Z): scene units = metres, X = east, Y = up,
 * Z = -north (so "in front when facing north" is -Z).
 *
 * Steps:
 *   1. Haversine for great-circle distance.
 *   2. Initial-bearing formula for the compass angle to the target.
 *   3. Local ENU: east = distance * sin(bearing), north = distance * cos(bearing).
 *   4. Rotate ENU around the up axis by `-headingRadians` so the viewer's
 *      forward direction lines up with -Z. After the rotation, a target
 *      directly ahead of the viewer sits at (0, _, negative-large).
 */
export function computeARTransform(
  viewer: { lat: number; lon: number; headingDegrees: number },
  target: { lat: number; lon: number; renderFromM: number; renderToM: number },
  options: { groundHeight?: number } = {},
): ARTransform {
  const groundHeight = options.groundHeight ?? DEFAULT_GROUND_HEIGHT_M;

  const phi1 = toRadians(viewer.lat);
  const phi2 = toRadians(target.lat);
  const dPhi = toRadians(target.lat - viewer.lat);
  const dLambda = toRadians(target.lon - viewer.lon);

  // Haversine — great-circle distance in metres.
  const sinDPhiHalf = Math.sin(dPhi / 2);
  const sinDLambdaHalf = Math.sin(dLambda / 2);
  const h =
    sinDPhiHalf * sinDPhiHalf +
    Math.cos(phi1) * Math.cos(phi2) * sinDLambdaHalf * sinDLambdaHalf;
  const distanceMeters =
    2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(h)));

  // Initial bearing from viewer to target (compass degrees, 0 = north).
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const bearingRad = Math.atan2(y, x);
  const bearing = (toDegrees(bearingRad) + 360) % 360;

  // Local ENU offsets in metres (flat-earth tangent plane — fine at the
  // sub-kilometre distances HoloWalk works at).
  const east = distanceMeters * Math.sin(bearingRad);
  const north = distanceMeters * Math.cos(bearingRad);

  // Apply viewer heading: rotate the ENU vector around the up axis by
  // -headingRadians so a target directly in the viewer's facing direction
  // ends up along -Z in the scene frame.
  const headingRad = toRadians(viewer.headingDegrees);
  const cosH = Math.cos(headingRad);
  const sinH = Math.sin(headingRad);
  // Rotation by -heading: (east', north') = ( east*cos − north*sin,
  //                                            east*sin + north*cos ).
  const eastRot = east * cosH - north * sinH;
  const northRot = east * sinH + north * cosH;

  // Scene axes: X = east, Y = up, Z = -north.
  const targetPos: readonly [number, number, number] = [
    eastRot,
    groundHeight,
    -northRot,
  ];

  return {
    targetPos,
    bearing,
    distanceMeters,
    arrived: distanceMeters < target.renderToM,
    outOfRange: distanceMeters > target.renderFromM,
  };
}
