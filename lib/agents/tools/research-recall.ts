import "server-only";

/**
 * lib/agents/tools/research-recall.ts — `research.recall` tool.
 *
 * Thin wrapper over the persistent research store at
 * `lib/agents/research/store.server.ts`. The store is being built by a
 * parallel agent; if it isn't present yet, we surface a stubbed
 * `{ stub: true, reason: "research-store-not-wired" }` result so the
 * specialist gets a calm "not configured yet" instead of an explosion.
 *
 * # Shape (when the store lands)
 *
 *   `recallResearch({ agentSlug, query, limit? }) =>
 *      Promise<Array<{ id, topic, summary, sources?, at }>>`
 *
 * Mirror that here. The dynamic import means the missing module is
 * caught at runtime, not load time, so this tool stays callable from
 * any specialist's allow-list while the parallel work converges.
 */

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.research-recall");

const RECALL_TIMEOUT_MS = 5_000;

type ResearchRecallArgs = { query: string; limit?: number };

function parseArgs(raw: unknown): ResearchRecallArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.query !== "string" || r.query.trim().length === 0) {
    return "args.query must be a non-empty string";
  }
  const limit =
    typeof r.limit === "number" && Number.isFinite(r.limit) && r.limit > 0
      ? Math.floor(r.limit)
      : undefined;
  const result: ResearchRecallArgs = { query: r.query.trim() };
  if (limit !== undefined) result.limit = limit;
  return result;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms),
    ),
  ]);
}

type ResearchStoreModule = {
  recallResearch?: (opts: {
    agentSlug: string;
    query: string;
    limit?: number;
  }) => Promise<unknown>;
};

async function run(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }

  let mod: ResearchStoreModule;
  try {
    // The research store is built by a parallel agent — it may not exist yet.
    // We assemble the specifier at runtime so webpack can't statically
    // resolve it; a missing module surfaces as a catchable runtime error
    // instead of a build-time "module not found".
    const spec = ["lib", "agents", "research", "store.server"].join("/");
    mod = (await import(spec)) as ResearchStoreModule;
  } catch {
    log.debug("research.recall stub — store module not present", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
    });
    return {
      ok: true,
      output: {
        stub: true,
        reason: "research-store-not-wired",
        query: parsed.query,
        results: [],
      },
    };
  }

  if (typeof mod.recallResearch !== "function") {
    log.debug("research.recall stub — recallResearch export missing", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
    });
    return {
      ok: true,
      output: {
        stub: true,
        reason: "research-store-not-wired",
        query: parsed.query,
        results: [],
      },
    };
  }

  try {
    const results = await withTimeout(
      mod.recallResearch({
        agentSlug: ctx.callingSpecialist,
        query: parsed.query,
        ...(parsed.limit !== undefined ? { limit: parsed.limit } : {}),
      }),
      RECALL_TIMEOUT_MS,
      "research_recall",
    );
    log.info("research.recall ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      query: parsed.query,
    });
    return { ok: true, output: { query: parsed.query, results } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("research.recall failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      query: parsed.query,
      err: msg,
    });
    return { ok: false, error: `research_recall_failed: ${msg}` };
  }
}

export const researchRecallTool: Tool = {
  name: "research.recall",
  description:
    "Recall persistent research notes (synthesised findings, citations) the crew has produced on prior tasks. Stubs gracefully when the research store isn't wired yet — returns { stub: true } in that case.",
  argsSchema: `{
    "query": "string (required) — free-text query against the research store",
    "limit": "number (optional) — cap on returned entries"
  }`,
  run,
};
