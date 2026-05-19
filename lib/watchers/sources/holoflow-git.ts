/**
 * lib/watchers/sources/holoflow-git.ts — Pull recent commits from the
 * Holoflow public repo via the GitHub Commits API.
 *
 * Holoflow has a public remote (`dimonauk/_3DPOV`) so we don't need
 * the bench-bridge for it. Endpoint:
 *   GET https://api.github.com/repos/dimonauk/_3DPOV/commits?per_page=30
 *
 * Same rate-limit caveats as `github-releases.ts` — wire `GITHUB_TOKEN`
 * for production.
 */
import type { FeedEntry } from "../types";

const OWNER = "dimonauk";
const REPO = "_3DPOV";
const PER_PAGE = 30;
const FETCH_TIMEOUT_MS = 12_000;

type ApiCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { name?: string; date?: string } | null;
    committer?: { date?: string } | null;
  };
  author?: { login?: string } | null;
};

function token(): string | undefined {
  const t = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  return t && t.trim() ? t.trim() : undefined;
}

export async function fetchHoloflowCommits(): Promise<{
  entries: FeedEntry[];
  error?: string;
}> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=${PER_PAGE}`;
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
    if (!resp.ok) {
      return { entries: [], error: `holoflow-commits http ${resp.status}` };
    }
    const raw = (await resp.json()) as ApiCommit[];
    const out: FeedEntry[] = raw.map((c) => {
      const lines = c.commit.message.split("\n");
      const subject = lines[0] ?? "(no message)";
      const body = lines.slice(1).join("\n").trim();
      const date =
        c.commit.author?.date ??
        c.commit.committer?.date ??
        new Date().toISOString();
      return {
        id: `commit:holoflow:${c.sha}`,
        kind: "commit",
        source: "holoflow",
        title: subject.slice(0, 200),
        url: c.html_url,
        summary: body ? body.slice(0, 1200) : undefined,
        publishedAt: new Date(date).toISOString(),
        author: c.author?.login ?? c.commit.author?.name,
        tags: ["holoflow", `${OWNER}/${REPO}`],
      };
    });
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
