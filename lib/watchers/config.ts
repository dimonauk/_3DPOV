/**
 * lib/watchers/config.ts — Curated allow-lists for the polymaths-feed
 * watcher.
 *
 * GitHub repos are pulled live from `OPEN-SOURCE-STACK.md` via
 * `parse-oss-stack.ts` — that's the canonical place. The lists below
 * are the things the doc can't infer: which HuggingFace orgs to follow,
 * which arXiv categories, which GitHub orgs to atom-poll.
 *
 * Keep these short. Surface noise is the enemy.
 */
import type { WatcherConfig } from "./types";

export const watcherConfig: WatcherConfig = {
  // Filled live by parse-oss-stack — kept empty here so callers know to
  // pull from the parser instead of hard-coding.
  githubRepos: [],

  /** Org-level atom feeds: catches releases the repo-level poll misses
   *  (e.g. new repos appearing in the org). */
  githubOrgs: [
    "anthropics",
    "openai",
    "google-deepmind",
    "meta-llama",
    "Stability-AI",
    "mistralai",
    "huggingface",
    "vercel",
    "pmndrs",
    "mrdoob",
    "comfyanonymous",
  ],

  /** HuggingFace allow-list — matched against the model-id prefix. */
  huggingfaceAuthors: [
    "anthropic",
    "openai",
    "google",
    "meta-llama",
    "stabilityai",
    "mistralai",
    "microsoft",
    "Qwen",
    "deepseek-ai",
    "tencent",
    "ali-vilab",
    "black-forest-labs",
    "Kijai",
    "tencent-Hunyuan3D",
  ],

  /** arXiv categories — graphics, vision, machine-learning. */
  arxivCategories: ["cs.GR", "cs.CV", "cs.LG"],
};
