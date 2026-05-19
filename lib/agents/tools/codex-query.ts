import "server-only";

/**
 * lib/agents/tools/codex-query.ts — `codex.query` tool.
 *
 * Search the studio's codex registry. The codex is a curated
 * knowledge index of techniques, apparatus, and material — see
 * `lib/codex.tsx`. The Scribe and any specialist explaining studio
 * canon use this tool to pull the canonical summary + slug for a
 * topic without inventing prose.
 *
 * # Filters
 *
 *  - `q` — case-insensitive substring match against title + summary.
 *  - `category` — exact match against `CodexCategory`. Validated.
 *  - `tag` — match against the entry's `seeAlso` list (effectively a
 *    "what mentions X" filter).
 *
 * If all three are absent we return the first `limit` entries in the
 * codex's natural (date-descending) order.
 *
 * # Output
 *
 * `{ count, entries: [{ slug, title, category, summary, href, date }] }`.
 * `href` is the public route — `/codex/<slug>` — so a specialist can
 * cite the studio page directly.
 */

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.codex-query");

const DEFAULT_LIMIT = 10;
const HARD_MAX_LIMIT = 50;

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  "Practice",
  "Apparatus",
  "Capture",
  "Capture (Immersive)",
  "Drone",
  "Production",
  "Print",
  "Commerce",
  "Community",
]);

type CodexQueryArgs = {
  q?: string;
  category?: string;
  tag?: string;
  limit?: number;
};

function parseArgs(raw: unknown): CodexQueryArgs | string {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object") return "args must be an object";
  const r = raw as Record<string, unknown>;
  const out: CodexQueryArgs = {};
  if (typeof r.q === "string" && r.q.trim().length > 0) out.q = r.q.trim();
  if (typeof r.category === "string" && r.category.trim().length > 0) {
    if (!VALID_CATEGORIES.has(r.category.trim())) {
      return `invalid_category: ${r.category}; valid: ${Array.from(VALID_CATEGORIES).join(", ")}`;
    }
    out.category = r.category.trim();
  }
  if (typeof r.tag === "string" && r.tag.trim().length > 0) out.tag = r.tag.trim();
  if (
    typeof r.limit === "number" &&
    Number.isFinite(r.limit) &&
    r.limit > 0
  ) {
    out.limit = Math.min(Math.floor(r.limit), HARD_MAX_LIMIT);
  }
  return out;
}

async function run(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }

  try {
    const mod = (await import("lib/codex")) as {
      codex: Array<{
        slug: string;
        title: string;
        category: string;
        summary: string;
        date: string;
        seeAlso?: string[];
      }>;
    };
    const all = mod.codex;
    const limit = parsed.limit ?? DEFAULT_LIMIT;

    const qLower = parsed.q?.toLowerCase();
    const filtered = all.filter((entry) => {
      if (parsed.category && entry.category !== parsed.category) return false;
      if (parsed.tag) {
        const see = entry.seeAlso ?? [];
        if (!see.includes(parsed.tag)) return false;
      }
      if (qLower) {
        const hay = `${entry.title}\n${entry.summary}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });

    const entries = filtered.slice(0, limit).map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      category: entry.category,
      summary: entry.summary,
      date: entry.date,
      href: `/codex/${entry.slug}`,
    }));

    log.info("codex.query ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      q: parsed.q,
      category: parsed.category,
      tag: parsed.tag,
      hits: entries.length,
      totalMatching: filtered.length,
    });

    return {
      ok: true,
      output: {
        count: entries.length,
        totalMatching: filtered.length,
        entries,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("codex.query failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      err: msg,
    });
    return { ok: false, error: `codex_query_failed: ${msg}` };
  }
}

export const codexQueryTool: Tool = {
  name: "codex.query",
  description:
    "Search the studio's codex (lib/codex.tsx) for entries by free-text query, category, or see-also tag. Returns slug + title + category + summary + /codex/<slug> href for each hit. Use when a specialist needs the canonical studio summary for a technique or apparatus.",
  argsSchema: `{
    "q": "string (optional) — case-insensitive substring matched against title + summary",
    "category": "string (optional) — one of: Practice, Apparatus, Capture, Capture (Immersive), Drone, Production, Print, Commerce, Community",
    "tag": "string (optional) — match against the entry's seeAlso list (e.g. 'gaussian-splatting')",
    "limit": "number (optional, default 10, max 50) — cap on returned entries"
  }`,
  run,
};
