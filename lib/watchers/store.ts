/**
 * lib/watchers/store.ts — Dual-backend store for the polymaths feed.
 *
 * If Upstash Redis is configured (`KV_REST_API_URL` + `KV_REST_API_TOKEN`),
 * store the snapshot there — survives across regions, function
 * instances, deploys. Otherwise fall back to `data/polymaths-feed.json`
 * on disk, which is what we ship in the repo as a dev-time seed.
 *
 * The store is a single key (`polymaths:feed`) holding the whole
 * WatcherStoreFile — small (≤1000 entries, ≤500KB typically) and the
 * /news page reads the whole thing every render via `getPolymathsFeed`.
 *
 * The bench-bridge ingest route appends entries through `appendEntries`;
 * the orchestrator writes the merged snapshot through `writeStore`.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import type { FeedEntry, WatcherStoreFile } from "./types";

const KEY = "polymaths:feed";
const FILE_PATH = path.join(
  process.cwd(),
  "data",
  "polymaths-feed.json",
);
const MAX_ENTRIES = 1000;

function upstashConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
  );
}

async function readFromFile(): Promise<WatcherStoreFile> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return JSON.parse(raw) as WatcherStoreFile;
  } catch {
    return { last_refresh: "1970-01-01T00:00:00Z", entries: [] };
  }
}

async function writeToFile(file: WatcherStoreFile): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(file, null, 2), "utf8");
}

async function readFromUpstash(): Promise<WatcherStoreFile | null> {
  const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(KEY)}`;
  const resp = await fetch(url, {
    headers: { authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    // Upstash REST is fine without a cache hint — every call is fresh.
  });
  if (!resp.ok) return null;
  const body = (await resp.json()) as { result?: string | null };
  if (!body.result) return null;
  try {
    return JSON.parse(body.result) as WatcherStoreFile;
  } catch {
    return null;
  }
}

async function writeToUpstash(file: WatcherStoreFile): Promise<void> {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(KEY)}`;
  await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(JSON.stringify(file)),
  });
}

export async function readStore(): Promise<WatcherStoreFile> {
  if (upstashConfigured()) {
    const remote = await readFromUpstash();
    if (remote) return remote;
  }
  return readFromFile();
}

export async function writeStore(file: WatcherStoreFile): Promise<void> {
  // Always persist to file so the repo carries a snapshot for dev /
  // local rendering; also push to Upstash when configured.
  await writeToFile(file);
  if (upstashConfigured()) {
    try {
      await writeToUpstash(file);
    } catch {
      /* upstash write best-effort */
    }
  }
}

/** Merge entries into the store, deduping by id, sort newest-first,
 *  cap at MAX_ENTRIES. Returns the resulting count. */
export async function appendEntries(
  incoming: FeedEntry[],
): Promise<number> {
  if (incoming.length === 0) {
    const cur = await readStore();
    return cur.entries.length;
  }
  const current = await readStore();
  const merged = mergeAndSort(current.entries, incoming);
  await writeStore({
    last_refresh: new Date().toISOString(),
    entries: merged,
  });
  return merged.length;
}

export function mergeAndSort(
  existing: FeedEntry[],
  incoming: FeedEntry[],
): FeedEntry[] {
  const map = new Map<string, FeedEntry>();
  for (const e of existing) map.set(e.id, e);
  // Incoming wins on conflict — refreshed summary / image overrides.
  for (const e of incoming) map.set(e.id, e);
  const arr = Array.from(map.values());
  arr.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return arr.slice(0, MAX_ENTRIES);
}
