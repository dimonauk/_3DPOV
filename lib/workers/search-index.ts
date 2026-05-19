/**
 * lib/workers/search-index.ts — Typed wrapper for the search worker.
 *
 * Usage:
 *
 *   import { buildSearchIndex, searchEntries } from "@/lib/workers/search-index";
 *
 *   await buildSearchIndex(entries);
 *   const hits = await searchEntries("aura test chamber", 10);
 *
 * `buildSearchIndex` is idempotent — calling it again rebuilds
 * the index from scratch, which is what you want when the
 * underlying dataset has changed.
 */

import { callWorker } from "./client";
import type { SearchableEntry, SearchHit } from "./search-index.worker";

export type { SearchableEntry, SearchHit };

/**
 * Build (or rebuild) the inverted index inside the worker.
 * The promise resolves once the index is ready to query.
 */
export async function buildSearchIndex(
  entries: SearchableEntry[],
): Promise<number> {
  const r = await callWorker<"search-index", { entries: SearchableEntry[] }, { count: number }>(
    "search-index",
    "build",
    { entries },
  );
  return r.count;
}

/**
 * Run a query against the prebuilt index.
 *
 * @param query  free-text query (prefix + fuzzy matching enabled in the worker)
 * @param limit  maximum hits to return (default 20)
 */
export async function searchEntries(
  query: string,
  limit = 20,
): Promise<SearchHit[]> {
  if (!query.trim()) return [];
  return callWorker<"search-index", { query: string; limit: number }, SearchHit[]>(
    "search-index",
    "search",
    { query, limit },
    { timeoutMs: 5_000 },
  );
}
