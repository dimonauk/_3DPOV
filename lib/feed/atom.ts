/**
 * lib/feed/atom.ts — Shared Atom 1.0 feed builder.
 *
 * Consumed by /feed.xml (site-wide) + /articles/feed.xml +
 * /journal/feed.xml + /tutorials/feed.xml. Each route hands in its
 * entry list + section metadata; this module emits the XML and
 * sets headers.
 *
 * Atom (not RSS 2.0) — its required fields catch mistakes earlier.
 */

import type { Entry } from "lib/writing";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://holoflow.co.uk";

const FEED_TITLE_BASE = "Holoflow Studio";

export type BuildFeedOptions = {
  /** Section label, e.g. "Articles", "Journal", or "Magazine" for the
   *  combined feed. */
  section?: string;
  /** Subtitle / short description shown in the feed metadata. */
  description: string;
  /** Sorted Entry list (already date-desc per section). */
  entries: Entry[];
  /** Path under SITE_URL where this feed lives, e.g. "/feed.xml" or
   *  "/articles/feed.xml". Required for rel="self". */
  selfPath: string;
};

function pathFor(entry: Entry): string {
  switch (entry.kind) {
    case "article":
      return `/articles/${entry.slug}`;
    case "journal":
      return `/journal/${entry.slug}`;
    case "tutorial":
      return `/tutorials/${entry.slug}`;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function entryXml(entry: Entry): string {
  const url = `${SITE_URL}${pathFor(entry)}`;
  const updated = new Date(`${entry.date}T00:00:00Z`).toISOString();
  const id = url;
  const title = escapeXml(entry.title);
  const summary = escapeXml(entry.excerpt ?? "");
  const category = entry.kind;
  return `  <entry>
    <id>${id}</id>
    <title>${title}</title>
    <link rel="alternate" type="text/html" href="${url}" />
    <updated>${updated}</updated>
    <published>${updated}</published>
    <author><name>Holoflow Studio</name></author>
    <category term="${category}" />
    <summary type="text">${summary}</summary>
  </entry>`;
}

export function buildFeed(options: BuildFeedOptions): Response {
  const { section, description, entries, selfPath } = options;
  const feedTitle = section
    ? `${FEED_TITLE_BASE} — ${section}`
    : FEED_TITLE_BASE;
  const feedUrl = `${SITE_URL}${selfPath}`;
  const latestUpdated =
    entries[0] != null
      ? new Date(`${entries[0].date}T00:00:00Z`).toISOString()
      : new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-GB">
  <title>${escapeXml(feedTitle)}</title>
  <subtitle>${escapeXml(description)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${feedUrl}" />
  <link rel="alternate" type="text/html" href="${SITE_URL}/" />
  <id>${SITE_URL}/</id>
  <updated>${latestUpdated}</updated>
  <generator uri="https://nextjs.org/" version="15">Next.js</generator>
  <rights>© Holoflow Studio. Individual works © their creators.</rights>
${entries.map(entryXml).join("\n")}
</feed>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
