/**
 * lib/social-feeds/store.ts — Read the aggregated feed.
 *
 * Today the store is a flat JSON file at `data/aggregated-feed.json`.
 * Read-only on the public side; the cron-job route is the only
 * writer. Future: pgvector / Postgres for semantic retrieval and
 * per-person filtering at scale.
 */

import feedData from "../../data/aggregated-feed.json";

import type { AggregatedFeedFile, AggregatedPost } from "./types";

const STORE: AggregatedFeedFile = feedData as AggregatedFeedFile;

export function getAllPosts(): AggregatedPost[] {
  return STORE.posts;
}

export function getRecentPosts(limit = 60): AggregatedPost[] {
  return STORE.posts
    .slice()
    .sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1))
    .slice(0, limit);
}

export function getPostsForPerson(personId: string): AggregatedPost[] {
  return STORE.posts.filter((p) => p.personId === personId);
}

export function getLastRefresh(): string {
  return STORE.last_refresh;
}
