import "server-only";

/**
 * lib/agents/tools/grep.ts — `grep.search` tool.
 *
 * Hand-rolled recursive content search. We don't shell out to ripgrep —
 * `rg` isn't guaranteed on every deploy target (Vercel functions, the
 * studio's bench, the operator's laptop), and spawning a child process
 * adds a permission surface we don't need. Pure Node `fs.readFile` + a
 * regex compiled from the pattern is fast enough for repo-scale grep
 * and lets us cap the work precisely.
 *
 * # Pattern handling
 *
 * The user-supplied pattern is treated as an ECMAScript regex string.
 * We refuse patterns that fail to compile (returning the engine's
 * error so the specialist can rewrite). No flag-passing — case-sensitive
 * by default; the LLM can write `(?i)`-free workarounds with
 * `[Aa]bc`-style charsets.
 *
 * # Bounds
 *
 *  - Root path-bound under D:/.github/_3DPOV/ (via resolveSafePath).
 *  - Skip-list: node_modules, .next, .git, tmp, .env, service-accounts.
 *  - Skips binary files (looks for null bytes in the first 8KB).
 *  - Per-file ceiling: 1MB. Files larger than that are summarised as
 *    "too_large" in the result, not read.
 *  - Default maxResults: 50; hard cap: 500.
 *  - 5-second wall-clock budget.
 */

import path from "node:path";

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";
import { resolveSafePath } from "./file-read";

const log = createLogger("agents.tools.grep");

const SEARCH_TIMEOUT_MS = 5_000;
const MAX_FILE_BYTES = 1_000_000;
const BINARY_PROBE_BYTES = 8_192;
const DEFAULT_MAX_RESULTS = 50;
const HARD_MAX_RESULTS = 500;

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

type GrepArgs = {
  pattern: string;
  root?: string;
  include?: string;
  maxResults?: number;
};

type GrepHit = {
  path: string;
  line: number;
  preview: string;
};

function parseArgs(raw: unknown): GrepArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.pattern !== "string" || r.pattern.length === 0) {
    return "args.pattern must be a non-empty string";
  }
  const root =
    typeof r.root === "string" && r.root.trim().length > 0 ? r.root.trim() : undefined;
  const include =
    typeof r.include === "string" && r.include.trim().length > 0
      ? r.include.trim()
      : undefined;
  const maxResults =
    typeof r.maxResults === "number" &&
    Number.isFinite(r.maxResults) &&
    r.maxResults > 0
      ? Math.min(Math.floor(r.maxResults), HARD_MAX_RESULTS)
      : undefined;
  const result: GrepArgs = { pattern: r.pattern };
  if (root !== undefined) result.root = root;
  if (include !== undefined) result.include = include;
  if (maxResults !== undefined) result.maxResults = maxResults;
  return result;
}

/** Compile the user pattern to a RegExp, returning either the regex or
 *  a string error suitable for surfacing back. */
