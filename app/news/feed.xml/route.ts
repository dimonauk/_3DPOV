/**
 * /news/feed.xml — Atom feed for the Polymaths Feed.
 *
 * Mirrors the shape of `lib/feed/atom.ts` but is the only feed in the
 * studio whose entries don't live in the Entry model — they're
 * FeedEntry rows from `getPolymathsFeed`. Atom 1.0, hourly cache.
 */
import { SITE_URL } from "lib/feed/atom";
import { getPolymathsFeed } from "lib/watchers/getFeed";

export const dynamic = "force-dynamic";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const entries = await getPolymathsFeed({ limit: 100 });
  const latest = entries[0]?.publishedAt ?? new Date().toISOString();
  const selfUrl = `${SITE_URL}/news/feed.xml`;

  const items = entries
    .map((e) => {
      const id = e.url.startsWith("http") ? e.url : `${SITE_URL}${e.url}`;
      return `  <entry>
    <id>${escape(e.id)}</id>
    <title>${escape(e.title)}</title>
    <link rel="alternate" type="text/html" href="${escape(id)}" />
    <updated>${escape(e.publishedAt)}</updated>
    <published>${escape(e.publishedAt)}</published>
    <author><name>${escape(e.author ?? "Holoflow Studio")}</name></author>
    <category term="${escape(e.kind)}" />
    <category term="${escape(e.source)}" />
    ${e.summary ? `<summary type="text">${escape(e.summary)}</summary>` : ""}
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-GB">
  <title>Holoflow Studio — News</title>
  <subtitle>The studio's working life: commits, releases, papers, models.</subtitle>
  <link rel="self" type="application/atom+xml" href="${escape(selfUrl)}" />
  <link rel="alternate" type="text/html" href="${SITE_URL}/news" />
  <id>${SITE_URL}/news</id>
  <updated>${escape(latest)}</updated>
  <generator uri="https://nextjs.org/" version="15">Next.js</generator>
  <rights>© Holoflow Studio. Individual works © their creators.</rights>
${items}
</feed>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600",
    },
  });
}
