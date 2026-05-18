/**
 * lib/capabilities/viz/splat-generate.server.ts — Server-side router
 * for the viz.splat-generate capability.
 *
 * One-line role: dispatches `splatGenerateServer(input, ctx)` to the
 * right provider module under `./splat-providers/`. The actual fetch /
 * poll / persist work lives there; this file is the switch statement.
 *
 * Re-exports `generateViaSharpOnnxFromBytes` + `SplatOutputTarget` for
 * the admin route handlers that import them directly (Drive-import,
 * Photos-import, raw-bytes).
 *
 * # Provider matrix
 *
 * | Provider          | Source              | Licence                  | Status            |
 * |-------------------|---------------------|--------------------------|-------------------|
 * | sharp-onnx        | image-single        | research-only            | live (bench)      |
 * | hangar-gsplat     | video               | commercial-ok            | client wired      |
 * | hangar-4dgs       | video               | commercial-ok            | client wired      |
 * | luma-genie        | luma-ref (objectId) | third-party-commercial   | client wired      |
 * | postshot          | image-set / video   | commercial-ok            | manual workflow   |
 * | studio-rig-native | image-set / video   | commercial-ok            | pipeline not built|
 *
 * "client wired" means the Holoflow-side client follows the documented
 * bench/API contract. The corresponding bench service or external API
 * must exist for the call to succeed; otherwise the provider returns
 * `provider-unavailable` with a clear deployment-gap message.
 */

import "server-only";

import {
  generateViaSharpOnnx,
  generateViaSharpOnnxFromBytes,
  generateViaHangarGsplat,
  generateViaHangar4dgs,
  generateViaLumaGenie,
} from "./splat-providers";
import { asError } from "./splat-providers/_helpers.server";

import type {
  SplatGenerateInput,
  SplatRecord,
} from "./splat-generate";

// Re-export for the admin route handlers that import these directly.
// Don't reach into ./splat-providers/ from callers — go through this
// router file so the public surface is a single import.
export { generateViaSharpOnnxFromBytes };
export type { SplatOutputTarget } from "./splat-providers";

/**
 * Server-side router. Picks the right provider and runs it.
 *
 * # Caller contract (auth)
 *
 * `ctx.uploadedBy` MUST be a Firebase uid that the caller has already
 * verified via `verifyIdToken` AND confirmed against the operator
 * allow-list (see `lib/auth/admin-emails.ts` + `requireAdminUser` in
 * `lib/integrations/google/admin-guard.ts`). This function trusts the
 * caller — it does NOT re-verify. Reasoning: the bench-side providers
 * persist artifacts tagged with `uploadedBy`, and the splat generation
 * itself is expensive enough that the route layer's auth gate is the
 * right enforcement boundary.
 *
 * Callers that skip pre-verification (e.g. internal cron jobs that
 * synthesise a uid) MUST document the trust source at the call site.
 * Never accept an `uploadedBy` value from user input.
 */
export async function splatGenerateServer(
  input: SplatGenerateInput,
  ctx: { uploadedBy: string },
): Promise<SplatRecord> {
  switch (input.provider) {
    case "sharp-onnx":
      return generateViaSharpOnnx(input, ctx.uploadedBy);
    case "hangar-gsplat":
      return generateViaHangarGsplat(input, ctx.uploadedBy);
    case "hangar-4dgs":
      return generateViaHangar4dgs(input, ctx.uploadedBy);
    case "luma-genie":
      return generateViaLumaGenie(input, ctx.uploadedBy);
    case "postshot":
      throw asError(
        "provider-unavailable",
        "postshot: Jawset Postshot is a desktop GUI app with no public API. " +
          "Operator workflow: open Postshot, drag the source images/video, " +
          "train, export the PLY. Upload the result via /api/admin/splat/from-bytes " +
          "(provider: studio-rig-native) or via Drive sync. Headless control " +
          "would need a bench-side wrapper that doesn't exist yet.",
      );
    case "studio-rig-native":
      throw asError(
        "provider-unavailable",
        "studio-rig-native: the POV-rig multi-camera capture pipeline is " +
          "studio-owned but not yet built. Until it lands, hangar-gsplat is " +
          "the closest commerce-safe equivalent (video → COLMAP/GLOMAP → " +
          "gsplat/Brush, all Apache/MIT).",
      );
  }
}
