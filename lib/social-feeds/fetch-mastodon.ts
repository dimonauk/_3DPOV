/**
 * lib/social-feeds/fetch-mastodon.ts — Fetch + normalise a Mastodon source.
 *
 * Mastodon's public API exposes statuses for any account without
 * auth via `/api/v1/accounts/:id/statuses`. The wrinkle: each
 * instance is its own API root, so the FeedSource's `url` must
 * carry both the instance and the handle (the studio's source
 * format: `@user@instance.tld`).
 *
 * One file per platform fetcher so each one stays modular.
 */

import type { AggregatedPost, FeedSource } from "./types";

const FETCH_TIMEOUT_MS = 15_000;
const PAGE_LIMIT = 30;

async function fetchJson(url: string): Promise<unknown> {
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
    if (!resp.ok) throw new Error(`mastodon http ${resp.status}: ${url}`);
    return await resp.json();
  } finally {
    clearTimeout(t);
  }
}

type MastoMedia = {
  type?: string;
  url?: string;
  preview_url?: string;
};
type MastoStatus = {
  id?: string;
  url?: string;
  uri?: string;
  content?: string;
  spoiler_text?: string;
  created_at?: string;
  media_attachments?: MastoMedia[];
};
type MastoAccountLookup = {
  id?: string;
  acct?: string;
  url?: string;
};

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function pickImages(
  attachments: MastoMedia[] | undefined,
): string[] | undefined {
  if (!attachments || attachments.length === 0) return undefined;
  const out: string[] = [];
  for (const a of attachments) {
    if (a.type !== "image") continue;
    const url = a.url ?? a.preview_url;
    if (typeof url === "string") out.push(url);
  }
  return out.length > 0 ? out : undefined;
}

/** Parse `@user@instance.tld` (or `user@instance.tld`) into (user, instance). */
function parseMastoHandle(raw: string): { user: string; instance: string } | null {
  const cleaned = raw.replace(/^@/, "").trim();
  const m = cleaned.match(/^([^@/]+)@([^@/]+)$/);
  if (!m) return null;
  const user = m[1];
  const instance = m[2];
  if (!user || !instance) return null;
  return { user, instance };
}

export type MastoFetchResult = {
  source: FeedSource;
  posts: AggregatedPost[];
  error?: string;
};

export async function fetchMastodonSource(
  source: FeedSource,
  personName: string,
): Promise<MastoFetchResult> {
  const handle = parseMastoHandle(source.url);
  if (!handle) {
    return { source, posts: [], error: "invalid mastodon handle" };
  }
  const instanceBase = `https://${handle.instance}`;
  try {
    // Look up the account id (needed for the statuses endpoint).
    const lookup = (await fetchJson(
      `${instanceBase}/api/v1/accounts/lookup?acct=${encodeURIComponent(handle.user)}`,
    )) as MastoAccountLookup;
    if (!lookup.id) {
      return { source, posts: [], error: "account lookup failed" };
    }
    const statuses = (await fetchJson(
      `${instanceBase}/api/v1/accounts/${lookup.id}/statuses?limit=${PAGE_LIMIT}&exclude_reblogs=true&exclude_replies=true`,
    )) as MastoStatus[];

    const posts: AggregatedPost[] = [];
    for (const s of statuses) {
      if (!s.id || !s.created_at) continue;
      const url = s.url ?? s.uri;
      if (!url) continue;
      const raw = (s.spoiler_text ? `${s.spoiler_text}\n\n` : "") + (s.content ?? "");
      const text = stripHtml(raw).slice(0, 800);
      posts.push({
        id: `mastodon:${url}`,
        personId: source.personId,
        personName,
        platform: "mastodon",
        postedAt: new Date(s.created_at).toISOString(),
        url,
        text,
        imageUrls: pickImages(s.media_attachments),
        handle: `@${handle.user}@${handle.instance}`,
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
