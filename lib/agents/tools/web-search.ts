import "server-only";

/**
 * lib/agents/tools/web-search.ts — `web.search` tool.
 *
 * Production path: Serper (https://google.serper.dev/search) when
 * `SERPER_API_KEY` is set. Fallback: scrape DuckDuckGo's HTML endpoint
 * (https://html.duckduckgo.com/html/) with a defensive regex extractor
 * — works without an API key, fine for dev/preview, throttled by DDG in
 * production so the runner shouldn't lean on it.
 *
 * Returns a small array of `{ title, url, snippet }`. Never throws —
 * network errors land as `{ ok: false, error: "..." }`.
 */

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.web-search");

const FETCH_TIMEOUT_MS = 15_000;

type SearchHit = { title: string; url: string; snippet: string };

type SearchArgs = { query: string; limit?: number };

function parseArgs(raw: unknown): SearchArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.query !== "string" || r.query.trim().length === 0) {
    return "args.query must be a non-empty string";
  }
  const limit =
    typeof r.limit === "number" && Number.isFinite(r.limit) && r.limit > 0
      ? Math.floor(r.limit)
      : undefined;
  const result: SearchArgs = { query: r.query };
  if (limit !== undefined) result.limit = limit;
  return result;
}

async function searchSerper(
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("no_serper_key");
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: limit }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`serper_http_${res.status}`);
  }
  const json = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>;
  };
  const organic = Array.isArray(json.organic) ? json.organic : [];
  return organic.slice(0, limit).map((h) => ({
    title: typeof h.title === "string" ? h.title : "",
    url: typeof h.link === "string" ? h.link : "",
    snippet: typeof h.snippet === "string" ? h.snippet : "",
  }));
}

/**
 * DuckDuckGo HTML scrape. The endpoint returns a server-rendered list of
 * `<div class="result__body">` blocks containing `<a class="result__a">`
 * with the title + `href` redirect, plus a `<a class="result__snippet">`
 * with the snippet. We extract them with a tolerant regex.
 *
 * DDG wraps the real URL in a redirect like `/l/?uddg=<encoded>`. We
 * decode that back to the underlying URL.
 */
async function searchDuckDuckGo(
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const body = new URLSearchParams({ q: query }).toString();
  const res = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // DDG returns a near-empty page for the default fetch UA. Use a
      // browser-ish UA so we get real results.
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
    },
    body,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`duckduckgo_http_${res.status}`);
  }
  const html = await res.text();
  const hits: SearchHit[] = [];

  // Result anchor — pulls href + inner text (the title).
  const anchorRe =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  // Snippet — separate <a class="result__snippet">…</a>.
  const snippetRe =
    /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

  const titles: Array<{ href: string; title: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html)) !== null) {
    if (titles.length >= limit) break;
    const rawHref = m[1] ?? "";
    const title = stripTags(m[2] ?? "");
    titles.push({ href: rawHref, title });
  }
  const snippets: string[] = [];
  while ((m = snippetRe.exec(html)) !== null) {
    if (snippets.length >= limit) break;
    snippets.push(stripTags(m[1] ?? ""));
  }

  for (let i = 0; i < titles.length; i++) {
    const t = titles[i];
    if (!t) continue;
    hits.push({
      title: t.title,
      url: resolveDdgRedirect(t.href),
      snippet: snippets[i] ?? "",
    });
  }
  return hits;
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveDdgRedirect(href: string): string {
  // DDG returns hrefs like `//duckduckgo.com/l/?uddg=https%3A%2F%2F...`
  // or sometimes a clean URL. Decode the `uddg` param if present.
  try {
    const normalised = href.startsWith("//") ? `https:${href}` : href;
    const u = new URL(normalised, "https://duckduckgo.com");
    const uddg = u.searchParams.get("uddg");
    if (uddg) return decodeURIComponent(uddg);
    return u.toString();
  } catch {
    return href;
  }
}

async function run(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }
  const limit = Math.min(parsed.limit ?? 8, 20);
  const useSerper = Boolean(process.env.SERPER_API_KEY);

  try {
    const hits = useSerper
      ? await searchSerper(parsed.query, limit)
      : await searchDuckDuckGo(parsed.query, limit);
    log.info("web.search ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      provider: useSerper ? "serper" : "duckduckgo",
      hits: hits.length,
    });
    return { ok: true, output: hits };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("web.search failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      provider: useSerper ? "serper" : "duckduckgo",
      err: msg,
    });
    return { ok: false, error: `web_search_failed: ${msg}` };
  }
}

export const webSearchTool: Tool = {
  name: "web.search",
  description:
    "Search the public web for current information. Use when the user asks about something recent or external to Holo-Flow Studio.",
  argsSchema: `{
    "query": "string (required) — the search query",
    "limit": "number (optional, default 8, max 20) — how many results to return"
  }`,
  run,
};
