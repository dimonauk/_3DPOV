/**
 * lib/capabilities/viz/splat-providers/luma-genie.server.ts —
 * luma-genie provider for viz.splat-generate.
 *
 * Pulls a previously-trained Luma capture by objectId, downloads its
 * Gaussian Splat PLY, persists via the studio's media library, and
 * returns a SplatRecord. Operator runs the capture on the Luma side
 * (mobile app or web upload); this provider just imports the result.
 *
 * # Luma API surface
 *
 * The Luma "Interactive Scenes" / "Genie" API is gated and the exact
 * endpoint paths have shifted over time. The provider defers to two
 * env vars so the deployment can point at whichever endpoint the
 * studio's current Luma plan exposes, without surface-code edits:
 *
 *   LUMA_API_URL    default: "https://api.lumalabs.ai"
 *   LUMA_API_KEY    required for any call
 *
 * Expected request shape (matches Luma's 2025-Q4 docs):
 *
 *   GET  {LUMA_API_URL}/v1/captures/{objectId}
 *     headers: Authorization: Bearer <key>
 *     returns: { status, downloads: { gaussianSplat?: string,
 *                                     mesh?: string,
 *                                     pointCloud?: string } }
 *
 *   The downloads.gaussianSplat URL is a time-limited signed URL
 *   pointing at the PLY (standard-3DGS flavour).
 *
 * If Luma changes the response shape or deprecates the splat download,
 * this provider returns `provider-unavailable` with a clear message
 * pointing operators at the Luma dashboard.
 *
 * # Licence
 *
 * `third-party-commercial`: licensable per Luma's commercial terms.
 * The studio's commerce surfaces filter on `licence !== "research-only"`
 * so Luma outputs reach commerce; the receipt of the operator's
 * Luma subscription is the actual legal trail.
 */

import "server-only";

import {
  asError,
  fetchAsset,
  log,
  persistSplat,
} from "./_helpers.server";

import type {
  SplatGenerateInput,
  SplatRecord,
} from "../splat-generate";

const API_URL = process.env["LUMA_API_URL"] ?? "https://api.lumalabs.ai";
const API_KEY = process.env["LUMA_API_KEY"] ?? "";

const SHAPE_LUMA_DEFAULT_GAUSSIANS = 500_000;

// Status query is a small JSON GET to Luma's public API. 30s is more
// than enough for any reasonable Luma response; a stalled request
// past that is "Luma down" not "still serializing JSON".
const LUMA_CAPTURE_FETCH_TIMEOUT_MS = 30 * 1_000;

type LumaCaptureResponse = {
  status?: "processing" | "ready" | "failed";
  downloads?: {
    gaussianSplat?: string;
    mesh?: string;
    pointCloud?: string;
  };
  error?: string;
};

async function fetchLumaCapture(objectId: string): Promise<LumaCaptureResponse> {
  if (!API_KEY) {
    throw asError(
      "provider-unavailable",
      `luma-genie: LUMA_API_KEY is not configured. Set it on the Vercel project (Production + Preview) and on the bench's .env.local for local-dev parity.`,
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/captures/${encodeURIComponent(objectId)}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(LUMA_CAPTURE_FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw asError(
        "provider-unavailable",
        `luma-genie: capture fetch hung (>${LUMA_CAPTURE_FETCH_TIMEOUT_MS / 1000}s)`,
      );
    }
    throw err;
  }
  if (res.status === 401 || res.status === 403) {
    throw asError(
      "provider-unavailable",
      `luma-genie: API rejected the key (${res.status}). Verify LUMA_API_KEY in the Vercel project env.`,
    );
  }
  if (res.status === 404) {
    throw asError(
      "source-invalid",
      `luma-genie: capture ${objectId} not found. Confirm the operator's Luma account owns it and the id is correct.`,
    );
  }
  if (!res.ok) {
    throw asError(
      "provider-unavailable",
      `luma-genie: capture fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  return (await res.json()) as LumaCaptureResponse;
}

export async function generateViaLumaGenie(
  input: SplatGenerateInput,
  uploadedBy: string,
): Promise<SplatRecord> {
  if (input.source.kind !== "luma-ref") {
    throw asError(
      "source-invalid",
      `luma-genie requires source.kind="luma-ref", got ${input.source.kind}`,
    );
  }
  const objectId = input.source.objectId;

  log.info("luma-genie start", { objectId });

  const capture = await fetchLumaCapture(objectId);

  if (capture.status === "processing") {
    throw asError(
      "generation-failed",
      `luma-genie: capture ${objectId} is still processing on Luma's side — try again in a moment.`,
    );
  }
  if (capture.status === "failed") {
    throw asError(
      "generation-failed",
      `luma-genie: capture ${objectId} failed on Luma's side: ${capture.error ?? "no detail"}`,
    );
  }

  const splatUrl = capture.downloads?.gaussianSplat;
  if (!splatUrl) {
    throw asError(
      "provider-unavailable",
      `luma-genie: capture ${objectId} has no gaussianSplat download. ` +
        `This usually means Luma's plan tier disables splat export for this capture; ` +
        `the operator can export from Luma's UI and re-upload via studio-rig-native instead.`,
    );
  }

  // Luma's signed URLs are time-limited; fetch immediately.
  const plyAsset = await fetchAsset(splatUrl);

  const record = await persistSplat({
    bytes: plyAsset.bytes,
    filename: `luma-${objectId}.ply`,
    uploadedBy,
    provider: "luma-genie",
    plyFlavour: "standard-3dgs",
    // Luma doesn't expose the gaussian count in their public API; the
    // viewer can read it from the PLY header at render time. Default
    // to a sensible non-zero value so commerce filters don't trip.
    gaussianCount: SHAPE_LUMA_DEFAULT_GAUSSIANS,
    sourceUrl: splatUrl,
    meta: { lumaObjectId: objectId },
    ...(input.recordId !== undefined && { recordId: input.recordId }),
  });

  log.info("luma-genie done", {
    id: record.id,
    objectId,
    plyBytes: record.plyBytes,
  });

  return record;
}
