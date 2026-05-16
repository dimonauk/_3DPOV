/**
 * lib/capabilities/image/print-check.server.ts — Buffer → verdict.
 *
 * Wraps `printCheck` (the pure verdict function) with a sharp call
 * that extracts the measurable properties: dimensions, format, bit
 * depth, colour space, embedded ICC, JPEG chroma subsampling, EXIF
 * orientation. The buffer is the only argument because callers can
 * come from either a File upload (Web API) or a fetched Drive blob.
 */

import "server-only";

import sharp from "sharp";

import {
  printCheck,
  type PrintCheckInput,
  type PrintCheckVerdict,
} from "./print-check";

/**
 * Detect a 360 equirectangular by sniffing the XMP buffer for Google's
 * `GPano:*` namespace + the `equirectangular` projection literal.
 * Falls back to a 2:1 aspect heuristic when XMP isn't present (some
 * older Insta360 firmware writes the EXIF tags but not the XMP block).
 */
function detectEquirectangular(
  xmp: Buffer | undefined,
  width: number,
  height: number,
): boolean {
  // XMP path — most 360 cameras (Osmo 360, Insta360, Theta, GoPro Max)
  // write Google's GPano namespace.
  if (xmp && xmp.length > 0) {
    const head = xmp.toString("utf8", 0, Math.min(xmp.length, 16384));
    if (
      head.includes("GPano:ProjectionType") ||
      (head.includes("ns.google.com/photos/1.0/panorama") &&
        head.includes("equirectangular"))
    ) {
      return true;
    }
  }
  // Heuristic fallback — 2:1 aspect with a large frame is almost
  // certainly equirectangular even without the XMP tag.
  if (width >= 4096 && Math.abs(width / height - 2) < 0.02) {
    return true;
  }
  return false;
}

function normaliseColorSpace(
  space: string | undefined,
): PrintCheckInput["colorSpace"] {
  if (!space) return "unknown";
  const s = space.toLowerCase();
  if (s.includes("srgb") || s === "rgb") return "srgb";
  if (s.includes("adobe")) return "adobe-rgb";
  if (s.includes("p3") || s.includes("display p3")) return "display-p3";
  if (s.includes("prophoto") || s.includes("rommrgb")) return "prophoto-rgb";
  if (s === "cmyk") return "cmyk";
  if (s === "lab" || s === "b-w") return s === "lab" ? "lab" : "unknown";
  return "unknown";
}

/**
 * Parse a JPEG/PNG/TIFF/etc. buffer and return a print verdict.
 * Throws if sharp can't decode the input (caller turns that into a 4xx).
 */
export async function printCheckFromBuffer(
  buf: Buffer,
): Promise<PrintCheckVerdict> {
  const img = sharp(buf, { failOn: "none" });
  const meta = await img.metadata();

  const input: PrintCheckInput = {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
  if (meta.format) input.format = meta.format;
  // sharp returns `depth` like "uchar" / "ushort"; `bitsPerSample` for TIFFs.
  // Prefer numeric `bitsPerSample`, else infer.
  if (typeof (meta as { bitsPerSample?: number }).bitsPerSample === "number") {
    input.bitDepth = (meta as { bitsPerSample?: number }).bitsPerSample;
  } else if (meta.depth === "ushort" || meta.depth === "short") {
    input.bitDepth = 16;
  } else if (meta.depth) {
    input.bitDepth = 8;
  }
  if (meta.space) input.colorSpace = normaliseColorSpace(meta.space);
  input.hasIccProfile = Boolean(meta.icc);
  if (meta.chromaSubsampling) input.chromaSubsampling = meta.chromaSubsampling;
  if (typeof meta.size === "number") input.fileSizeBytes = meta.size;
  if (typeof meta.orientation === "number") {
    input.exifOrientation = meta.orientation;
  }
  input.isEquirectangular = detectEquirectangular(
    meta.xmp,
    meta.width ?? 0,
    meta.height ?? 0,
  );

  return printCheck(input);
}
