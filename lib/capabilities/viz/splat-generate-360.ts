/**
 * lib/capabilities/viz/splat-generate-360.ts — Capability
 * `viz.splat-generate-360`: produce a 3D Gaussian Splat from a
 * spherical-camera capture (Avata 360, Osmo 360, Insta360, Theta,
 * GoPro Max).
 *
 * One-line role: 360-source-aware splat synthesis. Sibling to
 * `viz.splat-generate`, kept separate while the input shape and the
 * backing service stabilise.
 *
 * Full purpose in splat-generate-360.PURPOSE.md.
 *
 * # Why sibling, not a provider on splat-generate
 *
 * The existing `viz.splat-generate` taxonomy is provider-per-line and
 * source.kind is `image-single | image-set | video | luma-ref`. A 360
 * capture introduces two new source shapes that don't fit cleanly:
 *
 *  - `fisheye-pair` — pre-stitch DNG pair from a dual-fisheye camera.
 *    Each "shot" is two correlated images with a known rig constraint.
 *  - `equirect-video` / `equirect-image-set` — same as the existing
 *    video / image-set shapes but carrying a camera-model hint that
 *    the SfM stage must honour.
 *
 * Once the shape settles in this file, the two capabilities can fold:
 * `splat-generate` grows a `hangar-360` provider and the source union
 * gains the equirect / fisheye-pair variants. Until then this stays
 * a sibling so changes here cannot regress the existing surface.
 *
 * # Providers
 *
 * - "hangar-360" — the studio `splat360` engine in this repo at
 *   `services/splat360/` (port 8390 on the tailnet). COLMAP/GLOMAP +
 *   gsplat/Brush, all commerce-safe OSS.
 *
 * No research-only providers are eligible for this capability.
 *
 * # Posture
 *
 * Foundation phase: type surface + provider router stub. The
 * `hangar-360` provider stub lives in
 * `./splat-providers/hangar-360.ts` (TBD). Server-only routing lands
 * in `splat-generate-360.server.ts` when the provider goes live.
 */

import type { SplatLicence, SplatPlyFlavour } from "./splat-generate";

export type Splat360Provider = "hangar-360";

/**
 * Which physical camera the capture came from. Drives the adapter
 * choice on the service side (lens calibration prior, telemetry box
 * format).
 */
export type Splat360Camera =
  | "avata360"
  | "osmo360"
  | "insta360-x"
  | "theta"
  | "gopro-max"
  | "generic";

/**
 * SfM camera-model strategy. `auto` lets the service decide based on
 * source shape; the others force a specific path. See
 * `services/splat360/src/splat360/pipeline/camera_model.py`
 * for the trade-offs of each.
 */
export type Splat360Strategy =
  | "auto"
  | "fisheye-pair" // OPENCV_FISHEYE per lens, rig-coupled — best quality
  | "equirect" //     SPHERICAL camera model — simplest
  | "cubemap"; //     PINHOLE × 6 faces — universal compatibility

export type Splat360Source =
  | {
      kind: "fisheye-pair";
      /** Time-ordered pairs of (lens-A, lens-B) URLs. */
      pairs: ReadonlyArray<readonly [string, string]>;
      camera: Splat360Camera;
    }
  | {
      kind: "equirect-video";
      url: string;
      /** Frame decimation in fps. 1.0 is usually plenty for SfM. */
      frameFps?: number;
      camera: Splat360Camera;
    }
  | {
      kind: "equirect-image-set";
      urls: readonly string[];
      camera: Splat360Camera;
    };

export type Splat360GenerateInput = {
  provider: Splat360Provider;
  source: Splat360Source;
  /** Force a non-default SfM camera-model strategy. */
  strategy?: Splat360Strategy;
  /** Training backend. Default: `gsplat`. */
  trainer?: "gsplat" | "brush";
  /** Caller-supplied id; defaults to sha256 of the source payload at the call site. */
  recordId?: string;
};

/**
 * Returned record shape — mirrors `SplatRecord` from splat-generate
 * intentionally so a downstream renderer doesn't need to branch.
 */
export type Splat360Record = {
  id: string;
  provider: Splat360Provider;
  licence: SplatLicence; // always "commercial-ok" for hangar-360
  plyFlavour: SplatPlyFlavour;
  plyUrl: string;
  plyBytes: number;
  gaussianCount: number;
  generatedAt: string;
  /** Provider-specific diagnostic blob (SfM stats, train iters,
   *  camera path chosen, registered image count). Opaque to consumers. */
  meta: Record<string, unknown>;
};

export type Splat360Error = {
  code:
    | "provider-unavailable"
    | "source-invalid"
    | "camera-unsupported"
    | "sfm-failed"
    | "train-failed"
    | "generation-failed";
  message: string;
};

/**
 * Public capability. Foundation-phase stub.
 *
 * Once `hangar-360` lands, this function:
 *   1. Validates the source shape against the camera adapter.
 *   2. POSTs the job payload to the `splat360` service on the tailnet.
 *   3. Polls until done.
 *   4. Persists the `.ply` to blob storage, writes the record via the
 *      media library, returns it.
 */
export async function splatGenerate360(
  _input: Splat360GenerateInput,
): Promise<Splat360Record> {
  const detail: Splat360Error = {
    code: "provider-unavailable",
    message:
      "viz.splat-generate-360: hangar-360 provider not wired yet — foundation-phase scaffold only",
  };
  throw Object.assign(new Error(detail.message), detail);
}

/** Licence is fixed: hangar-360 is studio-owned commerce-safe OSS glue. */
export const PROVIDER_LICENCE_360: Readonly<
  Record<Splat360Provider, SplatLicence>
> = {
  "hangar-360": "commercial-ok",
};
