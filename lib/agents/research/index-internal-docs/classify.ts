/**
 * lib/agents/research/index-internal-docs/classify.ts
 *
 * Pure classification of a parsed doc:
 *   - topicForSource:  path + bucket -> canonical topic string
 *   - inferTags:       path + bucket + parsed -> tag set
 *   - scoreForSpecialist: keyword overlap score
 *   - pickSpecialists: bucket-defaults ∪ keyword-matches
 *   - summaryForSpecialist: cheap summary (no LLM call)
 *
 * Stateless. Takes inputs, returns derivations. Tested in isolation
 * without touching the filesystem.
 */

import path from "node:path";

import {
  BUCKET_DEFAULTS,
  KEYWORD_PROFILES,
  KEYWORD_SCORE_THRESHOLD,
  KNOWN_SPECIALISTS,
  REPO_ROOT,
  type SourceBucket,
  type SpecialistSlug,
} from "./config";
import type { ParsedDoc } from "./parsers";

/**
 * Canonical topic from path + bucket. The topic is operator-friendly
 * and shows up in histograms, so we lean on the directory structure
 * rather than synthesising from content.
 */
export function topicForSource(absPath: string, bucket: SourceBucket): string {
  const base = path.basename(absPath, path.extname(absPath));
  if (bucket === "synthesis") {
    return `synthesis-${base.replace(/^\d+-/, "")}`;
  }
  if (bucket === "agents-md") {
    const parent = path.basename(path.dirname(absPath));
    return parent === "_3DPOV" || parent === path.basename(REPO_ROOT)
      ? "agents-root"
      : `agents-${parent}`;
  }
  if (bucket === "articles") return `article-${base}`;
  if (bucket === "journal") return `journal-${base}`;
  if (bucket === "tutorials") return `tutorial-${base}`;
  return `docs-${base.toLowerCase()}`;
}

/**
 * Heuristic tag set for the entry. Bucket label, filename tokens,
 * plus any frontmatter tags.
 */
export function inferTags(
  absPath: string,
  bucket: SourceBucket,
  parsed: ParsedDoc,
): string[] {
  const fromFile = path
    .basename(absPath, path.extname(absPath))
    .toLowerCase()
    .split(/[-_]/)
    .filter((t) => t.length > 2 && !/^\d+$/.test(t));
  return [bucket, ...fromFile, ...parsed.tags];
}

/**
 * Count keyword occurrences in (filename, title, excerpt) for a
 * specialist. Each keyword contributes at most 1 to the score.
 */
export function scoreForSpecialist(
  absPath: string,
  parsed: ParsedDoc,
  specialist: SpecialistSlug,
): number {
  const haystack = [
    absPath.toLowerCase(),
    parsed.title.toLowerCase(),
    parsed.firstPara.toLowerCase(),
    parsed.excerptText.toLowerCase(),
  ].join(" \n ");
  let score = 0;
  for (const kw of KEYWORD_PROFILES[specialist]) {
    if (haystack.includes(kw)) score += 1;
  }
  return score;
}

/**
 * Which specialists should own this doc? Union of:
 *   (a) bucket defaults (always-on for that bucket)
 *   (b) keyword-matched specialists above the threshold
 */
export function pickSpecialists(
  absPath: string,
  bucket: SourceBucket,
  parsed: ParsedDoc,
  allowed: ReadonlySet<SpecialistSlug>,
): SpecialistSlug[] {
  const out = new Set<SpecialistSlug>();
  for (const s of BUCKET_DEFAULTS[bucket]) {
    if (allowed.has(s)) out.add(s);
  }
  for (const s of KNOWN_SPECIALISTS) {
    if (!allowed.has(s)) continue;
    if (out.has(s)) continue;
    if (scoreForSpecialist(absPath, parsed, s) >= KEYWORD_SCORE_THRESHOLD) {
      out.add(s);
    }
  }
  return [...out];
}

/**
 * Specialist-facing summary. No LLM in the indexer (it runs sync
 * under a route's maxDuration); the first paragraph is the honest
 * stand-in. The chat path can upgrade summaries via write-back later.
 */
export function summaryForSpecialist(
  specialist: SpecialistSlug,
  parsed: ParsedDoc,
): string {
  const para = parsed.firstPara.trim();
  if (!para) return `[${specialist}] indexed but no excerpt was extractable.`;
  return para.length > 320 ? `${para.slice(0, 317)}...` : para;
}
