/**
 * lib/watchers/sources/github-releases.ts — Poll GitHub Releases for the
 * curated dep list from OPEN-SOURCE-STACK.md.
 *
 * Endpoint: `GET https://api.github.com/repos/<owner>/<repo>/releases?per_page=5`.
 * Anonymous traffic is rate-limited at 60/h per IP. If `GITHUB_TOKEN`
 * is set the limit jumps to 5000/h — wire it on Vercel for production.
 *
 * Failures per-repo are swallowed (returned as zero entries with a
 * recorded error) so one rate-limit on one repo doesn't poison the
 * whole batch.
 */
import type { FeedEntry } from "../types";
import type { OssStackEntry } from "../parse-oss-stack";

const API_BASE = "https://api.github.com";
const FETCH_TIMEOUT_MS = 12_000;
const PER_PAGE = 5;

type ApiRelease = {
  id: number;
  html_url: string;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  created_at: string | null;
  author?: { login?: string } | null;
};

function token(): string | undefined {
  const t = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  return t && t.trim() ? t.trim() : undefined;
}

async function fetchOne(
  entry: OssStackEntry,
): Promise<{ entries: FeedEntry[]; error?: string }> {
  const url = `${API_BASE}/repos/${entry.owner}/${entry.repo}/releases?per_page=${PER_PAGE}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent":
      "HoloflowStudio-PolymathsFeed/0.1 (+https://holoflow.co.uk)",
  };
  const tok = token();
  if (tok) headers.authorization = `Bearer ${tok}`;

  try {
    const resp = await fetch(url, { signal: ctrl.signal, headers });
    if (resp.status === 404) {
      return { entries: [], error: `404 ${entry.owner}/${entry.repo}` };
    }
    if (!resp.ok) {
      return {
        entries: [],
        error: `gh http ${resp.status} ${entry.owner}/${entry.repo}`,
      };
    }
    const raw = (await resp.json()) as ApiRelease[];
    const out: FeedEntry[] = [];
    for (const rel of raw) {
      if (rel.draft) continue;
      const published = rel.published_at ?? rel.created_at;
      if (!published) continue;
      out.push({
        id: `release:github:${entry.owner}/${entry.repo}#${rel.id}`,
        kind: "release",
        source: "github",
        title: `${entry.name} ${rel.tag_name}${rel.prerelease ? " (pre)" : ""}`,
        url: rel.html_url,
        summary: rel.body ? truncate(rel.body, 600) : undefined,
        publishedAt: new Date(published).toISOString(),
        author: rel.author?.login,
        tags: [
          `${entry.owner}/${entry.repo}`,
          entry.linedUp ? "lined-up" : "wired",
          entry.section,
        ],
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

function truncate(s: string, n: number): string {
  const clean = s.replace(/\r\n/g, "\n").trim();
  if (clean.length <= n) return clean;
  return clean.slice(0, n - 1).trimEnd() + "…";
}

export async function fetchGithubReleases(
  repos: OssStackEntry[],
): Promise<{ entries: FeedEntry[]; errors: string[] }> {
  const all: FeedEntry[] = [];
  const errors: string[] = [];
  // Serial — keeps us under the unauth rate limit and friendly to
  // GitHub. With a token, parallelising is fine; keep it simple.
  for (const repo of repos) {
    const { entries, error } = await fetchOne(repo);
    all.push(...entries);
    if (error) errors.push(error);
  }
  return { entries: all, errors };
}
