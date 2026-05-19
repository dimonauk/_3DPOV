/**
 * lib/workers/feed-parse.worker.ts — RSS/Atom parsing off-main-thread.
 *
 * Wraps `feedsmith`'s `parseFeed` so big polyglot XML feeds
 * (the aggregated /feed page can chew through 30+ sources at
 * once) do not stall the cursor. Returns a normalised subset
 * — only the fields the studio actually renders — so the
 * structured-clone payload stays small.
 *
 * Ops:
 *   - "parse" payload { xml: string }  result ParsedFeed
 */

/// <reference lib="webworker" />

import { parseFeed as parseFeedsmith } from "feedsmith";

import type { AnyWorkerRequest, WorkerResponse } from "./types";

export type ParsedFeedItem = {
  id?: string;
  title?: string;
  link?: string;
  description?: string;
  published?: string;
  /** First image URL we could pick out (media:content, enclosure, thumbnail). */
  imageUrl?: string;
};

export type ParsedFeed = {
  /** Feed-level title if the source provided one. */
  title?: string;
  /** Feed-level link (homepage). */
  link?: string;
  items: ParsedFeedItem[];
};

type RawItem = Record<string, unknown>;
type RawFeed = {
  title?: string;
  link?: string;
  items?: RawItem[];
};

function pickImage(item: RawItem): string | undefined {
  const media = item["media"] as Record<string, unknown> | undefined;
  if (media && typeof media === "object") {
    const content = media["content"];
    if (Array.isArray(content) && content[0]) {
      const url = (content[0] as Record<string, unknown>)["url"];
      if (typeof url === "string") return url;
    }
    const thumb = media["thumbnail"];
    if (Array.isArray(thumb) && thumb[0]) {
      const url = (thumb[0] as Record<string, unknown>)["url"];
      if (typeof url === "string") return url;
    }
  }
  const enclosures = item["enclosures"];
  if (Array.isArray(enclosures) && enclosures[0]) {
    const enc = enclosures[0] as Record<string, unknown>;
    const url = enc["url"];
    const type = enc["type"];
    if (
      typeof url === "string" &&
      typeof type === "string" &&
      type.startsWith("image/")
    ) {
      return url;
    }
  }
  return undefined;
}

function pickLink(item: RawItem): string | undefined {
  if (typeof item["link"] === "string") return item["link"] as string;
  const links = item["links"];
  if (Array.isArray(links) && links[0]) {
    const href = (links[0] as Record<string, unknown>)["href"];
    if (typeof href === "string") return href;
  }
  return undefined;
}

function pickDate(item: RawItem): string | undefined {
  const raw =
    item["pubDate"] ?? item["published"] ?? item["updated"] ?? item["isoDate"];
  if (typeof raw === "string") return raw;
  return undefined;
}

function pickDescription(item: RawItem): string | undefined {
  if (typeof item["description"] === "string") {
    return item["description"] as string;
  }
  if (typeof item["summary"] === "string") return item["summary"] as string;
  return undefined;
}

function normalise(xml: string): ParsedFeed {
  const parsed = parseFeedsmith(xml) as unknown as RawFeed;
  const items: ParsedFeedItem[] = [];
  for (const raw of parsed.items ?? []) {
    items.push({
      id: typeof raw["id"] === "string" ? (raw["id"] as string) : undefined,
      title:
        typeof raw["title"] === "string" ? (raw["title"] as string) : undefined,
      link: pickLink(raw),
      description: pickDescription(raw),
      published: pickDate(raw),
      imageUrl: pickImage(raw),
    });
  }
  return {
    title: parsed.title,
    link: parsed.link,
    items,
  };
}

self.onmessage = (e: MessageEvent<AnyWorkerRequest>) => {
  const { id, kind, op, payload } = e.data;
  if (kind !== "feed-parse") return;

  try {
    if (op === "parse") {
      const { xml } = payload as { xml: string };
      const result = normalise(xml);
      const reply: WorkerResponse<"feed-parse", ParsedFeed> = {
        id,
        kind: "feed-parse",
        result,
      };
      (self as DedicatedWorkerGlobalScope).postMessage(reply);
      return;
    }
    throw new Error(`unknown op "${op}"`);
  } catch (err) {
    const reply: WorkerResponse<"feed-parse", never> = {
      id,
      kind: "feed-parse",
      error: err instanceof Error ? err.message : String(err),
    };
    (self as DedicatedWorkerGlobalScope).postMessage(reply);
  }
};

export {};
