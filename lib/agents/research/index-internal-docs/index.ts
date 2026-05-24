import "server-only";

/**
 * lib/agents/research/index-internal-docs/index.ts — Public entry.
 *
 * Scans the repo's documentation directories, classifies each doc to
 * one or more specialists, and writes a ResearchEntry per (doc,
 * specialist) pair via `recordResearch`.
 *
 * Posture: idempotent. `recordResearch` dedupes by (agentSlug, source)
 * so re-running is safe — it updates `lastConsultedAt` instead of
 * producing duplicates.
 *
 * Composition:
 *   ./config.ts    SOURCE_ROOTS, AGENTS_MD_PATHS, KNOWN_SPECIALISTS,
 *                  KEYWORD_PROFILES, BUCKET_DEFAULTS, IMPORTANCE_BY_BUCKET
 *   ./parsers.ts   ParsedDoc + parseMarkdown / parseTsxEntry
 *   ./classify.ts  topicForSource, inferTags, scoreForSpecialist,
 *                  pickSpecialists, summaryForSpecialist
 *   ./walk.ts      safeStat, walkDirectory
 *
 * This file owns the orchestration only.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { createLogger } from "../../../log";
import { recordResearch } from "../store.server";
import type { ResearchEntry } from "../types";

import {
  AGENTS_MD_PATHS,
  IMPORTANCE_BY_BUCKET,
  KNOWN_SPECIALISTS,
  SOURCE_ROOTS,
  type SourceBucket,
  type SpecialistSlug,
} from "./config";
import {
  inferTags,
  pickSpecialists,
  summaryForSpecialist,
  topicForSource,
} from "./classify";
import { parseMarkdown, parseTsxEntry } from "./parsers";
import { safeStat, walkDirectory } from "./walk";

const log = createLogger("agents.research.indexer");

export type IndexInternalDocsResult = {
  /** Total documents scanned across all source roots. */
  scanned: number;
  /** Total (specialist, doc) entries written. */
  indexed: number;
  /** Per-specialist breakdown of entries written. */
  perSpecialist: Record<string, number>;
  /** Source roots that didn't exist on disk (skipped). */
  missingRoots: string[];
  /** When the run completed. ISO. */
  finishedAt: string;
};

/**
 * Run the indexer end-to-end. Pass `specialistSlugs` to restrict
 * ownership to a subset — defaults to all five.
 */
export async function indexInternalDocs(args?: {
  specialistSlugs?: readonly string[];
}): Promise<IndexInternalDocsResult> {
  const allowed = new Set<SpecialistSlug>(
    (args?.specialistSlugs ?? KNOWN_SPECIALISTS).filter(
      (s): s is SpecialistSlug =>
        (KNOWN_SPECIALISTS as readonly string[]).includes(s),
    ),
  );

  const perSpecialist: Record<string, number> = {};
  for (const s of allowed) perSpecialist[s] = 0;

  const missingRoots: string[] = [];
  let scanned = 0;
  let indexed = 0;

  for (const source of SOURCE_ROOTS) {
    const stat = await safeStat(source.root);
    if (!stat || !stat.isDirectory()) {
      missingRoots.push(source.root);
      log.warn("source root missing", { root: source.root });
      continue;
    }
    const files = await walkDirectory(source.root, source.extensions);
    for (const file of files) {
      const count = await indexOneFile(
        file,
        source.bucket,
        allowed,
        perSpecialist,
      );
      scanned += 1;
      indexed += count;
    }
  }

  // AGENTS.md files (flat list, not a tree walk).
  for (const file of AGENTS_MD_PATHS) {
    const stat = await safeStat(file);
    if (!stat || !stat.isFile()) continue;
    const count = await indexOneFile(file, "agents-md", allowed, perSpecialist);
    scanned += 1;
    indexed += count;
  }

  const finishedAt = new Date().toISOString();
  log.info("indexInternalDocs complete", {
    scanned,
    indexed,
    perSpecialist,
    missingRootsCount: missingRoots.length,
  });
  return { scanned, indexed, perSpecialist, missingRoots, finishedAt };
}

/**
 * Process one file: parse, classify, write a ResearchEntry per
 * matched specialist. Returns the number of entries written.
 */
async function indexOneFile(
  absPath: string,
  bucket: SourceBucket,
  allowed: ReadonlySet<SpecialistSlug>,
  perSpecialist: Record<string, number>,
): Promise<number> {
  let raw: string;
  try {
    raw = await fs.readFile(absPath, "utf8");
  } catch (err) {
    log.warn("read failed; skipping", {
      absPath,
      err: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }

  const filenameTitle = path
    .basename(absPath, path.extname(absPath))
    .replace(/[-_]/g, " ");
  const ext = path.extname(absPath).toLowerCase();
  const parsed =
    ext === ".tsx"
      ? parseTsxEntry(raw, filenameTitle)
      : parseMarkdown(raw, filenameTitle);

  const specialists = pickSpecialists(absPath, bucket, parsed, allowed);
  if (specialists.length === 0) return 0;

  const topic = topicForSource(absPath, bucket);
  const tags = inferTags(absPath, bucket, parsed);
  const importance = IMPORTANCE_BY_BUCKET[bucket];

  let written = 0;
  for (const specialist of specialists) {
    const source = `internal:${absPath.replace(/\\/g, "/")}`;
    const entry: Omit<ResearchEntry, "id" | "collectedAt" | "lastConsultedAt"> = {
      agentSlug: specialist,
      title: parsed.title.slice(0, 200),
      source,
      topic,
      summary: summaryForSpecialist(specialist, parsed),
      content: parsed.excerptText,
      tags,
      importance,
      citations: [],
    };
    try {
      await recordResearch(entry);
      perSpecialist[specialist] = (perSpecialist[specialist] ?? 0) + 1;
      written += 1;
    } catch (err) {
      log.warn("recordResearch failed", {
        specialist,
        source,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return written;
}
