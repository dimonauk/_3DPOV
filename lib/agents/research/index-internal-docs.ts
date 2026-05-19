import "server-only";

/**
 * lib/agents/research/index-internal-docs.ts — One-shot indexer that
 * seeds each specialist with the Holoflow docs they should "know".
 *
 * One-line role: scan the repo's documentation directories, decide
 * which specialist should own each doc, and write a `ResearchEntry`
 * per (doc, specialist) pair through `recordResearch`.
 *
 * Posture: idempotent. `recordResearch` dedupes by (agentSlug,
 * source), so re-running the indexer is safe — it updates
 * `lastConsultedAt` instead of producing duplicates.
 *
 * Ownership heuristics — applied per-specialist, in order:
 *
 *   - aura — voice canon, character bibles, Princess docs, Charming
 *     Academy, Mary Poppins refs, anything in /aura, anything about
 *     emotion / story / character.
 *   - marcel — architecture docs, capability registry, deploy
 *     gotchas, API runbooks, anything operations-shaped.
 *   - coco — voice register, brand docs, aesthetic articles, the
 *     studio's tone-of-voice corpus.
 *   - scribe — codex entries, all articles, all journal, all
 *     tutorials, AGENTS.md files (the documentation registry itself
 *     is the Scribe's beat).
 *   - penny — pixel docs, sprite-/animation-related codex entries,
 *     anything about 2D / pixel-art / sprite work.
 *
 * Importance is fixed by source bucket:
 *   - 0.8 — synthesis docs (fact-anchored canon)
 *   - 0.6 — runbooks, capability docs, architecture docs, AGENTS.md
 *   - 0.4 — articles, journal, tutorials
 *
 * The classifier is lenient: a doc can land in multiple specialists'
 * libraries when its keywords cross domains. The Scribe is the
 * fall-through — anything classifiable as "this is documentation"
 * lands with the Scribe regardless of who else gets a copy.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { createLogger } from "../../log";
import { recordResearch } from "./store.server";
import type { ResearchEntry } from "./types";

const log = createLogger("agents.research.indexer");

// ── Directories the indexer scans ─────────────────────────────────────

/**
 * Source directories the indexer walks. Each entry pairs a root path
 * with the file extensions to read and the source-bucket label that
 * determines importance.
 */
type SourceRoot = {
  /** Absolute path. Missing roots are skipped silently with a log. */
  root: string;
  /** File extensions to include — lowercase, with the dot. */
  extensions: readonly string[];
  /** Source-bucket — drives importance + the "source:" prefix. */
  bucket: "synthesis" | "docs" | "agents-md" | "articles" | "journal" | "tutorials";
};

// In Next.js/Vercel server runtime, `process.cwd()` is the project root —
// matches the rest of the codebase (lib/cards/templates-server.ts,
// lib/ar/cards.ts, etc.). `__dirname` is unreliable across the various
// bundling modes Next uses for app-router server code.
const REPO_ROOT = process.cwd();

const SOURCE_ROOTS: SourceRoot[] = [
  {
    root: path.join(REPO_ROOT, "docs"),
    extensions: [".md"],
    bucket: "docs",
  },
  {
    root: "C:\\dimonauk\\_3DPOV\\synthesis",
    extensions: [".md"],
    bucket: "synthesis",
  },
  {
    root: path.join(REPO_ROOT, "components", "articles", "entries"),
    extensions: [".tsx"],
    bucket: "articles",
  },
  {
    root: path.join(REPO_ROOT, "components", "journal", "entries"),
    extensions: [".tsx"],
    bucket: "journal",
  },
  {
    root: path.join(REPO_ROOT, "components", "tutorials", "entries"),
    extensions: [".tsx"],
    bucket: "tutorials",
  },
];

/** AGENTS.md files — small and scattered. Walked separately so the
 *  recursion is bounded to the top of the repo. */
const AGENTS_MD_PATHS: string[] = [
  path.join(REPO_ROOT, "AGENTS.md"),
  path.join(REPO_ROOT, "app", "AGENTS.md"),
  path.join(REPO_ROOT, "app", "api", "AGENTS.md"),
  path.join(REPO_ROOT, "components", "AGENTS.md"),
  path.join(REPO_ROOT, "docs", "AGENTS.md"),
  path.join(REPO_ROOT, "lib", "AGENTS.md"),
  path.join(REPO_ROOT, "scripts", "AGENTS.md"),
];

// ── Specialists and their interest profiles ───────────────────────────

const KNOWN_SPECIALISTS = ["aura", "coco", "marcel", "scribe", "penny"] as const;
type SpecialistSlug = (typeof KNOWN_SPECIALISTS)[number];

