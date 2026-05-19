import "server-only";

/**
 * lib/agents/tools/file-write.ts — `file.write` tool.
 *
 * Operator-only write. Two-key gate:
 *   1. `ctx.callingSpecialist === "aura"` — only the orchestrator
 *      specialist is allowed to write. Any delegated specialist that
 *      tries to call this gets refused.
 *   2. `process.env.AGENT_FILE_WRITE_ENABLED === "1"` — env flag must
 *      be flipped to "1" deliberately on the host that should accept
 *      writes (typically the bench, never Vercel).
 *
 * Both must be true. The default posture is read-only.
 *
 * # Defensive bounds
 *
 *  - Path-bound under D:/.github/_3DPOV/ via the same `resolveSafePath`
 *    used by `file.read` (rejects `..`, denies env / service-account /
 *    node_modules / .next / tmp / .git).
 *  - Refuses to overwrite a file >1MB — large files are usually assets
 *    that shouldn't be hand-rewritten by an agent.
 *  - Logs every successful + failed write with the calling specialist
 *    and the task id, so we have an audit trail.
 *
 * # Why dynamic-import `fs/promises`
 *
 * Same reason as `file-read.ts` — keeps the tool registry's eager-load
 * bundle clean. The fs cost is only paid when an admin actually writes.
 */

import path from "node:path";

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";
import { resolveSafePath } from "./file-read";

const log = createLogger("agents.tools.file-write");

const WRITE_TIMEOUT_MS = 5_000;
const MAX_EXISTING_BYTES = 1_000_000;

type FileWriteArgs = { path: string; content: string };

function parseArgs(raw: unknown): FileWriteArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.path !== "string" || r.path.trim().length === 0) {
    return "args.path must be a non-empty string";
  }
  if (typeof r.content !== "string") {
    return "args.content must be a string";
  }
  return { path: r.path.trim(), content: r.content };
}

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
  // ── Gate 1: orchestrator-only ────────────────────────────────────────
  if (ctx.callingSpecialist !== "aura") {
    log.warn("file.write refused — not orchestrator", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
    });
    return { ok: false, error: "operator_only" };
  }

  // ── Gate 2: env flag ────────────────────────────────────────────────
  if (process.env.AGENT_FILE_WRITE_ENABLED !== "1") {
    log.warn("file.write refused — feature flag off", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
    });
    return { ok: false, error: "write_not_enabled" };
  }

  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }

  const resolved = resolveSafePath(parsed.path);
  if (!resolved.ok) {
    log.warn("file.write out-of-bounds", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      requested: parsed.path,
    });
    return { ok: false, error: resolved.error };
  }

  try {
    const { writeFile, stat, mkdir } = await import("node:fs/promises");

    // Refuse to overwrite anything large — assets, generated bundles,
    // PDFs. If the agent wants to touch one of those it's a manual
    // operator job.
    let existingSize = 0;
    try {
      const info = await withTimeout(
        stat(resolved.absolute),
        WRITE_TIMEOUT_MS,
        "file_stat",
      );
      if (info.isFile()) existingSize = info.size;
    } catch {
      /* file doesn't exist — that's fine, we'll create it */
    }
    if (existingSize > MAX_EXISTING_BYTES) {
      return {
        ok: false,
        error: `existing_file_too_large: ${existingSize}b > ${MAX_EXISTING_BYTES}b`,
      };
    }

    // Ensure the parent directory exists. `recursive: true` is a no-op
    // when it already does.
    await mkdir(path.dirname(resolved.absolute), { recursive: true });
    await withTimeout(
      writeFile(resolved.absolute, parsed.content, "utf8"),
      WRITE_TIMEOUT_MS,
      "file_write",
    );

    log.info("file.write ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      path: resolved.absolute,
      bytesWritten: Buffer.byteLength(parsed.content, "utf8"),
      replacedExisting: existingSize > 0,
    });

    return {
      ok: true,
      output: {
        path: resolved.absolute,
        bytesWritten: Buffer.byteLength(parsed.content, "utf8"),
        replacedExisting: existingSize > 0,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("file.write failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      path: resolved.absolute,
      err: msg,
    });
    return { ok: false, error: `file_write_failed: ${msg}` };
  }
}

export const fileWriteTool: Tool = {
  name: "file.write",
  description:
    "Write a UTF-8 text file under the studio's repository. Gated: only the orchestrator (Aura) may call this, and only when AGENT_FILE_WRITE_ENABLED=1 in the environment. Same path rules as file.read; refuses to overwrite existing files larger than 1MB.",
  argsSchema: `{
    "path": "string (required) — repo-relative or absolute path under D:/.github/_3DPOV/",
    "content": "string (required) — full UTF-8 contents to write"
  }`,
  run,
};
