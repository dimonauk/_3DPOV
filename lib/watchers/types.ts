/**
 * lib/watchers/types.ts — Types for the Polymaths Feed.
 *
 * The /news surface renders the studio's working life as one stream:
 * commits from the three repos (Holoflow, Hangar, Dolly_OS), GitHub
 * releases of every wired dep, AI/ML release news from HuggingFace +
 * arXiv + GitHub-org atom feeds. The shape below is what every
 * source-specific fetcher emits into the orchestrator.
 *
 * Mirrors `lib/social-feeds/types.ts` in spirit but lives in its own
 * module because the entry shape is different — a commit is not a
 * status post, and the source taxonomy is its own.
 */
export type FeedEntryKind =
  | "commit"
  | "release"
  | "paper"
  | "model"
  | "news";

export type FeedSourceKind =
  | "holoflow"
  | "hangar"
  | "dollyos"
  | "github"
  | "huggingface"
  | "arxiv"
  | "org";

export type FeedEntry = {
  /** Stable id, typically `${kind}:${source}:${native-id}`. Dedupe key. */
  id: string;
  kind: FeedEntryKind;
  source: FeedSourceKind;
  /** Short title — the commit message subject, release tag, paper title. */
  title: string;
  /** Canonical URL back to the upstream artefact. */
  url: string;
  /** Optional one-paragraph summary or release-notes excerpt. */
  summary?: string;
  /** Optional thumbnail / OG image. */
  image?: string;
  /** ISO 8601 publish/commit time. */
  publishedAt: string;
  /** Optional human author (commit author, paper first author, org name). */
  author?: string;
  /** Free tags (repo name, model family, arxiv category). */
  tags?: string[];
};

export type WatcherConfig = {
  /** Active GitHub repos to poll for releases. */
  githubRepos: Array<{ owner: string; repo: string; note?: string }>;
  /** GitHub orgs to poll via `.atom` feed. */
  githubOrgs: string[];
  /** HuggingFace allow-list (case-insensitive prefix on the model id). */
  huggingfaceAuthors: string[];
  /** arXiv categories to query, e.g. `cs.GR`, `cs.CV`, `cs.LG`. */
  arxivCategories: string[];
};

export type WatcherStoreFile = {
  last_refresh: string;
  entries: FeedEntry[];
};
