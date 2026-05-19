import "server-only";

/**
 * lib/agents/tools/drop-read.ts — `drop.read` tool.
 *
 * Thin wrapper over `getDropBySlug` (server-side Firestore read). The
 * specialist hands us a slug; we hand back the Drop record or
 * `drop_not_found`. We don't transform the shape — the Drop type is the
 * contract.
 */

import { createLogger } from "lib/log";
import { getDropBySlug } from "lib/drops/read";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.drop-read");

const READ_TIMEOUT_MS = 5_000;

type DropReadArgs = { slug: string };

function parseArgs(raw: unknown): DropReadArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.slug !== "string" || r.slug.trim().length === 0) {
    return "args.slug must be a non-empty string";
  }
  return { slug: r.slug.trim() };
}

/**
 * Race a promise against a deadline. We can't pass an AbortSignal into
 * `getDropBySlug` (firebase-admin doesn't take one), so the timeout is
 * advisory — the underlying request keeps running, but we return early.
 */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms),
    ),
  ]);
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
    const drop = await withTimeout(
      getDropBySlug(parsed.slug),
      READ_TIMEOUT_MS,
      "drop_read",
    );
    if (!drop) {
      log.debug("drop.read miss", {
        taskId: ctx.taskId,
        specialist: ctx.callingSpecialist,
        slug: parsed.slug,
      });
      return { ok: false, error: "drop_not_found" };
    }
    log.info("drop.read ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      slug: parsed.slug,
      status: drop.status,
    });
    return { ok: true, output: drop };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("drop.read failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      slug: parsed.slug,
      err: msg,
    });
    return { ok: false, error: `drop_read_failed: ${msg}` };
  }
}

export const dropReadTool: Tool = {
  name: "drop.read",
  description:
    "Read a published Drop by slug from Firestore (the source of truth for edition state). Use when the user asks about a specific drop.",
  argsSchema: `{
    "slug": "string (required) — the drop's Firestore document id / slug"
  }`,
  run,
};
