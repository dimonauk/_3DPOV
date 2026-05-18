/**
 * lib/social-feeds/sources.ts — Per-person feed source registry.
 *
 * Lists each rolodex person's known public feeds (RSS, Atom,
 * Bluesky, Mastodon, etc.). A cron job (TODO at
 * `/api/cron/refresh-feeds`) periodically fetches each, normalises
 * items via `feedsmith`, and writes the aggregated stream to
 * `data/aggregated-feed.json`.
 *
 * Instagram, X, Flickr need platform-specific APIs (no public RSS);
 * those sources are marked `platform` but require a separate
 * fetcher backend per-platform. Initial seed only includes feeds
 * the studio can fetch with no auth (RSS / Atom).
 */

import type { FeedSource } from "./types";

export const SOURCES: FeedSource[] = [
  // Seed entries — add per-person as their feeds are confirmed.
  // Example shape kept for the cron runner to type-check against.
  // {
  //   personId: "jon-the-photographer",
  //   platform: "rss",
  //   url: "https://jonthephotographer.co.uk/feed.xml",
  //   handle: "@jonthephotographer.co.uk",
  //   active: true,
  // },
];

export function sourcesForPerson(personId: string): FeedSource[] {
  return SOURCES.filter((s) => s.personId === personId && s.active);
}

export function activeSources(): FeedSource[] {
  return SOURCES.filter((s) => s.active);
}
