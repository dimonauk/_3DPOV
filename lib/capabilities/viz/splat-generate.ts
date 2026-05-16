/**
 * lib/capabilities/viz/splat-generate.ts — Capability `viz.splat-generate`:
 * turn a source asset (image / image-set / video frame / camera rig
 * capture) into a 3D Gaussian Splat (`.ply`) via a pluggable provider.
 *
 * One-line role: source-agnostic splat synthesis. The studio runs three
 * different splat pipelines depending on the source material and the
 * end-use licence; this capability picks the right one per call and
 * normalises the output shape.
 *
 * Full purpose in splat-generate.PURPOSE.md.
 *
 * # Providers
 * - "sharp-onnx" — Apple SHARP via ONNX (single image → 1.18M
 *   gaussians). Fast, research-licence only. CCTV archive track.
 * - "postshot" — Jawset Postshot (multi-image / video → trained
 *   gaussian splat). Commercial-friendly. Quality benchmark.
 * - "studio-rig-native" — POV-rig multi-camera capture pipeline.
 *   Studio owns the IP outright. Commerce track.
 * - "luma-genie" — Luma Labs hosted API. Commercial.
 *
 * # Licence
 * Every record carries a `licence` field that downstream surfaces (the
 * commerce filter, the editioned-piece minting flow) read to gate
 * what they can show. SHARP outputs are forever `research-only`.
 *
 * # Posture
 * Foundation phase: this file defines the type surface and provider
 * router stub. Concrete providers live in `./splat-providers/*.ts`
 * and are wired one at a time as each runtime path stabilises. The
 * stub `splatGenerate` here throws — server-only routing will land in
 * `splat-generate.server.ts` when the first provider goes live.
 */

export type SplatProvider =
  | "sharp-onnx"
  | "postshot"
  | "studio-rig-native"
  | "luma-genie"
  /**
   * Bench-side gsplat training pipeline. Pinhole-video input,
   * COLMAP/GLOMAP SfM, then gsplat or Brush as the trainer. Apache-2.0
   * / MIT throughout — commerce-safe. The bench endpoint is the
   * planned `splat360` service extended with a non-360 entry point;
   * see `splat-generate.server.ts` for the job contract.
   */
  | "hangar-gsplat"
  /**
   * Bench-side 4D gaussian-splatting training pipeline. Monocular
   * video input, deformable-MLP 4D-GS encoding. Either via the open
   * 4D-GS / Deformable-GS / SC-GS research codebases on the bench,
   * or via Apple SHARP 4D if/when that ONNX export lands. The latter
   * inherits SHARP's research-only licence; the former is commerce-
   * safe Apache/MIT.
   */
  | "hangar-4dgs";

/**
 * Licence that travels with every generated splat record. Downstream
 * commerce surfaces must filter on this — research-only outputs cannot
 * appear on a "buy" surface.
 */
export type SplatLicence =
  | "research-only" // apple-amlr: SHARP-derived. No commerce.
  | "commercial-ok" // studio-owned or Apache-2.0-derived.
  | "third-party-commercial"; // Luma etc. — terms vary; consult provider record.

/**
 * Encoding flavour of the PLY's value space. Standard 3DGS viewers
 * (Postshot, SuperSplat, Spark) expect the INRIA encoding. SHARP's
 * `export_ply` already writes in this space, but its PLY also carries
 * non-vertex SHARP-specific metadata that some viewers reject — see
 * `convert_sharp_ply.py` in `D:/The_Hangar/engines/sharp-onnx/`.
 */
export type SplatPlyFlavour =
  | "standard-3dgs" // x,y,z, nx,ny,nz, f_dc_0..2, f_rest_0..44, opacity, scale_0..2, rot_0..3
  | "sharp-onnx-raw" // SHARP's superset format — convert before generic viewing
  | "4dgs-deformable-mlp" // canonical 3DGS + a deformation MLP that maps (x, t) → Δ
  | "4dgs-canonical-time"; // per-timestep canonical attributes (heavier on disk)

/**
 * Encoding of time for a 4D splat. `null` means the record is a static
 * 3D splat (the historical case). Present + > 1 means a 4D record.
 */
