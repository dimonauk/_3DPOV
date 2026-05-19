import "server-only";

/**
 * lib/agents/tools/memory.ts — `memory.recall` + `memory.remember`.
 *
 * The two tools that let a specialist persist + retrieve facts across
 * crew tasks. Both bind to the calling-specialist's slug — passed in via
 * `ToolContext` — so memory is namespaced per-agent. The store is
 * Firestore-backed via `lib/agents/memory.server`.
 *
 * If `firebase-admin` isn't configured the server module silently
 * no-ops (returns []/the input record). We surface that as `ok: true`
 * with an empty/stub payload so the specialist's behaviour doesn't
 * fork between configured / un-configured environments.
 */

import { createLogger } from "lib/log";
import { recallFacts, rememberFact } from "lib/agents/memory.server";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.memory");

const READ_TIMEOUT_MS = 5_000;

// ── memory.recall ──────────────────────────────────────────────────────

type RecallArgs = { topic: string; limit?: number };

function parseRecallArgs(raw: unknown): RecallArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.topic !== "string" || r.topic.trim().length === 0) {
    return "args.topic must be a non-empty string";
  }
  const limit =
    typeof r.limit === "number" && Number.isFinite(r.limit) && r.limit > 0
      ? Math.floor(r.limit)
      : undefined;
  const result: RecallArgs = { topic: r.topic.trim() };
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

async function runRecall(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseRecallArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }
  try {
    const facts = await withTimeout(
      recallFacts({
        agentSlug: ctx.callingSpecialist,
        topic: parsed.topic,
        ...(parsed.limit !== undefined ? { limit: parsed.limit } : {}),
      }),
      READ_TIMEOUT_MS,
      "memory_recall",
    );
    log.info("memory.recall ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      topic: parsed.topic,
      count: facts.length,
    });
    return { ok: true, output: facts };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("memory.recall failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      topic: parsed.topic,
      err: msg,
    });
    return { ok: false, error: `memory_recall_failed: ${msg}` };
  }
}

export const memoryRecallTool: Tool = {
  name: "memory.recall",
  description:
    "Recall previously-stored facts on a topic for this specialist. Use to check what you've already learned before re-asking the user.",
  argsSchema: `{
    "topic": "string (required) — the topic key to recall, e.g. 'user.name', 'studio.policy'",
    "limit": "number (optional) — cap on returned facts"
  }`,
  run: runRecall,
};

// ── memory.remember ────────────────────────────────────────────────────

type RememberArgs = { topic: string; value: string; confidence?: number };

function parseRememberArgs(raw: unknown): RememberArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.topic !== "string" || r.topic.trim().length === 0) {
    return "args.topic must be a non-empty string";
  }
  if (typeof r.value !== "string" || r.value.length === 0) {
    return "args.value must be a non-empty string";
  }
  const confidence =
    typeof r.confidence === "number" && Number.isFinite(r.confidence)
      ? r.confidence
      : undefined;
  const result: RememberArgs = {
    topic: r.topic.trim(),
    value: r.value,
  };
  if (confidence !== undefined) result.confidence = confidence;
  return result;
}

async function runRemember(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseRememberArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }
  try {
    const record = await withTimeout(
      rememberFact({
        agentSlug: ctx.callingSpecialist,
        topic: parsed.topic,
        value: parsed.value,
        ...(parsed.confidence !== undefined
          ? { confidence: parsed.confidence }
          : {}),
        source: "agent-inferred",
      }),
      READ_TIMEOUT_MS,
      "memory_remember",
    );
    log.info("memory.remember ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      topic: parsed.topic,
      factId: record.id,
    });
    return { ok: true, output: { factId: record.id, record } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("memory.remember failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      topic: parsed.topic,
      err: msg,
    });
    return { ok: false, error: `memory_remember_failed: ${msg}` };
  }
}

export const memoryRememberTool: Tool = {
  name: "memory.remember",
  description:
    "Persist a fact (topic + value) for this specialist so future tasks can recall it. Use sparingly — only for durable facts, not transient state.",
  argsSchema: `{
    "topic": "string (required) — short topic key, e.g. 'user.name'",
    "value": "string (required) — the fact to remember",
    "confidence": "number (optional, 0..1, default 0.7) — how confident you are"
  }`,
  run: runRemember,
};
