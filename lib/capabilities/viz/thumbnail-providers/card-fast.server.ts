/**
 * lib/capabilities/viz/thumbnail-providers/card-fast.server.ts —
 * card-fast provider for viz.thumbnail-splat.
 *
 * Skia poster card via @napi-rs/canvas (chrome-on-midnight gradient,
 * pink accent stripe, label + subtitle, gaussian count badge). Pure
 * 2D — runs anywhere @napi-rs/canvas runs, including Vercel. Sub-second
 * per card.
 *
 * Default for placeholders and OpenGraph / Twitter link previews.
 */

import "server-only";

import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

import { mediaUpload } from "../../media/library";

import {
  DEFAULT_THUMBNAIL_SIZE,
  type ThumbnailSplatInput,
  type ThumbnailSplatResult,
} from "../thumbnail-splat";

import { asError, formatGaussianCount, log } from "./_helpers.server";

/** Draw the card-fast composition into a 2D context. Pure side-effect on
 *  the supplied context — separate from canvas creation + encoding so
 *  the unit cost is testable. */
function paintCardFast(
  ctx: SKRSContext2D,
  size: { w: number; h: number },
  label: string,
  subtitle: string | undefined,
  gaussianCount: number,
): void {
  const { w, h } = size;

  // 1. Diagonal midnight gradient backdrop.
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#0a0a0f");
  bg.addColorStop(1, "#1a1a2f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 2. Pink accent stripe along the left edge. The studio's signature
  //    chrome-pink-on-midnight; thin so the card stays editorial.
  ctx.fillStyle = "#f5b8c8";
  ctx.fillRect(0, 0, Math.max(6, Math.round(w * 0.005)), h);

  // 3. Sculpture label in a chunky sans-serif. Skia's bundled Deja Vu
  //    Sans resolves through the "sans-serif" stack; a registered brand
  //    font (e.g. via GlobalFonts.registerFromPath in app boot) would
  //    take over here without surgery.
  const labelSize = Math.round(h * 0.14);
  ctx.fillStyle = "#f3f3f7";
  ctx.font = `600 ${labelSize}px sans-serif`;
  ctx.textBaseline = "alphabetic";
  const labelY = Math.round(h * 0.5);
  const labelX = Math.round(w * 0.06);
  ctx.fillText(label, labelX, labelY);

  // 4. Subtitle in chrome-300, smaller.
  if (subtitle && subtitle.length > 0) {
    const subSize = Math.round(h * 0.05);
    ctx.fillStyle = "#b8b8c4";
    ctx.font = `400 ${subSize}px sans-serif`;
    ctx.fillText(subtitle, labelX, labelY + Math.round(subSize * 1.6));
  }

  // 5. Gaussian count, monospace, bottom-right.
  const countSize = Math.round(h * 0.035);
  const countText = formatGaussianCount(gaussianCount);
  ctx.fillStyle = "#b8b8c4";
  ctx.font = `400 ${countSize}px monospace`;
  ctx.textBaseline = "alphabetic";
  const metrics = ctx.measureText(countText);
  const countX = w - Math.round(metrics.width) - Math.round(w * 0.04);
  const countY = h - Math.round(h * 0.06);
  ctx.fillText(countText, countX, countY);
}

export async function renderCardFast(
  input: ThumbnailSplatInput,
  uploadedBy: string,
): Promise<ThumbnailSplatResult> {
  const size = input.size ?? DEFAULT_THUMBNAIL_SIZE;
  const label = input.label ?? `Splat ${input.record.id.slice(0, 8)}`;
  const canvas = createCanvas(size.w, size.h);
  const ctx = canvas.getContext("2d");

  log.debug("card-fast paint", { id: input.record.id, w: size.w, h: size.h });

  try {
    paintCardFast(ctx, size, label, input.subtitle, input.record.gaussianCount);
  } catch (err) {
    throw asError(
      "render-failed",
      `card-fast paint failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  let pngBuffer: Buffer;
  try {
    pngBuffer = await canvas.encode("png");
  } catch (err) {
    throw asError(
      "render-failed",
      `card-fast PNG encode failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  let media: { id: string; url: string; uploadedAt: string; sizeBytes?: number };
  try {
    media = await mediaUpload({
      file: new Uint8Array(pngBuffer),
      filename: `thumb-${input.record.id}-card.png`,
      mimeType: "image/png",
      kind: "photo",
      subject: "thumbnail",
      uploadedBy,
      source: "vercel-blob",
      sourceRef: {
        thumbnailSplat: {
          recordId: input.record.id,
          provider: "card-fast",
        },
      },
    });
  } catch (err) {
    throw asError(
      "blob-write-failed",
      `thumbnail upload failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  log.info("card-fast done", {
    id: media.id,
    recordId: input.record.id,
    bytes: pngBuffer.byteLength,
  });

  return {
    id: media.id,
    provider: "card-fast",
    url: media.url,
    bytes: media.sizeBytes ?? pngBuffer.byteLength,
    width: size.w,
    height: size.h,
    generatedAt: media.uploadedAt,
  };
}

/** Exported for tests: pure paint function with no media-library dependency. */
export const _paintCardFastForTests = paintCardFast;
