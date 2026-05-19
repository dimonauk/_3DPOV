/**
 * lib/workers/feed-parse.ts — Typed wrapper for the feed-parse worker.
 *
 * Usage:
 *
 *   import { parseFeed } from "@/lib/workers/feed-parse";
 *
 *   const xml = await fetch(url).then((r) => r.text());
 *   const feed = await parseFeed(xml);
 *
 * The XML string travels by structured clone (no transferable
 * option for plain strings); if the feeds you ingest are tens
 * of megabytes, prefer fetching as ArrayBuffer and shipping
 * that via a new "parse-binary" op on the worker.
 */

import { callWorker } from "./client";
import type { ParsedFeed, ParsedFeedItem } from "./feed-parse.worker";

export type { ParsedFeed, ParsedFeedItem };

export async function parseFeed(xml: string): Promise<ParsedFeed> {
  return callWorker<"feed-parse", { xml: string }, ParsedFeed>(
    "feed-parse",
    "parse",
    { xml },
    { timeoutMs: 15_000 },
  );
}
