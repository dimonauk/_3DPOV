/**
 * lib/qr.ts — QR code generation utility.
 *
 * Thin wrapper over the `qrcode` npm package (Apache-2.0). Public,
 * isomorphic surface: PNG bytes, SVG string, or data URL. Used by
 * `viz.splat-ar-deploy`, the HoloWalk per-sculpture QR route, and
 * any future surface that needs a QR encoded with a URL.
 *
 * # Format choice
 *
 * - **PNG**: best for printed signage at a known DPI. Use `toPngBuffer`
 *   when emitting from a Next.js route handler, `toPngDataUrl` when
 *   embedding in a React component.
 * - **SVG**: vector, infinitely scalable. Best for in-browser display
 *   and print-vendor handoffs (Illustrator / InDesign).
 * - **Data URL**: easiest for `<img src=...>` in client code.
 *
 * # Sizing guidance (printed signage)
 *
 * The scan-distance rule of thumb: usable scan distance ≈ QR side × 10.
 * For a sculpture trail where visitors scan from arm's length (~0.5m),
 * a 5cm QR works. From a metre away, 10cm. From 3m on a wall plaque,
 * 30cm.
 *
 * `recommendedQrSizeCm(scanDistanceM)` returns the side-length you
 * should print at to make the scan reliable.
 *
 * # Error correction
 *
 * Level L = 7% damage tolerance. M = 15%. Q = 25%. H = 30%.
 *
 * Outdoor signage that may get scuffed or partially obscured wants
 * H. Logo overlay (covers up to ~30% of the code) requires H.
 * Indoor pristine signage with no logo: M is plenty.
 */

import QRCode from "qrcode";

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

export type QrOptions = {
  /** Error correction level. Default "M". Use "H" for outdoor / logo overlay. */
  errorCorrection?: QrErrorCorrection;
  /** Pixel size of the output PNG (square). Default 1024 — fine for ~A5 print. */
  pngSize?: number;
  /** Border ("quiet zone") width in modules. Default 4 (spec minimum). */
  margin?: number;
  /** Foreground colour as hex. Default "#000000". */
  dark?: string;
  /** Background colour as hex. Default "#ffffff". */
  light?: string;
};

const DEFAULTS: Required<QrOptions> = {
  errorCorrection: "M",
  pngSize: 1024,
  margin: 4,
  dark: "#000000",
  light: "#ffffff",
};

function withDefaults(options: QrOptions = {}): Required<QrOptions> {
  return { ...DEFAULTS, ...options };
}

function libOptions(o: Required<QrOptions>) {
  return {
    errorCorrectionLevel: o.errorCorrection,
    margin: o.margin,
    color: { dark: o.dark, light: o.light },
  };
}

/**
 * Encode `text` as a QR code and return a PNG byte buffer.
 *
 * Works in any environment that supports `Buffer` (Node.js / Next.js
 * route handlers, edge functions when polyfilled). For browser-side
 * use, prefer `toPngDataUrl`.
 */
export async function toPngBuffer(
  text: string,
  options: QrOptions = {},
): Promise<Buffer> {
  const o = withDefaults(options);
  return QRCode.toBuffer(text, {
    ...libOptions(o),
    type: "png",
    width: o.pngSize,
  });
}

/**
 * Encode `text` as a QR code and return an inline SVG string.
 *
 * The string is the full `<svg>` element (no leading XML declaration).
 * Drop into JSX with `dangerouslySetInnerHTML` or hand to a print
 * pipeline. Self-contained — no external resources referenced.
 */
export async function toSvgString(
  text: string,
  options: QrOptions = {},
): Promise<string> {
  const o = withDefaults(options);
  return QRCode.toString(text, {
    ...libOptions(o),
    type: "svg",
  });
}

/**
 * Encode `text` as a QR code and return a `data:image/png;base64,...`
 * URL. Convenient for `<img src={...}>` and copy-paste sharing.
 */
export async function toPngDataUrl(
  text: string,
  options: QrOptions = {},
): Promise<string> {
  const o = withDefaults(options);
  return QRCode.toDataURL(text, {
    ...libOptions(o),
    type: "image/png",
    width: o.pngSize,
  });
}

/**
 * Side-length recommendation in centimetres for a given scan distance.
 *
 * Empirical rule (Apple, Denso, plus a margin for camera-angle variance):
 *
 *     usable distance ≈ side × 10
 *
 * Inverted: `side ≈ distance / 10` plus a 15% safety margin. Clamped
 * to a 3cm minimum (smaller QRs become brittle on mobile cameras).
 */
export function recommendedQrSizeCm(scanDistanceM: number): number {
  const baseCm = (scanDistanceM * 100) / 10;
  const withMargin = baseCm * 1.15;
  return Math.max(3, Math.round(withMargin * 10) / 10);
}

/**
 * Inverse of `recommendedQrSizeCm`: given a printed QR side, the
 * maximum reliable scan distance. Useful for telling the operator
 * "this 10cm sign is good for visitors standing within 1m".
 */
export function maxScanDistanceM(qrSideCm: number): number {
  return (qrSideCm / 100) * 10;
}

/**
 * Compose a deep-link URL with UTM analytics parameters baked in.
 * The `qrcode` library doesn't know or care about query strings; this
 * is a small helper so call-sites don't reinvent UTM building.
 */
export function withUtmParams(
  baseUrl: string,
  utm: {
    source: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  },
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", utm.source);
  if (utm.medium) url.searchParams.set("utm_medium", utm.medium);
  if (utm.campaign) url.searchParams.set("utm_campaign", utm.campaign);
  if (utm.content) url.searchParams.set("utm_content", utm.content);
  if (utm.term) url.searchParams.set("utm_term", utm.term);
  return url.toString();
}
