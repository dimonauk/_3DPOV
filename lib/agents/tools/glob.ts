import "server-only";

/**
 * lib/agents/tools/glob.ts — `glob.find` tool.
 *
 * Find files by glob pattern under the studio root. Prefers Node 22+'s
 * built-in `fs.glob` when available (zero dependency, native iterator);
 * falls back to a hand-rolled depth-first walker translating a small
 * subset of glob syntax to a regex.
 *
 * # Pattern syntax (the fallback understands a subset)
 *
 *   `*`        any run of non-separator characters
 *   `**`       any number of path segments, including zero
 *   `?`        any single non-separator character
 *   `{a,b,c}`  one of the comma-separated alternatives
 *
 * The fs.glob path supports the full Node glob syntax (whatever the
 * runtime ships); the fallback is a careful subset.
 *
 * # Caps + bounds
 *
 *  - Results capped at 200 — runaway patterns mustn't blow context.
 *  - Walks bounded under D:/.github/_3DPOV/ (or the explicit `root`
 *    arg, resolved-and-checked against the studio root).
 *  - Respects the file-read deny-list — skips node_modules, .next, .git,
 *    tmp, .env, firebase-service-account*.
 *  - 5-second timeout via AbortSignal.
 */

import path from "node:path";

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";
import { resolveSafePath } from "./file-read";

const log = createLogger("agents.tools.glob");

const SCAN_TIMEOUT_MS = 5_000;
const MAX_RESULTS = 200;

/** Same skip rules as file-read but expressed against single segment
 *  names (we filter directory entries before recursing). */
const SKIP_SEGMENTS: ReadonlySet<string> = new Set([
  "node_modules",
  ".next",
  ".git",
  "tmp",
]);

const SKIP_FILE_PATTERNS: ReadonlyArray<RegExp> = [
  /^\.env(\..*)?$/i,
  /^firebase-service-account.*\.json$/i,
];

type GlobArgs = { pattern: string; root?: string };

function parseArgs(raw: unknown): GlobArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.pattern !== "string" || r.pattern.trim().length === 0) {
    return "args.pattern must be a non-empty string";
  }
  const root =
    typeof r.root === "string" && r.root.trim().length > 0 ? r.root.trim() : undefined;
  const result: GlobArgs = { pattern: r.pattern.trim() };
  if (root !== undefined) result.root = root;
  return result;
}

/**
 * Translate a glob pattern to a regex. Handles `*`, `**`, `?`, and
 * `{a,b}` alternations. Anchored to start + end.
 */
function globToRegex(pattern: string): RegExp {
  let re = "^";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i] ?? "";
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        // ** — match across path separators, including zero segments.
        // Use a non-greedy any-char run.
        re += ".*";
        i += 2;
        // Eat an immediate following separator so `**/foo` matches `foo`.
        if (pattern[i] === "/" || pattern[i] === "\\") i += 1;
      } else {
        re += "[^/\\\\]*";
        i += 1;
      }
    } else if (ch === "?") {
      re += "[^/\\\\]";
      i += 1;
    } else if (ch === "{") {
      const close = pattern.indexOf("}", i);
      if (close === -1) {
        // No closing brace — treat as literal.
        re += "\\{";
        i += 1;
      } else {
        const alts = pattern.slice(i + 1, close).split(",");
        re +=
          "(?:" + alts.map((a) => a.replace(/[.+^$|()[\]\\]/g, "\\$&")).join("|") + ")";
        i = close + 1;
      }
    } else if (ch === "/" || ch === "\\") {
      re += "[/\\\\]";
      i += 1;
    } else if (
      ch === "." ||
      ch === "+" ||
      ch === "^" ||
      ch === "$" ||
      ch === "|" ||
      ch === "(" ||
      ch === ")" ||
      ch === "[" ||
      ch === "]"
    ) {
      re += "\\" + ch;
      i += 1;
    } else {
      re += ch;
      i += 1;
    }
  }
  re += "$";
  return new RegExp(re);
}

