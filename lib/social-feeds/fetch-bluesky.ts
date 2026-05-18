/**
 * lib/social-feeds/fetch-bluesky.ts — Fetch + normalise a Bluesky source.
 *
 * Bluesky exposes a public AppView (api.bsky.app) with no auth needed
 * for read-only timeline endpoints. We use `app.bsky.feed.getAuthorFeed`
 * to pull a handle's recent posts and normalise into the studio's
 * `AggregatedPost` shape.
 *
 * Docs: https://docs.bsky.app/docs/api/app-bsky-feed-get-author-feed
 *
 * The FeedSource's `url` field for Bluesky carries the handle (e.g.
 * `dimona.bsky.social` or a custom domain). One file per platform
 * so each fetcher stays modular.
 */

import type { AggregatedPost, FeedSource } from "./types";

const APPVIEW = "https://public.api.bsky.app";
const FETCH_TIMEOUT_MS = 15_000;
const PAGE_LIMIT = 30;

async function fetchWithTimeout(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        accept: "application/json",
        "user-agent":
          "HoloflowStudio-FeedAggregator/0.1 (+https://holoflow.co.uk)",
      },
    });
    if (!resp.ok) throw new Error(`bluesky http ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(t);
  }
}

type BskyImage = { fullsize?: string; thumb?: string };
type BskyEmbed = {
  $type?: string;
  images?: BskyImage[];
  media?: { images?: BskyImage[] };
};
type BskyRecord = {
  $type?: string;
  text?: string;
  createdAt?: string;
};
type BskyPostView = {
  uri?: string;
  cid?: string;
  author?: { did?: string; handle?: string; displayName?: string };
  record?: BskyRecord;
  embed?: BskyEmbed;
  indexedAt?: string;
};
type BskyFeedItem = { post?: BskyPostView };
type BskyFeedResponse = { feed?: BskyFeedItem[] };

function aturiToWebUrl(uri: string, handle: string): string | null {
  // at://did:plc:xxx/app.bsky.feed.post/<rkey> → https://bsky.app/profile/<handle>/post/<rkey>
  const m = uri.match(/\/app\.bsky\.feed\.post\/([^/]+)$/);
  if (!m) return null;
  return `https://bsky.app/profile/${handle}/post/${m[1]}`;
}

function pickImages(embed: BskyEmbed | undefined): string[] | undefined {
  if (!embed) return undefined;
  const direct = embed.images;
  if (Array.isArray(direct) && direct.length > 0) {
    return direct
      .map((i) => i.fullsize || i.thumb)
      .filter((s): s is string => typeof s === "string");
  }
  const media = embed.media?.images;
  if (Array.isArray(media) && media.length > 0) {
    return media
      .map((i) => i.fullsize || i.thumb)
      .filter((s): s is string => typeof s === "string");
  }
  return undefined;
}

export type BskyFetchResult = {
  source: FeedSource;
  posts: AggregatedPost[];
  error?: string;
};

export async function fetchBlueskySource(
  source: FeedSource,
  personName: string,
): Promise<BskyFetchResult> {
  // `source.url` carries the handle. Strip any "@" or https prefix.
  const handle = source.url
    .replace(/^https?:\/\/(bsky\.app\/profile\/)?/, "")
    .replace(/^@/, "")
    .split("/")[0];
  if (!handle) {
    return { source, posts: [], error: "missing handle" };
  }
  const apiUrl = `${APPVIEW}/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=${PAGE_LIMIT}`;
  try {
    const data = (await fetchWithTimeout(apiUrl)) as BskyFeedResponse;
    const items = Array.isArray(data.feed) ? data.feed : [];
    const posts: AggregatedPost[] = [];
    for (const item of items) {
      const post = item.post;
      if (!post?.uri || !post?.record) continue;
      const url = aturiToWebUrl(post.uri, handle);
      if (!url) continue;
      const text = (post.record.text ?? "").slice(0, 800);
      const postedAt =
        post.record.createdAt ?? post.indexedAt ?? new Date().toISOString();
      posts.push({
        id: `bluesky:${post.uri}`,
        personId: source.personId,
        personName,
        platform: "bluesky",
        postedAt: new Date(postedAt).toISOString(),
        url,
        text,
        imageUrls: pickImages(post.embed),
        handle,
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
