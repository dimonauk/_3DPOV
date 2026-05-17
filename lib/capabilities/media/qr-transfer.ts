/**
 * lib/capabilities/media/qr-transfer.ts — Capability `media.qr-transfer`:
 * round-trip a text payload through a QR-friendly compressed URL.
 *
 * One-line role: encode a shader / config / asset blob into a single
 * shareable URL (or chunked sequence) so a desktop chamber can hand
 * off state to a phone (or vice versa) via the camera.
 *
 * Full purpose in qr-transfer.PURPOSE.md.
 *
 * # The shape
 *
 * Encode: text → LZ-compressed-URI-component → `?shader=<...>` query
 * appended to the current origin. The QR renderer (qr-code-styling)
 * displays the resulting URL; the scanner (qr-scanner) reads any URL
 * and we extract + decompress the param.
 *
 * # Why URL-wrap rather than raw compressed text
 *
 * URL-wrapped payloads survive QR scanners that auto-open URLs, work
 * via plain link share, and degrade to "tap to import" UX when the
 * recipient already has the chamber open. Raw compressed text only
 * works if the receiving app knows it's a payload — too brittle.
 *
 * Atomised from D:/.github/Shadrerapp/src/apps/ShaderEditor/components/
 * QRTransfer.tsx (Apache-2.0) per docs/SHADRERAPP_MIGRATION.md. The
 * React panel chrome lives in the consuming chamber; this file holds
 * only the payload codec.
 */

import LZString from "lz-string";

/** Query parameter name used by the studio's QR-transfer convention. */
export const QR_TRANSFER_PARAM = "shader" as const;

export type EncodeOptions = {
  /** Override the param name (default: QR_TRANSFER_PARAM). */
  param?: string;
  /** Override the base URL (default: current `window.location.href`). */
  baseUrl?: string;
};

export type DecodeResult = {
  /** The decompressed payload text, or null when no payload was present. */
  payload: string | null;
  /** True when input was a URL with our param; false when raw text. */
  fromUrl: boolean;
};

const looksLikeGlsl = (text: string): boolean =>
  text.includes("void main") || text.includes("vec3 render");

/**
 * Pack `text` into a URL the scanner can ferry to another device.
 * Returns the full URL string.
 */
export function encodeForTransfer(text: string, options: EncodeOptions = {}): string {
  if (typeof window === "undefined" && !options.baseUrl) {
    throw new Error(
      "media.qr-transfer: encodeForTransfer requires a baseUrl outside browser context",
    );
  }
  const param = options.param ?? QR_TRANSFER_PARAM;
  const compressed = LZString.compressToEncodedURIComponent(text);
  const url = new URL(options.baseUrl ?? window.location.href);
  url.searchParams.set(param, compressed);
  return url.toString();
}

/**
 * Parse a scan result (URL or raw text) into the original payload, or
 * null when the scan doesn't carry a known shape.
 *
 * Accepts three input forms:
 *   1. URL with `?shader=<lz-compressed>` — primary path.
 *   2. Raw lz-compressed text — best-effort decompress.
 *   3. Raw GLSL source — accepted unchanged when it looks like a shader
 *      (contains `void main` or `vec3 render`).
 */
export function parsePayload(scanned: string, options: { param?: string } = {}): DecodeResult {
  const param = options.param ?? QR_TRANSFER_PARAM;

  try {
    const url = new URL(scanned);
    const compressed = url.searchParams.get(param);
    if (compressed) {
      const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
      if (decompressed) return { payload: decompressed, fromUrl: true };
    }
  } catch {
    /* not a URL — fall through */
  }

  const directDecompress = LZString.decompressFromEncodedURIComponent(scanned);
  if (directDecompress) return { payload: directDecompress, fromUrl: false };

  if (looksLikeGlsl(scanned)) return { payload: scanned, fromUrl: false };

  return { payload: null, fromUrl: false };
}

/**
 * Read a payload from the current page URL (when the user opened a
 * shared link). Returns null when no payload is present.
 */
export function readPayloadFromCurrentUrl(options: { param?: string } = {}): string | null {
  if (typeof window === "undefined") return null;
  const param = options.param ?? QR_TRANSFER_PARAM;
  const compressed = new URLSearchParams(window.location.search).get(param);
  if (!compressed) return null;
  return LZString.decompressFromEncodedURIComponent(compressed) || null;
}

/**
 * Strip the QR-transfer param from the address bar — call after
 * successfully importing a payload so reloads don't re-import.
 */
export function clearPayloadFromUrl(options: { param?: string } = {}): void {
  if (typeof window === "undefined") return;
  const param = options.param ?? QR_TRANSFER_PARAM;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(param)) return;
  url.searchParams.delete(param);
  window.history.replaceState({}, "", url.toString());
}