function compileSafely(pattern: string): RegExp | string {
  try {
    return new RegExp(pattern);
  } catch (err) {
    return `regex_compile_failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** Translate an `include` glob (e.g. "*.ts" or "**\/*.tsx") into a
 *  basename-or-relative-path regex. We re-use the same subset
 *  `glob.ts` understands. */
function includeToRegex(pattern: string): RegExp {
  let re = "^";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i] ?? "";
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        re += ".*";
        i += 2;
        if (pattern[i] === "/" || pattern[i] === "\\") i += 1;
      } else {
        re += "[^/\\\\]*";
        i += 1;
      }
    } else if (ch === "?") {
      re += "[^/\\\\]";
      i += 1;
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
      ch === "]" ||
      ch === "{" ||
      ch === "}"
    ) {
      re += "\\" + (ch as string);
      i += 1;
    } else {
      re += ch;
      i += 1;
    }
  }
  re += "$";
  return new RegExp(re);
}

function isLikelyBinary(buf: Buffer): boolean {
  const limit = Math.min(buf.length, BINARY_PROBE_BYTES);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

async function run(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }
  const re = compileSafely(parsed.pattern);
  if (typeof re === "string") {
    return { ok: false, error: re };
  }

  const resolved = resolveSafePath(parsed.root ?? ".");
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }
  // Hoist narrowed values out of the union so the recurse closure below
  // captures `RegExp` / `string`, not the original `RegExp | string` /
  // `{ ok: true; absolute } | { ok: false; error }` shapes.
  const regex: RegExp = re;
  const rootAbsolute: string = resolved.absolute;
  const includeRe = parsed.include ? includeToRegex(parsed.include) : null;
  const maxResults = parsed.maxResults ?? DEFAULT_MAX_RESULTS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const { readdir, readFile, stat } = await import("node:fs/promises");
    const hits: GrepHit[] = [];

    async function recurse(dir: string): Promise<void> {
      if (hits.length >= maxResults) return;
      if (controller.signal.aborted) throw new Error("grep_timeout");

      let entries: Awaited<ReturnType<typeof readdir>>;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (hits.length >= maxResults) return;
        const name = entry.name;
        if (SKIP_SEGMENTS.has(name)) continue;
        if (entry.isFile() && SKIP_FILE_PATTERNS.some((rx) => rx.test(name))) continue;
        const full = path.join(dir, name);

        if (entry.isDirectory()) {
          await recurse(full);
          continue;
        }
        if (!entry.isFile()) continue;

        // Filter by include-glob (basename + relative path).
        if (includeRe) {
          const rel = path.relative(rootAbsolute, full).split(path.sep).join("/");
          if (!includeRe.test(name) && !includeRe.test(rel)) continue;
        }

        let info: Awaited<ReturnType<typeof stat>>;
        try {
          info = await stat(full);
        } catch {
          continue;
        }
        if (info.size > MAX_FILE_BYTES) continue;

        let buf: Buffer;
        try {
          buf = await readFile(full);
        } catch {
          continue;
        }
        if (isLikelyBinary(buf)) continue;

        const text = buf.toString("utf8");
        const lines = text.split(/\r?\n/);
        for (let ln = 0; ln < lines.length; ln++) {
          if (hits.length >= maxResults) break;
          const line = lines[ln] ?? "";
          // Reset regex state for /g patterns — but we don't pass /g.
          regex.lastIndex = 0;
          if (regex.test(line)) {
            hits.push({
              path: full,
              line: ln + 1,
              preview: line.slice(0, 240),
            });
          }
        }
      }
    }

    await recurse(rootAbsolute);

    log.info("grep.search ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      pattern: parsed.pattern,
      root: resolved.absolute,
      hits: hits.length,
      capped: hits.length >= maxResults,
    });

    return {
      ok: true,
      output: {
        pattern: parsed.pattern,
        root: resolved.absolute,
        hits,
        capped: hits.length >= maxResults,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("grep.search failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      pattern: parsed.pattern,
      err: msg,
    });
    return { ok: false, error: `grep_search_failed: ${msg}` };
  } finally {
    clearTimeout(timer);
  }
}

export const grepSearchTool: Tool = {
  name: "grep.search",
  description:
    "Search file contents under the studio repository for an ECMAScript regex pattern. Skips binary files, node_modules, .next, .git, tmp, env files, service accounts. Returns matching lines with file path + line number + 240-char preview.",
  argsSchema: `{
    "pattern": "string (required) — ECMAScript regex pattern; treated case-sensitively, use [Aa] for tolerant matches",
    "root": "string (optional, default repo root) — directory to search under, repo-relative or absolute under D:/.github/_3DPOV/",
    "include": "string (optional) — glob to filter by filename, e.g. '*.ts' or '**/route.ts'",
    "maxResults": "number (optional, default 50, max 500) — cap on returned hits"
  }`,
  run,
};
