/**
 * lib/capabilities/viz/splat-compose.ts — Capability `viz.splat-compose`:
 * stitch N existing gaussian splats into one composed scene splat.
 *
 * One-line role: source splats in, single composed splat out. The studio
 * runs SHARP on CCTV stills (one splat per still); the eventual move is to
 * fuse all the splats taken at a given location — every angle of Borough
 * Market, say — into one walkable scene splat. This capability is the
 * surface that does that.
 *
 * # Licence math
 * The composed output inherits the MOST-RESTRICTIVE licence across all
 * inputs. If any contributing splat is `research-only` the output is
 * `research-only` and cannot appear on a commerce surface. This is
 * conservative on purpose: a single SHARP-derived splat poisons the whole
 * fused scene for commercial use. Mix carefully.
 *
 * Ordering (most-restrictive first):
 *   research-only  >  third-party-commercial  >  commercial-ok
 *
 * # Posture
 * Foundation phase: type surface + router stub only. The bench-side
 * fusion pipeline (point-cloud alignment → opacity-aware merge → optional
 * gsplat retraining for seam polish) is not yet wired. The job contract
 * the server stub expects lives in `splat-compose.server.ts`.
 */

import type {
  SplatLicence,
  SplatPlyFlavour,
  SplatRecord,
} from "./splat-generate";

/**
 * Only one provider for now: the bench-side fusion pipeline. Future
 * providers might include hosted alternatives, but the licence-inheritance
 * rule is provider-independent.
 */
export type SplatComposeProvider = "hangar-compose";

export type SplatComposeInput = {
  provider: SplatComposeProvider;
  /**
   * Firestore SplatRecord ids of the inputs to fuse. Order is not
   * significant — alignment is geometric, not list-positional.
   */
  sourceSplatIds: ReadonlyArray<string>;
  /**
   * Alignment strategy for finding common geometry across the inputs.
   *  - `auto`: try GPS metadata first, fall back to feature matching.
   *  - `gps-then-features`: same as auto but explicit; useful when callers
   *     know all inputs carry geotags.
   *  - `features-only`: skip GPS entirely (CCTV indoor capture, etc.).
   * Defaults to `auto`.
   */
  alignment?: "auto" | "gps-then-features" | "features-only";
  /**
   * Optional gsplat retraining pass after the raw merge, in iterations.
   * 0 (default) means concatenate-and-align only — seams will be visible
   * where splats overlap. A few thousand iterations polish the seams at
   * the cost of bench time.
   */
  retrainIterations?: number;
  /**
   * Optional caller-supplied id; defaults to a sha256 of the sorted
   * source-id tuple at the call site.
   */
  recordId?: string;
};

/**
 * Record shape for a composed splat. Same surface as `SplatRecord` but
 * `composedFrom` is required (not optional) — the whole point of this
 * capability is to track lineage.
 */
export type SplatComposeRecord = Omit<SplatRecord, "composedFrom"> & {
  composedFrom: ReadonlyArray<string>;
};

export type SplatComposeError = {
  code:
    | "provider-unavailable"
    | "source-not-found"
    | "licence-mismatch"
    | "alignment-failed"
    | "fusion-failed";
  message: string;
};

/**
 * Public capability. Foundation-phase stub: the router exists, the
 * fusion implementation does not yet.
 *
 * Once the bench path lands, this function:
 *   1. Loads each `sourceSplatIds` record from Firestore; rejects with
 *      `source-not-found` if any are missing.
 *   2. Computes the composed licence via {@link computeComposedLicence}.
 *   3. POSTs PLY URLs + alignment params to the bench fusion service.
 *   4. Persists the resulting PLY and writes a SplatComposeRecord with
 *      lineage populated.
 */
export async function splatCompose(
  _input: SplatComposeInput,
): Promise<SplatComposeRecord> {
  const detail: SplatComposeError = {
    code: "provider-unavailable",
    message:
      "viz.splat-compose: no provider wired yet — foundation-phase scaffold only",
  };
  throw Object.assign(new Error(detail.message), detail);
}

/**
 * Licence mapping by provider. Composition itself doesn't dictate the
 * output licence — the input licences do (see {@link computeComposedLicence}).
 * This map exists for parity with `PROVIDER_LICENCE` in splat-generate, and
 * names the "ceiling" licence: even a 100%-commercial input set fuses on the
 * bench under permissive (gsplat / open SfM) tooling, so commercial-ok is
 * the best we can produce.
 */
export const PROVIDER_LICENCE_COMPOSE: Readonly<
  Record<SplatComposeProvider, SplatLicence>
> = {
  "hangar-compose": "commercial-ok",
};

/**
 * Default PLY flavour of a composed splat. The bench pipeline normalises
 * to standard 3DGS before fusion, regardless of input flavours, so the
 * output is always standard. 4D inputs are not supported in v1 — mixing
 * 3D and 4D is a separate problem.
 */
export const COMPOSED_PLY_FLAVOUR: SplatPlyFlavour = "standard-3dgs";

/**
 * Pure function: pick the most-restrictive licence across a set of inputs.
 *
 * Ordering: `research-only` > `third-party-commercial` > `commercial-ok`.
 *
 * Empty input is a programmer error — callers should validate
 * `sourceSplatIds.length > 0` before invoking. We throw rather than
 * defaulting to a licence because silently returning `commercial-ok` for
 * an empty set would be the worst possible failure mode.
 */
export function computeComposedLicence(
  licences: ReadonlyArray<SplatLicence>,
): SplatLicence {
  if (licences.length === 0) {
    throw new Error(
      "computeComposedLicence: empty licence list — caller must validate inputs first",
    );
  }
  if (licences.includes("research-only")) return "research-only";
  if (licences.includes("third-party-commercial")) {
    return "third-party-commercial";
  }
  return "commercial-ok";
}
