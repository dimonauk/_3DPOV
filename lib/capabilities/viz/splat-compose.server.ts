/**
 * lib/capabilities/viz/splat-compose.server.ts — Server-side wiring for
 * the `viz.splat-compose` capability.
 *
 * One-line role: implements the `splatCompose` router by dispatching to
 * the bench-side fusion service. Foundation phase: nothing is wired yet;
 * the single provider throws `provider-unavailable` with the contract
 * the eventual implementation must satisfy documented inline.
 *
 * # Why a stub
 * Locking the contract before the bench code lands means the consumers
 * (HoloWalk scene composer, the studio's "fuse this location" UI) can
 * develop against a stable type surface, and the bench engineer has a
 * concrete spec to implement rather than a hand-wave.
 */

import "server-only";

import {
  type SplatComposeError,
  type SplatComposeInput,
  type SplatComposeRecord,
} from "./splat-compose";

function asError(code: SplatComposeError["code"], message: string): Error {
  const detail: SplatComposeError = { code, message };
  return Object.assign(new Error(message), detail);
}

/**
 * Server-side router. Picks the right provider and runs it.
 *
 * # Caller contract (auth)
 *
 * `_ctx.uploadedBy` is currently unused (the only provider throws
 * before any persistence), but the parameter is reserved for the
 * eventual wired path. When the bench-side fusion pipeline lands,
 * this function will pass `uploadedBy` straight through to
 * `persistSplat` (or whatever wires fused outputs into the media
 * library). At that point the same caller contract as
 * `splatGenerateServer` applies: `uploadedBy` MUST be a Firebase uid
 * that the caller has already verified via `verifyIdToken` AND
 * confirmed against the operator allow-list. This function trusts
 * the caller — it does NOT re-verify. Never accept the value from
 * user input.
 *
 * The `_` prefix on the parameter name flags "intentionally unused
 * today, kept for forward compatibility" — drop the underscore when
 * the provider lands.
 */
export async function splatComposeServer(
  input: SplatComposeInput,
  _ctx: { uploadedBy: string },
): Promise<SplatComposeRecord> {
  switch (input.provider) {
    case "hangar-compose":
      // Bench-side contract (TODO — fusion service on the studio bench):
      //   POST {SPLAT_COMPOSE_SERVICE_URL}/jobs
      //     body: { plyUrls: string[], alignment: "auto" |
      //             "gps-then-features" | "features-only",
      //             retrainIterations: number }
      //   Returns: { jobId, etaSeconds }
      //   Status: GET {SPLAT_COMPOSE_SERVICE_URL}/jobs/{jobId}
      //     -> { state: "queued" | "running" | "done" | "error",
      //          alignedCount, totalCount, alignmentMetric,
      //          retrainIters, durationSeconds }
      //   Result: GET {SPLAT_COMPOSE_SERVICE_URL}/jobs/{jobId}/result/std
      //     -> standard-3DGS PLY bytes of the stitched scene.
      //
      // Bench implementation needs:
      //   - Point-cloud alignment: coarse global registration via FGR
      //     (Fast Global Registration) or TEASER++; refined locally with
      //     ICP. GPS-then-features mode seeds with geotag centroids
      //     before geometric refinement.
      //   - Opacity-aware merge: naive concat double-renders in overlap
      //     regions. Either downweight opacities in overlap or run a
      //     proper density-based pruning step (gsplat's densification
      //     inverse).
      //   - Optional gsplat retraining pass to polish seams, gated on
      //     `retrainIterations > 0`. Same trainer as `hangar-gsplat` in
      //     splat-generate — uses the merged splat as init, the union
      //     of source camera poses as supervision.
      //   - Licence propagation: server must resolve each
      //     `sourceSplatIds` entry, gather their licences, and tag the
      //     output via `computeComposedLicence` from splat-compose.ts.
      throw asError(
        "provider-unavailable",
        "hangar-compose: bench-side splat fusion pipeline not yet wired. " +
          "Foundation-phase scaffold only. See splat-compose.server.ts for " +
          "the job contract this route expects (alignment → merge → " +
          "optional retrain).",
      );
  }
}
