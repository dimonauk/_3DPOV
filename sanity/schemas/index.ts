/**
 * sanity/schemas/index.ts — Sanity content-type registry.
 *
 * One-line role: the array Sanity's schema builder reads at boot. Each
 * document type is registered here exactly once.
 *
 * Order is editorial — it determines the order types appear in the
 * Studio's "New document" picker. Most-used first.
 */

import articleImage from "./article-image";
import codexImage from "./codex-image";
import pano360 from "./pano-360";
import photo from "./photo";
import video from "./video";

export const schemaTypes = [
  photo,
  video,
  pano360,
  articleImage,
  codexImage,
];
