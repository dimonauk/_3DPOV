/**
 * /feed.xml — site-wide Atom feed.
 *
 * Pulls from articles + journal + tutorials, sorts by date, hands
 * off to the shared builder in `lib/feed/atom.ts`. Pairs with the
 * per-section feeds at /articles/feed.xml, /journal/feed.xml,
 * /tutorials/feed.xml.
 */

import { articles } from "lib/articles";
import { buildFeed } from "lib/feed/atom";
import { journal } from "lib/journal";
import { tutorials } from "lib/tutorials";
import type { Entry } from "lib/writing";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const all: Entry[] = [...articles, ...journal, ...tutorials].sort(
    (a, b) => (a.date < b.date ? 1 : -1),
  );

  return buildFeed({
    description:
      "Articles, journal, tutorials, and the who's-who of UK creative scenes.",
    entries: all,
    selfPath: "/feed.xml",
  });
}
