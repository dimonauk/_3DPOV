/**
 * lib/sanity/fetch.ts — Cached Sanity readers.
 *
 * One-line role: the typed read surface the rest of the site uses to
 * pull content out of Sanity. Each function wraps `client.fetch` in
 * Next's `unstable_cache` with a per-query tag so the revalidation
 * webhook (`app/api/sanity/revalidate`) can target a precise slice
 * rather than blow the whole cache.
 *
 * # Posture
 * Lazy + tolerant. When Sanity isn't configured, every function returns
 * an empty result (`[]` or `null`); call sites in public routes can
 * fall back to other sources (static registries, Vercel Blob via
 * `mediaList`, etc.) without special-casing.
 */

import "server-only";

import { unstable_cache } from "next/cache";

import { getSanityClient } from "./client";
import {
  Q_ALL_PANOS,
  Q_ALL_PHOTOS,
  Q_ALL_VIDEOS,
  Q_CODEX_IMAGES_BY_SLUG,
  Q_INLINE_IMAGES_BY_ARTICLE_SLUG,
  Q_PHOTO_BY_SLUG,
} from "./queries";

export const SANITY_TAGS = {
  photos: "sanity-photos",
  videos: "sanity-videos",
  panos: "sanity-panos",
  articleImages: "sanity-article-images",
  codexImages: "sanity-codex-images",
} as const;

export type SanityPhoto = {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  title: string | null;
  slug: string | null;
  kind: "photo" | "photo-single-exposure" | null;
  subject: string | null;
  capturedAt: string | null;
  description: string | null;
  tags: string[] | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageMime: string | null;
  imageSize: number | null;
  imageHash: string | null;
  location: {
    slug?: string | null;
    name?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  credit: string | null;
  retired: boolean | null;
};

export type SanityVideo = {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  title: string | null;
  slug: string | null;
  subject: string | null;
  capturedAt: string | null;
  description: string | null;
  tags: string[] | null;
  fileUrl: string | null;
  fileMime: string | null;
  fileSize: number | null;
  posterUrl: string | null;
  durationSeconds: number | null;
  location: {
    slug?: string | null;
    name?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  retired: boolean | null;
};

export type SanityPano = {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  title: string | null;
  slug: string | null;
  subject: string | null;
  capturedAt: string | null;
  description: string | null;
  tags: string[] | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageMime: string | null;
  imageSize: number | null;
  heading: number | null;
  pitch: number | null;
  location: {
    slug?: string | null;
    name?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  retired: boolean | null;
};

export type SanityArticleImage = {
  _id: string;
  articleSlug: string | null;
  caption: string | null;
  alt: string | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  order: number | null;
};

export type SanityCodexImage = {
  _id: string;
  codexSlug: string | null;
  caption: string | null;
  alt: string | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  sources: { label: string; url: string }[] | null;
  order: number | null;
};

/** Cache settings — long revalidate window; webhook drives invalidation. */
const CACHE_REVALIDATE_SECONDS = 60 * 60; // 1 hour fallback

async function safeFetch<T>(
  query: string,
  params: Record<string, unknown>,
  fallback: T,
): Promise<T> {
  const client = getSanityClient();
  if (!client) return fallback;
  try {
    return (await client.fetch<T>(query, params)) ?? fallback;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[sanity] fetch failed:", err);
    return fallback;
  }
}

export const getAllPhotos = unstable_cache(
  async (): Promise<SanityPhoto[]> =>
    safeFetch<SanityPhoto[]>(Q_ALL_PHOTOS, {}, []),
  ["sanity:getAllPhotos"],
  { tags: [SANITY_TAGS.photos], revalidate: CACHE_REVALIDATE_SECONDS },
);

export const getPhotoBySlug = unstable_cache(
  async (slug: string): Promise<SanityPhoto | null> =>
    safeFetch<SanityPhoto | null>(Q_PHOTO_BY_SLUG, { slug }, null),
  ["sanity:getPhotoBySlug"],
  { tags: [SANITY_TAGS.photos], revalidate: CACHE_REVALIDATE_SECONDS },
);

export const getAllVideos = unstable_cache(
  async (): Promise<SanityVideo[]> =>
    safeFetch<SanityVideo[]>(Q_ALL_VIDEOS, {}, []),
  ["sanity:getAllVideos"],
  { tags: [SANITY_TAGS.videos], revalidate: CACHE_REVALIDATE_SECONDS },
);

export const getAllPanos = unstable_cache(
  async (): Promise<SanityPano[]> =>
    safeFetch<SanityPano[]>(Q_ALL_PANOS, {}, []),
  ["sanity:getAllPanos"],
  { tags: [SANITY_TAGS.panos], revalidate: CACHE_REVALIDATE_SECONDS },
);

export const getInlineImagesByArticleSlug = unstable_cache(
  async (slug: string): Promise<SanityArticleImage[]> =>
    safeFetch<SanityArticleImage[]>(
      Q_INLINE_IMAGES_BY_ARTICLE_SLUG,
      { slug },
      [],
    ),
  ["sanity:getInlineImagesByArticleSlug"],
  { tags: [SANITY_TAGS.articleImages], revalidate: CACHE_REVALIDATE_SECONDS },
);

export const getCodexImagesBySlug = unstable_cache(
  async (slug: string): Promise<SanityCodexImage[]> =>
    safeFetch<SanityCodexImage[]>(Q_CODEX_IMAGES_BY_SLUG, { slug }, []),
  ["sanity:getCodexImagesBySlug"],
  { tags: [SANITY_TAGS.codexImages], revalidate: CACHE_REVALIDATE_SECONDS },
);

/** Map a Sanity document `_type` to the matching cache tag. The webhook
 *  uses this to invalidate the right slice when a document is published. */
export function tagForType(type: string | undefined | null): string | null {
  switch (type) {
    case "photo":
      return SANITY_TAGS.photos;
    case "video":
      return SANITY_TAGS.videos;
    case "pano360":
      return SANITY_TAGS.panos;
    case "articleImage":
      return SANITY_TAGS.articleImages;
    case "codexImage":
      return SANITY_TAGS.codexImages;
    default:
      return null;
  }
}