export type Splat4DEncoding = {
  /** `deformable-mlp` (compact, needs runtime evaluator) or `canonical-time`
   *  (heavier, but renderable by stepping a static viewer). */
  kind: "deformable-mlp" | "canonical-time";
  /** Number of keyframes / training timestamps. */
  frameCount: number;
  /** Real-world seconds the recording spans. */
  durationSeconds: number;
  /** Frames per second of the source video, if applicable. */
  sourceFps?: number;
};

export type SplatGenerateInput = {
  provider: SplatProvider;
  /**
   * Source assets. The shape varies by provider:
   *  - sharp-onnx: exactly one image URL.
   *  - postshot / studio-rig-native: an array of image URLs (or a
   *    video URL that will be frame-extracted before training).
   *  - luma-genie: object/scene id from the Luma API.
   */
  source:
    | { kind: "image-single"; url: string }
    | { kind: "image-set"; urls: readonly string[] }
    | { kind: "video"; url: string; frameStride?: number }
    | { kind: "luma-ref"; objectId: string };
  /**
   * Optional caller-supplied id; defaults to a sha256 of the source
   * payload at the call site.
   */
  recordId?: string;
};

export type SplatRecord = {
  id: string;
  provider: SplatProvider;
  licence: SplatLicence;
  plyFlavour: SplatPlyFlavour;
  /** Public URL of the generated .ply (Vercel Blob or studio bench). */
  plyUrl: string;
  /** Bytes of the .ply on disk. */
  plyBytes: number;
  /** Number of gaussians in the splat. */
  gaussianCount: number;
  /** ISO-8601 timestamp of when generation completed. */
  generatedAt: string;
  /**
   * Present when the record is a 4D / dynamic splat. Static 3D splats
   * leave this absent. Downstream renderers branch on this to decide
   * whether to step time or render once.
   */
  fourD?: Splat4DEncoding;
  /**
   * Composition lineage. Present on splats produced by
   * `viz.splat-compose` (i.e. stitched scenes). Lists the source splat
   * ids that contributed; commerce gating is the most-restrictive
   * licence across them.
   */
  composedFrom?: ReadonlyArray<string>;
  /** Provider-specific diagnostic blob (depth range, training iters,
   *  inference time, etc.). Opaque to consumers. */
  meta: Record<string, unknown>;
};

export type SplatGenerateError = {
  code:
    | "provider-unavailable"
    | "source-invalid"
    | "licence-conflict"
    | "generation-failed";
  message: string;
};

/**
 * Public capability. Foundation-phase stub: the router exists, the
 * provider implementations do not yet.
 *
 * Once a provider lands, this function:
 *   1. Validates the input shape against the provider's required
 *      `source.kind`.
 *   2. Tags the record with the correct licence (sharp-onnx →
 *      research-only; the rest → commercial-ok or third-party).
 *   3. Calls the provider, persists the .ply to Vercel Blob, writes
 *      the record via the media library, returns it.
 */
export async function splatGenerate(
  _input: SplatGenerateInput,
): Promise<SplatRecord> {
  const detail: SplatGenerateError = {
    code: "provider-unavailable",
    message:
      "viz.splat-generate: no provider wired yet — foundation-phase scaffold only",
  };
  throw Object.assign(new Error(detail.message), detail);
}

/** Licence mapping by provider. Stable surface — commerce code reads
 *  from this directly when deciding what to show.
 *
 *  `hangar-4dgs` defaults to commercial-ok because the open 4D-GS
 *  research codebases on the bench (4D-GS, Deformable-GS, SC-GS) are
 *  all permissive (Apache / MIT). When/if Apple SHARP 4D weights enter
 *  the pipeline the provider should be renamed (`sharp-onnx-4d`) so the
 *  research-only licence travels with the record. */
export const PROVIDER_LICENCE: Readonly<Record<SplatProvider, SplatLicence>> = {
  "sharp-onnx": "research-only",
  postshot: "commercial-ok",
  "studio-rig-native": "commercial-ok",
  "luma-genie": "third-party-commercial",
  "hangar-gsplat": "commercial-ok",
  "hangar-4dgs": "commercial-ok",
};

/** Convenience predicate: does this record's licence allow it on
 *  commerce surfaces? */
export function isSplatCommerceEligible(record: SplatRecord): boolean {
  return record.licence !== "research-only";
}
