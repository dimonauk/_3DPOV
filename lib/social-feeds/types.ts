/**
 * lib/social-feeds/types.ts — Types for the aggregated social feed.
 *
 * The studio's /feed surface pulls public posts from people in the
 * rolodex — their Instagram, X, Flickr, RSS, Mastodon, Bluesky.
 * People don't post on holoflow.co.uk; their public posts elsewhere
 * are gathered into one chronological view.
 *
 * Data flow:
 *
 *   1. `lib/social-feeds/sources.ts` lists each rolodex person's
 *      known feed URLs.
 *   2. A cron job (`/api/cron/refresh-feeds`) periodically fetches
 *      each source, normalises items, writes to a flat store.
 *   3. `/feed` reads the store and renders.
 *
 * The store today is a JSON file at `data/aggregated-feed.json`.
 * Future: pgvector / Postgres for full-text search + per-person
 * semantic retrieval.
 */

export type SourcePlatform =
  | "instagram"
  | "x"
  | "bluesky"
  | "mastodon"
  | "flickr"
  | "youtube"
  | "rss"
  | "atom"
  | "website";

/** A single watchable feed for one rolodex person. One person can
 *  have many (Instagram + Flickr + their website's RSS). */
export type FeedSource = {
  /** Rolodex person id this source belongs to. */
  personId: string;
  /** Platform of the feed. */
  platform: SourcePlatform;
  /** Feed URL the refresher fetches. For RSS / Atom this is the
   *  feed XML; for Instagram / X this is the API URL or a proxy
   *  endpoint. */
  url: string;
  /** Optional handle / display label. */
  handle?: string;
  /** Whether this source is currently active (paused sources are
   *  skipped by the cron). */
  active: boolean;
};

/** One normalised post aggregated from a source. */
export type AggregatedPost = {
  /** Stable id, typically `${platform}:${platform-native-id}`. */
  id: string;
  personId: string;
  personName: string;
  platform: SourcePlatform;
  /** When the post was made on the source platform. */
  postedAt: string; // ISO 8601
  /** Direct link back to the post on the source platform. */
  url: string;
  /** Text / caption body. */
  text: string;
  /** Image URLs from the source post. Up to 4 surfaced. */
  imageUrls?: string[];
  /** Video URL (if a video post). */
  videoUrl?: string;
  /** Optional handle / display label shown next to the name. */
  handle?: string;
};

/** The flat-file store shape. */
export type AggregatedFeedFile = {
  /** When the cron last ran. */
  last_refresh: string;
  /** Most-recent-first list of aggregated posts. Capped at 1000 by
   *  the refresher to keep the file small. */
  posts: AggregatedPost[];
};
