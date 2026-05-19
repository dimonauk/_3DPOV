import "server-only";

/**
 * lib/agents/tools/file-read.ts — `file.read` tool.
 *
 * Path-bounded filesystem read. The specialist hands us a path; we
 * resolve it under the studio root, deny anything in the secret /
 * vendor / build-artefact lists, and return the file contents up to a
 * caller-supplied (or default) byte ceiling.
 *
 * # Why path-bound
 *
 * Specialists run server-side with the same process privileges as the
 * site. Without a bound they could read `/etc/passwd`, the Firebase
 * service account, or whatever else the runtime can see. The bound is
 * "anything under `D:/.github/_3DPOV/` that isn't in the deny-list."
 *
 * # No top-level `fs/promises` import
 *
 * The tool registry is loaded eagerly on first crew request. If we
 * top-level-imported `fs/promises` it would land in the bundle even
 * when nothing calls this tool. Dynamic-import inside `run` keeps the
 * bundle clean and the cold-start cheap.
 */

import path from "node:path";

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.file-read");

const ROOT = path.resolve("D:/.github/_3DPOV");
const READ_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_BYTES = 100_000;
const HARD_MAX_BYTES = 5_000_000;

/**
 * Deny-list of path segments / glob-ish prefixes. Anything whose
 * normalised path contains one of these is refused.
 *
 *  - `.env`, `.env.*` — never read secrets in-band
 *  - `firebase-service-account*.json` — same
 *  - `node_modules`, `.next`, `tmp`, `.git` — noise / build output
 */
const DENY_PATTERNS: ReadonlyArray<RegExp> = [
  /(^|[\\/])\.env(\..*)?$/i,
  /(^|[\\/])firebase-service-account.*\.json$/i,
  /(^|[\\/])node_modules([\\/]|$)/i,
  /(^|[\\/])\.next([\\/]|$)/i,
  /(^|[\\/])tmp([\\/]|$)/i,
  /(^|[\\/])\.git([\\/]|$)/i,
];

type FileReadArgs = { path: string; maxBytes?: number };

function parseArgs(raw: unknown): FileReadArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.path !== "string" || r.path.trim().length === 0) {
    return "args.path must be a non-empty string";
  }
  const maxBytes =
    typeof r.maxBytes === "number" &&
    Number.isFinite(r.maxBytes) &&
    r.maxBytes > 0
      ? Math.min(Math.floor(r.maxBytes), HARD_MAX_BYTES)
      : undefined;
  const result: FileReadArgs = { path: r.path.trim() };
  if (maxBytes !== undefined) result.maxBytes = maxBytes;
  return result;
}

/**
 * Normalise + validate the requested path. Returns the resolved
 * absolute path on success, or an error string.
 */
export function resolveSafePath(
  requested: string,
  root: string = ROOT,
): { ok: true; absolute: string } | { ok: false; error: string } {
  // Reject ".." in raw form before resolving — catches the
  // "..\\..\\Windows\\System32" class even when the resolve would land
  // outside ROOT.
  if (requested.includes("..")) {
    return { ok: false, error: "out_of_bounds" };
  }
  const absolute = path.resolve(root, requested);
  // Post-resolve check: must still be under ROOT.
  const rel = path.relative(root, absolute);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return { ok: false, error: "out_of_bounds" };
  }
  for (const pattern of DENY_PATTERNS) {
    if (pattern.test(absolute) || pattern.test(rel)) {
      return { ok: false, error: "out_of_bounds" };
    }
  }
  return { ok: true, absolute };
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
  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }
  const resolved = resolveSafePath(parsed.path);
  if (!resolved.ok) {
    log.warn("file.read out-of-bounds", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      requested: parsed.path,
    });
    return { ok: false, error: resolved.error };
  }

  const maxBytes = parsed.maxBytes ?? DEFAULT_MAX_BYTES;

  try {
    const { readFile, stat } = await import("node:fs/promises");
    const info = await withTimeout(stat(resolved.absolute), READ_TIMEOUT_MS, "file_stat");
    if (!info.isFile()) {
      return { ok: false, error: "not_a_file" };
    }
    // Read up to maxBytes — node has no "read first N" without a stream,
    // so we read all then slice. Cap stat.size to avoid loading a 1GB
    // file just to throw it away.
    if (info.size > maxBytes * 4 && info.size > HARD_MAX_BYTES) {
      return { ok: false, error: `file_too_large: ${info.size}b` };
    }
    const buf = await withTimeout(
      readFile(resolved.absolute),
      READ_TIMEOUT_MS,
      "file_read",
    );
    const sliced = buf.length > maxBytes ? buf.subarray(0, maxBytes) : buf;
    const content = sliced.toString("utf8");
    log.info("file.read ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      path: resolved.absolute,
      bytesRead: sliced.length,
      truncated: buf.length > maxBytes,
    });
    return {
      ok: true,
      output: {
        path: resolved.absolute,
        content,
        bytesRead: sliced.length,
        truncated: buf.length > maxBytes,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("file.read failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      path: resolved.absolute,
      err: msg,
    });
    return { ok: false, error: `file_read_failed: ${msg}` };
  }
}

export const fileReadTool: Tool = {
  name: "file.read",
  description:
    "Read a UTF-8 text file from the studio's repository. Path is resolved under D:/.github/_3DPOV/ and refused if it falls outside the tree or hits the deny-list (env files, service accounts, node_modules, .next, tmp).",
  argsSchema: `{
    "path": "string (required) — repo-relative or absolute path under D:/.github/_3DPOV/",
    "maxBytes": "number (optional, default 100000, max 5000000) — read ceiling; the file is returned truncated if it exceeds this"
  }`,
  run,
};
