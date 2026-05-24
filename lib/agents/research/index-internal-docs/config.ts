/**
 * lib/agents/research/index-internal-docs/config.ts
 *
 * Static configuration for the docs indexer: which directories to
 * scan, which specialists exist, what keywords each specialist cares
 * about, which buckets get auto-assigned to which specialists, and
 * how importance maps from bucket.
 *
 * Pure data — no logic, no IO. The classifier and the orchestrator
 * import from here. Content registry, exempt from the 300-line cap
 * spirit (this file is shorter, but the principle applies).
 */

import path from "node:path";

export const REPO_ROOT = process.cwd();

export type SourceBucket =
  | "synthesis"
  | "docs"
  | "agents-md"
  | "articles"
  | "journal"
  | "tutorials";

export type SourceRoot = {
  root: string;
  extensions: readonly string[];
  bucket: SourceBucket;
};

export const SOURCE_ROOTS: SourceRoot[] = [
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
export const AGENTS_MD_PATHS: string[] = [
  path.join(REPO_ROOT, "AGENTS.md"),
  path.join(REPO_ROOT, "app", "AGENTS.md"),
  path.join(REPO_ROOT, "app", "api", "AGENTS.md"),
  path.join(REPO_ROOT, "components", "AGENTS.md"),
  path.join(REPO_ROOT, "docs", "AGENTS.md"),
  path.join(REPO_ROOT, "lib", "AGENTS.md"),
  path.join(REPO_ROOT, "scripts", "AGENTS.md"),
];

export const KNOWN_SPECIALISTS = [
  "aura",
  "coco",
  "marcel",
  "scribe",
  "penny",
] as const;
export type SpecialistSlug = (typeof KNOWN_SPECIALISTS)[number];

/**
 * Keyword profiles. The classifier scores each doc against each
 * specialist by counting how many of the specialist's keywords appear
 * in the doc text (filename + frontmatter + first 3000 chars of body).
 * Above the threshold => specialist gets a copy. The Scribe also gets
 * everything via the fall-through rule in BUCKET_DEFAULTS.
 */
export const KEYWORD_PROFILES: Record<SpecialistSlug, readonly string[]> = {
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
export const BUCKET_DEFAULTS: Record<SourceBucket, SpecialistSlug[]> = {
  synthesis: ["scribe", "marcel"],
  docs: ["scribe"],
  "agents-md": ["scribe", "marcel"],
  articles: ["scribe"],
  journal: ["scribe"],
  tutorials: ["scribe"],
};

export const IMPORTANCE_BY_BUCKET: Record<SourceBucket, number> = {
  synthesis: 0.8,
  docs: 0.6,
  "agents-md": 0.6,
  articles: 0.4,
  journal: 0.4,
  tutorials: 0.4,
};

export const KEYWORD_SCORE_THRESHOLD = 1;
