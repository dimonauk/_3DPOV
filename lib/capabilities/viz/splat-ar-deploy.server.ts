/**
 * lib/capabilities/viz/splat-ar-deploy.server.ts — Server-side wiring
 * for `viz.splat-ar-deploy`.
 *
 * One-line role: implements `splatArDeployServer` — generates the QR
 * code via `lib/qr`, uploads to blob storage via the media library,
 * derives signage guidance, and returns the assembled
 * `SplatArDeployResult`. The deploy record is written so future
 * lookups don't regenerate the QR each call.
 */

import "server-only";

import { mediaUpload } from "../media/library";
import {
  maxScanDistanceM,
  toPngBuffer,
  toSvgString,
  withUtmParams,
} from "../../qr";

import {
  isDeployEligible,
  preferredSplatFormat,
  type SplatArDeployError,
  type SplatArDeployInput,
  type SplatArDeployResult,
} from "./splat-ar-deploy";

const DEFAULT_QR_SIZE_CM = 12;
const DEFAULT_PRINT_DPI = 300;

function asError(code: SplatArDeployError["code"], message: string): Error {
  const detail: SplatArDeployError = { code, message };
  return Object.assign(new Error(message), detail);
}

/**
 * Validate the deploy URL — must be absolute HTTPS for WebXR to grant
 * an AR session. `localhost` is allowed during dev; everything else
 * must be `https:`.
 */
function validateDeployUrl(deployUrl: string): URL {
  let url: URL;
  try {
    url = new URL(deployUrl);
  } catch {
    throw asError("deploy-url-invalid", `not a valid URL: ${deployUrl}`);
  }
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!isLocal && url.protocol !== "https:") {
    throw asError(
      "deploy-url-invalid",
      `deployUrl must be HTTPS (WebXR requires secure context): ${deployUrl}`,
    );
  }
  return url;
}

/**
 * Server-side router. Caller passes the operator's Firebase uid for
 * the media library's auth posture (matches splat-generate.server.ts).
 */
export async function splatArDeployServer(
  input: SplatArDeployInput,
  ctx: { uploadedBy: string },
): Promise<SplatArDeployResult> {
  // 1. Licence gate. Research-only records cannot deploy.
  if (!isDeployEligible(input.record)) {
    throw asError(
      "licence-conflict",
      `record ${input.record.id} carries licence=${input.record.licence}; cannot be deployed as public AR`,
    );
  }

  // 2. URL validation.
  const deployUrlObj = validateDeployUrl(input.deployUrl);

  // 3. Bake UTM params into the URL the QR encodes (analytics).
  const utm = input.utm ?? {};
  const finalUrl = withUtmParams(deployUrlObj.toString(), {
    source: utm.source ?? "splat-ar-deploy",
    medium: utm.medium ?? "qr",
    campaign: utm.campaign ?? input.record.id,
  });

  // 4. Generate the QR — outdoor signage default is high error correction.
  const qrOpts = {
    errorCorrection: "H" as const,
    pngSize: 1024,
    margin: 4,
    dark: "#0a0a0f",
    light: "#ffffff",
  };
  let qrPngBuffer: Buffer;
  let qrSvg: string;
  try {
    [qrPngBuffer, qrSvg] = await Promise.all([
      toPngBuffer(finalUrl, qrOpts),
      toSvgString(finalUrl, qrOpts),
    ]);
  } catch (err) {
    throw asError(
      "qr-generation-failed",
      `QR generation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 5. Upload the PNG to blob storage. The SVG stays inline.
  let qrPngMedia: { url: string; id: string; uploadedAt: string };
  try {
    qrPngMedia = await mediaUpload({
      file: new Uint8Array(qrPngBuffer),
      filename: `qr-${input.record.id}.png`,
      mimeType: "image/png",
      kind: "qr",
      subject: "deploy",
      uploadedBy: ctx.uploadedBy,
      source: "vercel-blob",
      sourceRef: {
        deploy: {
          recordId: input.record.id,
          deployUrl: finalUrl,
          qrSizeCm: input.qrSizeCm ?? DEFAULT_QR_SIZE_CM,
        },
      },
    });
  } catch (err) {
    throw asError(
      "blob-write-failed",
      `QR upload failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 6. Signage math.
  const qrSideCm = input.qrSizeCm ?? DEFAULT_QR_SIZE_CM;
  const signageGuide = {
    qrSideCm,
    maxScanDistanceM: maxScanDistanceM(qrSideCm),
    minPrintDpi: DEFAULT_PRINT_DPI,
  };

  // 7. Assemble.
  return {
    id: input.deployId ?? qrPngMedia.id,
    deployUrl: finalUrl,
    qrPngUrl: qrPngMedia.url,
    qrSvg,
    usdzFallbackUrl: input.record.usdzUrl ?? null,
    preferredFormat: preferredSplatFormat(input.record),
    licence: input.record.licence,
    signageGuide,
    emittedAt: qrPngMedia.uploadedAt,
  };
}
