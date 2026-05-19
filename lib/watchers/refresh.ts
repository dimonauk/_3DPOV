/**
 * lib/watchers/refresh.ts — Orchestrate one polymaths-feed refresh.
 *
 * Mirrors `lib/social-feeds/refresh.ts`. Runs every source in
 * sequence, merges into the existing store via `appendEntries`. Each
 * source is wrapped in try/catch so one failing fetcher doesn't kill
 * the run. Returns a `RefreshSummary` for the cron route to log.
 *
 * Sources:
 *   1. Holoflow public commits (GitHub API)
 *   2. GitHub Releases for every repo in OPEN-SOURCE-STACK.md
 *   3. HuggingFace recent models (filtered by allow-list)
 *   4. arXiv recent papers (cs.GR / cs.CV / cs.LG)
 *   5. GitHub org atom feeds (anthropic, openai, vercel, pmndrs, …)
 *
 * Hangar + DollyOS commits arrive via /api/internal/feed-ingest from
 * the bench-side poller — not pulled here.
 */
import { watcherConfig } from "./config";
import { addSuggestion } from "./install-queue";
import { getWiredRepos } from "./parse-oss-stack";
import { fetchArxiv } from "./sources/arxiv";
import { fetchGithubReleases } from "./sources/github-releases";
import { fetchHoloflowCommits } from "./sources/holoflow-git";
import { fetchHuggingFaceModels } from "./sources/huggingface-models";
import { fetchOrgAtoms } from "./sources/org-atom";
import { appendEntries } from "./store";
import type { FeedEntry } from "./types";

export type SourceResult = {
  source: string;
  entries: number;
  errors: string[];
};

export type RefreshSummary = {
  last_refresh: string;
  sources: SourceResult[];
  total_entries_fetched: number;
  total_entries_stored: number;
};

export async function refreshWatchers(): Promise<RefreshSummary> {
  const sources: SourceResult[] = [];
  const all: FeedEntry[] = [];

  await runSource(sources, "holoflow-commits", async () => {
    const r = await fetchHoloflowCommits();
    return { entries: r.entries, errors: r.error ? [r.error] : [] };
  }, all);

  await runSource(sources, "github-releases", async () => {
    const repos = await getWiredRepos();
    const r = await fetchGithubReleases(repos);
    // For "lined up" deps (not yet wired into package.json), queue a
    // pnpm-add suggestion in the operator console so the studio can
    // decide whether to bring the new release in.
    const linedUpByKey = new Map<string, (typeof repos)[number]>();
    for (const rep of repos) {
      if (rep.linedUp) linedUpByKey.set(`${rep.owner}/${rep.repo}`, rep);
    }
    for (const entry of r.entries) {
      const matchTag = entry.tags?.find((t) => t.includes("/"));
      if (!matchTag) continue;
      const rep = linedUpByKey.get(matchTag);
      if (!rep) continue;
      try {
        await addSuggestion({
          id: entry.id,
          owner: rep.owner,
          repo: rep.repo,
          name: rep.name,
          tag: entry.title,
          section: rep.section,
        });
      } catch {
        /* suggestion queueing is best-effort */
      }
    }
    return { entries: r.entries, errors: r.errors };
  }, all);

  await runSource(sources, "huggingface-models", async () => {
    const r = await fetchHuggingFaceModels(watcherConfig);
    return { entries: r.entries, errors: r.error ? [r.error] : [] };
  }, all);

  await runSource(sources, "arxiv", async () => {
    const r = await fetchArxiv(watcherConfig);
    return { entries: r.entries, errors: r.error ? [r.error] : [] };
  }, all);

  await runSource(sources, "github-orgs", async () => {
    const r = await fetchOrgAtoms(watcherConfig.githubOrgs);
    return { entries: r.entries, errors: r.errors };
  }, all);

  const totalStored = await appendEntries(all);

  return {
    last_refresh: new Date().toISOString(),
    sources,
    total_entries_fetched: all.length,
    total_entries_stored: totalStored,
  };
}

async function runSource(
  results: SourceResult[],
  name: string,
  fn: () => Promise<{ entries: FeedEntry[]; errors: string[] }>,
  collector: FeedEntry[],
): Promise<void> {
  try {
    const r = await fn();
    collector.push(...r.entries);
    results.push({ source: name, entries: r.entries.length, errors: r.errors });
  } catch (err) {
    results.push({
      source: name,
      entries: 0,
      errors: [err instanceof Error ? err.message : String(err)],
    });
  }
}
