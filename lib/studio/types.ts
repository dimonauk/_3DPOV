/**
 * lib/studio/types.ts — shared types for the Holoflow Studio editor.
 *
 * Stable contracts so the four major surfaces (DropZone, Viewer,
 * Timeline, Export) can evolve without breaking each other.
 */

/**
 * Discriminated union for what the operator has dropped onto the
 * canvas. Each variant carries enough metadata for the viewer to know
 * how to project it.
 */
export type SourceAsset =
  | {
      kind: "equirect-image";
      label: string;
      objectUrl: string;
      width: number;
      height: number;
      durationSeconds: 0;
      raw: File;
    }
  | {
      kind: "equirect-video";
      label: string;
      objectUrl: string;
      width: number;
      height: number;
      durationSeconds: number;
      raw: File;
    }
  | {
      kind: "dual-fisheye-image";
      label: string;
      objectUrl: string;
      width: number;
      height: number;
      durationSeconds: 0;
      camera: CameraId;
      raw: File;
    }
  | {
      kind: "dual-fisheye-video";
      label: string;
      objectUrl: string;
      width: number;
      height: number;
      durationSeconds: number;
      camera: CameraId;
      raw: File;
    }
  | {
      kind: "osv-video";
      /** DJI OSV — two SEPARATE video streams (verified 2026-05-15).
       *  Needs the hstack-then-v360 path before the viewer can render. */
      label: string;
      objectUrl: string;
      durationSeconds: number;
      camera: "avata360" | "osmo360";
      raw: File;
      streamCount: number;
    }
  | {
      kind: "insv-video";
      label: string;
      objectUrl: string;
      durationSeconds: number;
      camera: "insta360-x";
      raw: File;
      streamCount: number;
    }
  | {
      kind: "splat";
      label: string;
      objectUrl: string;
      durationSeconds: 0;
      format: "ply" | "splat" | "ksplat" | "spz";
      raw: File;
    }
  | {
      kind: "unknown";
      label: string;
      objectUrl: string;
      durationSeconds: 0;
      raw: File;
    };

export type CameraId =
  | "avata360"
  | "osmo360"
  | "insta360-x"
  | "theta"
  | "gopro-max"
  | "kandao-qoocam"
  | "samsung-gear-360"
  | "generic";

/**
 * A virtual-camera keyframe — the operator's "where the camera is
 * looking" at a given moment in the timeline.
 *
 * Pitch / yaw are in degrees. Yaw 0 = forward (centre of the equirect).
 * FOV is the horizontal field of view in degrees; 75 is the SLR-50mm
 * default, 110 is a wide GoPro look, 30 is telephoto.
 */
export type Keyframe = {
  /** Seconds from the source's start. For stills, always 0. */
  time: number;
  /** Yaw rotation in degrees (left/right). */
  yaw: number;
  /** Pitch rotation in degrees (up/down). */
  pitch: number;
  /** Optional roll. Default 0. */
  roll?: number;
  /** Horizontal field of view in degrees. */
  fov: number;
  /** Output aspect ratio override (W/H). Default = the viewer's. */
  aspect?: number;
  /** Easing override per-keyframe. Default = "linear". */
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bezier";
};
