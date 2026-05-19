import "server-only";

/**
 * lib/agents/tools/research-record.ts — `research.record` tool.
 *
 * Symmetric to `research.recall` — persists a research note to the
 * store at `lib/agents/research/store.server.ts`. When the store isn't
 * wired yet, returns a stub `ok: true` with `{ stub: true }` so the
 * specialist sees a calm "not configured" rather than an exception.
 *
 * # Expected store shape
 *
 *   `recordResearch({ agentSlug, topic, summary, sources? }) =>
 *      Promise<{ id, ... }>`
 *
 * `sources` is an optional array of `{ label, url? }` mirroring the
 * codex's source convention.
 */

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.research-record");

const RECORD_TIMEOUT_MS = 5_000;

type Source = { label: string; url?: string };

type ResearchRecordArgs = {
  topic: string;
  summary: string;
  sources?: Source[];
};

function parseArgs(raw: unknown): ResearchRecordArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.topic !== "string" || r.topic.trim().length === 0) {
    return "args.topic must be a non-empty string";
  }
  if (typeof r.summary !== "string" || r.summary.trim().length === 0) {
    return "args.summary must be a non-empty string";
  }

  const result: ResearchRecordArgs = {
    topic: r.topic.trim(),
    summary: r.summary.trim(),
  };

  if (Array.isArray(r.sources)) {
    const sources: Source[] = [];
    for (const item of r.sources) {
      if (typeof item !== "object" || item === null) continue;
      const obj = item as Record<string, unknown>;
      if (typeof obj.label !== "string" || obj.label.trim().length === 0) continue;
      const src: Source = { label: obj.label.trim() };
      if (typeof obj.url === "string" && obj.url.trim().length > 0) {
        src.url = obj.url.trim();
      }
      sources.push(src);
    }
    if (sources.length > 0) result.sources = sources;
  }

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
  recordResearch?: (opts: {
    agentSlug: string;
    topic: string;
    summary: string;
    sources?: Source[];
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
    log.debug("research.record stub — store module not present", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
    });
    return {
      ok: true,
      output: {
        stub: true,
        reason: "research-store-not-wired",
        topic: parsed.topic,
      },
    };
  }

  if (typeof mod.recordResearch !== "function") {
    log.debug("research.record stub — recordResearch export missing", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
    });
    return {
      ok: true,
      output: {
        stub: true,
        reason: "research-store-not-wired",
        topic: parsed.topic,
      },
    };
  }

  try {
    const record = await withTimeout(
      mod.recordResearch({
        agentSlug: ctx.callingSpecialist,
        topic: parsed.topic,
        summary: parsed.summary,
        ...(parsed.sources ? { sources: parsed.sources } : {}),
      }),
      RECORD_TIMEOUT_MS,
      "research_record",
    );
    log.info("research.record ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      topic: parsed.topic,
    });
    return { ok: true, output: { topic: parsed.topic, record } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("research.record failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      topic: parsed.topic,
      err: msg,
    });
    return { ok: false, error: `research_record_failed: ${msg}` };
  }
}

export const researchRecordTool: Tool = {
  name: "research.record",
  description:
    "Persist a synthesised research note (topic + summary, optional sources) to the durable research store so future crew runs can recall it. Stubs gracefully when the store isn't wired yet — returns { stub: true } in that case.",
  argsSchema: `{
    "topic": "string (required) — short topic key, e.g. 'gaussian-splatting.licence-landscape'",
    "summary": "string (required) — the finding, in studio voice, with concrete numbers when available",
    "sources": "array (optional) of { label: string, url?: string } — citation list"
  }`,
  run,
};
