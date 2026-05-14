/**
 * lib/sanity/queries.ts — GROQ query strings.
 *
 * One-line role: the named queries `fetch.ts` runs against Sanity. Pure
 * strings; no client coupling here so the same queries can be reused
 * from any Sanity-aware tool (e.g. the live preview surface, an export
 * script, the future Studio plugin).
 *
 * # Naming
 * One exported constant per query. The matching loader in `fetch.ts`
 * has the same root name (e.g. `Q_ALL_PHOTOS` → `getAllPhotos`).
 *
 * # Projection
 * Every query projects exactly the fields the reader needs. The output
 * shape feeds `to-media.ts`, which lifts a Sanity document into the
 * canonical `Media` record.
 */

/** All published, non-retired photographs, newest captured first. */
export const Q_ALL_PHOTOS = /* groq */ `
  *[_type == "photo" && !(_id in path("drafts.**")) && retired != true]
  | order(coalesce(capturedAt, _createdAt) desc) {
    _id,
    _createdAt,
    _updatedAt,
    title,
    "slug": slug.current,
    kind,
    subject,
    capturedAt,
    description,
    tags,
    "imageUrl": image.asset->url,
    "imageWidth": image.asset->metadata.dimensions.width,
    "imageHeight": image.asset->metadata.dimensions.height,
    "imageMime": image.asset->mimeType,
    "imageSize": image.asset->size,
    "imageHash": image.asset->sha1hash,
    location,
    credit,
    retired
  }
`;

/** A single photograph by slug. */
export const Q_PHOTO_BY_SLUG = /* groq */ `
  *[_type == "photo" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
    _id,
    _createdAt,
    _updatedAt,
    title,
    "slug": slug.current,
    kind,
    subject,
    capturedAt,
    description,
    tags,
    "imageUrl": image.asset->url,
    "imageWidth": image.asset->metadata.dimensions.width,
    "imageHeight": image.asset->metadata.dimensions.height,
    "imageMime": image.asset->mimeType,
    "imageSize": image.asset->size,
    "imageHash": image.asset->sha1hash,
    location,
    credit,
    retired
  }
`;

/** All published, non-retired videos, newest captured first. */
export const Q_ALL_VIDEOS = /* groq */ `
  *[_type == "video" && !(_id in path("drafts.**")) && retired != true]
  | order(coalesce(capturedAt, _createdAt) desc) {
    _id,
    _createdAt,
    _updatedAt,
    title,
    "slug": slug.current,
    subject,
    capturedAt,
    description,
    tags,
    "fileUrl": file.asset->url,
    "fileMime": file.asset->mimeType,
    "fileSize": file.asset->size,
    "posterUrl": poster.asset->url,
    durationSeconds,
    location,
    retired
  }
`;

/** All published, non-retired 360 panoramas, newest captured first. */
export const Q_ALL_PANOS = /* groq */ `
  *[_type == "pano360" && !(_id in path("drafts.**")) && retired != true]
  | order(coalesce(capturedAt, _createdAt) desc) {
    _id,
    _createdAt,
    _updatedAt,
    title,
    "slug": slug.current,
    subject,
    capturedAt,
    description,
    tags,
    "imageUrl": equirectImage.asset->url,
    "imageWidth": equirectImage.asset->metadata.dimensions.width,
    "imageHeight": equirectImage.asset->metadata.dimensions.height,
    "imageMime": equirectImage.asset->mimeType,
    "imageSize": equirectImage.asset->size,
    heading,
    pitch,
    location,
    retired
  }
`;

/** Inline illustrations attached to a single article, in order. */
export const Q_INLINE_IMAGES_BY_ARTICLE_SLUG = /* groq */ `
  *[_type == "articleImage" && articleSlug == $slug && !(_id in path("drafts.**"))]
  | order(coalesce(order, 0) asc, _createdAt asc) {
    _id,
    articleSlug,
    caption,
    alt,
    "imageUrl": image.asset->url,
    "imageWidth": image.asset->metadata.dimensions.width,
    "imageHeight": image.asset->metadata.dimensions.height,
    order
  }
`;

/** Apparatus images attached to a single codex entry, in order. */
export const Q_CODEX_IMAGES_BY_SLUG = /* groq */ `
  *[_type == "codexImage" && codexSlug == $slug && !(_id in path("drafts.**"))]
  | order(coalesce(order, 0) asc, _createdAt asc) {
    _id,
    codexSlug,
    caption,
    alt,
    "imageUrl": image.asset->url,
    "imageWidth": image.asset->metadata.dimensions.width,
    "imageHeight": image.asset->metadata.dimensions.height,
    sources,
    order
  }
`;
