/**
 * lib/watchers/sources/org-atom.ts — Poll GitHub-org `.atom` feeds.
 *
 * GitHub publishes an Atom feed of public activity at
 * `https://github.com/<org>.atom`. No auth needed. Cheap way to track
 * "what's anthropic / openai / google-deepmind doing this week" without
 * polling N repos.
 *
 * Items are heterogeneous (release, push, fork, star) so we keep the
 * title as the upstream gives it, classify the entry as `news`, and
 * leave detailed filtering to the UI.
 */
import { parseFeed } from "feedsmith";

import type { FeedEntry } from "../types";

const FETCH_TIMEOUT_MS = 15_000;

async function fetchOne(org: string): Promise<{
  entries: FeedEntry[];
  error?: string;
}> {
  const url = `https://github.com/${org}.atom`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        accept: "application/atom+xml, application/xml;q=0.9",
        "user-agent":
          "HoloflowStudio-PolymathsFeed/0.1 (+https://holoflow.co.uk)",
      },
    });
    if (!resp.ok) {
      return { entries: [], error: `org-atom ${org} http ${resp.status}` };
    }
    const xml = await resp.text();
    const parsed = parseFeed(xml) as {
      items?: Array<Record<string, unknown>>;
    };
    const items = parsed.items ?? [];
    const out: FeedEntry[] = [];
    for (const item of items) {
      const link =
        typeof item["link"] === "string"
          ? (item["link"] as string)
          : Array.isArray(item["links"]) && item["links"][0]
            ? ((item["links"][0] as Record<string, unknown>)["href"] as string)
            : undefined;
      if (!link) continue;
      const idRaw =
        typeof item["id"] === "string" ? (item["id"] as string) : link;
      const title =
        typeof item["title"] === "string"
          ? (item["title"] as string).trim()
          : "(activity)";
      const updated =
        typeof item["updated"] === "string"
          ? (item["updated"] as string)
          : typeof item["published"] === "string"
            ? (item["published"] as string)
            : new Date().toISOString();
      out.push({
        id: `news:org:${idRaw}`,
        kind: "news",
        source: "org",
        title,
        url: link,
        publishedAt: new Date(updated).toISOString(),
        author: org,
        tags: [org],
      });
    }
    return { entries: out };
  } catch (err) {
    return {
      entries: [],
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchOrgAtoms(
  orgs: readonly string[],
): Promise<{ entries: FeedEntry[]; errors: string[] }> {
  const all: FeedEntry[] = [];
  const errors: string[] = [];
  for (const org of orgs) {
    const r = await fetchOne(org);
    all.push(...r.entries);
    if (r.error) errors.push(r.error);
  }
  return { entries: all, errors };
}
