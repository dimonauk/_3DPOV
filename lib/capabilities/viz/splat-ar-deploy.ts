/**
 * lib/capabilities/viz/splat-ar-deploy.ts — Capability `viz.splat-ar-deploy`:
 * package a generated splat as a QR-driven AR experience.
 *
 * One-line role: given a SplatRecord360 and a target page URL, emit
 * the QR code + a stable public URL + an optional iOS USDZ fallback
 * URL, so a printed sign can drive a phone-AR experience.
 *
 * Full purpose in splat-ar-deploy.PURPOSE.md.
 *
 * # Flow
 *
 *   SplatRecord360 (commerce-ok .spz / .ksplat in blob storage)
 *      ↓
 *   choose target URL (e.g. /holo-walk/<id>/ar)
 *      ↓
 *   generate QR encoding that URL with UTM params
 *      ↓
 *   (optional) generate iOS USDZ fallback from splat→mesh pipeline
 *      ↓
 *   write the deploy record back to the media library
 *      ↓
 *   return {deployUrl, qrPngUrl, qrSvg, usdzFallbackUrl?, signageGuide}
 *
 * # The iOS fallback
 *
 * Mobile Safari (as of 2026) does not support WebXR AR. To give iOS
 * visitors an AR experience the deploy bundle includes an optional
 * USDZ pointer. Two ways to provide it:
 *
 *   1. **Pre-generated** — splat360's postprocess stage emits .usdz
 *      alongside .spz/.ksplat via SuGaR (splat → mesh → USDZ). Wire
 *      the URL into the deploy input.
 *   2. **Snapshot card** — a flat textured plane that shows a single
 *      rendered view of the splat at scale. Not a true AR splat, but
 *      survives iOS AR Quick Look. Handled by `viz.usdz-export`.
 *
 * When neither is provided, iOS users get the 3D orbit viewer fallback
 * (no AR overlay).
 *
 * # Posture
 *
 * Foundation phase: type surface + stub router. Server implementation
 * in `splat-ar-deploy.server.ts` lands when the first sign goes up.
 */

import type { SplatLicence } from "./splat-generate";
import type { Splat360Record } from "./splat-generate-360";

export type SplatArDeployInput = {
  /** The record to deploy. Either a 360-camera splat or a generic splat. */
  record: Pick<Splat360Record, "id" | "plyUrl" | "gaussianCount" | "licence"> & {
    /** Optional: the .spz URL if postprocess emitted one. Preferred for mobile delivery. */
    spzUrl?: string;
    /** Optional: the .ksplat URL if postprocess emitted one. Three.js-native. */
    ksplatUrl?: string;
    /** Optional: pre-generated USDZ URL for iOS AR Quick Look. */
    usdzUrl?: string;
  };

  /** The public page URL the QR encodes. The page is responsible for
   *  loading the right asset (spz preferred, ksplat fallback) and
   *  handing iOS users the USDZ. */
  deployUrl: string;

  /** Optional: caller-supplied UTM params. Defaults set by the server. */
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };

  /** Optional: target printed QR side in cm. Affects the signage guide. */
  qrSizeCm?: number;

  /** Optional: caller-supplied id for the deploy record; defaults to a sha. */
  deployId?: string;
};

export type SplatArDeployResult = {
  id: string;
  /** The public URL the QR encodes. */
  deployUrl: string;
  /** Public URL of the rendered QR PNG (Vercel Blob / R2). */
  qrPngUrl: string;
  /** Inline SVG of the QR — for printing pipelines that want vector. */
  qrSvg: string;
  /** Public URL of the iOS USDZ fallback, if available. `null` when not. */
  usdzFallbackUrl: string | null;
  /** Splat-format hint the deploy page should prefer. */
  preferredFormat: "spz" | "ksplat" | "ply";
  /** Licence carried through from the splat record. */
  licence: SplatLicence;
  /** Printable signage guidance derived from `qrSizeCm`. */
  signageGuide: {
    qrSideCm: number;
    /** Scan distance the QR is reliably readable at. */
    maxScanDistanceM: number;
    /** Minimum print DPI we recommend for the printed file. */
    minPrintDpi: number;
  };
  /** ISO-8601 timestamp the deploy was emitted. */
  emittedAt: string;
};

export type SplatArDeployError = {
  code:
    | "record-unavailable"
    | "licence-conflict"
    | "deploy-url-invalid"
    | "qr-generation-failed"
    | "blob-write-failed";
  message: string;
};

/**
 * Public capability. Foundation-phase stub.
 *
 * Server implementation will:
 *   1. Validate the licence — `research-only` records cannot deploy.
 *   2. Validate the deployUrl is HTTPS (WebXR requires secure context).
 *   3. Generate the QR via `lib/qr` with UTM params merged in.
 *   4. Upload QR PNG to blob storage.
 *   5. Derive the signage guide from `qrSizeCm`.
 *   6. Write a `SplatArDeployRecord` via the media library.
 *   7. Return the assembled `SplatArDeployResult`.
 */
export async function splatArDeploy(
  _input: SplatArDeployInput,
): Promise<SplatArDeployResult> {
  const detail: SplatArDeployError = {
    code: "deploy-url-invalid",
    message:
      "viz.splat-ar-deploy: server router not wired yet — call splatArDeployServer from a server context",
  };
  throw Object.assign(new Error(detail.message), detail);
}

/**
 * Commerce eligibility — research-only splats cannot be deployed as
 * public AR experiences. Mirror `isSplatCommerceEligible` from
 * `splat-generate` so the deploy capability has its own predicate.
 */
export function isDeployEligible(
  record: Pick<SplatArDeployInput["record"], "licence">,
): boolean {
  return record.licence !== "research-only";
}

/**
 * Pick the best splat format for the deploy page to serve. Mobile
 * gets .spz when present (10× smaller); desktop / older clients fall
 * back to .ksplat then .ply.
 */
export function preferredSplatFormat(
  record: Pick<SplatArDeployInput["record"], "spzUrl" | "ksplatUrl">,
): "spz" | "ksplat" | "ply" {
  if (record.spzUrl) return "spz";
  if (record.ksplatUrl) return "ksplat";
  return "ply";
}
