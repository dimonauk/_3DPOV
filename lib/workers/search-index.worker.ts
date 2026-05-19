/**
 * lib/workers/search-index.worker.ts — MiniSearch off-main-thread.
 *
 * Builds an inverted index over `{ slug, title, excerpt, kind }`
 * entries and answers ranked-result queries. The index lives
 * for the lifetime of the worker so subsequent `search` ops
 * are zero-allocation aside from the result array.
 *
 * Ops:
 *   - "build"  payload { entries: SearchableEntry[] }       result { count: number }
 *   - "search" payload { query: string; limit?: number }    result SearchHit[]
 */

/// <reference lib="webworker" />

import MiniSearch from "minisearch";

import type { AnyWorkerRequest, WorkerResponse } from "./types";

export type SearchableEntry = {
  slug: string;
  title: string;
  excerpt: string;
  /** Which surface this came from: "article", "journal", "tutorial", "person", … */
  kind: string;
};

export type SearchHit = {
  slug: string;
  title: string;
  excerpt: string;
  kind: string;
  score: number;
};

type BuildPayload = { entries: SearchableEntry[] };
type SearchPayload = { query: string; limit?: number };

let index: MiniSearch<SearchableEntry> | null = null;

function buildIndex(entries: SearchableEntry[]): number {
  index = new MiniSearch<SearchableEntry>({
    idField: "slug",
    fields: ["title", "excerpt", "kind"],
    storeFields: ["slug", "title", "excerpt", "kind"],
    searchOptions: {
      boost: { title: 3, excerpt: 1, kind: 0.5 },
      prefix: true,
      fuzzy: 0.2,
    },
  });
  index.addAll(entries);
  return entries.length;
}

function searchIndex(query: string, limit: number): SearchHit[] {
  if (!index) {
    throw new Error("search index has not been built yet — call buildSearchIndex first");
  }
  const raw = index.search(query);
  const hits: SearchHit[] = [];
  for (let i = 0; i < raw.length && i < limit; i += 1) {
    const r = raw[i];
    if (!r) continue;
    hits.push({
      slug: String(r["slug"] ?? r.id),
      title: String(r["title"] ?? ""),
      excerpt: String(r["excerpt"] ?? ""),
      kind: String(r["kind"] ?? ""),
      score: typeof r.score === "number" ? r.score : 0,
    });
  }
  return hits;
}

self.onmessage = (e: MessageEvent<AnyWorkerRequest>) => {
  const { id, kind, op, payload } = e.data;
  if (kind !== "search-index") return;

  try {
    if (op === "build") {
      const count = buildIndex((payload as BuildPayload).entries);
      const reply: WorkerResponse<"search-index", { count: number }> = {
        id,
        kind: "search-index",
        result: { count },
      };
      (self as DedicatedWorkerGlobalScope).postMessage(reply);
      return;
    }
    if (op === "search") {
      const p = payload as SearchPayload;
      const hits = searchIndex(p.query, p.limit ?? 20);
      const reply: WorkerResponse<"search-index", SearchHit[]> = {
        id,
        kind: "search-index",
        result: hits,
      };
      (self as DedicatedWorkerGlobalScope).postMessage(reply);
      return;
    }
    throw new Error(`unknown op "${op}"`);
  } catch (err) {
    const reply: WorkerResponse<"search-index", never> = {
      id,
      kind: "search-index",
      error: err instanceof Error ? err.message : String(err),
    };
    (self as DedicatedWorkerGlobalScope).postMessage(reply);
  }
};

// Marker export so isolatedModules + module workers stay happy.
export {};