/**
 * Recursive walker fallback. Yields paths relative to `root` that match
 * the regex translation of `pattern`. Caps at MAX_RESULTS.
 */
async function walkAndMatch(
  root: string,
  pattern: string,
  signal: AbortSignal,
): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const re = globToRegex(pattern);
  const out: string[] = [];

  async function recurse(dir: string): Promise<void> {
    if (out.length >= MAX_RESULTS) return;
    if (signal.aborted) throw new Error("glob_timeout");
    let entries: Awaited<ReturnType<typeof readdir>>;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return; // unreadable dir — skip silently
    }
    for (const entry of entries) {
      if (out.length >= MAX_RESULTS) return;
      const name = entry.name;
      if (SKIP_SEGMENTS.has(name)) continue;
      if (entry.isFile() && SKIP_FILE_PATTERNS.some((rx) => rx.test(name))) continue;

      const full = path.join(dir, name);
      const rel = path.relative(root, full);
      // Match against both forward + backslash normalised forms so a
      // pattern with either separator works on Windows.
      const relForward = rel.split(path.sep).join("/");
      const relBack = rel.split("/").join(path.sep);
      if (entry.isDirectory()) {
        await recurse(full);
      } else if (entry.isFile()) {
        if (re.test(relForward) || re.test(relBack)) {
          out.push(full);
        }
      }
    }
  }

  await recurse(root);
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

  // Resolve + validate root.
  const requestedRoot = parsed.root ?? ".";
  const resolved = resolveSafePath(requestedRoot);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  try {
    let results: string[] = [];

    // Try Node 22+ `fs.glob` first.
    try {
      const fs = await import("node:fs/promises");
      const maybeGlob = (
        fs as unknown as {
          glob?: (
            pattern: string,
            opts?: { cwd?: string; signal?: AbortSignal },
          ) => AsyncIterable<string>;
        }
      ).glob;
      if (typeof maybeGlob === "function") {
        for await (const rel of maybeGlob(parsed.pattern, {
          cwd: resolved.absolute,
          signal: controller.signal,
        })) {
          const full = path.resolve(resolved.absolute, rel);
          // Apply deny-list to the resolved full path.
          const segments = path.relative(resolved.absolute, full).split(path.sep);
          if (segments.some((s) => SKIP_SEGMENTS.has(s))) continue;
          const basename = path.basename(full);
          if (SKIP_FILE_PATTERNS.some((rx) => rx.test(basename))) continue;
          results.push(full);
          if (results.length >= MAX_RESULTS) break;
        }
      } else {
        results = await walkAndMatch(resolved.absolute, parsed.pattern, controller.signal);
      }
    } catch (innerErr) {
      // If fs.glob threw (older Node, malformed pattern, etc.), fall back.
      log.debug("fs.glob unavailable or failed; using walker", {
        err: innerErr instanceof Error ? innerErr.message : String(innerErr),
      });
      results = await walkAndMatch(resolved.absolute, parsed.pattern, controller.signal);
    }

    log.info("glob.find ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      pattern: parsed.pattern,
      root: resolved.absolute,
      hits: results.length,
      capped: results.length >= MAX_RESULTS,
    });

    return {
      ok: true,
      output: {
        pattern: parsed.pattern,
        root: resolved.absolute,
        matches: results,
        capped: results.length >= MAX_RESULTS,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("glob.find failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      pattern: parsed.pattern,
      err: msg,
    });
    return { ok: false, error: `glob_find_failed: ${msg}` };
  } finally {
    clearTimeout(timer);
  }
}

export const globFindTool: Tool = {
  name: "glob.find",
  description:
    "Find files matching a glob pattern under the studio repository. Supports * / ** / ? / {a,b} syntax. Skips node_modules, .next, .git, tmp, and the env / service-account deny-list. Capped at 200 results.",
  argsSchema: `{
    "pattern": "string (required) — glob pattern, e.g. 'lib/**/*.ts', 'app/**/route.ts'",
    "root": "string (optional, default repo root) — directory to search under, repo-relative or absolute under D:/.github/_3DPOV/"
  }`,
  run,
};