/**
 * Keyword profiles. The classifier scores each doc against each
 * specialist by counting how many of the specialist's keywords appear
 * in the doc text (filename + frontmatter + first 3000 chars of body).
 * Above the threshold => specialist gets a copy. The Scribe also gets
 * everything via the fall-through rule.
 */
const KEYWORD_PROFILES: Record<SpecialistSlug, readonly string[]> = {
  aura: [
    "aura",
    "void princess",
    "princess",
    "mary poppins",
    "charming academy",
    "nanny",
    "vrm",
    "voice register",
    "character",
    "cast bible",
    "emotion",
    "narrative",
    "story",
    "personality",
    "voice canon",
    "aura-test-chamber",
  ],
  coco: [
    "coco",
    "brand",
    "aesthetic",
    "voice",
    "register",
    "copy",
    "tone",
    "catalogue",
    "manifesto",
    "tagline",
    "in-brand",
    "language",
  ],
  marcel: [
    "marcel",
    "architecture",
    "capability",
    "runbook",
    "api",
    "deploy",
    "vercel",
    "firebase",
    "firestore",
    "infrastructure",
    "pipeline",
    "stack",
    "operations",
    "shopify",
    "stripe",
    "patreon",
    "google",
    "webhook",
    "blob",
    "config",
    "env",
    "ci",
    "build",
    "splat",
    "sharp",
    "ffmpeg",
    "blender",
    "comfyui",
    "ar cards",
    "webxr",
    "next.js",
  ],
  scribe: [
    "scribe",
    "codex",
    "article",
    "journal",
    "tutorial",
    "documentation",
    "doc",
    "essay",
    "writing",
    "registry",
    "agents.md",
    "guide",
    "primer",
  ],
  penny: [
    "penny",
    "pixel",
    "pixelorama",
    "sprite",
    "pixel art",
    "8-bit",
    "16-bit",
    "tile",
    "tilemap",
    "animation",
    "frame-by-frame",
    "low-poly",
    "voxel",
  ],
};

/**
 * Specialists that always get a doc from a given source bucket,
 * regardless of keyword score. The Scribe is the documentation
 * canon; Marcel is the operational canon.
 */
const BUCKET_DEFAULTS: Record<SourceRoot["bucket"], SpecialistSlug[]> = {
  synthesis: ["scribe", "marcel"],
  docs: ["scribe"],
  "agents-md": ["scribe", "marcel"],
  articles: ["scribe"],
  journal: ["scribe"],
  tutorials: ["scribe"],
};

const IMPORTANCE_BY_BUCKET: Record<SourceRoot["bucket"], number> = {
  synthesis: 0.8,
  docs: 0.6,
  "agents-md": 0.6,
  articles: 0.4,
  journal: 0.4,
  tutorials: 0.4,
};

const KEYWORD_SCORE_THRESHOLD = 1;

// ── File parsing ──────────────────────────────────────────────────────

type ParsedDoc = {
  /** Display title. */
  title: string;
  /** First paragraph or excerpt. Becomes the summary. */
  firstPara: string;
  /** Tags extracted from frontmatter / heuristics. */
  tags: string[];
  /** First ~3000 chars of body — used for content + classification. */
  excerptText: string;
};

/**
 * Pull a YAML-ish frontmatter block (`---\n...\n---`) from the head
 * of a markdown file. Returns the parsed key/value object and the
 * remaining body. We do this by hand because the indexer is the only
 * caller and we don't want a frontmatter parser as a dep just for
 * this. Strings only — frontmatter beyond strings is rare here.
 */
