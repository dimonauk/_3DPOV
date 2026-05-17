/**
 * lib/capabilities/viz/thumbnail-splat.server.ts — Server-side router
 * for the viz.thumbnail-splat capability.
 *
 * One-line role: dispatches `thumbnailSplatServer(input, ctx)` to the
 * matching provider module under `./thumbnail-providers/`. The actual
 * rendering work lives there; this file is the switch statement.
 *
 * # Provider matrix
 *
 * | Provider     | Runtime               | Speed       | Status        |
 * |--------------|-----------------------|-------------|---------------|
 * | card-fast    | Anywhere @napi-rs/canvas runs (incl. Vercel) | <1 s | live        |
 * | splat-real   | HoloFlow Desktop only | seconds     | client wired  |
 *
 * "client wired" means the Holoflow-side client posts to the bench
 * endpoint per the contract documented in `splat-real.server.ts`.
 * The desktop helper must implement the endpoint for the call to
 * succeed; otherwise `provider-unavailable` surfaces a clear
 * deployment-gap message and the caller can fall back to card-fast.
 */

import "server-only";

import { renderCardFast, renderSplatReal } from "./thumbnail-providers";

import type {
  ThumbnailSplatInput,
  ThumbnailSplatResult,
} from "./thumbnail-splat";

/**
 * Server-side router. Caller passes the operator's Firebase uid so the
 * media library write carries the right `uploadedBy` (matches the
 * posture in `splat-generate.server.ts` and `splat-ar-deploy.server.ts`).
 *
 * `ctx.fallbackToCardFast` (default true) silently re-dispatches to the
 * card-fast provider when splat-real returns `provider-unavailable` —
 * the common case until the HoloFlow Desktop helper ships. Surfaces
 * that need to assert canonical quality (admin re-bake tools, regression
 * tests) pass `fallbackToCardFast: false` to surface the gap explicitly.
 */
export async function thumbnailSplatServer(
  input: ThumbnailSplatInput,
  ctx: { uploadedBy: string; fallbackToCardFast?: boolean },
): Promise<ThumbnailSplatResult> {
  const fallback = ctx.fallbackToCardFast ?? true;
  switch (input.provider) {
    case "card-fast":
      return renderCardFast(input, ctx.uploadedBy);
    case "splat-real": {
      try {
        return await renderSplatReal(input, ctx.uploadedBy);
      } catch (err) {
        const code = (err as { code?: string })?.code;
        if (fallback && code === "provider-unavailable") {
          return renderCardFast(
            { ...input, provider: "card-fast" },
            ctx.uploadedBy,
          );
        }
        throw err;
      }
    }
  }
}
