/**
 * lib/watchers/getFeed.ts — Typed accessors for the polymaths-feed
 * store. Imported by `/news`, `/news/feed.xml`, `/admin/watchers`.
 *
 * Read-only on the public side; only the orchestrator + the bench
 * ingest route mutate the store.
 */
import { readStore } from "./store";
import type { FeedEntry, FeedEntryKind, FeedSourceKind } from "./types";

export async function getPolymathsFeed(
  options: {
    limit?: number;
    kind?: FeedEntryKind;
    source?: FeedSourceKind;
  } = {},
): Promise<FeedEntry[]> {
  const { entries } = await readStore();
  let out = entries;
  if (options.kind) out = out.filter((e) => e.kind === options.kind);
  if (options.source) out = out.filter((e) => e.source === options.source);
  if (options.limit && options.limit > 0) out = out.slice(0, options.limit);
  return out;
}

export async function getLastRefresh(): Promise<string> {
  const { last_refresh } = await readStore();
  return last_refresh;
}

export async function getFeedCounts(): Promise<{
  total: number;
  byKind: Record<FeedEntryKind, number>;
  bySource: Record<FeedSourceKind, number>;
}> {
  const { entries } = await readStore();
  const byKind = {
    commit: 0,
    release: 0,
    paper: 0,
    model: 0,
    news: 0,
  } satisfies Record<FeedEntryKind, number>;
  const bySource = {
    holoflow: 0,
    hangar: 0,
    dollyos: 0,
    github: 0,
    huggingface: 0,
    arxiv: 0,
    org: 0,
  } satisfies Record<FeedSourceKind, number>;
  for (const e of entries) {
    byKind[e.kind] += 1;
    bySource[e.source] += 1;
  }
  return { total: entries.length, byKind, bySource };
}
