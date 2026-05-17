/**
 * app/cards/design/card-designer/encode.ts — Slug + URL-fragment
 * encoder for the card designer. The fragment-encoded card is the
 * entire share-URL payload; no backend storage is required.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1. Pure
 * functions — no React, no DOM (encodeFragment uses TextEncoder +
 * btoa which are available in browsers and modern Node).
 */

import type { Card } from "lib/ar/types";

// Combining-diacritic range U+0300..U+036F. Built via RegExp so the
// source stays ASCII even though the codepoints render identically
// either way.
const DIACRITIC_RE = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITIC_RE, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

// URL-safe base64 (no +, /, =) so the fragment looks tidy.
export function encodeFragment(card: Card): string {
  const json = JSON.stringify(card);
  const utf8 = new TextEncoder().encode(json);
  let bin = "";
  for (const b of utf8) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
