/**
 * lib/cloudinary.ts
 *
 * Cloudinary URL builder + Next.js image loader.
 *
 * Cloud name: dnfjocfit
 * All image src values in portfolioData.ts are Cloudinary public_ids.
 *
 * Usage:
 *   import { cloudinaryUrl, cloudinaryLoader } from "lib/cloudinary";
 *
 *   // Raw URL
 *   cloudinaryUrl("portfolio/light-painting-antispin-3petal-blue", { width: 800 })
 *   // → https://res.cloudinary.com/dnfjocfit/image/upload/w_800,f_auto,q_auto/portfolio/light-painting-antispin-3petal-blue
 *
 *   // Next.js <Image> loader — wire via next.config.ts or per-image
 *   <Image src="portfolio/light-painting-antispin-3petal-blue" loader={cloudinaryLoader} ... />
 */

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dnfjocfit";

const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

export type CloudinaryTransforms = {
  width?: number;
  height?: number;
  quality?: number | "auto";
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  crop?: "fill" | "fit" | "scale" | "crop" | "thumb" | "pad";
  gravity?: string;
  aspectRatio?: string;
  /** Pass raw transform strings e.g. "e_sharpen:80" */
  extras?: string[];
};

/** Build a Cloudinary delivery URL from a public_id + optional transforms. */
export function cloudinaryUrl(
  publicId: string,
  transforms: CloudinaryTransforms = {},
): string {
  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop,
    gravity,
    aspectRatio,
    extras = [],
  } = transforms;

  const parts: string[] = [];

  if (width)       parts.push(`w_${width}`);
  if (height)      parts.push(`h_${height}`);
  if (crop)        parts.push(`c_${crop}`);
  if (gravity)     parts.push(`g_${gravity}`);
  if (aspectRatio) parts.push(`ar_${aspectRatio}`);
  parts.push(`f_${format}`);
  parts.push(`q_${quality}`);
  parts.push(...extras);

  const transform = parts.join(",");
  return `${BASE}/${transform}/${publicId}`;
}

/**
 * Next.js custom image loader.
 * Wire it globally in next.config.ts (loaderFile) or per-<Image> via the
 * `loader` prop. The `src` prop should be a Cloudinary public_id.
 */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return cloudinaryUrl(src, {
    width,
    quality: quality ?? "auto",
    format: "auto",
    crop: "fill",
  });
}

/**
 * Shorthand for gallery thumbnails — 4:3 crop, fill, auto format/quality.
 * Used by the photographs and gallery pages.
 */
export function galleryThumb(publicId: string, width = 800): string {
  return cloudinaryUrl(publicId, {
    width,
    crop: "fill",
    aspectRatio: "4:3",
    gravity: "auto",
    format: "auto",
    quality: "auto",
  });
}

/**
 * Shorthand for full-bleed hero images — 16:9, auto gravity.
 */
export function heroImage(publicId: string, width = 1600): string {
  return cloudinaryUrl(publicId, {
    width,
    crop: "fill",
    aspectRatio: "16:9",
    gravity: "auto",
    format: "auto",
    quality: "auto",
  });
}

/**
 * Square crop for product / card thumbnails.
 */
export function squareThumb(publicId: string, width = 600): string {
  return cloudinaryUrl(publicId, {
    width,
    height: width,
    crop: "fill",
    gravity: "auto",
    format: "auto",
    quality: "auto",
  });
}