function splitFrontmatter(raw: string): {
  fm: Record<string, string | string[]>;
  body: string;
} {
  if (!raw.startsWith("---")) return { fm: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { fm: {}, body: raw };
  const block = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const fm: Record<string, string | string[]> = {};
  for (const line of block.split(/\r?\n/)) {
    const m = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1];
    const valueRaw = (m[2] ?? "").trim();
    if (!key) continue;
    if (valueRaw.startsWith("[") && valueRaw.endsWith("]")) {
      const inner = valueRaw.slice(1, -1);
      fm[key] = inner
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      fm[key] = valueRaw.replace(/^["']|["']$/g, "");
    }
  }
  return { fm, body };
}

function parseMarkdown(raw: string, filenameTitle: string): ParsedDoc {
  const { fm, body } = splitFrontmatter(raw);
  let title = filenameTitle;
  if (typeof fm.title === "string" && fm.title) title = fm.title;
  else {
    const headingMatch = /^#\s+(.+)$/m.exec(body);
    if (headingMatch && headingMatch[1]) title = headingMatch[1].trim();
  }
  // First non-empty paragraph after stripping headings.
  const paraSource = body.replace(/^#+\s.*$/gm, "").trim();
  const firstPara = (paraSource.split(/\n\s*\n/)[0] ?? "").trim().slice(0, 500);
  const tags = Array.isArray(fm.tags)
    ? fm.tags
    : typeof fm.tags === "string"
    ? fm.tags.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    title,
    firstPara,
    tags,
    excerptText: body.slice(0, 3000),
  };
}

/**
 * Tutorial / article / journal entries live in .tsx files. They
 * export a `const entry: Entry = { slug, title, date, excerpt, ... }`
 * record after the React body component. We don't compile them —
 * regex-extract the literal fields we need. The site's entry-record
 * style is consistent enough that this works for all 100+ files.
 */
function parseTsxEntry(raw: string, filenameTitle: string): ParsedDoc {
  const title = extractTsxStringField(raw, "title") ?? filenameTitle;
  const excerpt = extractTsxStringField(raw, "excerpt") ?? "";
  // The body component holds the prose. Pull the inner JSX text as
  // a rough content blob — strip JSX tags + entity refs.
  const bodyMatch = /export default function[\s\S]*?return\s*\(\s*([\s\S]*?)\s*\);?\s*\}/m.exec(
    raw,
  );
  const bodyJsx = bodyMatch ? bodyMatch[1] : "";
  const bodyText = (bodyJsx ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);
  return {
    title,
    firstPara: excerpt || bodyText.slice(0, 500),
    tags: [],
    excerptText: bodyText,
  };
}

function extractTsxStringField(raw: string, key: string): string | null {
  const re = new RegExp(`${key}\\s*:\\s*([\"\\\`])((?:\\\\.|(?!\\1).)*?)\\1`);
  const m = re.exec(raw);
  return m && typeof m[2] === "string" ? m[2] : null;
}

// ── Topic + tag inference ─────────────────────────────────────────────

/**
 * Map a file path to a canonical topic. The topic is operator-
 * friendly and shows up in the histogram, so we lean on the directory
 * structure rather than synthesising from content.
 */
function topicForSource(absPath: string, bucket: SourceRoot["bucket"]): string {
  const base = path.basename(absPath, path.extname(absPath));
  if (bucket === "synthesis") {
    // "01-loop-as-keystone" → "synthesis-loop-as-keystone"
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
  // docs/
  return `docs-${base.toLowerCase()}`;
}

/**
 * Heuristic tag set for the entry. Adds the bucket label and any
 * frontmatter tags; lightly enriches from the filename.
 */
function inferTags(absPath: string, bucket: SourceRoot["bucket"], parsed: ParsedDoc): string[] {
  const fromFile = path
    .basename(absPath, path.extname(absPath))
    .toLowerCase()
    .split(/[-_]/)
    .filter((t) => t.length > 2 && !/^\d+$/.test(t));
  return [bucket, ...fromFile, ...parsed.tags];
}

/**
 * Score a doc against a specialist by counting keyword occurrences
 * across (filename, title, excerpt). Returns the integer score.
 */
function scoreForSpecialist(
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
 * Decide which specialists should own this doc. Returns the union of
 * (a) the bucket defaults and (b) keyword-matched specialists above
 * the threshold.
 */
function pickSpecialists(
  absPath: string,
  bucket: SourceRoot["bucket"],
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
 * Compose the specialist-facing summary. We don't have a model in the
 * indexer (this runs sync under a route's maxDuration); the first
 * paragraph is honest stand-in. The chat-driven path can later upgrade
 * the summary via a write-back.
 */
function summaryForSpecialist(
  specialist: SpecialistSlug,
  parsed: ParsedDoc,
): string {
  const para = parsed.firstPara.trim();
  if (!para) return `[${specialist}] indexed but no excerpt was extractable.`;
  return para.length > 320 ? `${para.slice(0, 317)}...` : para;
}

// ── Filesystem walk ───────────────────────────────────────────────────

async function safeStat(p: string): Promise<import("node:fs").Stats | null> {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

async function walkDirectory(
  root: string,
  extensions: readonly string[],
): Promise<string[]> {
  const out: string[] = [];
  const stat = await safeStat(root);
  if (!stat || !stat.isDirectory()) return out;
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(root, ent.name);
    if (ent.isDirectory()) {
      const nested = await walkDirectory(full, extensions);
      out.push(...nested);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (extensions.includes(ext)) out.push(full);
    }
  }
  return out;
}

// ── Public entry point ────────────────────────────────────────────────

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
    (args?.specialistSlugs ?? KNOWN_SPECIALISTS).filter((s): s is SpecialistSlug =>
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
      const count = await indexOneFile(file, source.bucket, allowed, perSpecialist);
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
 * Process one file: parse, classify, write a `ResearchEntry` per
 * matched specialist. Returns the number of entries written.
 */
async function indexOneFile(
  absPath: string,
  bucket: SourceRoot["bucket"],
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
    ext === ".tsx" ? parseTsxEntry(raw, filenameTitle) : parseMarkdown(raw, filenameTitle);

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
