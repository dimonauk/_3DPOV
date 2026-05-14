/**
 * lib/sanity/to-media.ts — Sanity document → canonical Media lifters.
 *
 * One-line role: convert a Sanity document into the canonical `Media`
 * shape so Sanity-sourced records can sit alongside Vercel-Blob and
 * Google-Photos-sourced records in the same listing API.
 *
 * # Posture
 * Pure functions, no IO. The caller passes already-fetched Sanity
 * documents; this module decides how each maps to a `Media`. When
 * required fields are missing (e.g. no image URL), the lifter returns
 * `null` rather than fabricating a record.
 */

import type {
  Media,
  MediaKind,
  MediaSubject,
} from "../capabilities/media/library-types";

import type {
  SanityArticleImage,
  SanityCodexImage,
  SanityPano,
  SanityPhoto,
  SanityVideo,
} from "./fetch";

const VALID_SUBJECTS: ReadonlySet<MediaSubject> = new Set([
  "photograph",
  "aerial",
  "holo-walk",
  "codex",
  "article",
  "journal",
  "tutorial",
  "product",
  "rookery",
  "press",
  "other",
]);

function normaliseSubject(raw: string | null | undefined): MediaSubject {
  if (raw && VALID_SUBJECTS.has(raw as MediaSubject)) {
    return raw as MediaSubject;
  }
  return "other";
}

function normalisePhotoKind(
  raw: string | null | undefined,
): "photo" | "photo-single-exposure" {
  return raw === "photo-single-exposure" ? "photo-single-exposure" : "photo";
}

/** Lift a Sanity photo document into a Media record. */
export function photoToMedia(doc: SanityPhoto): Media | null {
  if (!doc.imageUrl) return null;
  const kind: MediaKind = normalisePhotoKind(doc.kind);
  const media: Media = {
    id: doc.slug ?? doc._id,
    kind,
    subject: normaliseSubject(doc.subject),
    source: "sanity",
    url: doc.imageUrl,
    uploadedAt: doc._createdAt,
    uploadedBy: "sanity",
    mimeType: doc.imageMime ?? "image/jpeg",
    variants: { original: doc.imageUrl },
    sourceRef: { sanity: { documentId: doc._id } },
  };
  if (doc.title) media.title = doc.title;
  if (doc.description) media.description = doc.description;
  if (doc.capturedAt) media.capturedAt = doc.capturedAt;
  if (doc.imageWidth != null) media.width = doc.imageWidth;
  if (doc.imageHeight != null) media.height = doc.imageHeight;
  if (doc.imageSize != null) media.sizeBytes = doc.imageSize;
  if (doc.imageHash) media.sha256 = doc.imageHash;
  if (doc.tags && doc.tags.length > 0) media.tags = doc.tags;
  if (doc.location) {
    const loc: NonNullable<Media["location"]> = {};
    if (doc.location.slug != null) loc.slug = doc.location.slug;
    if (doc.location.name != null) loc.name = doc.location.name;
    if (doc.location.lat != null) loc.lat = doc.location.lat;
    if (doc.location.lng != null) loc.lng = doc.location.lng;
    if (Object.keys(loc).length > 0) media.location = loc;
  }
  if (doc.retired) media.retired = true;
  return media;
}

/** Lift a Sanity video document into a Media record. */
export function videoToMedia(doc: SanityVideo): Media | null {
  if (!doc.fileUrl) return null;
  const media: Media = {
    id: doc.slug ?? doc._id,
    kind: "video",
    subject: normaliseSubject(doc.subject),
    source: "sanity",
    url: doc.fileUrl,
    uploadedAt: doc._createdAt,
    uploadedBy: "sanity",
    mimeType: doc.fileMime ?? "video/mp4",
    variants: { original: doc.fileUrl },
    sourceRef: { sanity: { documentId: doc._id } },
  };
  if (doc.title) media.title = doc.title;
  if (doc.description) media.description = doc.description;
  if (doc.capturedAt) media.capturedAt = doc.capturedAt;
  if (doc.durationSeconds != null) media.durationSeconds = doc.durationSeconds;
  if (doc.fileSize != null) media.sizeBytes = doc.fileSize;
  if (doc.tags && doc.tags.length > 0) media.tags = doc.tags;
  if (doc.posterUrl) media.variants = { original: doc.fileUrl, large: doc.posterUrl };
  if (doc.location) {
    const loc: NonNullable<Media["location"]> = {};
    if (doc.location.slug != null) loc.slug = doc.location.slug;
    if (doc.location.name != null) loc.name = doc.location.name;
    if (doc.location.lat != null) loc.lat = doc.location.lat;
    if (doc.location.lng != null) loc.lng = doc.location.lng;
    if (Object.keys(loc).length > 0) media.location = loc;
  }
  if (doc.retired) media.retired = true;
  return media;
}

