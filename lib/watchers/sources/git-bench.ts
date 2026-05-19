/**
 * lib/watchers/sources/git-bench.ts — Ingest pre-formatted git-log
 * entries POSTed from the bench-side script.
 *
 * Hangar (`D:\The_Hangar`) and DollyOS (`D:\The_Hangar\Dolly_OS`)
 * don't have public GitHub remotes, so we can't poll the API. Instead,
 * a tiny Node script (`scripts/bench/poll-git-activity.mjs`) runs on
 * Sovereign-PC, reads `git log` for each repo, and POSTs the diff
 * since the last run to `/api/internal/feed-ingest`. This file
 * validates + normalises each ingested batch into `FeedEntry`s.
 *
 * Validation is intentionally permissive — we trust the bench-side
 * caller (bearer-token gated), but still normalise dates and clamp
 * field lengths so a runaway log entry can't blow up the store.
 */
import { z } from "zod";

import type { FeedEntry, FeedSourceKind } from "../types";

const SOURCE_ENUM: FeedSourceKind[] = [
  "holoflow",
  "hangar",
  "dollyos",
];

const IngestEntrySchema = z.object({
  source: z.enum(SOURCE_ENUM as [FeedSourceKind, ...FeedSourceKind[]]),
  sha: z.string().min(7).max(64),
  title: z.string().min(1).max(280),
  body: z.string().max(2000).optional(),
  author: z.string().max(120).optional(),
  publishedAt: z.string().min(10),
  /** Branch the commit landed on. */
  branch: z.string().max(120).optional(),
  /** Optional URL — if a repo has a remote, the script can format it. */
  url: z.string().url().optional(),
});

export const IngestBatchSchema = z.object({
  entries: z.array(IngestEntrySchema).max(500),
});

export type IngestBatch = z.infer<typeof IngestBatchSchema>;
export type IngestEntry = z.infer<typeof IngestEntrySchema>;

function fallbackUrl(source: FeedSourceKind, sha: string): string {
  switch (source) {
    case "holoflow":
      return `https://github.com/dimonauk/_3DPOV/commit/${sha}`;
    case "hangar":
    case "dollyos":
    default:
      // Private repos — no public URL. Anchor on the internal admin.
      return `/admin/watchers#commit-${sha}`;
  }
}

export function normaliseIngestBatch(batch: IngestBatch): FeedEntry[] {
  const out: FeedEntry[] = [];
  for (const e of batch.entries) {
    const published = new Date(e.publishedAt);
    if (Number.isNaN(published.getTime())) continue;
    const tags: string[] = [e.source];
    if (e.branch) tags.push(`branch:${e.branch}`);
    out.push({
      id: `commit:${e.source}:${e.sha}`,
      kind: "commit",
      source: e.source,
      title: e.title,
      url: e.url ?? fallbackUrl(e.source, e.sha),
      summary: e.body,
      publishedAt: published.toISOString(),
      author: e.author,
      tags,
    });
  }
  return out;
}
