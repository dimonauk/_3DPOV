/**
 * lib/social-feeds/fetch-rss.ts — Fetch + normalise an RSS / Atom source.
 *
 * Uses `feedsmith` for parsing. One file = one platform. The
 * normaliser maps each item into the studio's `AggregatedPost`
 * shape, picking the right id / url / image fields based on
 * common RSS extension patterns (media:content, enclosure,
 * itunes:image, og:image-in-summary, etc.).
 */

import { parseFeed } from "feedsmith";

import type { AggregatedPost, FeedSource } from "./types";

const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "HoloflowStudio-FeedAggregator/0.1 (+https://holoflow.co.uk)",
        accept:
          "application/atom+xml, application/rss+xml, application/xml;q=0.9, */*;q=0.5",
      },
    });
    if (!resp.ok) throw new Error(`feed http ${resp.status}: ${url}`);
    return await resp.text();
  } finally {
    clearTimeout(t);
  }
}

function pickImage(item: Record<string, unknown>): string | undefined {
  // feedsmith normalises differing extensions into a flat-ish shape;
  // probe the common places defensively.
  const media = item["media"] as Record<string, unknown> | undefined;
  if (media && typeof media === "object") {
    const content = media["content"];
    if (Array.isArray(content) && content[0]) {
      const url = (content[0] as Record<string, unknown>)["url"];
      if (typeof url === "string") return url;
    }
    const thumbnail = media["thumbnail"];
    if (Array.isArray(thumbnail) && thumbnail[0]) {
      const url = (thumbnail[0] as Record<string, unknown>)["url"];
      if (typeof url === "string") return url;
    }
  }
  const enclosures = item["enclosures"];
  if (Array.isArray(enclosures) && enclosures[0]) {
    const url = (enclosures[0] as Record<string, unknown>)["url"];
    const type = (enclosures[0] as Record<string, unknown>)["type"];
    if (typeof url === "string" && typeof type === "string" && type.startsWith("image/")) {
      return url;
    }
  }
  return undefined;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export type FetchResult = {
  source: FeedSource;
  posts: AggregatedPost[];
  error?: string;
};

export async function fetchRssSource(
  source: FeedSource,
  personName: string,
): Promise<FetchResult> {
  try {
    const xml = await fetchWithTimeout(source.url);
    const parsed = parseFeed(xml) as {
      items?: Array<Record<string, unknown>>;
    };
    const items = parsed.items ?? [];

    const posts: AggregatedPost[] = [];
    for (const item of items) {
      const link =
        typeof item["link"] === "string"
          ? (item["link"] as string)
          : Array.isArray(item["links"]) && item["links"][0]
            ? ((item["links"][0] as Record<string, unknown>)["href"] as string)
            : undefined;
      if (!link) continue;

      const titleRaw =
        typeof item["title"] === "string"
          ? (item["title"] as string)
          : "";
      const descRaw =
        typeof item["description"] === "string"
          ? (item["description"] as string)
          : typeof item["summary"] === "string"
            ? (item["summary"] as string)
            : "";
      const text = stripHtml(descRaw || titleRaw).slice(0, 800);

      const pubDateRaw =
        item["pubDate"] ??
        item["published"] ??
        item["updated"] ??
        item["isoDate"];
      const postedAt =
        typeof pubDateRaw === "string"
          ? new Date(pubDateRaw).toISOString()
          : new Date().toISOString();

      const image = pickImage(item);

      posts.push({
        id: `${source.platform}:${link}`,
        personId: source.personId,
        personName,
        platform: source.platform,
        postedAt,
        url: link,
        text,
        imageUrls: image ? [image] : undefined,
        handle: source.handle,
      });
    }
    return { source, posts };
  } catch (err) {
    return {
      source,
      posts: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