/** Lift a Sanity 360 panorama document into a Media record. */
export function panoToMedia(doc: SanityPano): Media | null {
  if (!doc.imageUrl) return null;
  const media: Media = {
    id: doc.slug ?? doc._id,
    kind: "360-photo",
    subject: normaliseSubject(doc.subject),
    source: "sanity",
    url: doc.imageUrl,
    uploadedAt: doc._createdAt,
    uploadedBy: "sanity",
    mimeType: doc.imageMime ?? "image/jpeg",
    variants: { original: doc.imageUrl },
    sourceRef: { sanity: { documentId: doc._id } },
  };
  if (doc.title) media.title = doc.title;
  if (doc.description) media.description = doc.description;
  if (doc.capturedAt) media.capturedAt = doc.capturedAt;
  if (doc.imageWidth != null) media.width = doc.imageWidth;
  if (doc.imageHeight != null) media.height = doc.imageHeight;
  if (doc.imageSize != null) media.sizeBytes = doc.imageSize;
  if (doc.tags && doc.tags.length > 0) media.tags = doc.tags;
  if (doc.location) {
    const loc: NonNullable<Media["location"]> = {};
    if (doc.location.slug != null) loc.slug = doc.location.slug;
    if (doc.location.name != null) loc.name = doc.location.name;
    if (doc.location.lat != null) loc.lat = doc.location.lat;
    if (doc.location.lng != null) loc.lng = doc.location.lng;
    if (Object.keys(loc).length > 0) media.location = loc;
  }
  if (doc.retired) media.retired = true;
  return media;
}

/** Lift a Sanity article image into a Media record (subject: "article"). */
export function articleImageToMedia(doc: SanityArticleImage): Media | null {
  if (!doc.imageUrl) return null;
  const media: Media = {
    id: doc._id,
    kind: "photo",
    subject: "article",
    source: "sanity",
    url: doc.imageUrl,
    uploadedAt: new Date(0).toISOString(),
    uploadedBy: "sanity",
    mimeType: "image/jpeg",
    variants: { original: doc.imageUrl },
    sourceRef: { sanity: { documentId: doc._id } },
  };
  if (doc.alt) media.title = doc.alt;
  if (doc.caption) media.description = doc.caption;
  if (doc.imageWidth != null) media.width = doc.imageWidth;
  if (doc.imageHeight != null) media.height = doc.imageHeight;
  if (doc.articleSlug) media.tags = [`article:${doc.articleSlug}`];
  return media;
}

/** Lift a Sanity codex image into a Media record (subject: "codex"). */
export function codexImageToMedia(doc: SanityCodexImage): Media | null {
  if (!doc.imageUrl) return null;
  const media: Media = {
    id: doc._id,
    kind: "photo",
    subject: "codex",
    source: "sanity",
    url: doc.imageUrl,
    uploadedAt: new Date(0).toISOString(),
    uploadedBy: "sanity",
    mimeType: "image/jpeg",
    variants: { original: doc.imageUrl },
    sourceRef: { sanity: { documentId: doc._id } },
  };
  if (doc.alt) media.title = doc.alt;
  if (doc.caption) media.description = doc.caption;
  if (doc.imageWidth != null) media.width = doc.imageWidth;
  if (doc.imageHeight != null) media.height = doc.imageHeight;
  if (doc.codexSlug) media.tags = [`codex:${doc.codexSlug}`];
  return media;
}
