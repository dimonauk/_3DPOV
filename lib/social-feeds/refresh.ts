/**
 * lib/social-feeds/refresh.ts — Orchestrate the aggregated-feed refresh.
 *
 * Pulls every active FeedSource, dispatches to the per-platform
 * fetcher, merges results, writes `data/aggregated-feed.json`
 * (capped at 1000 entries, newest first). One file per platform
 * fetcher so each one stays modular.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { fetchRssSource } from "./fetch-rss";
import { getProfile } from "../people/registry";
import { activeSources } from "./sources";
import type {
  AggregatedFeedFile,
  AggregatedPost,
  FeedSource,
} from "./types";

const STORE_PATH = path.join(
  process.cwd(),
  "data",
  "aggregated-feed.json",
);
const MAX_POSTS = 1000;

function personNameFor(source: FeedSource): string {
  const profile = getProfile(source.personId);
  return profile?.name ?? source.personId;
}

async function fetchOne(source: FeedSource): Promise<AggregatedPost[]> {
  const personName = personNameFor(source);
  switch (source.platform) {
    case "rss":
    case "atom":
    case "website": {
      const result = await fetchRssSource(source, personName);
      return result.posts;
    }
    // Stubs — each platform gets its own module when wired.
    case "bluesky":
    case "mastodon":
    case "instagram":
    case "x":
    case "flickr":
    case "youtube":
    default:
      return [];
  }
}

function dedupe(posts: AggregatedPost[]): AggregatedPost[] {
  const seen = new Set<string>();
  const out: AggregatedPost[] = [];
  for (const p of posts) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export type RefreshSummary = {
  sources_total: number;
  sources_ok: number;
  sources_failed: number;
  posts_total: number;
  posts_kept: number;
  last_refresh: string;
};

export async function refreshAggregatedFeed(): Promise<RefreshSummary> {
  const sources = activeSources();
  const all: AggregatedPost[] = [];
  let okCount = 0;
  let failCount = 0;

  for (const source of sources) {
    try {
      const posts = await fetchOne(source);
      all.push(...posts);
      okCount += 1;
    } catch {
      failCount += 1;
    }
  }

  const sorted = dedupe(all).sort((a, b) =>
    a.postedAt < b.postedAt ? 1 : -1,
  );
  const capped = sorted.slice(0, MAX_POSTS);

  const file: AggregatedFeedFile = {
    last_refresh: new Date().toISOString(),
    posts: capped,
  };

  await fs.writeFile(STORE_PATH, JSON.stringify(file, null, 2), "utf8");

  return {
    sources_total: sources.length,
    sources_ok: okCount,
    sources_failed: failCount,
    posts_total: all.length,
    posts_kept: capped.length,
    last_refresh: file.last_refresh,
  };
}
