/**
 * lib/watchers/sources/arxiv.ts — Poll arXiv recent papers via Atom.
 *
 * Endpoint (Atom, unauthenticated):
 *   GET https://export.arxiv.org/api/query?search_query=cat:cs.GR+OR+cat:cs.CV
 *       &sortBy=lastUpdatedDate&sortOrder=descending&max_results=20
 *
 * Parsed with `feedsmith` (already a dep). arXiv ids look like
 * `2406.12345v2`; the link is `http://arxiv.org/abs/<id>`. Author list
 * gets squashed to the first author for the card; the full list rides
 * along in `tags`.
 */
import { parseFeed } from "feedsmith";

import type { FeedEntry, WatcherConfig } from "../types";

const BASE = "https://export.arxiv.org/api/query";
const FETCH_TIMEOUT_MS = 15_000;
const MAX_RESULTS = 20;

function buildUrl(categories: readonly string[]): string {
  if (categories.length === 0) return "";
  const query = categories.map((c) => `cat:${c}`).join("+OR+");
  return `${BASE}?search_query=${query}&sortBy=lastUpdatedDate&sortOrder=descending&max_results=${MAX_RESULTS}`;
}

export async function fetchArxiv(
  config: Pick<WatcherConfig, "arxivCategories">,
): Promise<{ entries: FeedEntry[]; error?: string }> {
  const url = buildUrl(config.arxivCategories);
  if (!url) return { entries: [] };

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
      return { entries: [], error: `arxiv http ${resp.status}` };
    }
    const xml = await resp.text();
    const parsed = parseFeed(xml) as {
      items?: Array<Record<string, unknown>>;
    };
    const items = parsed.items ?? [];
    const out: FeedEntry[] = [];
    for (const item of items) {
      const idRaw = typeof item["id"] === "string" ? (item["id"] as string) : "";
      const link =
        typeof item["link"] === "string"
          ? (item["link"] as string)
          : Array.isArray(item["links"]) && item["links"][0]
            ? ((item["links"][0] as Record<string, unknown>)["href"] as string)
            : idRaw;
      if (!link) continue;
      const title =
        typeof item["title"] === "string"
          ? (item["title"] as string).trim()
          : "(untitled)";
      const summary =
        typeof item["summary"] === "string"
          ? cleanWhitespace(item["summary"] as string).slice(0, 600)
          : undefined;
      const updated =
        typeof item["updated"] === "string"
          ? (item["updated"] as string)
          : typeof item["published"] === "string"
            ? (item["published"] as string)
            : new Date().toISOString();

      const authors = pickAuthors(item);
      const firstAuthor = authors[0];
      const arxivId = idRaw.replace(/^https?:\/\/arxiv\.org\/abs\//, "");

      out.push({
        id: `paper:arxiv:${arxivId || link}`,
        kind: "paper",
        source: "arxiv",
        title,
        url: link,
        summary,
        publishedAt: new Date(updated).toISOString(),
        author: firstAuthor,
        tags: authors.slice(0, 6),
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

function cleanWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function pickAuthors(item: Record<string, unknown>): string[] {
  const authors = item["authors"];
  if (Array.isArray(authors)) {
    return authors
      .map((a) => {
        if (typeof a === "string") return a;
        if (a && typeof a === "object") {
          const name = (a as Record<string, unknown>)["name"];
          if (typeof name === "string") return name;
        }
        return "";
      })
      .filter(Boolean);
  }
  const author = item["author"];
  if (author && typeof author === "object") {
    const name = (author as Record<string, unknown>)["name"];
    if (typeof name === "string") return [name];
  }
  if (typeof author === "string") return [author];
  return [];
}
