/**
 * lib/watchers/sources/huggingface-models.ts — Poll HuggingFace recent
 * model releases, filtered to a curated allow-list of orgs/authors.
 *
 * Endpoint:
 *   GET https://huggingface.co/api/models?sort=lastModified
 *       &direction=-1&limit=50&full=false
 *
 * The allow-list comes from `WatcherConfig.huggingfaceAuthors`. Match
 * is case-insensitive on the model id prefix (`anthropic/`, `meta-llama/`,
 * etc.).
 */
import type { FeedEntry, WatcherConfig } from "../types";

const API_URL =
  "https://huggingface.co/api/models?sort=lastModified&direction=-1&limit=50&full=false";
const FETCH_TIMEOUT_MS = 15_000;

type ApiModel = {
  id: string;
  lastModified?: string;
  pipeline_tag?: string;
  tags?: string[];
  likes?: number;
  downloads?: number;
};

function matchesAllowlist(
  id: string,
  authors: readonly string[],
): boolean {
  const lower = id.toLowerCase();
  return authors.some((a) => lower.startsWith(`${a.toLowerCase()}/`));
}

export async function fetchHuggingFaceModels(
  config: Pick<WatcherConfig, "huggingfaceAuthors">,
): Promise<{ entries: FeedEntry[]; error?: string }> {
  if (config.huggingfaceAuthors.length === 0) {
    return { entries: [] };
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(API_URL, {
      signal: ctrl.signal,
      headers: {
        accept: "application/json",
        "user-agent":
          "HoloflowStudio-PolymathsFeed/0.1 (+https://holoflow.co.uk)",
      },
    });
    if (!resp.ok) {
      return {
        entries: [],
        error: `hf http ${resp.status}`,
      };
    }
    const raw = (await resp.json()) as ApiModel[];
    const filtered = raw.filter((m) =>
      matchesAllowlist(m.id, config.huggingfaceAuthors),
    );
    const entries: FeedEntry[] = filtered.map((m) => ({
      id: `model:huggingface:${m.id}`,
      kind: "model",
      source: "huggingface",
      title: m.id,
      url: `https://huggingface.co/${m.id}`,
      summary: m.pipeline_tag ? `Pipeline: ${m.pipeline_tag}` : undefined,
      publishedAt: m.lastModified
        ? new Date(m.lastModified).toISOString()
        : new Date().toISOString(),
      author: m.id.split("/")[0],
      tags: m.tags?.slice(0, 8),
    }));
    return { entries };
  } catch (err) {
    return {
      entries: [],
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(t);
  }
}
