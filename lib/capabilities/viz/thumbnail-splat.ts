/**
 * lib/capabilities/viz/thumbnail-splat.ts — Capability
 * `viz.thumbnail-splat`: render a server-side thumbnail for a generated
 * Gaussian Splat record via a pluggable provider.
 *
 * One-line role: surface-agnostic splat preview. The media library, the
 * HoloWalk index, and link previews (OpenGraph / Twitter cards) all want
 * a 2D image for a splat record; this capability is the seam where the
 * call-site picks the rendering strategy and the output lands in a
 * uniform record.
 *
 * Full purpose in thumbnail-splat.PURPOSE.md.
 *
 * # Providers
 * - "card-fast" — chrome-on-midnight poster card with the sculpture
 *   name, subtitle, and gaussian count. Pure 2D canvas via
 *   `@napi-rs/canvas`. Sub-second. Renderable on Vercel. The default
 *   for placeholders and link previews.
 * - "splat-real" — real WebGL splat screenshot taken in a headless
 *   browser. Heavy; runs on HoloFlow Desktop (`localhost:8390`), never
 *   on Vercel. The canonical thumbnail once the desktop helper is up.
 *
 * # Why a single capability with two providers
 * Surface code only ever asks for "a thumbnail of this splat." The
 * card-fast path always succeeds — instant placeholder for the
 * shelf-display surfaces. Surfaces that can wait for canonical quality
 * pick `splat-real` and absorb the latency. The provider union keeps
 * the type system honest as the desktop helper lands and the rendering
 * strategy stabilises.
 *
 * # Posture
 * Foundation phase: this file defines the type surface and provider
 * router stub. The card-fast path is wired in
 * `thumbnail-splat.server.ts`; the splat-real path documents the
 * expected HoloFlow Desktop endpoint and throws `provider-unavailable`
 * until the desktop side ships.
 */

import type { Splat360Record } from "./splat-generate-360";

export type ThumbnailProvider = "card-fast" | "splat-real";

export type ThumbnailSplatInput = {
  provider: ThumbnailProvider;
  /**
   * The splat record to draw a thumbnail for. Both `Splat360Record` and
   * the generic `SplatRecord` are accepted via the `Pick<>` shape —
   * everything the renderer needs lives in those three fields, plus
   * the optional `.spz` / `.ksplat` URLs the splat-real provider feeds
   * to the headless browser for faster loading.
   */
  record: Pick<Splat360Record, "id" | "plyUrl" | "gaussianCount"> & {
    spzUrl?: string;
    ksplatUrl?: string;
  };
  /** Sculpture name printed across the card. Default: a fallback derived from `record.id`. */
  label?: string;
  /** Optional subtitle (city / date / engine) printed under the label. */
  subtitle?: string;
  /** Output pixel dimensions. Default 1200×630 (Twitter / OpenGraph card). */
  size?: { w: number; h: number };
  /** Camera framing — splat-real only; ignored by card-fast. */
  view?: { yaw: number; pitch: number; fov: number };
};

export type ThumbnailSplatResult = {
  id: string;
  provider: ThumbnailProvider;
  /** Public URL of the rendered PNG (Vercel Blob). */
  url: string;
  /** Size of the PNG on disk. */
  bytes: number;
  width: number;
  height: number;
  /** ISO-8601 timestamp of when the thumbnail was emitted. */
  generatedAt: string;
};

export type ThumbnailSplatError = {
  code:
    | "provider-unavailable"
    | "splat-not-loadable"
    | "render-failed"
    | "blob-write-failed";
  message: string;
};

/**
 * Public capability. Foundation-phase stub: the router exists in
 * `thumbnail-splat.server.ts`; this client-facing stub throws to keep
 * callers honest about importing the server module when they need to
 * render.
 *
 * Once both providers are live, this function:
 *   1. Validates the provider matches a runtime that's actually reachable
 *      (card-fast → Node always; splat-real → HoloFlow Desktop only).
 *   2. Dispatches to the provider implementation.
 *   3. Uploads the PNG via the media library and returns the record.
 */
export async function thumbnailSplat(
  _input: ThumbnailSplatInput,
): Promise<ThumbnailSplatResult> {
  const detail: ThumbnailSplatError = {
    code: "provider-unavailable",
    message:
      "viz.thumbnail-splat: call thumbnailSplatServer from a server context — the client-facing stub does not render",
  };
  throw Object.assign(new Error(detail.message), detail);
}

/** Default thumbnail size — matches Twitter / OpenGraph card spec. */
export const DEFAULT_THUMBNAIL_SIZE: Readonly<{ w: number; h: number }> = {
  w: 1200,
  h: 630,
};
