/**
 * lib/holo-walk/qr.ts — Per-sculpture QR generation.
 *
 * Thin wrapper over `lib/qr` that knows the HoloWalk URL shape and
 * the studio's UTM conventions. The deploy capability (`viz.splat-ar-deploy`)
 * uses this; the `/holo-walk/<id>/qr` route uses this; the printable
 * signage page uses this.
 *
 * # URL shape
 *
 * The QR target is the per-sculpture AR landing route at:
 *
 *   `https://holoflow.co.uk/holo-walk/<id>/ar?utm_source=holowalk-qr&utm_medium=signage&utm_campaign=<id>`
 *
 * UTM params let analytics distinguish QR scans from direct link
 * clicks vs trail-index navigation.
 *
 * # Error correction default
 *
 * Outdoor signage exposed to weather, sun-bleaching, scuff, and
 * possible logo overlay defaults to error-correction level `H`.
 * Override per-call if you know the signage is indoor + pristine.
 */

import type { SculptureLocation } from "./locations";
import {
  toPngBuffer,
  toPngDataUrl,
  toSvgString,
  withUtmParams,
  type QrOptions,
} from "../qr";

/** Studio canonical public origin. Override via env at deploy. */
export const HOLO_WALK_ORIGIN =
  process.env["NEXT_PUBLIC_HOLO_WALK_ORIGIN"] ?? "https://holoflow.co.uk";

/** Default outdoor signage options — high error correction. */
const SIGNAGE_DEFAULT: QrOptions = {
  errorCorrection: "H",
  pngSize: 1024,
  margin: 4,
  dark: "#0a0a0f",   // chrome-on-midnight: foreground = warm-black-950
  light: "#ffffff",
};

/** Build the deep-link URL a sculpture's QR encodes. */
export function sculptureArUrl(location: Pick<SculptureLocation, "id">): string {
  const base = `${HOLO_WALK_ORIGIN}/holo-walk/${location.id}/ar`;
  return withUtmParams(base, {
    source: "holowalk-qr",
    medium: "signage",
    campaign: location.id,
  });
}

/** Build the QR PNG buffer for a sculpture. Suitable for a Next.js route. */
export async function sculptureQrPng(
  location: Pick<SculptureLocation, "id">,
  options: QrOptions = {},
): Promise<Buffer> {
  return toPngBuffer(sculptureArUrl(location), { ...SIGNAGE_DEFAULT, ...options });
}

/** Build the QR SVG string for a sculpture. Suitable for inline JSX or print. */
export async function sculptureQrSvg(
  location: Pick<SculptureLocation, "id">,
  options: QrOptions = {},
): Promise<string> {
  return toSvgString(sculptureArUrl(location), { ...SIGNAGE_DEFAULT, ...options });
}

/** Build a data URL — convenient for `<img>` in client components. */
export async function sculptureQrDataUrl(
  location: Pick<SculptureLocation, "id">,
  options: QrOptions = {},
): Promise<string> {
  return toPngDataUrl(sculptureArUrl(location), { ...SIGNAGE_DEFAULT, ...options });
}
